<!-- 单个条件配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 条件类型选择 -->
    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item label="条件类型" required>
          <el-select
            :model-value="condition.type"
            @update:model-value="(value) => updateConditionField('type', value)"
            @change="handleConditionTypeChange"
            placeholder="请选择条件类型"
            class="w-full"
          >
            <el-option
              v-for="option in conditionTypeOptions"
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

    <!-- 设备状态条件配置 -->
    <div v-if="condition.type === ConditionTypeEnum.DEVICE_STATUS" class="flex flex-col gap-16px">
      <!-- 状态和操作符选择 -->
      <el-row :gutter="16">
        <!-- 操作符选择 -->
        <el-col :span="12">
          <el-form-item label="操作符" required>
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

        <!-- 状态选择 -->
        <el-col :span="12">
          <el-form-item label="设备状态" required>
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
    <div v-else-if="condition.type === ConditionTypeEnum.DEVICE_PROPERTY" class="space-y-16px">
      <!-- 属性配置 -->
      <el-row :gutter="16">
        <!-- 属性/事件/服务选择 -->
        <el-col :span="6">
          <el-form-item label="监控项" required>
            <!-- TODO @puhui999：是不是不展示“整数”、“小数”这个类型，一行，只展示属性名 + 标识，更简洁一点；然后标识是 tag；因为已经有个 ？ tip 了 -->
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
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 当前时间条件配置 -->
    <CurrentTimeConditionConfig
      v-else-if="condition.type === ConditionTypeEnum.CURRENT_TIME"
      :model-value="condition"
      @update:model-value="updateCondition"
    />
  </div>
</template>

<script setup lang="ts">
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
  IotRuleSceneTriggerConditionParameterOperatorEnum
} from '@/views/iot/utils/constants'

/** 单个条件配置组件 */
defineOptions({ name: 'ConditionConfig' })

const props = defineProps<{
  modelValue: TriggerCondition
  triggerType: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerCondition): void
}>()

const condition = useVModel(props, 'modelValue', emit)

// 常量定义
const ConditionTypeEnum = IotRuleSceneTriggerConditionTypeEnum

// 条件类型选项
const conditionTypeOptions = [
  {
    value: IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS,
    label: '设备状态'
  },
  {
    value: IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY,
    label: '设备属性'
  },
  {
    value: IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME,
    label: '当前时间'
  }
]

// 设备状态选项
const deviceStatusOptions = [
  {
    value: 'online',
    label: '在线'
  },
  {
    value: 'offline',
    label: '离线'
  }
]
// 状态操作符选项
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

// 状态
const propertyType = ref<string>('string')
const propertyConfig = ref<any>(null)

// 计算属性：判断是否为设备相关条件
const isDeviceCondition = computed(() => {
  return (
    condition.value.type === ConditionTypeEnum.DEVICE_STATUS ||
    condition.value.type === ConditionTypeEnum.DEVICE_PROPERTY
  )
})

// 事件处理
const updateConditionField = (field: keyof TriggerCondition, value: any) => {
  ;(condition.value as any)[field] = value
  emit('update:modelValue', condition.value)
}

const updateCondition = (newCondition: TriggerCondition) => {
  condition.value = newCondition
  emit('update:modelValue', condition.value)
}

const handleConditionTypeChange = (type: number) => {
  // 清理不相关的字段
  if (type === ConditionTypeEnum.DEVICE_STATUS) {
    condition.value.identifier = undefined
    // 清理时间相关字段（如果存在）
    if ('timeValue' in condition.value) {
      delete (condition.value as any).timeValue
    }
    if ('timeValue2' in condition.value) {
      delete (condition.value as any).timeValue2
    }
  } else if (type === ConditionTypeEnum.CURRENT_TIME) {
    condition.value.identifier = undefined
    condition.value.productId = undefined
    condition.value.deviceId = undefined
  } else if (type === ConditionTypeEnum.DEVICE_PROPERTY) {
    // 清理时间相关字段（如果存在）
    if ('timeValue' in condition.value) {
      delete (condition.value as any).timeValue
    }
    if ('timeValue2' in condition.value) {
      delete (condition.value as any).timeValue2
    }
  }

  // 重置操作符和参数，使用枚举中的默认值
  condition.value.operator = IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value
  condition.value.param = ''
}

const handleProductChange = (_: number) => {
  // 产品变化时清空设备和属性
  condition.value.deviceId = undefined
  condition.value.identifier = ''
}

const handleDeviceChange = (_: number) => {
  // 设备变化时清空属性
  condition.value.identifier = ''
}

const handlePropertyChange = (propertyInfo: { type: string; config: any }) => {
  propertyType.value = propertyInfo.type
  propertyConfig.value = propertyInfo.config

  // 重置操作符和值
  condition.value.operator = '='
  condition.value.param = ''
}

const handleOperatorChange = () => {
  // 重置值
  condition.value.param = ''
}
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
