<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>
      <CardTitle title="会员终端" />
    </template>
    <Echart :height="300" :options="terminalChartOptions" />
  </el-card>
</template>
<script lang="ts" setup>
import * as MemberStatisticsApi from '@/api/mall/statistics/member'
import { EChartsOption } from 'echarts'
import { MemberTerminalStatisticsRespVO } from '@/api/mall/statistics/member'
import { DICT_TYPE, DictDataType, getIntDictOptions } from '@/utils/dict'
import { CardTitle } from '@/components/Card'

/** 会员终端卡片 */
defineOptions({ name: 'MemberTerminalCard' })

const loading = ref(true) // 加载中

/** 会员终端统计图配置 */
const terminalChartOptions = reactive<EChartsOption>({
  tooltip: {
    trigger: 'item',
    confine: true,
    formatter: '{a} <br/>{b} : {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'right'
  },
  roseType: 'area',
  series: [
    {
      name: '会员终端',
      type: 'pie',
      label: {
        show: false
      },
      labelLine: {
        show: false
      },
      data: []
    }
  ]
}) as EChartsOption

/** 按照终端，查询会员统计列表 */
const getMemberTerminalStatisticsList = async () => {
  loading.value = true
  const list = await MemberStatisticsApi.getMemberTerminalStatisticsList()
  const dictDataList = getIntDictOptions(DICT_TYPE.TERMINAL)
  terminalChartOptions.series![0].data = dictDataList.map((dictData: DictDataType) => {
    const userCount = list.find(
      (item: MemberTerminalStatisticsRespVO) => item.terminal === dictData.value
    )?.userCount
    return {
      name: dictData.label,
      value: userCount || 0
    }
  })
  loading.value = false
}

/** 初始化 **/
onMounted(() => {
  getMemberTerminalStatisticsList()
})
</script>
