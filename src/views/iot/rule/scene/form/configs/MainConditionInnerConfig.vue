<!-- 主条件内部配置组件 - 不显示条件类型选择 -->
<template>
  <div class="space-y-16px">
    <!-- 触发事件类型显示 -->
    <div class="flex items-center gap-8px mb-16px">
      <span class="text-14px text-[var(--el-text-color-regular)]">触发事件类型：</span>
      <el-tag size="small" type="primary">{{ getTriggerTypeText(triggerType) }}</el-tag>
    </div>

    <!-- 设备属性条件配置 -->
    <div v-if="isDevicePropertyTrigger" class="space-y-16px">
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
      <div v-if="conditionPreview" class="mt-12px">
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          预览：{{ conditionPreview }}
        </div>
      </div>
    </div>

    <!-- 设备状态条件配置 -->
    <div v-else-if="isDeviceStatusTrigger" class="space-y-16px">
      <DeviceStatusConditionConfig
        :model-value="condition"
        @update:model-value="updateCondition"
        @validate="handleValidate"
      />
    </div>

    <!-- 其他触发类型的提示 -->
    <div v-else class="text-center py-20px">
      <p class="text-14px text-[var(--el-text-color-secondary)] mb-4px">
        当前触发事件类型：{{ getTriggerTypeText(triggerType) }}
      </p>
      <p class="text-12px text-[var(--el-text-color-placeholder)]">
        此触发类型暂不需要配置额外条件
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import PropertySelector from '../selectors/PropertySelector.vue'
import OperatorSelector from '../selectors/OperatorSelector.vue'
import ValueInput from '../inputs/ValueInput.vue'
import DeviceStatusConditionConfig from './DeviceStatusConditionConfig.vue'
import { ConditionFormData } from '@/api/iot/rule/scene/scene.types'
import { IotRuleSceneTriggerTypeEnum } from '@/api/iot/rule/scene/scene.types'
import { useVModel } from '@vueuse/core'

/** 主条件内部配置组件 */
defineOptions({ name: 'MainConditionInnerConfig' })

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

// 响应式数据
const condition = useVModel(props, 'modelValue', emit)
const isValid = ref(true)
const validationMessage = ref('')
const propertyType = ref('')
const propertyConfig = ref<any>(null)

// 计算属性
const isDevicePropertyTrigger = computed(() => {
  return (
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST ||
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  )
})

const isDeviceStatusTrigger = computed(() => {
  return props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE
})

const conditionPreview = computed(() => {
  if (!condition.value.productId || !condition.value.deviceId || !condition.value.identifier) {
    return ''
  }
  return `设备[${condition.value.deviceId}]的${condition.value.identifier} ${condition.value.operator} ${condition.value.param}`
})

// 获取触发类型文本
const getTriggerTypeText = (type: number) => {
  switch (type) {
    case IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST:
      return '设备属性上报'
    case IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST:
      return '设备事件上报'
    case IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE:
      return '设备服务调用'
    case IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE:
      return '设备状态变化'
    default:
      return '未知类型'
  }
}

// 事件处理
const updateConditionField = (field: keyof ConditionFormData, value: any) => {
  condition.value[field] = value
  updateValidationResult()
}

const updateCondition = (value: ConditionFormData) => {
  emit('update:modelValue', value)
  updateValidationResult()
}

const handleProductChange = () => {
  // 产品变化时清空设备和属性
  condition.value.deviceId = undefined
  condition.value.identifier = ''
  updateValidationResult()
}

const handleDeviceChange = () => {
  // 设备变化时清空属性
  condition.value.identifier = ''
  updateValidationResult()
}

const handlePropertyChange = (propertyInfo: any) => {
  if (propertyInfo) {
    propertyType.value = propertyInfo.type
    propertyConfig.value = propertyInfo.config
  }
  updateValidationResult()
}

const handleOperatorChange = () => {
  updateValidationResult()
}

const handleValueValidate = (result: { valid: boolean; message: string }) => {
  updateValidationResult()
}

const handleValidate = (result: { valid: boolean; message: string }) => {
  isValid.value = result.valid
  validationMessage.value = result.message
  emit('validate', result)
}

// 验证逻辑
const updateValidationResult = () => {
  if (isDevicePropertyTrigger.value) {
    // 设备属性触发验证
    if (!condition.value.productId) {
      isValid.value = false
      validationMessage.value = '请选择产品'
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }

    if (!condition.value.deviceId) {
      isValid.value = false
      validationMessage.value = '请选择设备'
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }

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
  }

  isValid.value = true
  validationMessage.value = '主条件配置验证通过'
  emit('validate', { valid: true, message: validationMessage.value })
}

// 监听变化
watch(
  () => [
    condition.value.productId,
    condition.value.deviceId,
    condition.value.identifier,
    condition.value.operator,
    condition.value.param
  ],
  () => {
    updateValidationResult()
  },
  { immediate: true }
)
</script>
