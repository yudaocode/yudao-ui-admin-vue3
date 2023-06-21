<template>
  <Dialog v-model="dialogVisible" title="转派审批人" width="500">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="新审批人" prop="assigneeUserId">
        <el-select v-model="formData.assigneeUserId" clearable style="width: 100%">
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as TaskApi from '@/api/bpm/task'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'BpmTaskUpdateAssigneeForm' })

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  id: '',
  assigneeUserId: undefined
})
const formRules = ref({
  assigneeUserId: [{ required: true, message: '新审批人不能为空', trigger: 'change' }]
})

const formRef = ref() // 表单 Ref
const userList = ref<any[]>([]) // 用户列表

/** 打开弹窗 */
const open = async (id: string) => {
  dialogVisible.value = true
  resetForm()
  formData.value.id = id
  // 获得用户列表
  userList.value = await UserApi.getSimpleUserList()
}
defineExpose({ open }) // 提供 openModal 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await TaskApi.updateTaskAssignee(formData.value)
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: '',
    assigneeUserId: undefined
  }
  formRef.value?.resetFields()
}
</script>
