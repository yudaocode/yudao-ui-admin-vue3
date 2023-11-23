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
    <el-table-column align="center" label="姓名" prop="nickname" />
    <el-table-column align="center" label="部门" prop="deptName" />
    <el-table-column align="center" label="岗位" prop="postNames" />
    <el-table-column align="center" label="权限级别" prop="level">
      <template #default="{ row }">
        <el-tag>{{ getLevelName(row.level) }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column :formatter="dateFormatter" align="center" label="加入时间" prop="createTime" />
  </el-table>
  <CrmPermissionForm ref="crmPermissionFormRef" />
</template>
<script lang="ts" setup>
// TODO @puhui999：改成 CrmPermissionList
import { dateFormatter } from '@/utils/formatTime'
import { ElTable } from 'element-plus'
import * as PermissionApi from '@/api/crm/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import CrmPermissionForm from './CrmPermissionForm.vue'
import { CrmPermissionLevelEnum } from './index'

defineOptions({ name: 'CrmTeam' })

const message = useMessage() // 消息

const props = defineProps<{
  bizType: number
  bizId: number
}>()
const loading = ref(true) // 列表的加载中
const list = ref<PermissionApi.PermissionVO[]>([
  // TODO 测试数据
  {
    id: 1, // 数据权限编号
    userId: 1, // 用户编号
    bizType: 1, // Crm 类型
    bizId: 1, // Crm 类型数据编号
    level: 1, // 权限级别
    deptName: '研发部门', // 部门名称
    nickname: '芋道源码', // 用户昵称
    postNames: '全栈开发工程师', // 岗位名称数组
    createTime: new Date()
  }
]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await PermissionApi.getPermissionList({
      bizType: props.bizType,
      bizId: props.bizId
    })
    list.value = data
  } finally {
    loading.value = false
  }
}

// TODO @puhui999：字典格式化
/**
 * 获得权限级别名称
 * @param level 权限级别
 */
const getLevelName = computed(() => (level: number) => {
  switch (level) {
    case CrmPermissionLevelEnum.OWNER:
      return '负责人'
    case CrmPermissionLevelEnum.READ:
      return '只读'
    case CrmPermissionLevelEnum.WRITE:
      return '读写'
    default:
      break
  }
})
// TODO @puhui999：空行稍微注意下哈；一些注释补齐下；
const multipleSelection = ref<PermissionApi.PermissionVO[]>([])
const handleSelectionChange = (val: PermissionApi.PermissionVO[]) => {
  multipleSelection.value = val
}
// TODO @puhui999：一些变量命名，看看有没可能跟列表界面的 index.vue 保持他统一的风格；
const crmPermissionFormRef = ref<InstanceType<typeof CrmPermissionForm>>()
const handleEdit = () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  const ids = multipleSelection.value?.map((item) => item.id)
  crmPermissionFormRef.value?.open('update', props.bizType, props.bizId, ids)
}
const handleRemove = async () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  await message.delConfirm()
  const ids = multipleSelection.value?.map((item) => item.id)
  await PermissionApi.deletePermission({
    bizType: props.bizType,
    bizId: props.bizId,
    ids
  })
}
const handleAdd = () => {
  crmPermissionFormRef.value?.open('create', props.bizType, props.bizId)
}

const userStore = useUserStoreWithOut()
const handleQuit = async () => {
  const permission = list.value.find(
    (item) => item.userId === userStore.getUser.id && item.level === CrmPermissionLevelEnum.OWNER
  )
  if (permission) {
    message.warning('负责人不能退出团队！')
    return
  }
  const userPermission = list.value.find((item) => item.userId === userStore.getUser.id)
  await PermissionApi.quitTeam(userPermission?.id)
}

watch(
  () => props.bizId,
  () => {
    getList()
  },
  { immediate: true, deep: true }
)
</script>
