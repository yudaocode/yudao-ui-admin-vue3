<template>
  <el-select
    v-model="selectedOperator"
    class="condition-selector"
    clearable
    :placeholder="placeholder"
  >
    <el-option label="等于" value="=" />
    <el-option label="不等于" value="!=" />
    <el-option label="大于" value=">" />
    <el-option label="大于等于" value=">=" />
    <el-option label="小于" value="<" />
    <el-option label="小于等于" value="<=" />
    <el-option label="在列表中" value="in" />
    <el-option label="不在列表中" value="not in" />
    <el-option label="在范围内" value="between" />
    <el-option label="不在范围内" value="not between" />
    <el-option label="包含" value="like" />
    <el-option label="非空" value="not null" />
  </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedOperator = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<style scoped>
.condition-selector {
  width: 100%;
}
</style>
