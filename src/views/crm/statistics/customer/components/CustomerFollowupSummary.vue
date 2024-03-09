<!-- 客户跟进次数分析 -->
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
      <el-table-column label="员工姓名" align="center" prop="ownerUserName" min-width="200" />
      <el-table-column label="跟进次数" align="right" prop="followupRecordCount" min-width="200" />
      <el-table-column
        label="跟进客户数"
        align="right"
        prop="followupCustomerCount"
        min-width="200"
      />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import {
  StatisticsCustomerApi,
  CrmStatisticsFollowupSummaryByDateRespVO,
  CrmStatisticsFollowupSummaryByUserRespVO
} from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'

defineOptions({ name: 'CustomerFollowupSummary' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticsFollowupSummaryByUserRespVO[]>([]) // 列表的数据

/** 柱状图配置：纵向 */
const echartsOption = reactive<EChartsOption>({
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    containLabel: true
  },
  legend: {},
  series: [
    {
      name: '跟进客户数',
      type: 'bar',
      data: []
    },
    {
      name: '跟进次数',
      type: 'bar',
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
      saveAsImage: { show: true, name: '客户跟进次数分析' } // 保存为图片
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
  const followupSummaryByDate = await StatisticsCustomerApi.getFollowupSummaryByDate(
    props.queryParams
  )
  const followupSummaryByUser = await StatisticsCustomerApi.getFollowupSummaryByUser(
    props.queryParams
  )
  // 2.1 更新 Echarts 数据
  if (echartsOption.xAxis && echartsOption.xAxis['data']) {
    echartsOption.xAxis['data'] = followupSummaryByDate.map(
      (s: CrmStatisticsFollowupSummaryByDateRespVO) => s.time
    )
  }
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = followupSummaryByDate.map(
      (s: CrmStatisticsFollowupSummaryByDateRespVO) => s.followupCustomerCount
    )
  }
  if (echartsOption.series && echartsOption.series[1] && echartsOption.series[1]['data']) {
    echartsOption.series[1]['data'] = followupSummaryByDate.map(
      (s: CrmStatisticsFollowupSummaryByDateRespVO) => s.followupRecordCount
    )
  }
  // 2.2 更新列表数据
  list.value = followupSummaryByUser
  loading.value = false
}
defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
