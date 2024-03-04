<!-- 客户跟进方式分析 -->
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
      <el-table-column label="跟进方式" align="center" prop="followupType" min-width="200" />
      <el-table-column label="个数" align="center" prop="followupRecordCount" min-width="200" />
      <el-table-column label="占比(%)" align="center" prop="portion" min-width="200" />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import {
  StatisticsCustomerApi,
  CrmStatisticsFollowupSummaryByTypeRespVO
} from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'
import { round, sumBy } from 'lodash-es'

defineOptions({ name: 'CustomerFollowupType' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticsFollowupSummaryByTypeRespVO[]>([]) // 列表的数据

/** 饼图配置 */
const echartsOption = reactive<EChartsOption>({
  title: {
    text: '客户跟进方式分析',
    left: 'center'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{b} : {c}% '
  },
  toolbox: {
    feature: {
      saveAsImage: { show: true, name: '客户跟进方式分析' } // 保存为图片
    }
  },
  series: [
    {
      name: '跟进方式',
      type: 'pie',
      radius: '50%',
      data: [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}) as EChartsOption

/** 获取统计数据 */
const loadData = async () => {
  // 1. 加载统计数据
  loading.value = true
  const followupSummaryByType = await StatisticsCustomerApi.getFollowupSummaryByType(
    props.queryParams
  )
  // 2.1 更新 Echarts 数据
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = followupSummaryByType.map(
      (r: CrmStatisticsFollowupSummaryByTypeRespVO) => {
        return {
          name: r.followupType,
          value: r.followupRecordCount
        }
      }
    )
  }
  // 2.2 更新列表数据
  const totalCount = sumBy(followupSummaryByType, 'followupRecordCount')
  list.value = followupSummaryByType.map((r: CrmStatisticsFollowupSummaryByTypeRespVO) => {
    return {
      followupType: r.followupType,
      followupRecordCount: r.followupRecordCount,
      portion: round((r.followupRecordCount / totalCount) * 100, 2)
    }
  })
  loading.value = false
}
defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
