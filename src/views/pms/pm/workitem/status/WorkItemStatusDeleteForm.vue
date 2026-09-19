<template>
  <Dialog v-model="dialogVisible" title="迁移并删除状态" width="480px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="待删除状态">{{ formData.statusName }}</el-form-item>
      <el-form-item label="迁移到" prop="transferStatusId">
        <el-select v-model="formData.transferStatusId" class="!w-100%" placeholder="请选择目标状态">
          <el-option
            v-for="status in statusList"
            :key="status.id"
            :label="status.name"
            :value="status.id"
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
import type { FormRules } from 'element-plus'
import * as WorkItemStatusApi from '@/api/pms/pm/workitem/status'

defineOptions({ name: 'PmsWorkItemStatusDeleteForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  id: undefined as number | undefined,
  statusName: '',
  transferStatusId: undefined as number | undefined
})
const formRules = reactive<FormRules>({
  transferStatusId: [{ required: true, message: '迁移目标状态不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const statusList = ref<WorkItemStatusApi.PmsWorkItemStatusVO[]>([]) // 可迁移目标状态列表

/** 打开弹窗 */
async function open(id: number) {
  dialogVisible.value = true
  resetForm()
  formLoading.value = true
  try {
    const status = await WorkItemStatusApi.getWorkItemStatus(id)
    statusList.value = (
      await WorkItemStatusApi.getWorkItemStatusList(status.projectId, status.workItemType)
    ).filter((item) => item.id !== id)
    formData.value.id = status.id
    formData.value.statusName = status.name
    formData.value.transferStatusId = statusList.value[0]?.id
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await WorkItemStatusApi.deleteWorkItemStatus(
      formData.value.id!,
      formData.value.transferStatusId
    )
    message.success('状态已删除，工作项迁移完成')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    statusName: '',
    transferStatusId: undefined
  }
  statusList.value = []
  formRef.value?.resetFields()
}
</script>
