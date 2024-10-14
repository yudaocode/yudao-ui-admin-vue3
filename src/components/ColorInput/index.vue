<template>
  <el-input v-model="color">
    <template #prepend>
      <el-color-picker v-model="color" :predefine="PREDEFINE_COLORS" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { propTypes } from '@/utils/propTypes'
import { PREDEFINE_COLORS } from '@/utils/color'

// 颜色输入框
defineOptions({ name: 'ColorInput' })

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
