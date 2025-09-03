<!-- 值输入组件 -->
<template>
  <div class="w-full min-w-0">
    <!-- 布尔值选择 -->
    <el-select
      v-if="propertyType === IoTDataSpecsDataTypeEnum.BOOL"
      v-model="localValue"
      placeholder="请选择布尔值"
      class="w-full!"
    >
      <el-option label="真 (true)" value="true" />
      <el-option label="假 (false)" value="false" />
    </el-select>

    <!-- 枚举值选择 -->
    <el-select
      v-else-if="propertyType === IoTDataSpecsDataTypeEnum.ENUM && enumOptions.length > 0"
      v-model="localValue"
      placeholder="请选择枚举值"
      class="w-full!"
    >
      <el-option
        v-for="option in enumOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <!-- 范围输入 (between 操作符) -->
    <div
      v-else-if="operator === IotRuleSceneTriggerConditionParameterOperatorEnum.BETWEEN.value"
      class="w-full! flex items-center gap-8px"
    >
      <el-input
        v-model="rangeStart"
        :type="getInputType()"
        placeholder="最小值"
        @input="handleRangeChange"
        class="flex-1 min-w-0"
        style="width: auto !important"
      />
      <span class="text-12px text-[var(--el-text-color-secondary)] whitespace-nowrap">至</span>
      <el-input
        v-model="rangeEnd"
        :type="getInputType()"
        placeholder="最大值"
        @input="handleRangeChange"
        class="flex-1 min-w-0"
      />
    </div>

    <!-- 列表输入 (in 操作符) -->
    <div
      v-else-if="operator === IotRuleSceneTriggerConditionParameterOperatorEnum.IN.value"
      class="w-full!"
    >
      <el-input v-model="localValue" placeholder="请输入值列表，用逗号分隔" class="w-full!">
        <template #suffix>
          <el-tooltip content="多个值用逗号分隔，如：1,2,3" placement="top">
            <Icon
              icon="ep:question-filled"
              class="text-[var(--el-text-color-placeholder)] cursor-help"
            />
          </el-tooltip>
        </template>
      </el-input>
      <div v-if="listPreview.length > 0" class="mt-8px flex items-center gap-6px flex-wrap">
        <span class="text-12px text-[var(--el-text-color-secondary)]">解析结果：</span>
        <el-tag v-for="(item, index) in listPreview" :key="index" size="small" class="m-0">
          {{ item }}
        </el-tag>
      </div>
    </div>

    <!-- 日期时间输入 -->
    <el-date-picker
      v-else-if="propertyType === IoTDataSpecsDataTypeEnum.DATE"
      v-model="dateValue"
      type="datetime"
      placeholder="请选择日期时间"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
      @change="handleDateChange"
      class="w-full!"
    />

    <!-- 数字输入 -->
    <el-input-number
      v-else-if="isNumericType()"
      v-model="numberValue"
      :precision="getPrecision()"
      :step="getStep()"
      :min="getMin()"
      :max="getMax()"
      placeholder="请输入数值"
      @change="handleNumberChange"
      class="w-full!"
    />

    <!-- 文本输入 -->
    <el-input
      v-else
      v-model="localValue"
      :type="getInputType()"
      :placeholder="getPlaceholder()"
      class="w-full!"
    >
      <template #suffix>
        <el-tooltip
          v-if="propertyConfig?.unit"
          :content="`单位：${propertyConfig.unit}`"
          placement="top"
        >
          <span class="text-12px text-[var(--el-text-color-secondary)] px-4px">
            {{ propertyConfig.unit }}
          </span>
        </el-tooltip>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import {
  IoTDataSpecsDataTypeEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum
} from '@/views/iot/utils/constants'

/** 值输入组件 */
defineOptions({ name: 'ValueInput' })

interface Props {
  modelValue?: string
  propertyType?: string
  operator?: string
  propertyConfig?: any
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: ''
})

const rangeStart = ref('') // 范围开始值
const rangeEnd = ref('') // 范围结束值
const dateValue = ref('') // 日期值
const numberValue = ref<number>() // 数字值

/** 计算属性：枚举选项 */
const enumOptions = computed(() => {
  if (props.propertyConfig?.enum) {
    return props.propertyConfig.enum.map((item: any) => ({
      label: item.name || item.label || item.value,
      value: item.value
    }))
  }
  return []
})

/** 计算属性：列表预览 */
const listPreview = computed(() => {
  if (
    props.operator === IotRuleSceneTriggerConditionParameterOperatorEnum.IN.value &&
    localValue.value
  ) {
    return localValue.value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item)
  }
  return []
})

/** 判断是否为数字类型 */
const isNumericType = () => {
  return [
    IoTDataSpecsDataTypeEnum.INT,
    IoTDataSpecsDataTypeEnum.FLOAT,
    IoTDataSpecsDataTypeEnum.DOUBLE
  ].includes((props.propertyType || '') as any)
}

/** 获取输入框类型 */
const getInputType = () => {
  switch (props.propertyType) {
    case IoTDataSpecsDataTypeEnum.INT:
    case IoTDataSpecsDataTypeEnum.FLOAT:
    case IoTDataSpecsDataTypeEnum.DOUBLE:
      return 'number'
    default:
      return 'text'
  }
}

/** 获取占位符文本 */
const getPlaceholder = () => {
  const typeMap = {
    [IoTDataSpecsDataTypeEnum.TEXT]: '请输入字符串',
    [IoTDataSpecsDataTypeEnum.INT]: '请输入整数',
    [IoTDataSpecsDataTypeEnum.FLOAT]: '请输入浮点数',
    [IoTDataSpecsDataTypeEnum.DOUBLE]: '请输入双精度数',
    [IoTDataSpecsDataTypeEnum.STRUCT]: '请输入 JSON 格式数据',
    [IoTDataSpecsDataTypeEnum.ARRAY]: '请输入数组格式数据'
  }
  return typeMap[props.propertyType || ''] || '请输入值'
}

/** 获取数字精度 */
const getPrecision = () => {
  return props.propertyType === IoTDataSpecsDataTypeEnum.INT ? 0 : 2
}

/** 获取数字步长 */
const getStep = () => {
  return props.propertyType === IoTDataSpecsDataTypeEnum.INT ? 1 : 0.1
}

/** 获取最小值 */
const getMin = () => {
  return props.propertyConfig?.min || undefined
}

/** 获取最大值 */
const getMax = () => {
  return props.propertyConfig?.max || undefined
}

/** 处理范围变化事件 */
const handleRangeChange = () => {
  if (rangeStart.value && rangeEnd.value) {
    localValue.value = `${rangeStart.value},${rangeEnd.value}`
  } else {
    localValue.value = ''
  }
}

/** 处理日期变化事件 */
const handleDateChange = (value: string) => {
  localValue.value = value || ''
}

/** 处理数字变化事件 */
const handleNumberChange = (value: number | undefined) => {
  localValue.value = value?.toString() || ''
}

/** 监听操作符变化 */
watch(
  () => props.operator,
  () => {
    localValue.value = ''
    rangeStart.value = ''
    rangeEnd.value = ''
    dateValue.value = ''
    numberValue.value = undefined
  }
)
</script>
