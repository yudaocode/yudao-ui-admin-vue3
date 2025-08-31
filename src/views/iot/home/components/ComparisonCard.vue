<template>
  <el-card class="stat-card" shadow="never" :loading="loading">
    <div class="flex flex-col">
      <div class="flex justify-between items-center mb-1">
        <span class="text-gray-500 text-base font-medium">{{ title }}</span>
        <Icon :icon="icon" :class="`text-[32px] ${iconColor}`" />
      </div>
      <span class="text-3xl font-bold text-gray-700">
        <span v-if="value === -1">--</span>
        <span v-else>{{ value }}</span>
      </span>
      <el-divider class="my-2" />
      <div class="flex justify-between items-center text-gray-400 text-sm">
        <span>今日新增</span>
        <span class="text-green-500" v-if="todayCount !== -1">+{{ todayCount }}</span>
        <span v-else>--</span>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

/** 【总数 + 新增数】统计卡片组件 */
defineOptions({ name: 'IoTComparisonCard' })

const props = defineProps({
  title: propTypes.string.def('').isRequired,
  value: propTypes.number.def(0).isRequired,
  todayCount: propTypes.number.def(0).isRequired,
  icon: propTypes.string.def('').isRequired,
  iconColor: propTypes.string.def(''),
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
.stat-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgb(0 0 0 / 8%);
  }
}
</style>
