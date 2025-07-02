<template>
  <el-dialog v-model="dialogVisible" title="新增升级任务" width="600px" append-to-body>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="任务名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="升级范围" prop="deviceScope">
        <el-select v-model="formData.deviceScope" placeholder="请选择升级范围" class="w-full">
          <el-option
            v-for="item in Object.values(IoTOtaTaskDeviceScopeEnum)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="任务描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入任务描述"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting"> 确定 </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { IoTOtaTaskApi, OtaTask } from '@/api/iot/ota/task'
import { IoTOtaTaskDeviceScopeEnum } from '@/views/iot/utils/constants'

defineOptions({ name: 'OtaTaskForm' })

const props = defineProps<{
  firmwareId: number
}>()

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()

// 弹窗状态
const dialogVisible = ref(false)
const submitting = ref(false)

// 表单数据
const formRef = ref()
const formData = ref<OtaTask>({
  name: '',
  deviceScope: undefined,
  firmwareId: props.firmwareId,
  description: ''
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  deviceScope: [{ required: true, message: '请选择升级范围', trigger: 'change' }]
}

/** 打开弹窗 */
const open = () => {
  dialogVisible.value = true
  resetForm()
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    name: '',
    deviceScope: undefined,
    firmwareId: props.firmwareId,
    description: ''
  }
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

/** 取消 */
const handleCancel = () => {
  dialogVisible.value = false
}

/** 提交表单 */
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    await IoTOtaTaskApi.createOtaTask(formData.value)
    message.success('创建成功')
    dialogVisible.value = false
    emit('success')
  } catch (error) {
    console.error('创建任务失败', error)
  } finally {
    submitting.value = false
  }
}

defineExpose({
  open
})
</script>
