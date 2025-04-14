<template>
  <el-card class="stat-card" shadow="never">
    <div class="flex flex-col">
      <div class="flex justify-between items-center mb-1">
        <span class="text-gray-500 text-base font-medium">{{ title }}</span>
        <Icon :icon="icon" class="text-[32px]" :class="iconColor" />
      </div>
      <span class="text-3xl font-bold text-gray-700">
        {{ value }}
      </span>
      <el-divider class="my-2" />
      <div class="flex justify-between items-center text-gray-400 text-sm">
        <span>今日新增</span>
        <span class="text-green-500">+{{ todayCount }}</span>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

/** 统计卡片组件 */
defineOptions({ name: 'ComparisonCard' })

const props = defineProps({
  title: propTypes.string.def('').isRequired,
  value: propTypes.number.def(0).isRequired,
  todayCount: propTypes.number.def(0).isRequired,
  icon: propTypes.string.def('').isRequired,
  iconColor: propTypes.string.def('')
})
</script>
