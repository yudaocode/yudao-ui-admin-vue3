<template>
  <ClueDetailsHeader :clue="clue" :loading="loading">
    <el-button
      v-if="permissionListRef?.validateWrite"
      v-hasPermi="['crm:clue:update']"
      type="primary"
      @click="openForm"
    >
      编辑
    </el-button>
    <el-button v-if="permissionListRef?.validateOwnerUser" type="primary" @click="transfer">
      转移
    </el-button>
    <el-button
      v-if="permissionListRef?.validateOwnerUser && !clue.transformStatus"
      type="success"
      @click="handleTransform"
    >
      转化为客户
    </el-button>
    <el-button v-else disabled type="success">已转化客户</el-button>
  </ClueDetailsHeader>
  <el-col>
    <el-tabs>
      <el-tab-pane label="跟进记录">
        <FollowUpList :biz-id="clueId" :biz-type="BizTypeEnum.CRM_CLUE" />
      </el-tab-pane>
      <el-tab-pane label="基本信息">
        <ClueDetailsInfo :clue="clue" />
      </el-tab-pane>
      <el-tab-pane label="团队成员">
        <PermissionList
          ref="permissionListRef"
          :biz-id="clue.id!"
          :biz-type="BizTypeEnum.CRM_CLUE"
          :show-action="true"
          @quit-team="close"
        />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <ClueForm ref="formRef" @success="getClue" />
  <CrmTransferForm ref="transferFormRef" :biz-type="BizTypeEnum.CRM_CLUE" @success="close" />
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ClueApi from '@/api/crm/clue'
import ClueForm from '@/views/crm/clue/ClueForm.vue'
import ClueDetailsHeader from './ClueDetailsHeader.vue' // 线索明细 - 头部
import ClueDetailsInfo from './ClueDetailsInfo.vue' // 线索明细 - 详细信息
import PermissionList from '@/views/crm/permission/components/PermissionList.vue' // 团队成员列表（权限）
import CrmTransferForm from '@/views/crm/permission/components/TransferForm.vue'
import FollowUpList from '@/views/crm/followup/index.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import type { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/crm/operateLog'

defineOptions({ name: 'CrmClueDetail' })

const clueId = ref(0) // 线索编号
const loading = ref(true) // 加载中
const message = useMessage() // 消息弹窗
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由

const permissionListRef = ref<InstanceType<typeof PermissionList>>() // 团队成员列表 Ref

/** 获取详情 */
const clue = ref<ClueApi.ClueVO>({} as ClueApi.ClueVO) // 线索详情
const getClue = async () => {
  loading.value = true
  try {
    clue.value = await ClueApi.getClue(clueId.value)
    await getOperateLog()
  } finally {
    loading.value = false
  }
}

/** 编辑线索 */
const formRef = ref<InstanceType<typeof ClueForm>>() // 线索表单 Ref
const openForm = () => {
  formRef.value?.open('update', clueId.value)
}

/** 线索转移 */
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 线索转移表单 ref
const transfer = () => {
  transferFormRef.value?.open(clueId.value)
}

/** 转化为客户 */
const handleTransform = async () => {
  await message.confirm(`确定将【${clue.value.name}】转化为客户吗？`)
  await ClueApi.transformClue(clueId.value)
  message.success(`转化客户【${clue.value.name}】成功`)
  await getClue()
}

/** 获取操作日志 */
const logList = ref<OperateLogVO[]>([]) // 操作日志列表
const getOperateLog = async () => {
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CLUE,
    bizId: clueId.value
  })
  logList.value = data.list
}

const close = () => {
  delView(unref(currentRoute))
}

/** 初始化 */
const { params } = useRoute()
onMounted(() => {
  if (!params.id) {
    message.warning('参数错误，线索不能为空！')
    close()
    return
  }
  clueId.value = params.id as unknown as number
  getClue()
})
</script>
