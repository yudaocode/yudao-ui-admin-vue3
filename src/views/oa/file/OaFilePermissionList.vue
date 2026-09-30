<template>
  <Dialog v-model="dialogVisible" title="共享设置" width="850px">
    <!-- 列表操作 -->
    <el-button type="primary" plain class="mb-16px" :disabled="loading" @click="openForm('create')">
      <Icon icon="ep:plus" /> 新增
    </el-button>
    <!-- 共享权限列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          {{ getDictLabel(DICT_TYPE.OA_FILE_SUBJECT_TYPE, row.subjectType) }}
        </template>
      </el-table-column>
      <el-table-column label="共享对象" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ getSubjectName(row) }}</template>
      </el-table-column>
      <el-table-column label="权限" width="90">
        <template #default="{ row }">
          {{ getDictLabel(DICT_TYPE.OA_FILE_PERMISSION_LEVEL, row.level) }}
        </template>
      </el-table-column>
      <el-table-column label="继承" width="70">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.inherit" />
        </template>
      </el-table-column>
      <el-table-column label="到期时间" prop="expireTime" :formatter="dateFormatter" width="165" />
      <el-table-column label="操作" align="center" width="150">
        <template #default="{ row }">
          <el-button :disabled="loading" link type="primary" @click="openForm('update', row)">
            修改
          </el-button>
          <el-button :disabled="loading" link type="danger" @click="handleDelete(row.id)">
            取消共享
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>

    <!-- 新增、修改共享权限 -->
    <OaFilePermissionForm ref="formRef" @success="handleSuccess" />
  </Dialog>
</template>

<script setup lang="ts">
import * as PermissionApi from '@/api/oa/file/permission'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { OA_FILE_SUBJECT_TYPE } from '@/views/oa/utils/constants'
import OaFilePermissionForm from './OaFilePermissionForm.vue'

defineOptions({ name: 'OaFilePermissionList' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 列表加载中
const nodeId = ref(0) // 文件节点编号
const list = ref<PermissionApi.OaFilePermissionVO[]>([]) // 共享权限列表
const formRef = ref() // 共享表单 Ref
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const deptList = ref<DeptApi.DeptVO[]>([]) // 部门列表

/** 打开弹窗 */
async function open(id: number) {
  dialogVisible.value = true
  nodeId.value = id
  list.value = []
  loading.value = true
  try {
    const [permissions, users, depts] = await Promise.all([
      PermissionApi.getFilePermissionList(id),
      UserApi.getSimpleUserList(),
      DeptApi.getSimpleDeptList()
    ])
    list.value = permissions
    userList.value = users
    deptList.value = depts
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询共享权限列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await PermissionApi.getFilePermissionList(nodeId.value)
  } finally {
    loading.value = false
  }
}

/** 获得共享对象名称 */
function getSubjectName(row: PermissionApi.OaFilePermissionVO) {
  return row.subjectType === OA_FILE_SUBJECT_TYPE.USER
    ? userList.value.find((item) => item.id === row.subjectId)?.nickname
    : deptList.value.find((item) => item.id === row.subjectId)?.name
}

/** 打开新增、修改表单 */
function openForm(type: string, row?: PermissionApi.OaFilePermissionVO) {
  formRef.value.open(type, nodeId.value, row)
}

/** 共享变更后刷新列表 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function handleSuccess() {
  await getList()
  emit('success')
}

/** 取消共享 */
async function handleDelete(id: number) {
  try {
    // 取消共享的二次确认
    await message.delConfirm('是否取消该共享权限？')
    // 发起取消共享
    loading.value = true
    await PermissionApi.deleteFilePermission(id)
    message.success('取消成功')
    await handleSuccess()
  } catch {
  } finally {
    loading.value = false
  }
}
</script>
