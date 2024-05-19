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
      <el-table-column label="跟进方式" align="center" prop="followUpType" min-width="200">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_FOLLOW_UP_TYPE" :value="scope.row.followUpType" />
        </template>
      </el-table-column>
      <el-table-column label="个数" align="center" prop="followUpRecordCount" min-width="200" />
      <el-table-column label="占比(%)" align="center" prop="portion" min-width="200" />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import {
  StatisticsCustomerApi,
  CrmStatisticsFollowUpSummaryByTypeRespVO
} from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'
import { sumBy } from 'lodash-es'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { erpCalculatePercentage } from '@/utils'

defineOptions({ name: 'CustomerFollowupType' })

const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticsFollowUpSummaryByTypeRespVO[]>([]) // 列表的数据

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

/** 获取数据并填充图表 */
const fetchAndFill = async () => {
  // 1. 加载统计数据
  const followUpSummaryByType = await StatisticsCustomerApi.getFollowUpSummaryByType(
    props.queryParams
  )
  // 2.1 更新 Echarts 数据
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = followUpSummaryByType.map(
      (row: CrmStatisticsFollowUpSummaryByTypeRespVO) => {
        return {
          name: getDictLabel(DICT_TYPE.CRM_FOLLOW_UP_TYPE, row.followUpType),
          value: row.followUpRecordCount
        }
      }
    )
  }
  // 2.2 更新列表数据
  const totalCount = sumBy(followUpSummaryByType, 'followUpRecordCount')
  list.value = followUpSummaryByType.map((row: CrmStatisticsFollowUpSummaryByTypeRespVO) => {
    return {
      ...row,
      portion: erpCalculatePercentage(row.followUpRecordCount, totalCount)
    }
  })
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
