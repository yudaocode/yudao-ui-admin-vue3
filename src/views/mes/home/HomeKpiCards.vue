<!--
  HomeKpiCards - 首页核心 KPI 汇总卡片
  以 4 列卡片形式展示关键生产指标：
  1. 生产工单 —— 进行中数量 / 待排产 / 已完成
  2. 今日产量 —— 今日产出件数，对比昨日
  3. 质量合格率 —— 合格品 / 不良品计算百分比
  4. 设备状态 —— 运行中 / 停机 / 维护中
-->
<template>
  <el-row :gutter="16" class="mb-16px">
    <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
      <el-card
        shadow="hover"
        class="kpi-card kpi-card--production"
        @click="handleNavigate('MesProWorkOrder')"
      >
        <div class="flex items-center gap-16px">
          <div
            class="w-56px h-56px rounded-12px flex items-center justify-center flex-shrink-0 text-white"
            style="background: linear-gradient(135deg, #409eff, #66b1ff)"
          >
            <Icon icon="ep:document" :size="28" />
          </div>
          <div>
            <div class="text-14px color-[var(--el-text-color-secondary)] mb-4px">生产工单</div>
            <div class="flex items-baseline gap-4px">
              <CountTo
                :end-val="summary.workOrderActiveCount"
                :duration="1500"
                class="text-28px font-700 leading-[1.2] color-[#409eff]"
              />
              <span class="text-13px color-[var(--el-text-color-secondary)]">进行中</span>
            </div>
            <div class="text-12px color-[var(--el-text-color-placeholder)] mt-4px">
              <span>待排产 {{ summary.workOrderPrepareCount }}</span>
              <el-divider direction="vertical" />
              <span>已完成 {{ summary.workOrderFinishedCount }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
      <el-card
        shadow="hover"
        class="kpi-card kpi-card--output"
        @click="handleNavigate('MesProFeedback')"
      >
        <div class="flex items-center gap-16px">
          <div
            class="w-56px h-56px rounded-12px flex items-center justify-center flex-shrink-0 text-white"
            style="background: linear-gradient(135deg, #67c23a, #85ce61)"
          >
            <Icon icon="ep:data-analysis" :size="28" />
          </div>
          <div>
            <div class="text-14px color-[var(--el-text-color-secondary)] mb-4px">今日产量</div>
            <div class="flex items-baseline gap-4px">
              <CountTo
                :end-val="summary.todayOutput"
                :duration="1500"
                class="text-28px font-700 leading-[1.2] color-[#67c23a]"
              />
              <span class="text-13px color-[var(--el-text-color-secondary)]">件</span>
            </div>
            <div class="text-12px color-[var(--el-text-color-placeholder)] mt-4px">
              <span>昨日 {{ summary.yesterdayOutput }} 件</span>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
      <el-card
        shadow="hover"
        class="kpi-card kpi-card--quality"
        @click="handleNavigate('MesProFeedback')"
      >
        <div class="flex items-center gap-16px">
          <div
            class="w-56px h-56px rounded-12px flex items-center justify-center flex-shrink-0 text-white"
            style="background: linear-gradient(135deg, #e6a23c, #ebb563)"
          >
            <Icon icon="ep:circle-check" :size="28" />
          </div>
          <div>
            <div class="text-14px color-[var(--el-text-color-secondary)] mb-4px">质量合格率</div>
            <div class="flex items-baseline gap-4px">
              <CountTo
                :end-val="qualityRate"
                :decimals="1"
                :duration="1500"
                class="text-28px font-700 leading-[1.2] color-[#e6a23c]"
              />
              <span class="text-13px color-[var(--el-text-color-secondary)]">%</span>
            </div>
            <div class="text-12px color-[var(--el-text-color-placeholder)] mt-4px">
              <template v-if="hasQualityData">
                <span>合格 {{ summary.todayQualifiedQuantity }}</span>
                <el-divider direction="vertical" />
                <span>不良 {{ summary.todayUnqualifiedQuantity }}</span>
              </template>
              <span v-else>暂无数据</span>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
    <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
      <el-card
        shadow="hover"
        class="kpi-card kpi-card--equipment"
        @click="handleNavigate('MesDvMachinery')"
      >
        <div class="flex items-center gap-16px">
          <div
            class="w-56px h-56px rounded-12px flex items-center justify-center flex-shrink-0 text-white"
            style="background: linear-gradient(135deg, #7c3aed, #9461f5)"
          >
            <Icon icon="ep:cpu" :size="28" />
          </div>
          <div>
            <div class="text-14px color-[var(--el-text-color-secondary)] mb-4px">设备状态</div>
            <div class="flex items-baseline gap-4px">
              <CountTo
                :end-val="summary.machineryProducing"
                :duration="1500"
                class="text-28px font-700 leading-[1.2] color-[#7c3aed]"
              />
              <span class="text-13px color-[var(--el-text-color-secondary)]"
                >/ {{ summary.machineryTotal }} 运行中</span
              >
            </div>
            <div class="text-12px color-[var(--el-text-color-placeholder)] mt-4px">
              <span class="text-red-400">停机 {{ summary.machineryStop }}</span>
              <el-divider direction="vertical" />
              <span class="text-orange-400">维护 {{ summary.machineryMaintenance }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { MesHomeSummaryVO } from '@/api/mes/home'

defineOptions({ name: 'HomeKpiCards' })

const props = defineProps<{
  summary: MesHomeSummaryVO
}>()

const emit = defineEmits<{
  navigate: [name: string]
}>()

/** 是否有质量数据（合格品 + 不良品 > 0） */
const hasQualityData = computed(() => {
  return props.summary.todayQualifiedQuantity + props.summary.todayUnqualifiedQuantity > 0
})

/** 质量合格率 = 合格品 / (合格品 + 不良品) * 100，无数据时为 0 */
const qualityRate = computed(() => {
  const total = props.summary.todayQualifiedQuantity + props.summary.todayUnqualifiedQuantity
  if (total === 0) return 0
  return (props.summary.todayQualifiedQuantity / total) * 100
})

/** 导航到目标页面，参数为路由 name */
const handleNavigate = (name: string) => {
  emit('navigate', name)
}
</script>

<style lang="scss" scoped>
.kpi-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}
</style>
