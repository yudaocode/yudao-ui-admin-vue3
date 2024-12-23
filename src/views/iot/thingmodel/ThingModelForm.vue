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
          <el-radio-button
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_PRODUCT_THING_MODEL_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="功能名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入功能名称" />
      </el-form-item>
      <el-form-item label="标识符" prop="identifier">
        <el-input v-model="formData.identifier" placeholder="请输入标识符" />
      </el-form-item>
      <!-- 属性配置 -->
      <ThingModelDataSpecs
        v-if="formData.type === ProductFunctionTypeEnum.PROPERTY"
        v-model="formData.property"
      />
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
import { ProductFunctionTypeEnum, ThingModelApi, ThingModelData } from 'src/api/iot/thingmodel'
import { IOT_PROVIDE_KEY } from '@/views/iot/utils/constants'
import { DataSpecsDataType } from './config'
import { cloneDeep } from 'lodash-es'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

/** IoT 物模型数据表单 */
defineOptions({ name: 'IoTProductThingModelForm' })

const product = inject<Ref<ProductVO>>(IOT_PROVIDE_KEY.PRODUCT) // 注入产品信息

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ThingModelData>({
  type: ProductFunctionTypeEnum.PROPERTY,
  dataType: DataSpecsDataType.INT,
  property: {
    dataType: DataSpecsDataType.INT,
    dataSpecs: {
      dataType: DataSpecsDataType.INT
    }
  }
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
      validator: (_: any, value: string, callback: any) => {
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
  ]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ThingModelApi.getThingModel(id)
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
    const data = cloneDeep(formData.value) as ThingModelData
    // 信息补全
    data.productId = product!.value.id
    data.productKey = product!.value.productKey
    data.description = data.property.description
    data.dataType = data.property.dataType
    data.property.identifier = data.identifier
    data.property.name = data.name
    if (formType.value === 'create') {
      await ThingModelApi.createThingModel(data)
      message.success(t('common.createSuccess'))
    } else {
      await ThingModelApi.updateThingModel(data)
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
    type: ProductFunctionTypeEnum.PROPERTY,
    dataType: DataSpecsDataType.INT,
    property: {
      dataType: DataSpecsDataType.INT,
      dataSpecs: {
        dataType: DataSpecsDataType.INT
      }
    }
  }
  formRef.value?.resetFields()
}
</script>
