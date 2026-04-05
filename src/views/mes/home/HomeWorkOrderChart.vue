<!-- 首页工单状态分布饼图 -->
<template>
  <el-card shadow="hover" class="h-full">
    <template #header>
      <div class="flex justify-between items-center">
        <span class="text-16px font-600">工单状态分布</span>
      </div>
    </template>
    <Echart :options="workOrderChartOptions" :height="280" />
  </el-card>
</template>

<script lang="ts" setup>
import { EChartsOption } from 'echarts'
import { MesHomeStatisticsApi, MesHomeWorkOrderStatusVO } from '@/api/mes/home'
import { MesProWorkOrderStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'HomeWorkOrderChart' })

const statusColorMap: Record<number, string> = {
  [MesProWorkOrderStatusEnum.PREPARE]: '#909399', // 草稿
  [MesProWorkOrderStatusEnum.CONFIRMED]: '#409EFF', // 已确认
  [MesProWorkOrderStatusEnum.FINISHED]: '#67C23A', // 已完成
  [MesProWorkOrderStatusEnum.CANCELED]: '#F56C6C' // 已取消
} // 工单状态对应的颜色映射
const workOrderChartOptions = reactive<EChartsOption>({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0, type: 'scroll' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}' },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: []
    }
  ]
}) as EChartsOption // ECharts 饼图配置

/** 加载工单状态分布数据并更新饼图 */
const loadData = async () => {
  const data: MesHomeWorkOrderStatusVO[] =
    await MesHomeStatisticsApi.getWorkOrderStatusDistribution()
  ;(workOrderChartOptions as any).series[0].data = data.map((d) => ({
    name: d.statusName,
    value: d.count,
    itemStyle: { color: statusColorMap[d.status] || '#409EFF' }
  }))
}

/** 组件挂载时自动加载数据 */
onMounted(() => {
  loadData()
})
</script>
