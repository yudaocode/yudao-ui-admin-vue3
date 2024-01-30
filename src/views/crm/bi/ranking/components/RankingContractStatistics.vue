<template>
  <el-card shadow="never">
    <!-- 柱状图 -->
    <el-skeleton :loading="trendLoading" animated>
      <Echart :height="500" :options="barChartOptions" />
    </el-skeleton>
  </el-card>
  <el-card shadow="never" class="mt-16px">
    <!-- 排行列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="公司排名" align="center" type="index" width="80" />
      <el-table-column label="签订人" align="center" prop="nickname" min-width="200" />
      <el-table-column label="部门" align="center" prop="deptName" min-width="200" />
      <el-table-column label="合同金额（元）" align="center" prop="price" min-width="200" />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import { RankingStatisticsApi, BiContractRanKingRespVO, BiRankReqVO } from '@/api/crm/bi/ranking'
import { EChartsOption } from 'echarts'

/** 合同金额排行 */
defineOptions({ name: 'RankingContractStatistics' })

const trendLoading = ref(true) // 状态加载中
const loading = ref(false) // 列表的加载中
const list = ref<BiContractRanKingRespVO[]>([]) // 列表的数据
const params = defineProps<{ queryParams: BiRankReqVO }>() // 搜索参数

/** 柱状图配置 横向 */
const barChartOptions = reactive<EChartsOption>({
  dataset: {
    dimensions: ['name', 'value'],
    source: []
  },
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    top: 80,
    containLabel: true
  },
  legend: {
    top: 50
  },
  series: [
    {
      name: '合同金额排行',
      type: 'bar',
      smooth: true,
      itemStyle: { color: '#B37FEB' }
    }
  ],
  toolbox: {
    feature: {
      // 数据区域缩放
      dataZoom: {
        yAxisIndex: false // Y轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '合同金额排行' } // 保存为图片
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  xAxis: {
    type: 'value',
    name: '合同金额（元）',
    nameGap: 30,
    nameTextStyle: {
      color: '#666',
      fontSize: 14
    }
  },
  yAxis: {
    type: 'category',
    name: '签订人',
    nameGap: 30,
    nameTextStyle: {
      color: '#666',
      fontSize: 14
    },
    axisLabel: {
      formatter: (value: string) => {
        return value
      }
    }
  }
}) as EChartsOption

/** 获取合同金额排行 */
const getRankingContractStatistics = async () => {
  trendLoading.value = true
  loading.value = true
  const rankingList = await RankingStatisticsApi.contractAmountRanking(params.queryParams)
  let source = rankingList.map((item: BiContractRanKingRespVO) => {
    return {
      name: item.nickname,
      value: item.price
    }
  })
  // 反转数据源
  source = source.reverse()
  // 更新 Echarts 数据
  if (barChartOptions.dataset && barChartOptions.dataset['source']) {
    barChartOptions.dataset['source'] = source
  }
  // 更新列表数据
  list.value = rankingList
  trendLoading.value = false
  loading.value = false
}

/** 重新加载数据 */
const reloadData = async () => {
  await getRankingContractStatistics()
}
// 暴露 reloadData 函数
defineExpose({
  reloadData
})

onMounted(() => {
  getRankingContractStatistics()
})
</script>
<style scoped lang="scss"></style>
