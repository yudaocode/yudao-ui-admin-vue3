<template>
  <el-input v-model="color">
    <template #prepend>
      <el-color-picker v-model="color" :predefine="COLORS" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { propTypes } from '@/utils/propTypes'

// 颜色输入框
defineOptions({ name: 'ColorInput' })

// 预设颜色
const COLORS = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  '#409EFF',
  '#909399',
  '#C0C4CC',
  '#b7390b',
  '#ff7800',
  '#fad400',
  '#5b8c5f',
  '#00babd',
  '#1f73c3',
  '#711f57'
]

const props = defineProps({
  modelValue: propTypes.string.def('')
})
const emit = defineEmits(['update:modelValue'])
const color = computed({
  get: () => {
    return props.modelValue
  },
  set: (val: string) => {
    emit('update:modelValue', val)
  }
})
</script>

<style scoped lang="scss">
:deep(.el-input-group__prepend) {
  padding: 0;
}
</style>
