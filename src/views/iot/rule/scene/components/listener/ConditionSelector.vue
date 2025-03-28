<template>
  <el-select v-model="selectedOperator" class="w-1/1" clearable :placeholder="placeholder">
    <!-- 根据属性类型展示不同的可选条件 -->
    <el-option
      v-for="(item, key) in filteredOperators"
      :key="key"
      :label="item.name"
      :value="item.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IotRuleSceneTriggerConditionParameterOperatorEnum } from '@/api/iot/rule/scene/scene.types'

/** 条件选择器 */
defineOptions({ name: 'ConditionSelector' })
const props = defineProps({
  placeholder: {
    type: String,
    default: '请选择条件'
  },
  modelValue: {
    type: String,
    default: ''
  },
  dataType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedOperator = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 根据数据类型过滤可用的操作符
const filteredOperators = computed(() => {
  // 如果没有指定数据类型，返回所有操作符
  if (!props.dataType) {
    return IotRuleSceneTriggerConditionParameterOperatorEnum
  }

  const operatorMap = new Map()
  
  // 添加通用的操作符（所有类型都有非空操作符）
  operatorMap.set('NOT_NULL', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_NULL)
  
  // 根据数据类型添加特定的操作符
  switch (props.dataType) {
    case 'int':
    case 'float':
    case 'double':
      // 数值类型支持的所有操作符
      operatorMap.set('EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS)
      operatorMap.set('NOT_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS)
      operatorMap.set('GREATER_THAN', IotRuleSceneTriggerConditionParameterOperatorEnum.GREATER_THAN)
      operatorMap.set('GREATER_THAN_OR_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.GREATER_THAN_OR_EQUALS)
      operatorMap.set('LESS_THAN', IotRuleSceneTriggerConditionParameterOperatorEnum.LESS_THAN)
      operatorMap.set('LESS_THAN_OR_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.LESS_THAN_OR_EQUALS)
      operatorMap.set('IN', IotRuleSceneTriggerConditionParameterOperatorEnum.IN)
      operatorMap.set('NOT_IN', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_IN)
      operatorMap.set('BETWEEN', IotRuleSceneTriggerConditionParameterOperatorEnum.BETWEEN)
      operatorMap.set('NOT_BETWEEN', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_BETWEEN)
      break
    case 'enum':
      // 枚举类型支持的操作符
      operatorMap.set('EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS)
      operatorMap.set('NOT_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS)
      operatorMap.set('IN', IotRuleSceneTriggerConditionParameterOperatorEnum.IN)
      operatorMap.set('NOT_IN', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_IN)
      break
    case 'bool':
      // 布尔类型支持的操作符
      operatorMap.set('EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS)
      operatorMap.set('NOT_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS)
      break
    case 'text':
      // 文本类型支持的操作符
      operatorMap.set('EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS)
      operatorMap.set('NOT_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS)
      operatorMap.set('LIKE', IotRuleSceneTriggerConditionParameterOperatorEnum.LIKE)
      break
    case 'date':
      // 日期类型支持的操作符
      operatorMap.set('EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS)
      operatorMap.set('NOT_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS)
      operatorMap.set('GREATER_THAN', IotRuleSceneTriggerConditionParameterOperatorEnum.GREATER_THAN)
      operatorMap.set('GREATER_THAN_OR_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.GREATER_THAN_OR_EQUALS)
      operatorMap.set('LESS_THAN', IotRuleSceneTriggerConditionParameterOperatorEnum.LESS_THAN)
      operatorMap.set('LESS_THAN_OR_EQUALS', IotRuleSceneTriggerConditionParameterOperatorEnum.LESS_THAN_OR_EQUALS)
      operatorMap.set('BETWEEN', IotRuleSceneTriggerConditionParameterOperatorEnum.BETWEEN)
      operatorMap.set('NOT_BETWEEN', IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_BETWEEN)
      break
    // struct 和 array 类型只支持非空操作符，已在通用部分添加
    default:
      return IotRuleSceneTriggerConditionParameterOperatorEnum
  }
  
  return Object.fromEntries(operatorMap)
})
</script>
