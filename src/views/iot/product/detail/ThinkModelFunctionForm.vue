<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="功能类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio-button value="1"> 属性 </el-radio-button>
          <el-radio-button value="2"> 服务 </el-radio-button>
          <el-radio-button value="3"> 事件 </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="功能名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入功能名称" />
      </el-form-item>
      <el-form-item label="标识符" prop="identifier">
        <el-input
          v-model="formData.identifier"
          placeholder="请输入标识符"
          :disabled="formType === 'update'"
        />
      </el-form-item>
      <el-form-item label="数据类型" prop="type">
        <el-select
          v-model="formData.property.dataType.type"
          placeholder="请选择数据类型"
          :disabled="formType === 'update'"
        >
          <el-option key="int" label="int32 (整数型)" value="int" />
          <el-option key="float" label="float (单精度浮点型)" value="float" />
          <el-option key="double" label="double (双精度浮点型)" value="double" />
          <!--          <el-option key="text" label="text (文本型)" value="text" />-->
          <!--          <el-option key="date" label="date (日期型)" value="date" />-->
          <!--          <el-option key="bool" label="bool (布尔型)" value="bool" />-->
          <!--          <el-option key="enum" label="enum (枚举型)" value="enum" />-->
          <!--          <el-option key="struct" label="struct (结构体)" value="struct" />-->
          <!--          <el-option key="array" label="array (数组)" value="array" />-->
        </el-select>
      </el-form-item>
      <el-form-item label="取值范围" prop="max">
        <el-input v-model="formData.property.dataType.specs.min" placeholder="请输入最小值" />
        <span class="mx-2">~</span>
        <el-input v-model="formData.property.dataType.specs.max" placeholder="请输入最大值" />
      </el-form-item>
      <el-form-item label="步长" prop="step">
        <el-input v-model="formData.property.dataType.specs.step" placeholder="请输入步长" />
      </el-form-item>
      <el-form-item label="单位" prop="unit">
        <el-input v-model="formData.property.dataType.specs.unit" placeholder="请输入单位" />
      </el-form-item>
      <el-form-item label="读写类型" prop="accessMode">
        <el-radio-group v-model="formData.property.accessMode">
          <el-radio label="rw">读写</el-radio>
          <el-radio label="r">只读</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="属性描述" prop="property.description">
        <el-input
          type="textarea"
          v-model="formData.property.description"
          placeholder="请输入属性描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProductVO } from '@/api/iot/product'
import { ThinkModelFunctionApi, ThinkModelFunctionVO } from '@/api/iot/thinkmodelfunction'

const props = defineProps<{ product: ProductVO }>()

defineOptions({ name: 'ThinkModelFunctionForm' })

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
  type: '1',
  property: {
    identifier: undefined,
    name: undefined,
    accessMode: 'rw',
    required: true,
    dataType: {
      type: undefined,
      specs: {
        min: undefined,
        max: undefined,
        step: undefined,
        unit: undefined
      }
    },
    description: undefined // 添加这一行
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
      validator: (rule, value, callback) => {
        const reservedKeywords = ['set', 'get', 'post', 'property', 'event', 'time', 'value']
        if (reservedKeywords.includes(value)) {
          callback(
            new Error(
              'set, get, post, property, event, time, value 是系统保留字段，不能用于标识符定义'
            )
          )
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  property: {
    dataType: {
      type: [{ required: true, message: '数据类型不能为空', trigger: 'blur' }]
    },
    accessMode: [{ required: true, message: '读写类型不能为空', trigger: 'blur' }]
  }
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
    data.productId = props.product.id
    data.productKey = props.product.productKey
    if (formType.value === 'create') {
      await ThinkModelFunctionApi.createThinkModelFunction(data)
      message.success(t('common.createSuccess'))
    } else {
      await ThinkModelFunctionApi.updateThinkModelFunction(data)
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
    productId: undefined,
    productKey: undefined,
    identifier: undefined,
    name: undefined,
    description: undefined,
    type: '1', // todo @HAOHAO：看看枚举下
    property: {
      identifier: undefined,
      name: undefined,
      accessMode: 'rw',
      required: true,
      dataType: {
        type: undefined,
        specs: {
          min: undefined,
          max: undefined,
          step: undefined,
          unit: undefined
        }
      },
      description: undefined // 确保重置 description 字段
    }
  }
  formRef.value?.resetFields()
}
</script>
