<template>
  <el-form
    ref="innerFormRef"
    :model="condition"
    :rules="conditionRules"
    label-width="110px"
    class="space-y-16px"
  >
    <!-- 触发事件类型选择 -->
    <el-form-item label="触发事件类型" required>
      <el-select
        :model-value="triggerType"
        @update:model-value="handleTriggerTypeChange"
        placeholder="请选择触发事件类型"
        class="w-full"
      >
        <el-option
          v-for="option in triggerTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </el-form-item>

    <!-- 设备属性条件配置 -->
    <div v-if="isDevicePropertyTrigger" class="space-y-16px">
      <!-- 产品设备选择 -->
      <el-row :gutter="16">
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

      <!-- 属性配置 -->
      <el-row :gutter="16">
        <!-- 属性/事件/服务选择 -->
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

        <!-- 操作符选择 - 服务调用和事件上报不需要操作符 -->
        <el-col v-if="needsOperatorSelector" :span="6">
          <el-form-item label="操作符" prop="operator" required>
            <OperatorSelector
              :model-value="condition.operator"
              @update:model-value="(value) => updateConditionField('operator', value)"
              :property-type="propertyType"
            />
          </el-form-item>
        </el-col>

        <!-- 值输入 -->
        <el-col :span="isWideValueColumn ? 18 : 12">
          <el-form-item :label="valueInputLabel" prop="value" :required="needsValueRequired">
            <!-- 服务调用参数配置 -->
            <JsonParamsInput
              v-if="triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE"
              v-model="condition.value"
              type="service"
              :config="serviceConfig"
              placeholder="请输入 JSON 格式的服务参数"
            />
            <!-- 事件上报比较值：标量填裸值；结构体／数组填 JSON 整体相等；留空则事件发生即匹配 -->
            <template v-else-if="triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST">
              <el-input
                :model-value="condition.value"
                @update:model-value="(value) => updateConditionField('value', value)"
                placeholder="留空则事件发生即匹配"
              />
              <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px leading-relaxed">
                标量事件值填裸值（如
                <code class="px-2px">normal</code>）；结构体／数组事件值填合法 JSON（如
                <code class="px-2px">{"level":"high"}</code>）
              </div>
            </template>
            <!-- 普通值输入 -->
            <ValueInput
              v-else
              :model-value="condition.value"
              @update:model-value="(value) => updateConditionField('value', value)"
              :property-type="propertyType"
              :operator="condition.operator"
              :property-config="propertyConfig"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 设备状态条件配置 -->
    <div v-else-if="isDeviceStatusTrigger" class="space-y-16px">
      <!-- 设备状态触发器使用简化的配置 -->
      <el-row :gutter="16">
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
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="操作符" prop="operator" required>
            <el-select
              :model-value="condition.operator"
              @update:model-value="(value) => updateConditionField('operator', value)"
              placeholder="请选择操作符"
              class="w-full"
            >
              <el-option
                :label="IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.name"
                :value="IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="参数" prop="value" required>
            <el-select
              :model-value="condition.value"
              @update:model-value="(value) => updateConditionField('value', value)"
              placeholder="请选择设备状态"
              class="w-full"
            >
              <el-option
                v-for="option in deviceStatusChangeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 其他触发类型的提示 -->
    <div v-else class="text-center py-20px">
      <p class="text-14px text-[var(--el-text-color-secondary)] mb-4px">
        当前触发事件类型：{{ getTriggerTypeLabel(triggerType) }}
      </p>
      <p class="text-12px text-[var(--el-text-color-placeholder)]">
        此触发类型暂不需要配置额外条件
      </p>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import PropertySelector from '../selectors/PropertySelector.vue'
import OperatorSelector from '../selectors/OperatorSelector.vue'
import ValueInput from '../inputs/ValueInput.vue'
import JsonParamsInput from '../inputs/JsonParamsInput.vue'

import type { Trigger } from '@/api/iot/rule/scene'
import {
  IotRuleSceneTriggerTypeEnum,
  triggerTypeOptions,
  getTriggerTypeLabel,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  IoTDeviceStatusEnum
} from '@/views/iot/utils/constants'
import { buildMainConditionRules } from '@/views/iot/utils/sceneRule'
import { useVModel } from '@vueuse/core'

/** 主条件内部配置组件 */
defineOptions({ name: 'MainConditionInnerConfig' })

const props = defineProps<{
  modelValue: Trigger
  triggerType: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Trigger): void
  (e: 'trigger-type-change', value: number): void
}>()

/** 获取设备状态变更选项（用于触发器配置） */
const deviceStatusChangeOptions = [
  {
    label: IoTDeviceStatusEnum.ONLINE.label,
    value: IoTDeviceStatusEnum.ONLINE.value
  },
  {
    label: IoTDeviceStatusEnum.OFFLINE.label,
    value: IoTDeviceStatusEnum.OFFLINE.value
  }
]

const condition = useVModel(props, 'modelValue', emit)
const innerFormRef = ref<FormInstance>()
const propertyType = ref('') // 属性类型
const propertyConfig = ref<any>(null) // 属性配置

const conditionRules = computed(() => buildMainConditionRules(props.triggerType))

// 计算属性：是否为设备属性触发器
const isDevicePropertyTrigger = computed(() => {
  return (
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST ||
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  )
})

// 计算属性：是否为设备状态触发器
const isDeviceStatusTrigger = computed(() => {
  return props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE
})

// 计算属性：是否需要操作符选择（服务调用和事件上报不需要操作符）
const needsOperatorSelector = computed(() => {
  const noOperatorTriggerTypes = [
    IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE,
    IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST
  ] as number[]
  return !noOperatorTriggerTypes.includes(props.triggerType)
})

// 比较值是否必填（属性上报必填，事件/服务可选）
const needsValueRequired = computed(() => {
  return props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST
})

// 计算属性：是否需要宽列布局（服务调用和事件上报不需要操作符列，所以值输入列更宽）
const isWideValueColumn = computed(() => {
  const wideColumnTriggerTypes = [
    IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE,
    IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST
  ] as number[]
  return wideColumnTriggerTypes.includes(props.triggerType)
})

// 计算属性：值输入字段的标签文本
const valueInputLabel = computed(() => {
  return props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    ? '服务参数'
    : '比较值'
})

// 计算属性：服务配置 - 用于 JsonParamsInput
const serviceConfig = computed(() => {
  if (
    propertyConfig.value &&
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ) {
    return {
      service: {
        name: propertyConfig.value.name || '服务',
        inputParams: propertyConfig.value.inputParams || []
      }
    }
  }
  return undefined
})

/** 设备状态触发器默认操作符为「等于」 */
const ensureDeviceStatusDefaults = () => {
  if (props.triggerType !== IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
    return
  }
  if (!condition.value.operator) {
    condition.value.operator = IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value
  }
}

/**
 * 更新条件字段
 * @param field 字段名
 * @param value 字段值
 */
const updateConditionField = (field: keyof Trigger, value: any) => {
  Object.assign(condition.value, { [field]: value })
  nextTick(() => {
    innerFormRef.value?.validateField(field as string).catch(() => {})
  })
}

/**
 * 处理触发器类型变化事件
 * @param type 触发器类型
 */
const handleTriggerTypeChange = (type: number) => {
  emit('trigger-type-change', type)
}

/** 处理产品变化事件 */
const handleProductChange = () => {
  condition.value.deviceId = undefined
  condition.value.identifier = ''
  nextTick(() => {
    innerFormRef.value?.clearValidate(['deviceId', 'identifier'])
  })
}

/** 处理设备变化事件 */
const handleDeviceChange = () => {
  condition.value.identifier = ''
  nextTick(() => {
    innerFormRef.value?.clearValidate('identifier')
  })
}

/**
 * 处理属性变化事件
 * @param propertyInfo 属性信息对象
 */
const handlePropertyChange = (propertyInfo: any) => {
  if (propertyInfo) {
    propertyType.value = propertyInfo.type
    propertyConfig.value = propertyInfo.config

    if (
      props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
      props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    ) {
      condition.value.operator = IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value
    }
  }
}

/** 校验主条件表单 */
const validate = async (): Promise<boolean> => {
  if (!innerFormRef.value || Object.keys(conditionRules.value).length === 0) {
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

watch(
  () => props.triggerType,
  () => {
    ensureDeviceStatusDefaults()
    nextTick(() => clearValidate())
  },
  { immediate: true }
)

onMounted(() => {
  ensureDeviceStatusDefaults()
})
</script>
