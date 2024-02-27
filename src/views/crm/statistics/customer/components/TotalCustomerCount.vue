<!-- 客户总量分析 -->
<template>
  <!-- 柱状图 -->
  <el-card shadow="never">
    <el-skeleton :loading="loading" animated>
      <Echart :height="500" :options="echartsOption" />
    </el-skeleton>
  </el-card>

  <!-- 统计列表 -->
  <el-card shadow="never" class="mt-16px">
    <el-table v-loading="loading" :data="list">
      <el-table-column label="序号" align="center" type="index" width="80" />
      <el-table-column label="日期" align="center" prop="category" min-width="200" />
      <el-table-column label="新增客户数" align="center" prop="customerCount" min-width="200" />
      <el-table-column label="成交客户数" align="center" prop="dealCustomerCount" min-width="200" />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import { StatisticsCustomerApi, StatisticsCustomerRespVO } from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'
import { clone } from 'lodash-es'

defineOptions({ name: 'TotalCustomerCount' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<StatisticsCustomerRespVO[]>([]) // 列表的数据

/** 柱状图配置：纵向 */
const echartsOption = reactive<EChartsOption>({
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    containLabel: true
  },
  legend: { },
  series: [
    {
      name: '新增客户数',
      type: 'bar',
      data: []
    },
    {
      name: '成交客户数',
      type: 'bar',
      data: []
    },
  ],
  toolbox: {
    feature: {
      dataZoom: {
        xAxisIndex: false // 数据区域缩放：Y 轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '客户总量分析' } // 保存为图片
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  yAxis: {
    type: 'value',
    name: '数量（个）'
  },
  xAxis: {
    type: 'category',
    name: '日期',
    data: []
  }
}) as EChartsOption

/** 获取统计数据 */
const loadData = async () => {
  // 1. 加载统计数据
  loading.value = true
  const customerCount = await StatisticsCustomerApi.getTotalCustomerCount(props.queryParams)
  const dealCustomerCount = await StatisticsCustomerApi.getDealTotalCustomerCount(props.queryParams)
  // 2.1 更新 Echarts 数据
  if (echartsOption.xAxis && echartsOption.xAxis['data']) {
    echartsOption.xAxis['data'] = clone(customerCount.map(s => s['category']))
  }
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = clone(customerCount.map(s => s['count']))
  }
  if (echartsOption.series && echartsOption.series[1] && echartsOption.series[1]['data']) {
    echartsOption.series[1]['data'] = clone(dealCustomerCount.map(s => s['count']))
  }
  // 2.2 更新列表数据
  const tableData = customerCount.map((item, index) => {
    return {
      category: item['category'],
      customerCount: item['count'],
      dealCustomerCount: dealCustomerCount[index]['count'],
    }
  })
  list.value = tableData
  loading.value = false
}
defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
