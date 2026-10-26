<template>
  <el-select
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :model-value="modelValue"
    :placeholder="placeholder"
    @update:model-value="handleChange"
  >
    <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id" />
  </el-select>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { FmsVoucherWordVO } from '@/api/fms/config/voucher-word'

defineOptions({ name: 'FmsVoucherWordSelect' })

withDefaults(
  defineProps<{
    modelValue?: number
    options: FmsVoucherWordVO[]
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: false,
    filterable: false,
    placeholder: '请选择凭证字'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

/** 选中变化 */
function handleChange(value: unknown) {
  emit('update:modelValue', parseId(value))
}
</script>
