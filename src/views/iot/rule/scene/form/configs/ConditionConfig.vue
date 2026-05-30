<!-- 单个条件配置组件 -->
<template>
  <el-form
    ref="innerFormRef"
    :model="condition"
    :rules="conditionRules"
    label-width="110px"
    class="flex flex-col gap-16px"
  >
    <!-- 条件类型选择 -->
    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item label="条件类型" prop="type" required>
          <el-select
            :model-value="condition.type"
            @update:model-value="(value) => updateConditionField('type', value)"
            @change="handleConditionTypeChange"
            placeholder="请选择条件类型"
            class="w-full"
          >
            <el-option
              v-for="option in getConditionTypeOptions()"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 产品设备选择 - 设备相关条件的公共部分 -->
    <el-row v-if="isDeviceCondition" :gutter="16">
      <el-col :span="12">
        <el-form-item label="产品" prop="productId" required>
          <ProductSelector
            :model-value="condition.productId"
            @update:model-value="(value) => updateConditionField('productId', value)"
            @change="handleProductChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="设备" prop="deviceId" required>
          <DeviceSelector
            :model-value="condition.deviceId"
            @update:model-value="(value) => updateConditionField('deviceId', value)"
            :product-id="condition.productId"
            @change="handleDeviceChange"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 设备状态条件配置 -->
    <div
      v-if="condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS"
      class="flex flex-col gap-16px"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="操作符" prop="operator" required>
            <el-select
              :model-value="condition.operator"
              @update:model-value="(value) => updateConditionField('operator', value)"
              placeholder="请选择操作符"
              class="w-full"
            >
              <el-option
                v-for="option in statusOperatorOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="设备状态" prop="param" required>
            <el-select
              :model-value="condition.param"
              @update:model-value="(value) => updateConditionField('param', value)"
              placeholder="请选择设备状态"
              class="w-full"
            >
              <el-option
                v-for="option in deviceStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 设备属性条件配置 -->
    <div
      v-else-if="condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY"
      class="space-y-16px"
    >
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="监控项" prop="identifier" required>
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

        <el-col :span="6">
          <el-form-item label="操作符" prop="operator" required>
            <OperatorSelector
              :model-value="condition.operator"
              @update:model-value="(value) => updateConditionField('operator', value)"
              :property-type="propertyType"
              @change="handleOperatorChange"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="比较值" prop="param" required>
            <ValueInput
              :model-value="condition.param"
              @update:model-value="(value) => updateConditionField('param', value)"
              :property-type="propertyType"
              :operator="condition.operator"
              :property-config="propertyConfig"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 当前时间条件配置 -->
    <CurrentTimeConditionConfig
      v-else-if="condition.type === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME"
      :model-value="condition"
      @update:model-value="updateCondition"
      @field-change="handleCurrentTimeFieldChange"
    />
  </el-form>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { useVModel } from '@vueuse/core'
import CurrentTimeConditionConfig from './CurrentTimeConditionConfig.vue'
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import PropertySelector from '../selectors/PropertySelector.vue'
import OperatorSelector from '../selectors/OperatorSelector.vue'
import ValueInput from '../inputs/ValueInput.vue'
import type { TriggerCondition } from '@/api/iot/rule/scene'
import {
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  getConditionTypeOptions,
  IoTDeviceStatusEnum
} from '@/views/iot/utils/constants'
import { buildSubConditionRules } from '@/views/iot/utils/sceneRule'

/** 单个条件配置组件 */
defineOptions({ name: 'ConditionConfig' })

const props = defineProps<{
  modelValue: TriggerCondition
  triggerType: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerCondition): void
}>()

/** 获取设备状态选项 */
const deviceStatusOptions = [
  {
    value: IoTDeviceStatusEnum.ONLINE.value,
    label: IoTDeviceStatusEnum.ONLINE.label
  },
  {
    value: IoTDeviceStatusEnum.OFFLINE.value,
    label: IoTDeviceStatusEnum.OFFLINE.label
  }
]

/** 获取状态操作符选项 */
const statusOperatorOptions = [
  {
    value: IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value,
    label: IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.name
  },
  {
    value: IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS.value,
    label: IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS.name
  }
]

const condition = useVModel(props, 'modelValue', emit)
const innerFormRef = ref<FormInstance>()
const propertyType = ref<string>('string')
const propertyConfig = ref<any>(null)

const isDeviceCondition = computed(() => {
  return (
    condition.value.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS ||
    condition.value.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY
  )
})

const conditionRules = computed(() =>
  buildSubConditionRules(condition.value.type, () => condition.value.operator)
)

/**
 * 更新条件字段
 * @param field 字段名
 * @param value 字段值
 */
const updateConditionField = (field: keyof TriggerCondition, value: any) => {
  ;(condition.value as any)[field] = value
  emit('update:modelValue', condition.value)
  nextTick(() => {
    innerFormRef.value?.validateField(field as string).catch(() => {})
  })
}

/**
 * 更新整个条件对象
 * @param newCondition 新的条件对象
 */
const updateCondition = (newCondition: TriggerCondition) => {
  condition.value = newCondition
  emit('update:modelValue', condition.value)
}

/** 当前时间子组件字段变更后触发校验 */
const handleCurrentTimeFieldChange = (field: string) => {
  nextTick(() => {
    innerFormRef.value?.validateField(field).catch(() => {})
  })
}

/**
 * 处理条件类型变化事件
 * @param type 条件类型
 */
const handleConditionTypeChange = (type: number) => {
  const isCurrentTime = type === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME
  const isDeviceStatus = type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS

  if (isCurrentTime || isDeviceStatus) {
    condition.value.identifier = undefined
  }

  if (isCurrentTime) {
    condition.value.productId = undefined
    condition.value.deviceId = undefined
  }

  condition.value.operator = isCurrentTime
    ? 'at_time'
    : IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value

  condition.value.param = ''
  emit('update:modelValue', condition.value)
  nextTick(() => clearValidate())
}

/** 处理产品变化事件 */
const handleProductChange = () => {
  condition.value.deviceId = undefined
  condition.value.identifier = ''
  emit('update:modelValue', condition.value)
  nextTick(() => {
    innerFormRef.value?.clearValidate(['deviceId', 'identifier'])
  })
}

/** 处理设备变化事件 */
const handleDeviceChange = () => {
  condition.value.identifier = ''
  emit('update:modelValue', condition.value)
  nextTick(() => {
    innerFormRef.value?.clearValidate('identifier')
  })
}

/**
 * 处理属性变化事件
 * @param propertyInfo 属性信息对象
 */
const handlePropertyChange = (propertyInfo: { type: string; config: any }) => {
  propertyType.value = propertyInfo.type
  propertyConfig.value = propertyInfo.config
  condition.value.operator = IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value
  condition.value.param = ''
  emit('update:modelValue', condition.value)
}

/** 处理操作符变化事件 */
const handleOperatorChange = () => {
  condition.value.param = ''
  emit('update:modelValue', condition.value)
  nextTick(() => {
    innerFormRef.value?.validateField('param').catch(() => {})
  })
}

const validate = async (): Promise<boolean> => {
  if (!innerFormRef.value) {
    return true
  }
  try {
    await innerFormRef.value.validate()
    return true
  } catch {
    return false
  }
}

const clearValidate = () => {
  innerFormRef.value?.clearValidate()
}

defineExpose({ validate, clearValidate })
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
