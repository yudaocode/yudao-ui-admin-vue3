<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="ProductKey" prop="productKey">
        <el-input
          v-model="formData.productKey"
          placeholder="请输入 ProductKey"
          :readonly="formType === 'update'"
        >
          <template #append>
            <el-button @click="generateProductKey" :disabled="formType === 'update'">
              重新生成
            </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="产品名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="产品分类" prop="categoryId">
        <el-select v-model="formData.categoryId" placeholder="请选择产品分类" clearable>
          <el-option
            v-for="category in categoryList"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="设备类型" prop="deviceType">
        <el-radio-group v-model="formData.deviceType" :disabled="formType === 'update'">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="[DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(formData.deviceType)"
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
      <el-form-item
        v-if="formData.deviceType === DeviceTypeEnum.GATEWAY_SUB"
        label="接入网关协议"
        prop="protocolType"
      >
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
        <el-radio-group v-model="formData.dataFormat" :disabled="formType === 'update'">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DATA_FORMAT)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
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
      <el-collapse>
        <el-collapse-item title="更多配置">
          <el-form-item label="产品图标" prop="icon">
            <UploadImg v-model="formData.icon" :height="'80px'" :width="'80px'" />
          </el-form-item>
          <el-form-item label="产品图片" prop="picUrl">
            <UploadImg v-model="formData.picUrl" :height="'120px'" :width="'120px'" />
          </el-form-item>
          <el-form-item label="产品描述" prop="description">
            <el-input type="textarea" v-model="formData.description" placeholder="请输入产品描述" />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import {
  ValidateTypeEnum,
  ProductApi,
  ProductVO,
  DataFormatEnum,
  DeviceTypeEnum
} from '@/api/iot/product/product'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { ProductCategoryApi, ProductCategoryVO } from '@/api/iot/product/category'
import { UploadImg } from '@/components/UploadFile'
import { generateRandomStr } from '@/utils'

defineOptions({ name: 'IoTProductForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  name: undefined,
  productKey: '',
  categoryId: undefined,
  icon: undefined,
  picUrl: undefined,
  description: undefined,
  deviceType: undefined,
  netType: undefined,
  protocolType: undefined,
  protocolId: undefined,
  dataFormat: DataFormatEnum.JSON,
  validateType: ValidateTypeEnum.WEAK
})
const formRules = reactive({
  productKey: [{ required: true, message: 'ProductKey 不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
  categoryId: [{ required: true, message: '产品分类不能为空', trigger: 'change' }],
  deviceType: [{ required: true, message: '设备类型不能为空', trigger: 'change' }],
  netType: [
    {
      required: true,
      message: '联网方式不能为空',
      trigger: 'change'
    }
  ],
  protocolType: [
    {
      required: true,
      message: '接入网关协议不能为空',
      trigger: 'change'
    }
  ],
  dataFormat: [{ required: true, message: '数据格式不能为空', trigger: 'change' }],
  validateType: [{ required: true, message: '数据校验级别不能为空', trigger: 'change' }]
})
const formRef = ref()
const categoryList = ref<ProductCategoryVO[]>([]) // 产品分类列表

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
  } else {
    // 新增时，生成随机 productKey
    generateProductKey()
  }
  // 加载分类列表
  categoryList.value = await ProductCategoryApi.getSimpleProductCategoryList()
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
    id: undefined,
    name: undefined,
    productKey: '',
    categoryId: undefined,
    icon: undefined,
    picUrl: undefined,
    description: undefined,
    deviceType: undefined,
    netType: undefined,
    protocolType: undefined,
    protocolId: undefined,
    dataFormat: DataFormatEnum.JSON,
    validateType: ValidateTypeEnum.WEAK
  }
  formRef.value?.resetFields()
}

/** 生成 ProductKey */
const generateProductKey = () => {
  formData.value.productKey = generateRandomStr(16)
}
</script>
