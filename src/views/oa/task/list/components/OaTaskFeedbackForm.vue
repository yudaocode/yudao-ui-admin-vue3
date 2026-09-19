<template>
  <Dialog v-model="dialogVisible" title="新增反馈" width="600px" :close-on-click-modal="false">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="任务状态" prop="status">
        <el-select v-model="formData.status" class="w-full">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="反馈内容" prop="content">
        <el-input
          v-model="formData.content"
          :rows="5"
          maxlength="1000"
          placeholder="请输入任务反馈"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
    </el-form>
    <!-- 表单操作 -->
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button :disabled="formLoading" @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormInstance, FormRules } from 'element-plus'
import * as TaskApi from '@/api/oa/task'
import { OA_TASK_STATUS } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaTaskFeedbackForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单提交中
const formData = ref<TaskApi.OaTaskFeedbackReqVO>({
  taskId: 0,
  publisher: false,
  status: OA_TASK_STATUS.NEW,
  content: ''
}) // 表单数据
const formRules = reactive<FormRules>({
  status: [{ required: true, message: '任务状态不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref
const statusOptions = ref([...getIntDictOptions(DICT_TYPE.OA_TASK_STATUS)]) // 当前用户可选择的状态

const emit = defineEmits<{ success: [] }>()

/** 打开反馈表单 */
async function open(task: TaskApi.OaTaskVO, mode: string) {
  const status = (mode === 'published' ? task.status : task.receiverStatus) ?? OA_TASK_STATUS.NEW
  if (task.canceled || (mode !== 'published' && status >= OA_TASK_STATUS.SUBMITTED)) return
  formData.value = { taskId: task.id!, publisher: mode === 'published', status, content: '' }
  statusOptions.value =
    mode === 'published'
      ? [...getIntDictOptions(DICT_TYPE.OA_TASK_STATUS)]
      : getIntDictOptions(DICT_TYPE.OA_TASK_STATUS).filter(
          (item) => item.value >= OA_TASK_STATUS.NEW && item.value <= OA_TASK_STATUS.SUBMITTED
        )
  dialogVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交反馈 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  await formRef.value.validate()
  // 保存成功后关闭弹窗，并通知详情刷新；失败时保留输入内容
  formLoading.value = true
  try {
    await TaskApi.feedbackTask(formData.value)
    message.success('反馈成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
