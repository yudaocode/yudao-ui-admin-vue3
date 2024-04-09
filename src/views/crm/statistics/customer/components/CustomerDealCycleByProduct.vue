<!-- 成交周期分析 -->
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
      <el-table-column label="序号" align="center" type="index" width="80" />
      <el-table-column label="产品名称" align="center" prop="productName" min-width="200" />
      <el-table-column
        label="成交周期(天)"
        align="center"
        prop="customerDealCycle"
        min-width="200"
      />
      <el-table-column label="成交客户数" align="center" prop="customerDealCount" min-width="200" />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import {
  StatisticsCustomerApi,
  CrmStatisticsCustomerDealCycleByProductRespVO
} from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'

defineOptions({ name: 'CustomerDealCycleByProduct' })

const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticsCustomerDealCycleByProductRespVO[]>([]) // 列表的数据

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
      name: '成交周期(天)',
      type: 'bar',
      data: [],
      yAxisIndex: 0
    },
    {
      name: '成交客户数',
      type: 'bar',
      data: [],
      yAxisIndex: 1
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
      saveAsImage: { show: true, name: '成交周期分析' } // 保存为图片
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
      name: '成交周期(天)',
      min: 0,
      minInterval: 1 // 显示整数刻度
    },
    {
      type: 'value',
      name: '成交客户数',
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
    name: '产品名称',
    data: []
  }
}) as EChartsOption

/** 获取数据并填充图表 */
const fetchAndFill = async () => {
  // 1. 加载统计数据
  const customerDealCycleByProduct = (
    await StatisticsCustomerApi.getCustomerDealCycleByProduct(props.queryParams)
  ).map((s: CrmStatisticsCustomerDealCycleByProductRespVO) => {
    return {
      productName: s.productName ?? '未知',
      customerDealCycle: s.customerDealCount,
      customerDealCount: s.customerDealCount
    }
  })
  // 2.1 更新 Echarts 数据
  if (echartsOption.xAxis && echartsOption.xAxis['data']) {
    echartsOption.xAxis['data'] = customerDealCycleByProduct.map(
      (s: CrmStatisticsCustomerDealCycleByProductRespVO) => s.productName
    )
  }
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = customerDealCycleByProduct.map(
      (s: CrmStatisticsCustomerDealCycleByProductRespVO) => s.customerDealCycle
    )
  }
  if (echartsOption.series && echartsOption.series[1] && echartsOption.series[1]['data']) {
    echartsOption.series[1]['data'] = customerDealCycleByProduct.map(
      (s: CrmStatisticsCustomerDealCycleByProductRespVO) => s.customerDealCount
    )
  }
  // 2.2 更新列表数据
  list.value = customerDealCycleByProduct
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
