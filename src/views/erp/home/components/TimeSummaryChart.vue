<template>
  <el-card shadow="never">
    <template #header>
      <CardTitle :title="props.title" />
    </template>
    <!-- 折线图 -->
    <Echart :height="300" :options="lineChartOptions" />
  </el-card>
</template>
<script lang="ts" setup>
import { EChartsOption } from 'echarts'
import { formatDate } from '@/utils/formatTime'
import { CardTitle } from '@/components/Card'
import { propTypes } from '@/utils/propTypes'

/** 会员用户统计卡片 */
defineOptions({ name: 'MemberStatisticsCard' })

const props = defineProps({
  title: propTypes.string.def('').isRequired,
  value: propTypes.object.isRequired
})

/** 折线图配置 */
const lineChartOptions = reactive<EChartsOption>({
  dataset: {
    dimensions: ['time', 'price'],
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
  series: [{ name: '金额', type: 'line', smooth: true, areaStyle: {} }],
  toolbox: {
    feature: {
      // 数据区域缩放
      dataZoom: {
        yAxisIndex: false // Y轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: props.title } // 保存为图片
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    padding: [5, 10]
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisTick: {
      show: false
    }
  },
  yAxis: {
    axisTick: {
      show: false
    }
  }
}) as EChartsOption

watch(
  () => props.value,
  (val) => {
    if (!val) {
      return
    }
    // 更新 Echarts 数据
    if (lineChartOptions.dataset && lineChartOptions.dataset['source']) {
      lineChartOptions.dataset['source'] = val
    }
  }
)
</script>
