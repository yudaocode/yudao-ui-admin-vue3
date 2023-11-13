<template>
  <!-- 操作栏 -->
  <el-row justify="end">
    <el-button type="primary" @click="handleAdd">
      <Icon class="mr-5px" icon="ep:plus" />
      新增
    </el-button>
    <el-button @click="handleEdit">
      <Icon class="mr-5px" icon="ep:edit" />
      编辑
    </el-button>
    <el-button @click="handleRemove">
      <Icon class="mr-5px" icon="ep:delete" />
      移除
    </el-button>
    <el-button type="danger" @click="handleQuit"> 退出团队</el-button>
  </el-row>
  <!--  团队成员展示 -->
  <el-table
    v-loading="loading"
    :data="list"
    :show-overflow-tooltip="true"
    :stripe="true"
    class="mt-20px"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="55" />
    <el-table-column align="center" label="姓名" prop="mobile" />
    <el-table-column align="center" label="部门" prop="detailAddress" />
    <el-table-column align="center" label="岗位" prop="detailAddress" />
    <el-table-column align="center" label="权限级别" prop="creatorName" />
    <el-table-column :formatter="dateFormatter" align="center" label="加入时间" prop="createTime" />
  </el-table>
  <CrmPermissionForm ref="crmPermissionFormRef" />
</template>
<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { ElTable } from 'element-plus'
import * as PermissionApi from '@/api/crm/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import CrmPermissionForm from './CrmPermissionForm.vue'

defineOptions({ name: 'CrmTeam' })
const props = defineProps<{
  bizType: number
  bizId: number
}>()
const loading = ref(true) // 列表的加载中
const list = ref<PermissionApi.PermissionVO[]>([]) // 列表的数据
const getList = async () => {
  loading.value = true
  try {
    const res = await PermissionApi.getPermissionList({
      bizType: props.bizType,
      bizId: props.bizId
    })
    list.value = res
  } finally {
    loading.value = false
  }
}

const multipleSelection = ref<PermissionApi.PermissionVO[]>([])
const handleSelectionChange = (val: PermissionApi.PermissionVO[]) => {
  multipleSelection.value = val
}
const message = useMessage()
const crmPermissionFormRef = ref<InstanceType<typeof CrmPermissionForm | null>>(null)
const handleEdit = () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  const ids = multipleSelection.value?.map((item) => item.id)
  crmPermissionFormRef.value?.open('update', props.bizType, props.bizId, ids[0])
}
const handleRemove = async () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  await message.delConfirm()
  const ids = multipleSelection.value?.map((item) => item.id)
  ids?.forEach((id) => {
    // TODO 还不确定要不要搞个批量删除，还是一次只能删除一个，先用循环弄一下
    PermissionApi.deletePermission({
      bizType: props.bizType,
      bizId: props.bizId,
      id
    })
  })
}
const handleAdd = () => {
  crmPermissionFormRef.value?.open('create', props.bizType, props.bizId)
}

const userStore = useUserStoreWithOut()
const handleQuit = () => {
  const permission = list.value.find(
    (item) => item.userId === userStore.getUser.id && item.level === 1
  )
  if (permission) {
    message.warning('负责人不能退出团队！')
    return
  }
}

watch(
  () => props.bizId,
  () => {
    getList()
  },
  { immediate: true, deep: true }
)
</script>
<style lang="scss" scoped></style>
