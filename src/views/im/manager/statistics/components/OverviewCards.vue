<template>
  <el-row :gutter="16">
    <el-col v-for="card in cards" :key="card.title" :xl="6" :lg="6" :md="12" :sm="24" :xs="24">
      <el-card shadow="never" class="!rounded-8px mb-16px">
        <div class="flex items-center">
          <div
            class="w-48px h-48px rounded-8px flex items-center justify-center mr-12px flex-shrink-0"
            :style="{ backgroundColor: card.color }"
          >
            <Icon :icon="card.icon" :size="24" color="#fff" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-13px text-[var(--el-text-color-secondary)] mb-4px">{{ card.title }}</div>
            <div class="text-22px font-600 text-[var(--el-text-color-primary)] leading-none">
              <CountTo :start-val="0" :end-val="card.value" :duration="1500" />
              <span v-if="card.suffix" class="text-12px text-[var(--el-text-color-placeholder)] ml-6px font-normal">{{ card.suffix }}</span>
            </div>
            <div class="text-12px text-[var(--el-text-color-placeholder)] mt-6px">{{ card.metaLabel }}：
              <span :class="card.metaClass">{{ card.metaValue }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import type { ImStatisticsOverviewVO } from '@/api/im/manager/statistics'

defineOptions({ name: 'ImStatisticsOverviewCards' })

const props = defineProps<{ overview: ImStatisticsOverviewVO }>()

const calcRatio = (today: number, yesterday: number): { label: string; cls: string } => {
  if (!yesterday) return { label: '无昨日数据', cls: 'text-gray-400' }
  const diff = ((today - yesterday) / yesterday) * 100
  const sign = diff >= 0 ? '+' : ''
  return {
    label: `${sign}${diff.toFixed(1)}%`,
    cls: diff >= 0 ? 'text-green-500' : 'text-red-500'
  }
}

const cards = computed(() => {
  const o = props.overview
  const totalMsgToday = (o.privateMessageToday ?? 0) + (o.groupMessageToday ?? 0)
  const totalMsgYesterday = (o.privateMessageYesterday ?? 0) + (o.groupMessageYesterday ?? 0)
  const msgRatio = calcRatio(totalMsgToday, totalMsgYesterday)
  return [
    {
      title: '总用户',
      value: o.totalUser ?? 0,
      icon: 'ep:user',
      color: '#409EFF',
      metaLabel: '今日新增',
      metaValue: `+${o.newUserToday ?? 0}`,
      metaClass: 'text-green-500'
    },
    {
      title: '总群组',
      value: o.totalGroup ?? 0,
      icon: 'ep:chat-dot-round',
      color: '#67C23A',
      metaLabel: '今日新增',
      metaValue: `+${o.newGroupToday ?? 0}`,
      metaClass: 'text-green-500'
    },
    {
      title: '日活用户',
      value: o.activeUserDaily ?? 0,
      icon: 'ep:timer',
      color: '#E6A23C',
      metaLabel: '周/月活',
      metaValue: `${o.activeUserWeekly ?? 0} / ${o.activeUserMonthly ?? 0}`,
      metaClass: 'text-gray-500'
    },
    {
      title: '今日消息',
      value: totalMsgToday,
      suffix: ` (P ${o.privateMessageToday}/G ${o.groupMessageToday})`,
      icon: 'ep:message',
      color: '#909399',
      metaLabel: '环比昨日',
      metaValue: msgRatio.label,
      metaClass: msgRatio.cls
    }
  ]
})
</script>
