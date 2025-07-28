<!-- 单个条件配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 条件类型选择 -->
    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item label="条件类型" required>
          <ConditionTypeSelector
            :model-value="condition.type"
            @update:model-value="(value) => updateConditionField('type', value)"
            @change="handleConditionTypeChange"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 设备状态条件配置 -->
    <DeviceStatusConditionConfig
      v-if="condition.type === ConditionTypeEnum.DEVICE_STATUS"
      :model-value="condition"
      @update:model-value="updateCondition"
      @validate="handleValidate"
    />

    <!-- 设备属性条件配置 -->
    <div v-else-if="condition.type === ConditionTypeEnum.DEVICE_PROPERTY" class="space-y-16px">
      <!-- 产品设备选择 -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="产品" required>
            <ProductSelector
              :model-value="condition.productId"
              @update:model-value="(value) => updateConditionField('productId', value)"
              @change="handleProductChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备" required>
            <DeviceSelector
              :model-value="condition.deviceId"
              @update:model-value="(value) => updateConditionField('deviceId', value)"
              :product-id="condition.productId"
              @change="handleDeviceChange"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 属性配置 -->
      <el-row :gutter="16">
        <!-- 属性/事件/服务选择 -->
        <el-col :span="6">
          <el-form-item label="监控项" required>
            <PropertySelector
              :model-value="condition.identifier"
              @update:model-value="(value) => updateConditionField('identifier', value)"
              :trigger-type="triggerType"
              :product-id="condition.productId"
              :device-id="condition.deviceId"
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
        <el-col :span="12">
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
      <!-- TODO puhui999：可以去掉。。。因为表单选择了，可以看懂的呀。 -->
      <div
        v-if="conditionPreview"
        class="p-12px bg-[var(--el-fill-color-light)] rounded-6px border border-[var(--el-border-color-lighter)]"
      >
        <div class="flex items-center gap-8px mb-8px">
          <Icon icon="ep:view" class="text-[var(--el-color-info)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">条件预览</span>
        </div>
        <div class="pl-24px">
          <code
            class="text-12px text-[var(--el-color-primary)] bg-[var(--el-fill-color-blank)] p-8px rounded-4px font-mono"
            >{{ conditionPreview }}</code
          >
        </div>
      </div>
    </div>

    <!-- 当前时间条件配置 -->
    <CurrentTimeConditionConfig
      v-else-if="condition.type === ConditionTypeEnum.CURRENT_TIME"
      :model-value="condition"
      @update:model-value="updateCondition"
      @validate="handleValidate"
    />

    <!-- 验证结果 -->
    <div v-if="validationMessage" class="mt-8px">
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
import ConditionTypeSelector from '../selectors/ConditionTypeSelector.vue'
import DeviceStatusConditionConfig from './DeviceStatusConditionConfig.vue'
import CurrentTimeConditionConfig from './CurrentTimeConditionConfig.vue'
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import PropertySelector from '../selectors/PropertySelector.vue'
import OperatorSelector from '../selectors/OperatorSelector.vue'
import ValueInput from '../inputs/ValueInput.vue'
import {
  ConditionFormData,
  IotRuleSceneTriggerConditionTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 单个条件配置组件 */
defineOptions({ name: 'ConditionConfig' })

interface Props {
  modelValue: ConditionFormData
  triggerType: number
}

interface Emits {
  (e: 'update:modelValue', value: ConditionFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const condition = useVModel(props, 'modelValue', emit)

// 常量定义
const ConditionTypeEnum = IotRuleSceneTriggerConditionTypeEnum

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
  ;(condition.value as any)[field] = value
  emit('update:modelValue', condition.value)
}

const updateCondition = (newCondition: ConditionFormData) => {
  condition.value = newCondition
  emit('update:modelValue', condition.value)
}

const handleConditionTypeChange = (type: number) => {
  // 清理不相关的字段
  if (type === ConditionTypeEnum.DEVICE_STATUS) {
    condition.value.identifier = undefined
    condition.value.timeValue = undefined
    condition.value.timeValue2 = undefined
  } else if (type === ConditionTypeEnum.CURRENT_TIME) {
    condition.value.identifier = undefined
    condition.value.productId = undefined
    condition.value.deviceId = undefined
  } else if (type === ConditionTypeEnum.DEVICE_PROPERTY) {
    condition.value.timeValue = undefined
    condition.value.timeValue2 = undefined
  }

  // 重置操作符和参数
  condition.value.operator = '='
  condition.value.param = ''

  updateValidationResult()
}

const handleValidate = (result: { valid: boolean; message: string }) => {
  isValid.value = result.valid
  validationMessage.value = result.message
  emit('validate', result)
}

const handleProductChange = (productId: number) => {
  // 产品变化时清空设备和属性
  condition.value.deviceId = undefined
  condition.value.identifier = ''
  updateValidationResult()
}

const handleDeviceChange = (deviceId: number) => {
  // 设备变化时清空属性
  condition.value.identifier = ''
  updateValidationResult()
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
:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
