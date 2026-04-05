<!-- TODO @AI：补充一些注释 -->
<template>
  <el-card shadow="hover">
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

defineOptions({ name: 'HomeWorkOrderChart' })

const statusColorMap: Record<number, string> = {
  // TODO @AI：key 最好使用枚举；
  0: '#909399', // 草稿
  1: '#409EFF', // 已确认
  2: '#67C23A', // 已完成
  3: '#F56C6C' // 已取消
}

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
}) as EChartsOption

const loadData = async () => {
  const data: MesHomeWorkOrderStatusVO[] =
    await MesHomeStatisticsApi.getWorkOrderStatusDistribution()
  ;(workOrderChartOptions as any).series[0].data = data.map((d) => ({
    name: d.statusName,
    value: d.count,
    itemStyle: { color: statusColorMap[d.status] || '#409EFF' }
  }))
}

/** 暴露加载方法供父组件调用 */
defineExpose({ loadData })
</script>
