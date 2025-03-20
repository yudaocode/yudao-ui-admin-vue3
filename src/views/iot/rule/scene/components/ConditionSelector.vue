<template>
  <div class="condition-selector">
    <el-select 
      v-model="selectedOperator" 
      :placeholder="placeholder || '请选择操作符'"
      class="condition-select"
      @change="handleOperatorChange"
    >
      <el-option 
        v-for="item in operatorOptions" 
        :key="item.value" 
        :label="item.label" 
        :value="item.value"
      >
        <div class="operator-option">
          <span>{{ item.label }}</span>
          <span class="operator-symbol">{{ item.symbol }}</span>
        </div>
      </el-option>
    </el-select>

    <!-- 普通输入值 -->
    <template v-if="!isRangeOperator && !isListOperator">
      <el-input 
        v-model="inputValue" 
        :placeholder="valuePlaceholder || '请输入值'"
        class="value-input"
        @change="handleValueChange"
      />
    </template>

    <!-- 范围值输入 -->
    <template v-if="isRangeOperator">
      <div class="range-input">
        <el-input 
          v-model="rangeValue.min" 
          placeholder="最小值"
          class="range-input-item"
          @change="handleRangeValueChange"
        />
        <span class="range-separator">至</span>
        <el-input 
          v-model="rangeValue.max" 
          placeholder="最大值"
          class="range-input-item"
          @change="handleRangeValueChange"
        />
      </div>
    </template>

    <!-- 列表值输入 -->
    <template v-if="isListOperator">
      <el-select
        v-model="listValue"
        :placeholder="valuePlaceholder || '请选择值'"
        multiple
        filterable
        allow-create
        class="list-select"
        @change="handleListValueChange"
      >
        <el-option
          v-for="item in listOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineEmits, defineProps } from 'vue'
import { IotRuleSceneTriggerConditionParameterOperatorEnum } from '@/api/iot/rule/scene/scene.types'

interface ConditionValue {
  operator: IotRuleSceneTriggerConditionParameterOperatorEnum
  value: string
}

// 定义组件属性
const props = defineProps({
  modelValue: {
    type: Object as () => ConditionValue,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  valuePlaceholder: {
    type: String,
    default: ''
  },
  listOptions: {
    type: Array as () => { label: string, value: string | number }[],
    default: () => []
  }
})

// 定义事件
const emit = defineEmits(['update:modelValue'])

// 操作符选项
const operatorOptions = [
  { label: '等于', value: IotRuleSceneTriggerConditionParameterOperatorEnum.EQ, symbol: '=' },
  { label: '不等于', value: IotRuleSceneTriggerConditionParameterOperatorEnum.NE, symbol: '≠' },
  { label: '大于', value: IotRuleSceneTriggerConditionParameterOperatorEnum.GT, symbol: '>' },
  { label: '小于', value: IotRuleSceneTriggerConditionParameterOperatorEnum.LT, symbol: '<' },
  { label: '大于等于', value: IotRuleSceneTriggerConditionParameterOperatorEnum.GTE, symbol: '≥' },
  { label: '小于等于', value: IotRuleSceneTriggerConditionParameterOperatorEnum.LTE, symbol: '≤' },
  { label: '在...之间', value: IotRuleSceneTriggerConditionParameterOperatorEnum.BETWEEN, symbol: '↔' },
  { label: '不在...之间', value: IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_BETWEEN, symbol: '⟷' },
  { label: '在列表中', value: IotRuleSceneTriggerConditionParameterOperatorEnum.IN, symbol: '∈' },
  { label: '不在列表中', value: IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_IN, symbol: '∉' }
]

// 当前选中的操作符
const selectedOperator = ref(props.modelValue.operator || '')

// 输入值
const inputValue = ref(props.modelValue.value || '')

// 范围值
const rangeValue = ref({
  min: '',
  max: ''
})

// 列表值
const listValue = ref([])

// 计算属性：是否为范围操作符
const isRangeOperator = computed(() => {
  return ['between', 'notBetween'].includes(selectedOperator.value)
})

// 计算属性：是否为列表操作符
const isListOperator = computed(() => {
  return ['in', 'notIn'].includes(selectedOperator.value)
})

// 处理操作符变更
const handleOperatorChange = () => {
  updateModelValue()
}

// 处理值变更
const handleValueChange = () => {
  updateModelValue()
}

// 处理范围值变更
const handleRangeValueChange = () => {
  updateModelValue()
}

// 处理列表值变更
const handleListValueChange = () => {
  updateModelValue()
}

// 更新组件值
const updateModelValue = () => {
  const value = isRangeOperator.value
    ? `${rangeValue.value.min},${rangeValue.value.max}`
    : isListOperator.value
    ? listValue.value.join(',')
    : inputValue.value

  emit('update:modelValue', {
    operator: selectedOperator.value,
    value
  })
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedOperator.value = newVal.operator || ''
    
    if (isRangeOperator.value && newVal.value) {
      const [min, max] = newVal.value.split(',')
      rangeValue.value = { min, max }
    } else if (isListOperator.value && newVal.value) {
      listValue.value = newVal.value.split(',')
    } else {
      inputValue.value = newVal.value || ''
    }
  }
}, { deep: true })
</script>

<style scoped>
.condition-selector {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
}

.condition-select {
  width: 120px;
}

.value-input {
  flex: 1;
}

.operator-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operator-symbol {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.range-input {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.range-input-item {
  flex: 1;
}

.range-separator {
  padding: 0 4px;
  color: var(--el-text-color-regular);
}

.list-select {
  flex: 1;
}
</style> 
