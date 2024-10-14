<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="产品名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入产品名称" />
      </el-form-item>

      <el-form-item label="设备类型" prop="deviceType">
        <el-select
          v-model="formData.deviceType"
          placeholder="请选择设备类型"
          :disabled="formType === 'update'"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="formData.deviceType === 0 || formData.deviceType === 2"
        label="联网方式"
        prop="netType"
      >
        <el-select
          v-model="formData.netType"
          placeholder="请选择联网方式"
          :disabled="formType === 'update'"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_NET_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="formData.deviceType === 1" label="接入网关协议" prop="protocolType">
        <el-select
          v-model="formData.protocolType"
          placeholder="请选择接入网关协议"
          :disabled="formType === 'update'"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_PROTOCOL_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="数据格式" prop="dataFormat">
        <el-select
          v-model="formData.dataFormat"
          placeholder="请选择接数据格式"
          :disabled="formType === 'update'"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DATA_FORMAT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="数据校验级别" prop="validateType">
        <el-radio-group v-model="formData.validateType" :disabled="formType === 'update'">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_VALIDATE_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="产品描述" prop="description">
        <el-input type="textarea" v-model="formData.description" placeholder="请输入产品描述" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProductApi, ProductVO } from '@/api/iot/product'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'IoTProductForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  name: undefined,
  id: undefined,
  productKey: undefined,
  protocolId: undefined,
  categoryId: undefined,
  description: undefined,
  validateType: undefined,
  status: undefined,
  deviceType: undefined,
  netType: undefined,
  protocolType: undefined,
  dataFormat: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
  deviceType: [{ required: true, message: '设备类型不能为空', trigger: 'change' }],
  netType: [
    {
      // TODO @haohao：0、1、/2 最好前端也枚举下；另外，这里的 required 可以直接设置为 true。然后表单那些 v-if。只要不存在，它自动就不校验了哈
      required: formData.deviceType === 0 || formData.deviceType === 2,
      message: '联网方式不能为空',
      trigger: 'change'
    }
  ],
  protocolType: [
    { required: formData.deviceType === 1, message: '接入网关协议不能为空', trigger: 'change' }
  ],
  dataFormat: [{ required: true, message: '数据格式不能为空', trigger: 'change' }],
  validateType: [{ required: true, message: '数据校验级别不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProductApi.getProduct(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open, close: () => (dialogVisible.value = false) })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProductVO
    if (formType.value === 'create') {
      await ProductApi.createProduct(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductApi.updateProduct(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false // 确保关闭弹框
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    name: undefined,
    id: undefined,
    productKey: undefined,
    protocolId: undefined,
    categoryId: undefined,
    description: undefined,
    validateType: undefined,
    status: undefined,
    deviceType: undefined,
    netType: undefined,
    protocolType: undefined,
    dataFormat: undefined
  }
  formRef.value?.resetFields()
}
</script>
