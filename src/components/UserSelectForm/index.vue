<template>
  <Dialog v-model="dialogVisible" title="人员选择" width="800">
    <el-row class="gap2" v-loading="formLoading">
      <el-col :span="6">
        <ContentWrap class="h-1/1">
          <el-tree
            ref="treeRef"
            :data="deptTree"
            :expand-on-click-node="false"
            :props="defaultProps"
            default-expand-all
            highlight-current
            node-key="id"
            @node-click="handleNodeClick"
          />
        </ContentWrap>
      </el-col>
      <el-col :span="17">
        <el-transfer
          v-model="selectedUserIdList"
          :titles="['未选', '已选']"
          filterable
          filter-placeholder="搜索成员"
          :data="transferUserList"
          :props="{ label: 'nickname', key: 'id' }"
        />
      </el-col>
    </el-row>
    <template #footer>
      <el-button
        :disabled="formLoading || !selectedUserIdList?.length"
        type="primary"
        @click="submitForm"
      >
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { defaultProps, findTreeNode, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'UserSelectForm' })
const emit = defineEmits<{
  confirm: [id: any, userList: any[]]
}>()
const { t } = useI18n() // 国际
const message = useMessage() // 消息弹窗
const deptTree = ref<Tree[]>([]) // 部门树形结构化
const userList = ref<UserApi.UserVO[]>([]) // 所有用户列表
const filteredUserList = ref<UserApi.UserVO[]>([]) // 当前部门过滤后的用户列表
const selectedUserIdList: any = ref([]) // 选中的用户列表
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const activityId = ref()

/** 计算属性：合并已选择的用户和当前部门过滤后的用户 */
const transferUserList = computed(() => {
  // 1.1 获取所有已选择的用户
  const selectedUsers = userList.value.filter((user: any) =>
    selectedUserIdList.value.includes(user.id)
  )

  // 1.2 获取当前部门过滤后的未选择用户
  const filteredUnselectedUsers = filteredUserList.value.filter(
    (user: any) => !selectedUserIdList.value.includes(user.id)
  )

  // 2. 合并并去重
  return [...selectedUsers, ...filteredUnselectedUsers]
})

/** 打开弹窗 */
const open = async (id: number, selectedList?: any[]) => {
  activityId.value = id
  resetForm()

  // 加载部门、用户列表
  deptTree.value = handleTree(await DeptApi.getSimpleDeptList())
  userList.value = await UserApi.getSimpleUserList()

  // 初始状态下，过滤列表等于所有用户列表
  filteredUserList.value = [...userList.value]
  selectedUserIdList.value = selectedList?.map((item: any) => item.id) || []
  dialogVisible.value = true
}

/** 获取部门过滤后的用户列表 */
const getUserList = async (deptId?: number) => {
  formLoading.value = true
  try {
    // @ts-ignore
    // TODO @芋艿：替换到 simple List 暂不支持 deptId 过滤
    // TODO @Zqqq：这个，可以使用前端过滤么？通过 deptList 获取到 deptId 子节点，然后去 userList
    const data = await UserApi.getUserPage({ pageSize: 100, pageNo: 1, deptId })
    // 更新过滤后的用户列表
    filteredUserList.value = data.list
  } finally {
    formLoading.value = false
  }
}

/** 提交选择 */
const submitForm = async () => {
  try {
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    // 从所有用户列表中筛选出已选择的用户
    const emitUserList = userList.value.filter((user: any) =>
      selectedUserIdList.value.includes(user.id)
    )
    // 发送操作成功的事件
    emit('confirm', activityId.value, emitUserList)
  } finally {
  }
}

/** 重置表单 */
const resetForm = () => {
  deptTree.value = []
  userList.value = []
  filteredUserList.value = []
  selectedUserIdList.value = []
}

/** 处理部门被点击 */
const handleNodeClick = (row: { [key: string]: any }) => {
  getUserList(row.id)
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>

<style lang="scss" scoped>
:deep() {
  .el-transfer {
    display: flex;
  }
  .el-transfer__buttons {
    display: flex !important;
    flex-direction: column-reverse;
    justify-content: center;
    gap: 20px;
    .el-transfer__button:nth-child(2) {
      margin: 0;
    }
  }
}
</style>
