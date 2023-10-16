<template>
  <div class="flex flex-col gap-2 bg-[var(--el-bg-color-overlay)] p-6">
    <div class="flex items-center justify-between text-gray-500">
      <span>{{ title }}</span>
      <el-tag>{{ tag }}</el-tag>
    </div>
    <div class="flex flex-row items-baseline justify-between">
      <CountTo :prefix="prefix" :end-val="value" :decimals="decimals" class="text-3xl" />
      <span :class="toNumber(percent) > 0 ? 'text-red-500' : 'text-green-500'">
        {{ Math.abs(toNumber(percent)) }}%
        <Icon :icon="toNumber(percent) > 0 ? 'ep:caret-top' : 'ep:caret-bottom'" class="!text-sm" />
      </span>
    </div>
    <el-divider class="mb-1! mt-2!" />
    <div class="flex flex-row items-center justify-between text-sm">
      <span class="text-gray-500">昨日数据</span>
      <span>{{ prefix || '' }}{{ reference }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { toNumber } from 'lodash-es'
import { calculateRelativeRate } from '@/utils'

/** 交易对照卡片 */
defineOptions({ name: 'ComparisonCard' })

const props = defineProps({
  title: propTypes.string.def('').isRequired,
  tag: propTypes.string.def(''),
  prefix: propTypes.string.def(''),
  value: propTypes.number.def(0).isRequired,
  reference: propTypes.number.def(0).isRequired,
  decimals: propTypes.number.def(0)
})

// 计算环比
const percent = computed(() =>
  calculateRelativeRate(props.value as number, props.reference as number)
)
</script>
