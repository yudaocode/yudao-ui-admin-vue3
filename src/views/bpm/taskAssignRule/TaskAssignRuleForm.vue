<template>
  <Dialog v-model="dialogVisible" title="修改任务规则" width="600">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="任务名称" prop="taskDefinitionName">
        <el-input v-model="formData.taskDefinitionName" disabled placeholder="请输入流标标识" />
      </el-form-item>
      <el-form-item label="任务标识" prop="taskDefinitionKey">
        <el-input v-model="formData.taskDefinitionKey" disabled placeholder="请输入任务标识" />
      </el-form-item>
      <el-form-item label="规则类型" prop="type">
        <el-select v-model="formData.type" clearable style="width: 100%">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_TASK_ASSIGN_RULE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="formData.type === 10" label="指定角色" prop="roleIds">
        <el-select v-model="formData.roleIds" clearable multiple style="width: 100%">
          <el-option
            v-for="item in roleOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="formData.type === 20 || formData.type === 21"
        label="指定部门"
        prop="deptIds"
        span="24"
      >
        <el-tree-select
          ref="treeRef"
          v-model="formData.deptIds"
          :data="deptTreeOptions"
          :props="defaultProps"
          empty-text="加载中，请稍后"
          multiple
          node-key="id"
          show-checkbox
        />
      </el-form-item>
      <el-form-item v-if="formData.type === 22" label="指定岗位" prop="postIds" span="24">
        <el-select v-model="formData.postIds" clearable multiple style="width: 100%">
          <el-option
            v-for="item in postOptions"
            :key="parseInt(item.id)"
            :label="item.name"
            :value="parseInt(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="formData.type === 30 || formData.type === 31 || formData.type === 32"
        label="指定用户"
        prop="userIds"
        span="24"
      >
        <el-select v-model="formData.userIds" clearable multiple style="width: 100%">
          <el-option
            v-for="item in userOptions"
            :key="parseInt(item.id)"
            :label="item.nickname"
            :value="parseInt(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="formData.type === 40" label="指定用户组" prop="userGroupIds">
        <el-select v-model="formData.userGroupIds" clearable multiple style="width: 100%">
          <el-option
            v-for="item in userGroupOptions"
            :key="parseInt(item.id)"
            :label="item.name"
            :value="parseInt(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="formData.type === 50" label="指定脚本" prop="scripts">
        <el-select v-model="formData.scripts" clearable multiple style="width: 100%">
          <el-option
            v-for="dict in taskAssignScriptDictDatas"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <!-- 操作按钮 -->
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import * as TaskAssignRuleApi from '@/api/bpm/taskAssignRule'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'

defineOptions({ name: 'BpmTaskAssignRuleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  type: Number(undefined),
  modelId: '',
  options: [],
  roleIds: [],
  deptIds: [],
  postIds: [],
  userIds: [],
  userGroupIds: [],
  scripts: []
})
const formRules = reactive({
  type: [{ required: true, message: '规则类型不能为空', trigger: 'change' }],
  roleIds: [{ required: true, message: '指定角色不能为空', trigger: 'change' }],
  deptIds: [{ required: true, message: '指定部门不能为空', trigger: 'change' }],
  postIds: [{ required: true, message: '指定岗位不能为空', trigger: 'change' }],
  userIds: [{ required: true, message: '指定用户不能为空', trigger: 'change' }],
  userGroupIds: [{ required: true, message: '指定用户组不能为空', trigger: 'change' }],
  scripts: [{ required: true, message: '指定脚本不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const roleOptions = ref<RoleApi.RoleVO[]>([]) // 角色列表
const deptOptions = ref<DeptApi.DeptVO[]>([]) // 部门列表
const deptTreeOptions = ref() // 部门树
const postOptions = ref<PostApi.PostVO[]>([]) // 岗位列表
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const userGroupOptions = ref<UserGroupApi.UserGroupVO[]>([]) // 用户组列表
const taskAssignScriptDictDatas = getIntDictOptions(DICT_TYPE.BPM_TASK_ASSIGN_SCRIPT)

/** 打开弹窗 */
const open = async (modelId: string, row: TaskAssignRuleApi.TaskAssignVO) => {
  // 1. 先重置表单
  resetForm()
  // 2. 再设置表单
  formData.value = {
    ...row,
    modelId: modelId,
    options: [],
    roleIds: [],
    deptIds: [],
    postIds: [],
    userIds: [],
    userGroupIds: [],
    scripts: []
  }
  // 将 options 赋值到对应的 roleIds 等选项
  if (row.type === 10) {
    formData.value.roleIds.push(...row.options)
  } else if (row.type === 20 || row.type === 21) {
    formData.value.deptIds.push(...row.options)
  } else if (row.type === 22) {
    formData.value.postIds.push(...row.options)
  } else if (row.type === 30 || row.type === 31 || row.type === 32) {
    formData.value.userIds.push(...row.options)
  } else if (row.type === 40) {
    formData.value.userGroupIds.push(...row.options)
  } else if (row.type === 50) {
    formData.value.scripts.push(...row.options)
  }
  // 打开弹窗
  dialogVisible.value = true

  // 获得角色列表
  roleOptions.value = await RoleApi.getSimpleRoleList()
  // 获得部门列表
  deptOptions.value = await DeptApi.getSimpleDeptList()
  deptTreeOptions.value = handleTree(deptOptions.value, 'id')
  // 获得岗位列表
  postOptions.value = await PostApi.getSimplePostList()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 获得用户组列表
  userGroupOptions.value = await UserGroupApi.getSimpleUserGroupList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return

  // 构建表单
  const form = {
    ...formData.value,
    taskDefinitionName: undefined
  }
  // 将 roleIds 等选项赋值到 options 中
  if (form.type === 10) {
    form.options = form.roleIds
  } else if (form.type === 20 || form.type === 21) {
    form.options = form.deptIds
  } else if (form.type === 22) {
    form.options = form.postIds
  } else if (form.type === 30 || form.type === 31 || form.type === 32) {
    form.options = form.userIds
  } else if (form.type === 40) {
    form.options = form.userGroupIds
  } else if (form.type === 50) {
    form.options = form.scripts
  }
  form.roleIds = undefined
  form.deptIds = undefined
  form.postIds = undefined
  form.userIds = undefined
  form.userGroupIds = undefined
  form.scripts = undefined

  // 提交请求
  formLoading.value = true
  try {
    const data = form as unknown as TaskAssignRuleApi.TaskAssignVO
    if (!data.id) {
      await TaskAssignRuleApi.createTaskAssignRule(data)
      message.success(t('common.createSuccess'))
    } else {
      await TaskAssignRuleApi.updateTaskAssignRule(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formRef.value?.resetFields()
}
</script>
