<template>
  <div class="space-y-16px">
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

        <!-- 操作符选择 - 服务调用和事件上报不需要操作符 -->
        <el-col
          v-if="
            triggerType !== IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE &&
            triggerType !== IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST
          "
          :span="6"
        >
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
        <el-col
          :span="
            triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE ||
            triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST
              ? 18
              : 12
          "
        >
          <el-form-item
            :label="
              triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
                ? '服务参数'
                : '比较值'
            "
            required
          >
            <!-- 服务调用参数配置 -->
            <JsonParamsInput
              v-if="triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE"
              v-model="condition.value"
              type="service"
              :config="serviceConfig"
              placeholder="请输入JSON格式的服务参数"
            />
            <!-- 事件上报参数配置 -->
            <JsonParamsInput
              v-else-if="triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST"
              v-model="condition.value"
              type="event"
              :config="eventConfig"
              placeholder="请输入JSON格式的事件参数"
            />
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

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="操作符" required>
            <el-select
              :model-value="condition.operator"
              @update:model-value="(value) => updateConditionField('operator', value)"
              placeholder="请选择操作符"
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
  </div>
</template>

<script setup lang="ts">
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import PropertySelector from '../selectors/PropertySelector.vue'
import OperatorSelector from '../selectors/OperatorSelector.vue'
import ValueInput from '../inputs/ValueInput.vue'
import JsonParamsInput from '../inputs/JsonParamsInput.vue'

import type { Trigger } from '@/api/iot/rule/scene'
import {
  IotRuleSceneTriggerTypeEnum,
  getTriggerTypeOptions,
  getTriggerTypeLabel,
  getDeviceStatusChangeOptions
} from '@/views/iot/utils/constants'
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

// 响应式数据
const condition = useVModel(props, 'modelValue', emit)
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

// 服务配置 - 用于 JsonParamsInput
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

// 事件配置 - 用于 JsonParamsInput
const eventConfig = computed(() => {
  if (propertyConfig.value && props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST) {
    return {
      event: {
        name: propertyConfig.value.name || '事件',
        outputParams: propertyConfig.value.outputParams || []
      }
    }
  }
  return undefined
})

// 使用标准化的选项获取函数
const triggerTypeOptions = getTriggerTypeOptions()
const deviceStatusChangeOptions = getDeviceStatusChangeOptions()

// 事件处理
const updateConditionField = (field: keyof Trigger, value: any) => {
  ;(condition.value as any)[field] = value
}

const handleTriggerTypeChange = (type: number) => {
  emit('trigger-type-change', type)
}

const handleProductChange = () => {
  // 产品变化时清空设备和属性
  condition.value.deviceId = undefined
  condition.value.identifier = ''
}

const handleDeviceChange = () => {
  // 设备变化时清空属性
  condition.value.identifier = ''
}

const handlePropertyChange = (propertyInfo: any) => {
  if (propertyInfo) {
    propertyType.value = propertyInfo.type
    propertyConfig.value = propertyInfo.config

    // 对于事件上报和服务调用，自动设置操作符为 '='
    if (
      props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
      props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    ) {
      condition.value.operator = '='
    }
  }
}

const handleOperatorChange = () => {
  // 操作符变化处理
}
</script>
