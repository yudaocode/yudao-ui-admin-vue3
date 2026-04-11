<template>
  <el-input v-model="modelValue" v-bind="$attrs">
    <template #append>
      <el-color-picker v-model="color" :predefine="PREDEFINE_COLORS" />
    </template>
  </el-input>
</template>

<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { PREDEFINE_COLORS } from '@/utils/color'
import { useVModels } from '@vueuse/core'

/**
 * 带颜色选择器输入框
 */
defineOptions({ name: 'InputWithColor' })

const props = defineProps({
  modelValue: propTypes.string.def('').isRequired,
  color: propTypes.string.def('').isRequired
})
const emit = defineEmits(['update:modelValue', 'update:color'])
const { modelValue, color } = useVModels(props, emit)
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
