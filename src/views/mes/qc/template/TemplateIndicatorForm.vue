<!-- MES 质检方案-检测指标项 表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <el-form-item label="质检指标ID" prop="indicatorId">
        <!-- TODO @AI:可以做了！ -->
        <!-- TODO @芋艿：等 qc_indicator 完成后，替换为选择器组件 -->
        <el-input-number
          v-model="formData.indicatorId"
          placeholder="请输入质检指标ID"
          :min="1"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="检测方法/要求" prop="checkMethod">
        <el-input
          type="textarea"
          v-model="formData.checkMethod"
          placeholder="请输入检测方法/检测要求"
          :rows="3"
        />
      </el-form-item>
      <el-form-item label="标准值" prop="standardValue">
        <el-input-number
          v-model="formData.standardValue"
          placeholder="请输入标准值"
          :precision="4"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="单位" prop="unit">
        <el-input v-model="formData.unit" placeholder="请输入单位" />
      </el-form-item>
      <el-form-item label="误差上限" prop="thresholdMax">
        <el-input-number
          v-model="formData.thresholdMax"
          placeholder="请输入误差上限"
          :precision="4"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="误差下限" prop="thresholdMin">
        <el-input-number
          v-model="formData.thresholdMin"
          placeholder="请输入误差下限"
          :precision="4"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="说明图URL" prop="docUrl">
        <el-input v-model="formData.docUrl" placeholder="请输入说明图URL" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcTemplateApi, QcTemplateIndicatorVO } from '@/api/mes/qc/template'

defineOptions({ name: 'TemplateIndicatorForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  templateId: undefined as number | undefined,
  indicatorId: undefined,
  checkMethod: undefined,
  standardValue: undefined,
  unit: undefined,
  thresholdMax: undefined,
  thresholdMin: undefined,
  docUrl: undefined,
  remark: undefined
})
const formRules = reactive({
  indicatorId: [{ required: true, message: '质检指标ID不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number, templateId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.templateId = templateId
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcTemplateApi.getTemplateIndicator(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcTemplateIndicatorVO
    if (formType.value === 'create') {
      await QcTemplateApi.createTemplateIndicator(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateApi.updateTemplateIndicator(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    templateId: undefined,
    indicatorId: undefined,
    checkMethod: undefined,
    standardValue: undefined,
    unit: undefined,
    thresholdMax: undefined,
    thresholdMin: undefined,
    docUrl: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
