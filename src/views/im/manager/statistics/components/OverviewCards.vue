<template>
  <el-row :gutter="16">
    <el-col v-for="card in cards" :key="card.title" :xl="6" :lg="6" :md="12" :sm="24" :xs="24">
      <el-card shadow="never" class="kpi-card !rounded-8px mb-16px">
        <el-skeleton :loading="loading" :rows="2" animated>
          <div class="flex items-center">
            <div class="kpi-card__icon mr-14px" :style="{ background: card.gradient }">
              <Icon :icon="card.icon" :size="24" color="#fff" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-13px text-[var(--el-text-color-secondary)]">{{ card.title }}</div>
              <div
                class="mt-6px text-24px font-600 leading-none text-[var(--el-text-color-primary)]"
              >
                <CountTo :start-val="0" :end-val="card.value" :duration="1500" />
                <span
                  v-if="card.suffix"
                  class="ml-6px text-12px font-normal text-[var(--el-text-color-placeholder)]"
                >
                  {{ card.suffix }}
                </span>
              </div>
              <div
                class="mt-8px flex items-center text-12px text-[var(--el-text-color-placeholder)]"
              >
                <span>{{ card.metaLabel }}</span>
                <span class="ml-6px font-500" :class="card.metaClass">{{ card.metaValue }}</span>
              </div>
            </div>
          </div>
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import type { ImStatisticsOverviewVO } from '@/api/im/manager/statistics'

defineOptions({ name: 'ImStatisticsOverviewCards' })

const props = withDefaults(
  defineProps<{ overview?: ImStatisticsOverviewVO; loading?: boolean }>(),
  { loading: false }
)

// 概览数据兜底，避免 loading 阶段 overview 未就绪时取值报错
const o = computed(() => props.overview ?? ({} as ImStatisticsOverviewVO))

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
  const v = o.value
  const totalMsgToday = (v.privateMessageToday ?? 0) + (v.groupMessageToday ?? 0)
  const totalMsgYesterday = (v.privateMessageYesterday ?? 0) + (v.groupMessageYesterday ?? 0)
  const msgRatio = calcRatio(totalMsgToday, totalMsgYesterday)
  return [
    {
      title: '总用户',
      value: v.totalUser ?? 0,
      icon: 'ep:user',
      gradient: 'linear-gradient(135deg, #5b9cff 0%, #409eff 100%)',
      metaLabel: '今日新增',
      metaValue: `+${v.newUserToday ?? 0}`,
      metaClass: 'text-green-500'
    },
    {
      title: '总群组',
      value: v.totalGroup ?? 0,
      icon: 'ep:chat-dot-round',
      gradient: 'linear-gradient(135deg, #5bd6a0 0%, #67c23a 100%)',
      metaLabel: '今日新增',
      metaValue: `+${v.newGroupToday ?? 0}`,
      metaClass: 'text-green-500'
    },
    {
      title: '日活用户',
      value: v.activeUserDaily ?? 0,
      icon: 'ep:timer',
      gradient: 'linear-gradient(135deg, #ffc46b 0%, #e6a23c 100%)',
      metaLabel: '周 / 月活',
      metaValue: `${v.activeUserWeekly ?? 0} / ${v.activeUserMonthly ?? 0}`,
      metaClass: 'text-gray-500'
    },
    {
      title: '今日消息',
      value: totalMsgToday,
      suffix: `(私 ${v.privateMessageToday ?? 0} / 群 ${v.groupMessageToday ?? 0})`,
      icon: 'ep:message',
      gradient: 'linear-gradient(135deg, #b794f6 0%, #805ad5 100%)',
      metaLabel: '环比昨日',
      metaValue: msgRatio.label,
      metaClass: msgRatio.cls
    }
  ]
})
</script>

<style lang="scss" scoped>
.kpi-card {
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--el-box-shadow-light);
  }

  &__icon {
    display: flex;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }
}
</style>
