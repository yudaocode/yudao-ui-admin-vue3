<!-- 合同汇总表 -->
<template>
  <!-- Echarts图 -->
  <el-card shadow="never">
    <el-skeleton :loading="loading" animated>
      <Echart :height="500" :options="echartsOption" />
    </el-skeleton>
  </el-card>

  <!-- 统计列表 -->
  <el-card shadow="never" class="mt-16px">
    <el-table v-loading="loading" :data="list" show-summary :summary-method="getSummaries">
      <el-table-column label="月份" align="center" prop="time" min-width="120" />
      <el-table-column label="合同数量" align="center" prop="contractCount" min-width="120" />
      <el-table-column
        label="合同金额（元）"
        align="right"
        prop="contractPrice"
        min-width="160"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        label="回款金额（元）"
        align="right"
        prop="receivablePrice"
        min-width="160"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        label="未回款金额（元）"
        align="right"
        prop="unreceivedPrice"
        min-width="160"
        :formatter="erpPriceTableColumnFormatter"
      />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { EChartsOption } from 'echarts'
import {
  StatisticsPerformanceApi,
  StatisticsPerformanceSummaryRespVO
} from '@/api/crm/statistics/performance'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'

defineOptions({ name: 'ContractSummary' })

const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<StatisticsPerformanceSummaryRespVO[]>([]) // 列表的数据

/** 柱状图配置：纵向 */
const echartsOption = reactive<EChartsOption>({
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    containLabel: true
  },
  legend: {},
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  toolbox: {
    feature: {
      dataZoom: {
        xAxisIndex: false
      },
      brush: {
        type: ['lineX', 'clear']
      },
      saveAsImage: { show: true, name: '合同汇总表' }
    }
  },
  xAxis: {
    type: 'category',
    name: '月份',
    data: []
  },
  yAxis: {
    type: 'value',
    name: '金额（元）'
  },
  series: [
    {
      name: '合同金额（元）',
      type: 'bar',
      data: []
    },
    {
      name: '回款金额（元）',
      type: 'bar',
      data: []
    },
    {
      name: '未回款金额（元）',
      type: 'line',
      data: []
    }
  ]
}) as EChartsOption

/** 获取合同汇总表 */
const loadData = async () => {
  loading.value = true
  try {
    // 1. 加载统计数据
    const data = await StatisticsPerformanceApi.getContractSummary(props.queryParams)
    // 2.1 更新列表数据
    list.value = data
    // 2.2 更新 Echarts 数据
    if (echartsOption.xAxis && echartsOption.xAxis['data']) {
      echartsOption.xAxis['data'] = data.map(
        (item: StatisticsPerformanceSummaryRespVO) => item.time
      )
    }
    if (echartsOption.series) {
      echartsOption.series[0]['data'] = data.map(
        (item: StatisticsPerformanceSummaryRespVO) => item.contractPrice
      )
      echartsOption.series[1]['data'] = data.map(
        (item: StatisticsPerformanceSummaryRespVO) => item.receivablePrice
      )
      echartsOption.series[2]['data'] = data.map(
        (item: StatisticsPerformanceSummaryRespVO) => item.unreceivedPrice
      )
    }
  } finally {
    loading.value = false
  }
}

/** 统计合计行 */
const getSummaries = ({ columns, data }: { columns: any[]; data: any[] }) => {
  return columns.map((column, index) => {
    if (index === 0) {
      return '合计'
    }
    const values = data.map((item) => Number(item[column.property]) || 0)
    const total = values.reduce((sum, value) => sum + value, 0)
    return column.property === 'contractCount' ? String(total) : erpPriceInputFormatter(total)
  })
}

defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
