<template>
  <el-input v-model="valueRef" v-bind="$attrs">
    <template #append>
      <el-color-picker v-model="colorRef" :predefine="PREDEFINE_COLORS" />
    </template>
  </el-input>
</template>

<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { PREDEFINE_COLORS } from '@/utils/color'

/**
 * 带颜色选择器输入框
 */
defineOptions({ name: 'InputWithColor' })

const props = defineProps({
  modelValue: propTypes.string.def('').isRequired,
  color: propTypes.string.def('').isRequired
})

watch(
  () => props.modelValue,
  (val: string) => {
    if (val === unref(valueRef)) return
    valueRef.value = val
  }
)

const emit = defineEmits(['update:modelValue', 'update:color'])

// 输入框的值
const valueRef = ref(props.modelValue)
watch(
  () => valueRef.value,
  (val: string) => {
    emit('update:modelValue', val)
  }
)
// 颜色
const colorRef = ref(props.color)
watch(
  () => colorRef.value,
  (val: string) => {
    emit('update:color', val)
  }
)
</script>
<style scoped lang="scss">
:deep(.el-input-group__append) {
  padding: 0;
  .el-color-picker__trigger {
    padding: 0;
    border-left: none;
    border-radius: 0 var(--el-input-border-radius) var(--el-input-border-radius) 0;
  }
}
</style>
