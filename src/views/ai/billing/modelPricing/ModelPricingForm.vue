<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px" v-loading="formLoading">
      <el-form-item label="模型" prop="modelId">
        <el-select v-model="formData.modelId" placeholder="请选择模型" clearable>
          <el-option v-for="item in modelList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="输入单价(元/百万)" prop="priceInPer1mYuan">
        <el-input-number v-model="formData.priceInPer1mYuan" :min="0" :precision="6" class="!w-1/1" placeholder="缓存未命中的输入单价" />
      </el-form-item>
      <el-form-item label="缓存命中单价(元/百万)" prop="priceCachedPer1mYuan">
        <el-input-number v-model="formData.priceCachedPer1mYuan" :min="0" :precision="6" class="!w-1/1" placeholder="0 表示与输入同价" />
      </el-form-item>
      <el-form-item label="输出单价(元/百万)" prop="priceOutPer1mYuan">
        <el-input-number v-model="formData.priceOutPer1mYuan" :min="0" :precision="6" class="!w-1/1" placeholder="标准输出单价" />
      </el-form-item>
      <el-form-item label="推理单价(元/百万)" prop="priceReasoningPer1mYuan">
        <el-input-number v-model="formData.priceReasoningPer1mYuan" :min="0" :precision="6" class="!w-1/1" placeholder="0 表示与输出同价" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ModelPricingApi, ModelPricingVO } from '@/api/ai/billing/modelPricing'
import { ModelApi } from '@/api/ai/model/model'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'ModelPricingForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  modelId: undefined,
  priceInPer1mYuan: 0,
  priceCachedPer1mYuan: 0,
  priceOutPer1mYuan: 0,
  priceReasoningPer1mYuan: 0,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  modelId: [{ required: true, message: '模型不能为空', trigger: 'blur' }],
  priceInPer1mYuan: [{ required: true, message: '输入单价不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref()
const modelList = ref<any[]>([])

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ModelPricingApi.getModelPricing(id)
    } finally {
      formLoading.value = false
    }
  }
  const data = await ModelApi.getModelPage({ pageNo: 1, pageSize: 100 })
  modelList.value = data.list
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ModelPricingVO
    if (formType.value === 'create') {
      await ModelPricingApi.createModelPricing(data)
      message.success(t('common.createSuccess'))
    } else {
      await ModelPricingApi.updateModelPricing(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    modelId: undefined,
    priceInPer1mYuan: 0,
    priceCachedPer1mYuan: 0,
    priceOutPer1mYuan: 0,
    priceReasoningPer1mYuan: 0,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
