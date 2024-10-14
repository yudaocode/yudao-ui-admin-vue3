<template>
  <ReceivableDetailsHeader v-loading="loading" :receivable="receivable">
    <el-button v-if="permissionListRef?.validateWrite" @click="openForm('update', receivable.id)">
      编辑
    </el-button>
  </ReceivableDetailsHeader>
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <ReceivableDetailsInfo :receivable="receivable" />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
      <el-tab-pane label="团队成员">
        <PermissionList
          ref="permissionListRef"
          :biz-id="receivable.id!"
          :biz-type="BizTypeEnum.CRM_RECEIVABLE"
          :show-action="true"
          @quit-team="close"
        />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <ReceivableForm ref="formRef" @success="getReceivable(receivable.id)" />
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ReceivableApi from '@/api/crm/receivable'
import ReceivableDetailsHeader from './ReceivableDetailsHeader.vue'
import ReceivableDetailsInfo from './ReceivableDetailsInfo.vue'
import PermissionList from '@/views/crm/permission/components/PermissionList.vue' // 团队成员列表（权限）
import { BizTypeEnum } from '@/api/crm/permission'
import { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/crm/operateLog'
import ReceivableForm from '@/views/crm/receivable/ReceivableForm.vue'

defineOptions({ name: 'CrmReceivablePlanDetail' })
const props = defineProps<{ id?: number }>()

const route = useRoute()
const message = useMessage()
const receivableId = ref(0) // 回款编号
const loading = ref(true) // 加载中
const receivable = ref<ReceivableApi.ReceivableVO>({} as ReceivableApi.ReceivableVO) // 回款详情
const permissionListRef = ref<InstanceType<typeof PermissionList>>() // 团队成员列表 Ref

/** 获取详情 */
const getReceivable = async (id: number) => {
  loading.value = true
  try {
    receivable.value = await ReceivableApi.getReceivable(id)
    await getOperateLog(id)
  } finally {
    loading.value = false
  }
}

/** 编辑 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 获取操作日志 */
const logList = ref<OperateLogVO[]>([]) // 操作日志列表
const getOperateLog = async (receivableId: number) => {
  if (!receivableId) {
    return
  }
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_RECEIVABLE,
    bizId: receivableId
  })
  logList.value = data.list
}

/** 关闭窗口 */
const { delView } = useTagsViewStore() // 视图操作
const { currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
}

/** 初始化 */
const { params } = useRoute()
onMounted(async () => {
  const id = props.id || route.params.id
  if (!id) {
    message.warning('参数错误，回款不能为空！')
    close()
    return
  }
  receivableId.value = id
  await getReceivable(receivableId.value)
})
</script>
