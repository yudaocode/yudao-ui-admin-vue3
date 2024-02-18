<!-- 回款金额排行 -->
<template>
  <!-- 柱状图 -->
  <el-card shadow="never">
    <el-skeleton :loading="loading" animated>
      <Echart :height="500" :options="echartsOption" />
    </el-skeleton>
  </el-card>

  <!-- 排行列表 -->
  <el-card shadow="never" class="mt-16px">
    <el-table v-loading="loading" :data="list">
      <el-table-column label="公司排名" align="center" type="index" width="80" />
      <el-table-column label="签订人" align="center" prop="nickname" min-width="200" />
      <el-table-column label="部门" align="center" prop="deptName" min-width="200" />
      <el-table-column label="回款金额（元）" align="center" prop="count" min-width="200" />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import { RankApi, BiRankRespVO } from '@/api/crm/bi/rank'
import { EChartsOption } from 'echarts'
import { clone } from 'lodash-es'

defineOptions({ name: 'ReceivablePriceRank' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<BiRankRespVO[]>([]) // 列表的数据

/** 柱状图配置：横向 */
const echartsOption = reactive<EChartsOption>({
  dataset: {
    dimensions: ['nickname', 'count'],
    source: []
  },
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    containLabel: true
  },
  legend: {
    top: 50
  },
  series: [
    {
      name: '回款金额排行',
      type: 'bar'
    }
  ],
  toolbox: {
    feature: {
      dataZoom: {
        yAxisIndex: false // 数据区域缩放：Y 轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '回款金额排行' } // 保存为图片
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
    name: '回款金额（元）'
  },
  yAxis: {
    type: 'category',
    name: '签订人',
    nameGap: 30
  }
}) as EChartsOption

/** 获取回款金额排行 */
const loadData = async () => {
  // 1. 加载排行数据
  loading.value = true
  const rankingList = await RankApi.getReceivablePriceRank(props.queryParams)
  // 2.1 更新 Echarts 数据
  if (echartsOption.dataset && echartsOption.dataset['source']) {
    echartsOption.dataset['source'] = clone(rankingList).reverse()
  }
  // 2.2 更新列表数据
  list.value = rankingList
  loading.value = false
}
defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
