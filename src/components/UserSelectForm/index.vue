<template>
  <Dialog v-model="dialogVisible" title="人员选择" width="900">
    <el-row>
      <el-col :span="6">
        <el-tree
          ref="treeRef"
          :data="deptList"
          :expand-on-click-node="false"
          :props="defaultProps"
          default-expand-all
          highlight-current
          node-key="id"
          @node-click="handleNodeClick"
        />
      </el-col>
      <el-col :span="17" :offset="1">
        <el-transfer
          v-model="selectedUserIdList"
          :titles="['未选', '已选']"
          filterable
          filter-placeholder="搜索成员"
          :data="userList"
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
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'UserSelectForm' })
const emit = defineEmits<{
  confirm: [id: any, userList: any[]]
}>()
const { t } = useI18n() // 国际
const message = useMessage() // 消息弹窗

const deptList = ref<Tree[]>([]) // 部门树形结构化
const userList: any = ref([]) // 用户列表
const selectedUserIdList: any = ref([]) // 选中的用户列表
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const activityId = ref() // 关联的主键编号 TODO @goldenzqqq：这个 activityId 有没可能不传递。在使用 @submitForm="xxx()" 时，传递的参数。目的是，更加解耦一些。

/** 打开弹窗 */
const open = async (id: number, selectedList?: any[]) => {
  activityId.value = id
  // 重置表单
  resetForm()

  // 加载相关数据
  deptList.value = handleTree(await DeptApi.getSimpleDeptList())
  await getUserList()
  // 设置选中的用户列表
  selectedUserIdList.value = selectedList?.map((item: any) => item.id)

  // 设置可见
  dialogVisible.value = true
}

/** 获取用户列表 */
const getUserList = async (deptId?: number) => {
  try {
    // @ts-ignore
    // TODO @芋艿：替换到 simple List
    const data = await UserApi.getUserPage({ pageSize: 100, pageNo: 1, deptId })
    userList.value = data.list
  } finally {
  }
}

/** 提交选择 */
const submitForm = async () => {
  // 提交请求
  formLoading.value = true
  try {
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    const emitUserList = userList.value.filter((user: any) =>
      selectedUserIdList.value.includes(user.id)
    )
    // 发送操作成功的事件
    emit('confirm', activityId.value, emitUserList)
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  deptList.value = []
  userList.value = []
  selectedUserIdList.value = []
}

/** 处理部门被点击 */
const handleNodeClick = (row: { [key: string]: any }) => {
  getUserList(row.id)
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
