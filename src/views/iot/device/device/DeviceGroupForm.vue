<template>
  <Dialog :title="'添加设备到分组'" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="设备分组" prop="groupIds">
        <el-select v-model="formData.groupIds" placeholder="请选择设备分组" multiple clearable>
          <el-option
            v-for="group in deviceGroups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DeviceApi } from '@/api/iot/device/device'
import { DeviceGroupApi } from '@/api/iot/device/group'

defineOptions({ name: 'IoTDeviceGroupForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  ids: [] as number[],
  groupIds: [] as number[]
})
const formRules = reactive({
  groupIds: [{ required: true, message: '设备分组不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const deviceGroups = ref<any[]>([]) // 设备分组列表

/** 打开弹窗 */
const open = async (ids: number[]) => {
  dialogVisible.value = true
  resetForm()
  formData.value.ids = ids

  // 加载设备分组列表
  try {
    deviceGroups.value = await DeviceGroupApi.getSimpleDeviceGroupList()
  } catch (error) {
    console.error('加载设备分组列表失败:', error)
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    await DeviceApi.updateDeviceGroup(formData.value)
    message.success(t('common.updateSuccess'))
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
    ids: [],
    groupIds: []
  }
  formRef.value?.resetFields()
}
</script>
