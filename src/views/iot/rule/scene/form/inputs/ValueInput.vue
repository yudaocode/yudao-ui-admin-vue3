<!-- 值输入组件 -->
<!-- TODO @yunai：这个需要在看看。。。 -->
<template>
  <div class="w-full min-w-0">
    <!-- 布尔值选择 -->
    <el-select
      v-if="propertyType === 'bool'"
      v-model="localValue"
      placeholder="请选择布尔值"
      @change="handleChange"
      class="w-full!"
      style="width: 100% !important"
    >
      <el-option label="真 (true)" value="true" />
      <el-option label="假 (false)" value="false" />
    </el-select>

    <!-- 枚举值选择 -->
    <el-select
      v-else-if="propertyType === 'enum' && enumOptions.length > 0"
      v-model="localValue"
      placeholder="请选择枚举值"
      @change="handleChange"
      class="w-full!"
      style="width: 100% !important"
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
      v-else-if="operator === 'between'"
      class="w-full! flex items-center gap-8px"
      style="width: 100% !important"
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
        style="width: auto !important"
      />
    </div>

    <!-- 列表输入 (in 操作符) -->
    <div v-else-if="operator === 'in'" class="w-full!" style="width: 100% !important">
      <el-input
        v-model="localValue"
        placeholder="请输入值列表，用逗号分隔"
        @input="handleChange"
        class="w-full!"
        style="width: 100% !important"
      >
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
      v-else-if="propertyType === 'date'"
      v-model="dateValue"
      type="datetime"
      placeholder="请选择日期时间"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
      @change="handleDateChange"
      class="w-full!"
      style="width: 100% !important"
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
      style="width: 100% !important"
    />

    <!-- 文本输入 -->
    <el-input
      v-else
      v-model="localValue"
      :type="getInputType()"
      :placeholder="getPlaceholder()"
      @input="handleChange"
      class="w-full!"
      style="width: 100% !important"
    >
      <template #suffix>
        <el-tooltip
          v-if="propertyConfig?.unit"
          :content="`单位：${propertyConfig.unit}`"
          placement="top"
        >
          <span class="text-12px text-[var(--el-text-color-secondary)] px-4px">{{
            propertyConfig.unit
          }}</span>
        </el-tooltip>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { IoTDataSpecsDataTypeEnum } from '@/views/iot/utils/constants'

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

// 状态
const rangeStart = ref('')
const rangeEnd = ref('')
const dateValue = ref('')
const numberValue = ref<number>()

// 计算属性
const enumOptions = computed(() => {
  if (props.propertyConfig?.enum) {
    return props.propertyConfig.enum.map((item: any) => ({
      label: item.name || item.label || item.value,
      value: item.value
    }))
  }
  return []
})

const listPreview = computed(() => {
  if (props.operator === 'in' && localValue.value) {
    return localValue.value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item)
  }
  return []
})

// 工具函数
const isNumericType = () => {
  return [
    IoTDataSpecsDataTypeEnum.INT,
    IoTDataSpecsDataTypeEnum.FLOAT,
    IoTDataSpecsDataTypeEnum.DOUBLE
  ].includes(props.propertyType || '')
}

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

const getPlaceholder = () => {
  const typeMap = {
    [IoTDataSpecsDataTypeEnum.TEXT]: '请输入字符串',
    [IoTDataSpecsDataTypeEnum.INT]: '请输入整数',
    [IoTDataSpecsDataTypeEnum.FLOAT]: '请输入浮点数',
    [IoTDataSpecsDataTypeEnum.DOUBLE]: '请输入双精度数',
    [IoTDataSpecsDataTypeEnum.STRUCT]: '请输入JSON格式数据',
    [IoTDataSpecsDataTypeEnum.ARRAY]: '请输入数组格式数据'
  }
  return typeMap[props.propertyType || ''] || '请输入值'
}

const getPrecision = () => {
  return props.propertyType === IoTDataSpecsDataTypeEnum.INT ? 0 : 2
}

const getStep = () => {
  return props.propertyType === IoTDataSpecsDataTypeEnum.INT ? 1 : 0.1
}

const getMin = () => {
  return props.propertyConfig?.min || undefined
}

const getMax = () => {
  return props.propertyConfig?.max || undefined
}

// 事件处理
const handleChange = () => {
  // 值变化处理
}

const handleRangeChange = () => {
  if (rangeStart.value && rangeEnd.value) {
    localValue.value = `${rangeStart.value},${rangeEnd.value}`
  } else {
    localValue.value = ''
  }
}

const handleDateChange = (value: string) => {
  localValue.value = value || ''
}

const handleNumberChange = (value: number | undefined) => {
  localValue.value = value?.toString() || ''
}

// 监听操作符变化
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
