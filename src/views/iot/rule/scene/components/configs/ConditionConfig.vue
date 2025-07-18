<!-- 单个条件配置组件 -->
<!-- TODO @puhui999：这里需要在对下阿里云 IoT，不太对；它是条件类型；然后选择产品、设备；接着选条件类型对应的比较； -->
<template>
  <div class="condition-config">
    <el-row :gutter="16">
      <!-- 属性/事件/服务选择 -->
      <el-col :span="8">
        <el-form-item label="监控项" required>
          <PropertySelector
            :model-value="condition.identifier"
            @update:model-value="(value) => updateConditionField('identifier', value)"
            :trigger-type="triggerType"
            :product-id="productId"
            :device-id="deviceId"
            @change="handlePropertyChange"
          />
        </el-form-item>
      </el-col>

      <!-- 操作符选择 -->
      <el-col :span="6">
        <el-form-item label="操作符" required>
          <OperatorSelector
            :model-value="condition.operator"
            @update:model-value="(value) => updateConditionField('operator', value)"
            :property-type="propertyType"
            @change="handleOperatorChange"
          />
        </el-form-item>
      </el-col>

      <!-- 值输入 -->
      <el-col :span="10">
        <el-form-item label="比较值" required>
          <ValueInput
            :model-value="condition.param"
            @update:model-value="(value) => updateConditionField('param', value)"
            :property-type="propertyType"
            :operator="condition.operator"
            :property-config="propertyConfig"
            @validate="handleValueValidate"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 条件预览 -->
    <div v-if="conditionPreview" class="condition-preview">
      <div class="preview-header">
        <Icon icon="ep:view" class="preview-icon" />
        <span class="preview-title">条件预览</span>
      </div>
      <div class="preview-content">
        <code class="preview-text">{{ conditionPreview }}</code>
      </div>
    </div>

    <!-- 验证结果 -->
    <div v-if="validationMessage" class="validation-result">
      <el-alert
        :title="validationMessage"
        :type="isValid ? 'success' : 'error'"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import PropertySelector from '../selectors/PropertySelector.vue'
import OperatorSelector from '../selectors/OperatorSelector.vue'
import ValueInput from '../inputs/ValueInput.vue'
import { ConditionFormData } from '@/api/iot/rule/scene/scene.types'

/** 单个条件配置组件 */
defineOptions({ name: 'ConditionConfig' })

interface Props {
  modelValue: ConditionFormData
  triggerType: number
  productId?: number
  deviceId?: number
}

interface Emits {
  (e: 'update:modelValue', value: ConditionFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const condition = useVModel(props, 'modelValue', emit)

// 状态
const propertyType = ref<string>('string')
const propertyConfig = ref<any>(null)
const validationMessage = ref('')
const isValid = ref(true)
const valueValidation = ref({ valid: true, message: '' })

// 计算属性
const conditionPreview = computed(() => {
  if (!condition.value.identifier || !condition.value.operator || !condition.value.param) {
    return ''
  }

  const propertyName = propertyConfig.value?.name || condition.value.identifier
  const operatorText = getOperatorText(condition.value.operator)
  const value = condition.value.param

  return `当 ${propertyName} ${operatorText} ${value} 时触发`
})

// 工具函数
const getOperatorText = (operator: string) => {
  const operatorMap = {
    '=': '等于',
    '!=': '不等于',
    '>': '大于',
    '>=': '大于等于',
    '<': '小于',
    '<=': '小于等于',
    in: '包含于',
    between: '介于'
  }
  return operatorMap[operator] || operator
}

// 事件处理
const updateConditionField = (field: keyof ConditionFormData, value: any) => {
  condition.value[field] = value
  emit('update:modelValue', condition.value)
}

const handlePropertyChange = (propertyInfo: { type: string; config: any }) => {
  propertyType.value = propertyInfo.type
  propertyConfig.value = propertyInfo.config

  // 重置操作符和值
  condition.value.operator = '='
  condition.value.param = ''

  updateValidationResult()
}

const handleOperatorChange = () => {
  // 重置值
  condition.value.param = ''
  updateValidationResult()
}

const handleValueValidate = (result: { valid: boolean; message: string }) => {
  valueValidation.value = result
  updateValidationResult()
}

const updateValidationResult = () => {
  // 基础验证
  if (!condition.value.identifier) {
    isValid.value = false
    validationMessage.value = '请选择监控项'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  if (!condition.value.operator) {
    isValid.value = false
    validationMessage.value = '请选择操作符'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  if (!condition.value.param) {
    isValid.value = false
    validationMessage.value = '请输入比较值'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  // 值验证
  if (!valueValidation.value.valid) {
    isValid.value = false
    validationMessage.value = valueValidation.value.message
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  // 验证通过
  isValid.value = true
  validationMessage.value = '条件配置验证通过'
  emit('validate', { valid: true, message: validationMessage.value })
}

// 监听条件变化
watch(
  () => [condition.value.identifier, condition.value.operator, condition.value.param],
  () => {
    updateValidationResult()
  },
  { deep: true }
)

// 初始化
onMounted(() => {
  updateValidationResult()
})
</script>

<style scoped>
.condition-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.condition-preview {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.preview-icon {
  color: var(--el-color-primary);
  font-size: 14px;
}

.preview-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.preview-content {
  margin-left: 20px;
}

.preview-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-blank);
  padding: 8px 12px;
  border-radius: 4px;
  display: block;
  font-family: inherit;
}

.validation-result {
  margin-top: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
