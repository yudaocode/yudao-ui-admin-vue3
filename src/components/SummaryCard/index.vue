<template>
  <div class="flex flex-row items-center gap-3 rounded bg-[var(--el-bg-color-overlay)] p-4">
    <div
      class="h-12 w-12 flex flex-shrink-0 items-center justify-center rounded-1"
      :class="`${iconColor} ${iconBgColor}`"
    >
      <Icon :icon="icon" class="!text-6" />
    </div>
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1 text-gray-500">
        <span class="text-3.5">{{ title }}</span>
        <el-tooltip :content="tooltip" placement="top-start" v-if="tooltip">
          <Icon icon="ep:warning" class="item-center flex !text-3" />
        </el-tooltip>
      </div>
      <div class="flex flex-row items-baseline gap-2">
        <div class="text-7">
          <CountTo :prefix="prefix" :end-val="value" :decimals="decimals" />
        </div>
        <span
          v-if="percent != undefined"
          :class="toNumber(percent) > 0 ? 'text-red-500' : 'text-green-500'"
        >
          <span class="text-sm">{{ Math.abs(toNumber(percent)) }}%</span>
          <Icon
            :icon="toNumber(percent) > 0 ? 'ep:caret-top' : 'ep:caret-bottom'"
            class="ml-0.5 !text-3"
          />
        </span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { toNumber } from 'lodash-es'

/** 统计卡片 */
defineOptions({ name: 'SummaryCard' })

defineProps({
  title: propTypes.string.def(''),
  tooltip: propTypes.string.def(''),
  icon: propTypes.string.def(''),
  iconColor: propTypes.string.def(''),
  iconBgColor: propTypes.string.def(''),
  prefix: propTypes.string.def(''),
  value: propTypes.number.def(0),
  decimals: propTypes.number.def(0),
  percent: propTypes.oneOfType([Number, String]).def(undefined)
})
</script>
