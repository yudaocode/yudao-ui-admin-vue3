<!-- 操作符选择器组件 -->
<template>
  <div class="w-full">
    <el-select
      v-model="localValue"
      placeholder="请选择操作符"
      @change="handleChange"
      class="w-full"
    >
      <el-option
        v-for="operator in availableOperators"
        :key="operator.value"
        :label="operator.label"
        :value="operator.value"
      >
        <div class="flex items-center justify-between w-full py-4px">
          <div class="flex items-center gap-8px">
            <div class="text-14px font-500 text-[var(--el-text-color-primary)]">
              {{ operator.label }}
            </div>
            <div
              class="text-12px text-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)] px-6px py-2px rounded-4px font-mono"
            >
              {{ operator.symbol }}
            </div>
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{ operator.description }}
          </div>
        </div>
      </el-option>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 操作符选择器组件 */
defineOptions({ name: 'OperatorSelector' })

const props = defineProps<{
  modelValue?: string
  propertyType?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const localValue = useVModel(props, 'modelValue', emit)

// 所有操作符定义
const allOperators = [
  {
    value: '=',
    label: '等于',
    symbol: '=',
    description: '值完全相等时触发',
    example: 'temperature = 25',
    supportedTypes: ['int', 'float', 'double', 'string', 'bool', 'enum']
  },
  {
    value: '!=',
    label: '不等于',
    symbol: '≠',
    description: '值不相等时触发',
    example: 'power != false',
    supportedTypes: ['int', 'float', 'double', 'string', 'bool', 'enum']
  },
  {
    value: '>',
    label: '大于',
    symbol: '>',
    description: '值大于指定值时触发',
    example: 'temperature > 30',
    supportedTypes: ['int', 'float', 'double', 'date']
  },
  {
    value: '>=',
    label: '大于等于',
    symbol: '≥',
    description: '值大于或等于指定值时触发',
    example: 'humidity >= 80',
    supportedTypes: ['int', 'float', 'double', 'date']
  },
  {
    value: '<',
    label: '小于',
    symbol: '<',
    description: '值小于指定值时触发',
    example: 'temperature < 10',
    supportedTypes: ['int', 'float', 'double', 'date']
  },
  {
    value: '<=',
    label: '小于等于',
    symbol: '≤',
    description: '值小于或等于指定值时触发',
    example: 'battery <= 20',
    supportedTypes: ['int', 'float', 'double', 'date']
  },
  {
    value: 'in',
    label: '包含于',
    symbol: '∈',
    description: '值在指定列表中时触发',
    example: 'status in [1,2,3]',
    supportedTypes: ['int', 'float', 'string', 'enum']
  },
  {
    value: 'between',
    label: '介于',
    symbol: '⊆',
    description: '值在指定范围内时触发',
    example: 'temperature between 20,30',
    supportedTypes: ['int', 'float', 'double', 'date']
  },
  {
    value: 'contains',
    label: '包含',
    symbol: '⊃',
    description: '字符串包含指定内容时触发',
    example: 'message contains "error"',
    supportedTypes: ['string']
  },
  {
    value: 'startsWith',
    label: '开始于',
    symbol: '⊢',
    description: '字符串以指定内容开始时触发',
    example: 'deviceName startsWith "sensor"',
    supportedTypes: ['string']
  },
  {
    value: 'endsWith',
    label: '结束于',
    symbol: '⊣',
    description: '字符串以指定内容结束时触发',
    example: 'fileName endsWith ".log"',
    supportedTypes: ['string']
  }
]

// 计算属性
const availableOperators = computed(() => {
  if (!props.propertyType) {
    return allOperators
  }

  return allOperators.filter((op) => op.supportedTypes.includes(props.propertyType!))
})

const selectedOperator = computed(() => {
  return allOperators.find((op) => op.value === localValue.value)
})

// 事件处理
const handleChange = (value: string) => {
  emit('change', value)
}

// 监听属性类型变化
watch(
  () => props.propertyType,
  () => {
    // 如果当前选择的操作符不支持新的属性类型，则清空选择
    if (localValue.value && selectedOperator.value) {
      if (!selectedOperator.value.supportedTypes.includes(props.propertyType || '')) {
        localValue.value = ''
      }
    }
  }
)
</script>

<style scoped>
:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
