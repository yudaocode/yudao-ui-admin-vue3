<template>
  <div class="flex flex-col gap-2 bg-[var(--el-bg-color-overlay)] p-6">
    <div class="flex items-center justify-between text-gray-500">
      <span>{{ title }}</span>
    </div>
    <div class="flex flex-row items-baseline justify-between">
      <CountTo prefix="￥" :end-val="value" :decimals="2" :duration="500" class="text-3xl" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

/** 价格展示 Card */
defineOptions({ name: 'ErpSummaryCard' })

defineProps({
  title: propTypes.string.def('').isRequired,
  value: propTypes.number.def(0).isRequired
})
</script>
