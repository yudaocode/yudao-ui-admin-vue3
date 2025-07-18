<!-- 操作符选择器组件 -->
<template>
  <div class="operator-selector">
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
        <div class="operator-option">
          <div class="option-content">
            <div class="option-label">{{ operator.label }}</div>
            <div class="option-symbol">{{ operator.symbol }}</div>
          </div>
          <div class="option-desc">{{ operator.description }}</div>
        </div>
      </el-option>
    </el-select>

    <!-- 操作符说明 -->
    <!-- TODO @puhui999：这个去掉 -->
    <div v-if="selectedOperator" class="operator-description">
      <div class="desc-content">
        <Icon icon="ep:info-filled" class="desc-icon" />
        <span class="desc-text">{{ selectedOperator.description }}</span>
      </div>
      <div v-if="selectedOperator.example" class="desc-example">
        <span class="example-label">示例：</span>
        <code class="example-code">{{ selectedOperator.example }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 操作符选择器组件 */
defineOptions({ name: 'OperatorSelector' })

interface Props {
  modelValue?: string
  propertyType?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
.operator-selector {
  width: 100%;
}

.operator-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.option-symbol {
  font-size: 16px;
  color: var(--el-color-primary);
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 120px;
  text-align: right;
}

.operator-description {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.desc-content {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.desc-icon {
  color: var(--el-color-primary);
  font-size: 12px;
  flex-shrink: 0;
}

.desc-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.desc-example {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 18px;
}

.example-label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.example-code {
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-fill-color-blank);
  padding: 2px 4px;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
