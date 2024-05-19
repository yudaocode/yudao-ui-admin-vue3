<!-- 客户总量统计 -->
<template>
  <!-- Echarts图 -->
  <el-card shadow="never">
    <el-skeleton :loading="loading" animated>
      <Echart :height="500" :options="echartsOption" />
    </el-skeleton>
  </el-card>

  <!-- 统计列表 -->
  <el-card shadow="never" class="mt-16px">
    <el-table v-loading="loading" :data="list">
      <el-table-column label="序号" align="center" type="index" width="80" fixed="left" />
      <el-table-column label="员工姓名" prop="ownerUserName" min-width="100" fixed="left" />
      <el-table-column
        label="进入公海客户数"
        align="right"
        prop="customerPutCount"
        min-width="200"
      />
      <el-table-column
        label="公海领取客户数"
        align="right"
        prop="customerTakeCount"
        min-width="200"
      />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import {
  StatisticsCustomerApi,
  CrmStatisticsPoolSummaryByDateRespVO,
  CrmStatisticsPoolSummaryByUserRespVO
} from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'

defineOptions({ name: 'CustomerPoolSummary' })

const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticsPoolSummaryByUserRespVO[]>([]) // 列表的数据

/** 柱状图配置：纵向 */
const echartsOption = reactive<EChartsOption>({
  grid: {
    left: 20,
    right: 40, // 让 X 轴右侧显示完整
    bottom: 20,
    containLabel: true
  },
  legend: {},
  series: [
    {
      name: '进入公海客户数',
      type: 'bar',
      yAxisIndex: 0,
      data: []
    },
    {
      name: '公海领取客户数',
      type: 'bar',
      yAxisIndex: 1,
      data: []
    }
  ],
  toolbox: {
    feature: {
      dataZoom: {
        xAxisIndex: false // 数据区域缩放：Y 轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '公海客户分析' } // 保存为图片
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '进入公海客户数',
      min: 0,
      minInterval: 1 // 显示整数刻度
    },
    {
      type: 'value',
      name: '公海领取客户数',
      min: 0,
      minInterval: 1, // 显示整数刻度
      splitLine: {
        lineStyle: {
          type: 'dotted', // 右侧网格线虚化, 减少混乱
          opacity: 0.7
        }
      }
    }
  ],
  xAxis: {
    type: 'category',
    name: '日期',
    data: []
  }
}) as EChartsOption

/** 获取数据并填充图表 */
const fetchAndFill = async () => {
  // 1. 加载统计数据
  const poolSummaryByDate = await StatisticsCustomerApi.getPoolSummaryByDate(props.queryParams)
  const poolSummaryByUser = await StatisticsCustomerApi.getPoolSummaryByUser(props.queryParams)
  // 2.1 更新 Echarts 数据
  if (echartsOption.xAxis && echartsOption.xAxis['data']) {
    echartsOption.xAxis['data'] = poolSummaryByDate.map(
      (s: CrmStatisticsPoolSummaryByDateRespVO) => s.time
    )
  }
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = poolSummaryByDate.map(
      (s: CrmStatisticsPoolSummaryByDateRespVO) => s.customerPutCount
    )
  }
  if (echartsOption.series && echartsOption.series[1] && echartsOption.series[1]['data']) {
    echartsOption.series[1]['data'] = poolSummaryByDate.map(
      (s: CrmStatisticsPoolSummaryByDateRespVO) => s.customerTakeCount
    )
  }

  // 2.2 更新列表数据
  list.value = poolSummaryByUser
}

/** 获取统计数据 */
const loadData = async () => {
  loading.value = true
  try {
    await fetchAndFill()
  } finally {
    loading.value = false
  }
}

defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
