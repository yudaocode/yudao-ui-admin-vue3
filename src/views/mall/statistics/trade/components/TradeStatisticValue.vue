<template>
  <div class="flex flex-col gap-2 bg-[var(--el-bg-color-overlay)] p-6">
    <div class="flex items-center justify-between text-gray-500">
      <span>{{ title }}</span>
      <el-tooltip :content="tooltip" placement="top-start" v-if="tooltip">
        <Icon icon="ep:warning" />
      </el-tooltip>
    </div>
    <div class="mb-4 text-3xl">
      <CountTo :prefix="prefix" :end-val="value" :decimals="decimals" />
    </div>
    <div class="flex flex-row gap-1 text-sm">
      <span class="text-gray-500">环比</span>
      <span :class="toNumber(percent) > 0 ? 'text-red-500' : 'text-green-500'">
        {{ Math.abs(toNumber(percent)) }}%
        <Icon :icon="toNumber(percent) > 0 ? 'ep:caret-top' : 'ep:caret-bottom'" class="!text-sm" />
      </span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { toNumber } from 'lodash-es'

/** 交易统计值组件 */
defineOptions({ name: 'TradeStatisticValue' })

defineProps({
  tooltip: propTypes.string.def(''),
  title: propTypes.string.def(''),
  prefix: propTypes.string.def(''),
  value: propTypes.number.def(0),
  decimals: propTypes.number.def(0),
  percent: propTypes.oneOfType([Number, String]).def(0)
})
</script>
