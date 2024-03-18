<template>
  <Dialog v-model="dialogVisible" title="回退任务" width="500">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="退回节点" prop="targetTaskDefinitionKey">
        <el-select v-model="formData.targetTaskDefinitionKey" clearable style="width: 100%">
          <el-option
            v-for="item in returnList"
            :key="item.taskDefinitionKey"
            :label="item.name"
            :value="item.taskDefinitionKey"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="回退理由" prop="reason">
        <el-input v-model="formData.reason" clearable placeholder="请输入回退理由" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" name="TaskRollbackDialogForm" setup>
import * as TaskApi from '@/api/bpm/task'

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  id: '',
  targetTaskDefinitionKey: undefined,
  reason: ''
})
const formRules = ref({
  targetTaskDefinitionKey: [{ required: true, message: '必须选择回退节点', trigger: 'change' }],
  reason: [{ required: true, message: '回退理由不能为空', trigger: 'blur' }]
})

const formRef = ref() // 表单 Ref
const returnList = ref([] as any)
/** 打开弹窗 */
const open = async (id: string) => {
  returnList.value = await TaskApi.getTaskListByReturn(id)
  if (returnList.value.length === 0) {
    message.warning('当前没有可回退的节点')
    return false
  }
  dialogVisible.value = true
  resetForm()
  formData.value.id = id
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
    await TaskApi.returnTask(formData.value)
    message.success('回退成功')
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
    targetTaskDefinitionKey: undefined,
    reason: ''
  }
  formRef.value?.resetFields()
}
</script>
