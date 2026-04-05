<template>
  <!-- TODO @AI：有没办法拆分 vue 组件，更好理解 -->
  <!-- TODO @AI：尽量使用 unocss -->
  <div class="mes-home">
    <!-- Row 1: 核心 KPI 汇总卡片 -->
    <el-row :gutter="16" class="mb-16px">
      <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
        <el-card shadow="hover" class="kpi-card kpi-card--production" @click="handleNavigate('/mes/pro/workorder')">
          <div class="kpi-card__content">
            <div class="kpi-card__icon">
              <Icon icon="ep:document" :size="28" />
            </div>
            <div class="kpi-card__info">
              <div class="kpi-card__title">生产工单</div>
              <div class="kpi-card__value">
                <CountTo :end-val="summary.workOrderActiveCount" :duration="1500" class="kpi-card__number" />
                <span class="kpi-card__unit">进行中</span>
              </div>
              <div class="kpi-card__extra">
                <span>待排产 {{ summary.workOrderPrepareCount }}</span>
                <el-divider direction="vertical" />
                <span>已完成 {{ summary.workOrderFinishedCount }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
        <el-card shadow="hover" class="kpi-card kpi-card--output" @click="handleNavigate('/mes/pro/feedback')">
          <div class="kpi-card__content">
            <div class="kpi-card__icon">
              <Icon icon="ep:data-analysis" :size="28" />
            </div>
            <div class="kpi-card__info">
              <div class="kpi-card__title">今日产量</div>
              <div class="kpi-card__value">
                <CountTo :end-val="summary.todayOutput" :duration="1500" class="kpi-card__number" />
                <span class="kpi-card__unit">件</span>
              </div>
              <div class="kpi-card__extra">
                <span>昨日 {{ summary.yesterdayOutput }} 件</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
        <el-card shadow="hover" class="kpi-card kpi-card--quality" @click="handleNavigate('/mes/qc/iqc')">
          <div class="kpi-card__content">
            <div class="kpi-card__icon">
              <Icon icon="ep:circle-check" :size="28" />
            </div>
            <div class="kpi-card__info">
              <div class="kpi-card__title">质量合格率</div>
              <div class="kpi-card__value">
                <CountTo :end-val="qualityRate" :decimals="1" :duration="1500" class="kpi-card__number" />
                <span class="kpi-card__unit">%</span>
              </div>
              <div class="kpi-card__extra">
                <span>合格 {{ summary.todayQualifiedQuantity }}</span>
                <el-divider direction="vertical" />
                <span>不良 {{ summary.todayUnqualifiedQuantity }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xl="6" :lg="6" :md="12" :sm="12" :xs="24" class="mb-16px">
        <el-card shadow="hover" class="kpi-card kpi-card--equipment" @click="handleNavigate('/mes/dv/machinery')">
          <div class="kpi-card__content">
            <div class="kpi-card__icon">
              <Icon icon="ep:cpu" :size="28" />
            </div>
            <div class="kpi-card__info">
              <div class="kpi-card__title">设备状态</div>
              <div class="kpi-card__value">
                <CountTo :end-val="summary.machineryProducing" :duration="1500" class="kpi-card__number" />
                <span class="kpi-card__unit">/ {{ summary.machineryTotal }} 运行中</span>
              </div>
              <div class="kpi-card__extra">
                <span class="text-red-400">停机 {{ summary.machineryStop }}</span>
                <el-divider direction="vertical" />
                <span class="text-orange-400">维护 {{ summary.machineryMaintenance }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Row 2: 生产趋势 + 待办异常 -->
    <el-row :gutter="16" class="mb-16px">
      <!-- 生产趋势图 -->
      <el-col :xl="16" :lg="16" :md="24" :sm="24" :xs="24" class="mb-16px">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">生产趋势</span>
              <el-radio-group v-model="trendDays" size="small" @change="loadProductionTrend">
                <el-radio-button :value="7">近 7 天</el-radio-button>
                <el-radio-button :value="30">近 30 天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <Echart :options="trendChartOptions" :height="320" />
        </el-card>
      </el-col>
      <!-- 待办事项 / 异常提醒 -->
      <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24" class="mb-16px">
        <el-card shadow="hover" class="alert-card">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">待办与异常</span>
            </div>
          </template>
          <div class="alert-list">
            <div class="alert-item alert-item--danger" @click="handleNavigate('/mes/pro/andon')">
              <div class="alert-item__icon">
                <Icon icon="ep:warning-filled" :size="20" />
              </div>
              <div class="alert-item__content">
                <span class="alert-item__label">安灯报警</span>
                <span class="alert-item__desc">未处置的安灯呼叫</span>
              </div>
              <el-badge :value="summary.andonActiveCount" :hidden="!summary.andonActiveCount"
                class="alert-item__badge" />
            </div>
            <div class="alert-item alert-item--warning" @click="handleNavigate('/mes/dv/repair')">
              <div class="alert-item__icon">
                <Icon icon="ep:set-up" :size="20" />
              </div>
              <div class="alert-item__content">
                <span class="alert-item__label">设备维修</span>
                <span class="alert-item__desc">待处理的维修工单</span>
              </div>
              <el-badge :value="summary.repairActiveCount" :hidden="!summary.repairActiveCount"
                class="alert-item__badge" />
            </div>
            <div class="alert-item alert-item--info" @click="handleNavigate('/mes/pro/workorder')">
              <div class="alert-item__icon">
                <Icon icon="ep:document-checked" :size="20" />
              </div>
              <div class="alert-item__content">
                <span class="alert-item__label">待排产工单</span>
                <span class="alert-item__desc">草稿状态的生产工单</span>
              </div>
              <el-badge :value="summary.workOrderPrepareCount" :hidden="!summary.workOrderPrepareCount"
                class="alert-item__badge" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Row 3: 工单分布 + 快捷入口 -->
    <el-row :gutter="16">
      <!-- 工单状态分布 -->
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24" class="mb-16px">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">工单状态分布</span>
            </div>
          </template>
          <Echart :options="workOrderChartOptions" :height="280" />
        </el-card>
      </el-col>
      <!-- 快捷入口 -->
      <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24" class="mb-16px">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-header__title">快捷入口</span>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col v-for="item in shortcuts" :key="item.name" :span="8" class="mb-16px">
              <div class="shortcut-item" @click="handleNavigate(item.url)">
                <div class="shortcut-item__icon" :style="{ background: item.bgColor }">
                  <Icon :icon="item.icon" :size="24" color="#fff" />
                </div>
                <span class="shortcut-item__name">{{ item.name }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { EChartsOption } from 'echarts'
import { useRouter } from 'vue-router'
import {
  MesHomeStatisticsApi,
  MesHomeSummaryVO,
  MesHomeWorkOrderStatusVO,
  MesHomeProductionTrendVO
} from '@/api/mes/home'

defineOptions({ name: 'MesHome' })

const router = useRouter()

// ========== 数据 ==========

const summary = ref<MesHomeSummaryVO>({
  workOrderActiveCount: 0,
  workOrderPrepareCount: 0,
  workOrderFinishedCount: 0,
  todayOutput: 0,
  yesterdayOutput: 0,
  todayQualifiedQuantity: 0,
  todayUnqualifiedQuantity: 0,
  machineryTotal: 0,
  machineryProducing: 0,
  machineryStop: 0,
  machineryMaintenance: 0,
  andonActiveCount: 0,
  repairActiveCount: 0
})

const qualityRate = computed(() => {
  const total = summary.value.todayQualifiedQuantity + summary.value.todayUnqualifiedQuantity
  if (total === 0) return 100
  return (summary.value.todayQualifiedQuantity / total) * 100
})

// ========== 生产趋势图 ==========

const trendDays = ref(7)
const trendChartOptions = reactive<EChartsOption>({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' }
  },
  legend: { data: ['产量', '合格品', '不良品'], bottom: 0 },
  grid: { left: 50, right: 20, top: 20, bottom: 40 },
  xAxis: { type: 'category', data: [], boundaryGap: false },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '产量',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: { color: '#409EFF' },
      areaStyle: { color: 'rgba(64,158,255,0.15)' }
    },
    {
      name: '合格品',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: { color: '#67C23A' }
    },
    {
      name: '不良品',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: { color: '#F56C6C' }
    }
  ]
}) as EChartsOption

const loadProductionTrend = async () => {
  const data: MesHomeProductionTrendVO[] = await MesHomeStatisticsApi.getProductionTrend(trendDays.value)
  // 截取日期中 MM-DD 部分
  const dates = data.map((d) => d.date.substring(5))
  const quantities = data.map((d) => d.quantity)
  const qualified = data.map((d) => d.qualifiedQuantity)
  const unqualified = data.map((d) => d.unqualifiedQuantity)
  // 更新图表数据
  ;(trendChartOptions as any).xAxis.data = dates
  ;(trendChartOptions as any).series[0].data = quantities
  ;(trendChartOptions as any).series[1].data = qualified
  ;(trendChartOptions as any).series[2].data = unqualified
}

// ========== 工单状态分布图 ==========

const statusColorMap: Record<number, string> = {
  0: '#909399', // 草稿
  1: '#409EFF', // 已确认
  2: '#67C23A', // 已完成
  3: '#F56C6C'  // 已取消
}

const workOrderChartOptions = reactive<EChartsOption>({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0, type: 'scroll' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}' },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: []
    }
  ]
}) as EChartsOption

const loadWorkOrderStatus = async () => {
  const data: MesHomeWorkOrderStatusVO[] = await MesHomeStatisticsApi.getWorkOrderStatusDistribution()
  ;(workOrderChartOptions as any).series[0].data = data.map((d) => ({
    name: d.statusName,
    value: d.count,
    itemStyle: { color: statusColorMap[d.status] || '#409EFF' }
  }))
}

// ========== 快捷入口 ==========

const shortcuts = [
  { name: '生产工单', icon: 'ep:document', url: '/mes/pro/workorder', bgColor: '#409EFF' },
  { name: '生产报工', icon: 'ep:edit', url: '/mes/pro/feedback', bgColor: '#67C23A' },
  { name: '质量检验', icon: 'ep:search', url: '/mes/qc/iqc', bgColor: '#E6A23C' },
  { name: '库存查询', icon: 'ep:box', url: '/mes/wm/materialstock', bgColor: '#F56C6C' },
  { name: '设备管理', icon: 'ep:cpu', url: '/mes/dv/machinery', bgColor: '#7c3aed' },
  { name: '库存流水', icon: 'ep:tickets', url: '/mes/wm/transaction', bgColor: '#0ea5e9' }
]

// ========== 导航 ==========

const handleNavigate = (url: string) => {
  router.push(url)
}

// ========== 初始化 ==========

onMounted(async () => {
  const [summaryData] = await Promise.all([
    MesHomeStatisticsApi.getHomeSummary(),
    loadProductionTrend(),
    loadWorkOrderStatus()
  ])
  summary.value = summaryData
})
</script>

<style lang="scss" scoped>
.mes-home {
  padding: 0;
}

// ========== KPI 卡片 ==========
.kpi-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
  }

  &__title {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__number {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }

  &__unit {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__extra {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
  }

  // 四种 KPI 颜色
  &--production .kpi-card__icon {
    background: linear-gradient(135deg, #409eff, #66b1ff);
  }

  &--production .kpi-card__number {
    color: #409eff;
  }

  &--output .kpi-card__icon {
    background: linear-gradient(135deg, #67c23a, #85ce61);
  }

  &--output .kpi-card__number {
    color: #67c23a;
  }

  &--quality .kpi-card__icon {
    background: linear-gradient(135deg, #e6a23c, #ebb563);
  }

  &--quality .kpi-card__number {
    color: #e6a23c;
  }

  &--equipment .kpi-card__icon {
    background: linear-gradient(135deg, #7c3aed, #9461f5);
  }

  &--equipment .kpi-card__number {
    color: #7c3aed;
  }
}

// ========== 卡片 Header ==========
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__title {
    font-size: 16px;
    font-weight: 600;
  }
}

// ========== 待办异常面板 ==========
.alert-card {
  height: 100%;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.alert-list {
  display: flex;
  flex-direction: column;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &--danger .alert-item__icon {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
  }

  &--warning .alert-item__icon {
    background: rgba(230, 162, 60, 0.1);
    color: #e6a23c;
  }

  &--info .alert-item__icon {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__badge {
    flex-shrink: 0;
  }
}

// ========== 快捷入口 ==========
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px 0;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);
    transform: translateY(-2px);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}
</style>
