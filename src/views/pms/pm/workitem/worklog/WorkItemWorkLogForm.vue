<template>
  <Dialog v-model="dialogVisible" :title="formData.id ? '编辑工时' : '登记工时'" width="520px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="96px"
    >
      <el-form-item label="投入工时" prop="actualHours">
        <el-input-number
          v-model="formData.actualHours"
          class="!w-100%"
          :min="1"
          @change="handleActualHoursChange"
        />
      </el-form-item>
      <el-form-item label="剩余工时" prop="remainingHours">
        <el-input-number v-model="formData.remainingHours" class="!w-100%" :min="0" />
      </el-form-item>
      <el-form-item label="工时说明" prop="description">
        <el-input
          v-model="formData.description"
          :rows="4"
          maxlength="500"
          placeholder="请输入本次工作内容"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as WorkLogApi from '@/api/pms/pm/workitem/worklog'

defineOptions({ name: 'PmsWorkItemWorkLogForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单加载中
const currentRemainingHours = ref(0) // 打开时工作项的剩余工时
const formData = ref<WorkLogApi.PmsWorkItemWorkLogVO>(getDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  actualHours: [{ required: true, message: '请输入投入工时', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于提交成功后的回调

/** 打开弹窗 */
async function open(workItemId: number, id?: number, remainingHours = 0) {
  dialogVisible.value = true
  resetForm()
  currentRemainingHours.value = remainingHours
  formData.value.workItemId = workItemId
  if (!id) {
    formData.value.remainingHours = Math.max(remainingHours - formData.value.actualHours, 0)
    return
  }
  formLoading.value = true
  try {
    formData.value = await WorkLogApi.getWorkItemWorkLog(id)
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 根据投入工时建议剩余工时 */
function handleActualHoursChange(actualHours?: number) {
  if (formData.value.id) return
  formData.value.remainingHours = Math.max(currentRemainingHours.value - (actualHours ?? 0), 0)
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formData.value.id) {
      await WorkLogApi.updateWorkItemWorkLog(formData.value)
      message.success('更新成功')
    } else {
      await WorkLogApi.createWorkItemWorkLog(formData.value)
      message.success('登记成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData()
  formRef.value?.resetFields()
}

/** 获得表单默认值 */
function getDefaultFormData(): WorkLogApi.PmsWorkItemWorkLogVO {
  return {
    workItemId: 0,
    actualHours: 1,
    remainingHours: 0,
    description: ''
  }
}
</script>
