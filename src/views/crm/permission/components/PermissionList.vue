<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button @click="openForm">
      <Icon class="mr-5px" icon="fluent:people-team-add-20-filled" /> 添加团队成员
    </el-button>
    <el-button @click="handleUpdate">
      <Icon class="mr-5px" icon="ep:edit" />
      编辑
    </el-button>
    <el-button @click="handleDelete">
      <Icon class="mr-5px" icon="ep:delete" />
      移除
    </el-button>
    <el-button type="danger" @click="handleQuit"> 退出团队</el-button>
  </el-row>

  <!-- 列表 -->
  <ContentWrap class="mt-10px">
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column align="center" label="姓名" prop="nickname" />
      <el-table-column align="center" label="部门" prop="deptName" />
      <el-table-column align="center" label="岗位" prop="postNames" />
      <el-table-column align="center" label="权限" prop="level">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.CRM_PERMISSION_LEVEL" :value="row.level" />
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="加入时间"
        prop="createTime"
      />
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <CrmPermissionForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import * as PermissionApi from '@/api/crm/permission'
import { PermissionLevelEnum } from '@/api/crm/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import CrmPermissionForm from './PermissionForm.vue'

defineOptions({ name: 'CrmPermissionList' })
const props = defineProps<{
  bizType: number // 业务类型
  bizId: number // 业务编号
}>()

const message = useMessage() // 消息
const loading = ref(true) // 列表的加载中
const list = ref<PermissionApi.PermissionVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await PermissionApi.getPermissionList({
      bizType: props.bizType,
      bizId: props.bizId
    })
  } finally {
    loading.value = false
  }
}

/** 选中团队成员 */
const multipleSelection = ref<PermissionApi.PermissionVO[]>([]) // 选择的团队成员
const handleSelectionChange = (val: PermissionApi.PermissionVO[]) => {
  multipleSelection.value = val
}

/** 添加团队成员 */
const formRef = ref<InstanceType<typeof CrmPermissionForm>>() // 权限表单 Ref
const openForm = () => {
  formRef.value?.open('create', props.bizType, props.bizId)
}

/** 编辑团队成员 */
const handleUpdate = () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  const ids = multipleSelection.value?.map((item) => item.id) as number[]
  formRef.value?.open('update', props.bizType, props.bizId, ids)
}

/** 移除团队成员 */
const handleDelete = async () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  // TODO @puhui999：应该有个提示哈
  await message.delConfirm()
  const ids = multipleSelection.value?.map((item) => item.id)
  await PermissionApi.deletePermissionBatch({
    bizType: props.bizType,
    bizId: props.bizId,
    ids
  })
}

/** 退出团队 */
const userStore = useUserStoreWithOut() // 用户信息缓存
const handleQuit = async () => {
  const permission = list.value.find(
    (item) => item.userId === userStore.getUser.id && item.level === PermissionLevelEnum.OWNER
  )
  if (permission) {
    message.warning('负责人不能退出团队！')
    return
  }
  // TODO @puhui999：应该有个提示哈
  const userPermission = list.value.find((item) => item.userId === userStore.getUser.id)
  await PermissionApi.deleteSelfPermission(userPermission?.id)
}

/** 监听打开的 bizId + bizType，从而加载最新的列表 */
watch(
  () => [props.bizId, props.bizType],
  () => {
    getList()
  },
  { immediate: true, deep: true }
)
</script>
