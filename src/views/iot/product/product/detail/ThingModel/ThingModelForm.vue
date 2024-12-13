<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="功能类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio-button :value="1"> 属性</el-radio-button>
          <el-radio-button :value="2"> 服务</el-radio-button>
          <el-radio-button :value="3"> 事件</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="功能名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入功能名称" />
      </el-form-item>
      <el-form-item label="标识符" prop="identifier">
        <el-input v-model="formData.identifier" placeholder="请输入标识符" />
      </el-form-item>
      <ThingModelDataSpecs v-model="formData" />
      <el-form-item label="读写类型" prop="accessMode">
        <el-radio-group v-model="formData.accessMode">
          <el-radio label="rw">读写</el-radio>
          <el-radio label="r">只读</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="属性描述" prop="property.description">
        <el-input v-model="formData.description" placeholder="请输入属性描述" type="textarea" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ProductVO } from '@/api/iot/product/product'
import ThingModelDataSpecs from './ThingModelDataSpecs.vue'
import {
  ProductFunctionTypeEnum,
  ThinkModelFunctionApi,
  ThinkModelFunctionVO
} from '@/api/iot/thinkmodelfunction'
import { IOT_PROVIDE_KEY } from '@/views/iot/utils/constants'

defineOptions({ name: 'IoTProductThingModelForm' })

const product = inject<Ref<ProductVO>>(IOT_PROVIDE_KEY.PRODUCT) // 注入产品信息

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  productId: undefined,
  productKey: undefined,
  identifier: undefined,
  name: undefined,
  description: undefined,
  type: ProductFunctionTypeEnum.PROPERTY,
  dataType: undefined,
  dataSpecsList: [],
  dataSpecs: undefined,
  accessMode: undefined
})
const formRules = reactive({
  name: [
    { required: true, message: '功能名称不能为空', trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9][\u4e00-\u9fa5a-zA-Z0-9\-_/\.]{0,29}$/,
      message:
        '支持中文、大小写字母、日文、数字、短划线、下划线、斜杠和小数点，必须以中文、英文或数字开头，不超过 30 个字符',
      trigger: 'blur'
    }
  ],
  type: [{ required: true, message: '功能类型不能为空', trigger: 'blur' }],
  identifier: [
    { required: true, message: '标识符不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{1,50}$/,
      message: '支持大小写字母、数字和下划线，不超过 50 个字符',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        const reservedKeywords = ['set', 'get', 'post', 'property', 'event', 'time', 'value']
        if (reservedKeywords.includes(value)) {
          callback(
            new Error(
              'set, get, post, property, event, time, value 是系统保留字段，不能用于标识符定义'
            )
          )
        } else if (/^\d+$/.test(value)) {
          callback(new Error('标识符不能是纯数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  'property.dataType.type': [{ required: true, message: '数据类型不能为空', trigger: 'blur' }],
  'property.accessMode': [{ required: true, message: '读写类型不能为空', trigger: 'blur' }]
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
      formData.value = await ThinkModelFunctionApi.getThinkModelFunction(id)
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
    const data = formData.value as unknown as ThinkModelFunctionVO
    data.productId = product!.value.id
    data.productKey = product!.value.productKey
    if (formType.value === 'create') {
      await ThinkModelFunctionApi.createThinkModelFunction(data)
      message.success(t('common.createSuccess'))
    } else {
      await ThinkModelFunctionApi.updateThinkModelFunction(data)
      message.success(t('common.updateSuccess'))
    }
  } finally {
    dialogVisible.value = false // 确保关闭弹框
    emit('success')
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    productId: undefined,
    productKey: undefined,
    identifier: undefined,
    name: undefined,
    description: undefined,
    type: ProductFunctionTypeEnum.PROPERTY,
    dataType: undefined,
    dataSpecsList: [],
    dataSpecs: undefined,
    accessMode: undefined
  }
  formRef.value?.resetFields()
}
</script>
