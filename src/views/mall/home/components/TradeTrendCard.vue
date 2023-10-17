<template>
  <el-card shadow="never">
    <template #header>
      <div class="flex flex-row items-center justify-between">
        <CardTitle title="交易量趋势" />
        <!-- 查询条件 -->
        <div class="flex flex-row items-center gap-2">
          <el-radio-group v-model="timeRangeType" @change="handleTimeRangeTypeChange">
            <el-radio-button v-for="[key, value] in timeRange.entries()" :key="key" :label="key">
              {{ value.name }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </template>
    <!-- 折线图 -->
    <Echart :height="300" :options="eChartOptions" />
  </el-card>
</template>
<script lang="ts" setup>
import dayjs, { Dayjs } from 'dayjs'
import { EChartsOption } from 'echarts'
import * as TradeStatisticsApi from '@/api/mall/statistics/trade'
import { fenToYuan } from '@/utils'
import { formatDate } from '@/utils/formatTime'
import { CardTitle } from '@/components/Card'

/** 交易量趋势 */
defineOptions({ name: 'TradeTrendCard' })

enum TimeRangeTypeEnum {
  DAY30 = 1,
  WEEK = 7,
  MONTH = 30,
  YEAR = 365
} // 日期类型
const timeRangeType = ref(TimeRangeTypeEnum.DAY30) // 日期快捷选择按钮, 默认30天
const loading = ref(true) // 加载中
// 时间范围 Map
const timeRange = new Map()
  .set(TimeRangeTypeEnum.DAY30, {
    name: '30天',
    series: [
      { name: '订单金额', type: 'bar', smooth: true, data: [] },
      { name: '订单数量', type: 'line', smooth: true, data: [] }
    ]
  })
  .set(TimeRangeTypeEnum.WEEK, {
    name: '周',
    series: [
      { name: '上周金额', type: 'bar', smooth: true, data: [] },
      { name: '本周金额', type: 'bar', smooth: true, data: [] },
      { name: '上周数量', type: 'line', smooth: true, data: [] },
      { name: '本周数量', type: 'line', smooth: true, data: [] }
    ]
  })
  .set(TimeRangeTypeEnum.MONTH, {
    name: '月',
    series: [
      { name: '上月金额', type: 'bar', smooth: true, data: [] },
      { name: '本月金额', type: 'bar', smooth: true, data: [] },
      { name: '上月数量', type: 'line', smooth: true, data: [] },
      { name: '本月数量', type: 'line', smooth: true, data: [] }
    ]
  })
  .set(TimeRangeTypeEnum.YEAR, {
    name: '年',
    series: [
      { name: '去年金额', type: 'bar', smooth: true, data: [] },
      { name: '今年金额', type: 'bar', smooth: true, data: [] },
      { name: '去年数量', type: 'line', smooth: true, data: [] },
      { name: '今年数量', type: 'line', smooth: true, data: [] }
    ]
  })
/** 图表配置 */
const eChartOptions = reactive<EChartsOption>({
  grid: {
    left: 20,
    right: 20,
    bottom: 20,
    top: 80,
    containLabel: true
  },
  legend: {
    top: 50,
    data: []
  },
  series: [],
  toolbox: {
    feature: {
      // 数据区域缩放
      dataZoom: {
        yAxisIndex: false // Y轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '订单量趋势' } // 保存为图片
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
    inverse: true,
    boundaryGap: false,
    axisTick: {
      show: false
    },
    data: [],
    axisLabel: {
      formatter: (date: string) => {
        switch (timeRangeType.value) {
          case TimeRangeTypeEnum.DAY30:
            return formatDate(date, 'MM-DD')
          case TimeRangeTypeEnum.WEEK:
            let weekDay = formatDate(date, 'ddd')
            if (weekDay == '0') weekDay = '日'
            return '周' + weekDay
          case TimeRangeTypeEnum.MONTH:
            return formatDate(date, 'D')
          case TimeRangeTypeEnum.YEAR:
            return formatDate(date, 'M') + '月'
          default:
            return date
        }
      }
    }
  },
  yAxis: {
    axisTick: {
      show: false
    }
  }
}) as EChartsOption

/** 时间范围类型单选按钮选中 */
const handleTimeRangeTypeChange = async () => {
  // 设置时间范围
  let beginTime: Dayjs
  let endTime: Dayjs
  switch (timeRangeType.value) {
    case TimeRangeTypeEnum.WEEK:
      beginTime = dayjs().startOf('week')
      endTime = dayjs().endOf('week')
      break
    case TimeRangeTypeEnum.MONTH:
      beginTime = dayjs().startOf('month')
      endTime = dayjs().endOf('month')
      break
    case TimeRangeTypeEnum.YEAR:
      beginTime = dayjs().startOf('year')
      endTime = dayjs().endOf('year')
      break
    case TimeRangeTypeEnum.DAY30:
    default:
      beginTime = dayjs().subtract(30, 'day').startOf('d')
      endTime = dayjs().endOf('d')
      break
  }
  // 发送时间范围选中事件
  await getOrderCountTrendComparison(beginTime, endTime)
}

/** 查询订单数量趋势对照数据 */
const getOrderCountTrendComparison = async (
  beginTime: dayjs.ConfigType,
  endTime: dayjs.ConfigType
) => {
  loading.value = true
  // 查询数据
  const list = await TradeStatisticsApi.getOrderCountTrendComparison(
    timeRangeType.value,
    beginTime,
    endTime
  )
  // 处理数据
  const dates: string[] = []
  const series = [...timeRange.get(timeRangeType.value).series]
  for (let item of list) {
    dates.push(item.value.date)
    if (series.length === 2) {
      series[0].data.push(fenToYuan(item?.value?.orderPayPrice || 0)) // 当前金额
      series[1].data.push(fenToYuan(item?.value?.orderPayCount || 0)) // 当前数量
    } else {
      series[0].data.push(fenToYuan(item?.reference?.orderPayPrice || 0)) // 对照金额
      series[1].data.push(fenToYuan(item?.value?.orderPayPrice || 0)) // 当前金额
      series[2].data.push(item?.reference?.orderPayCount || 0) // 对照数量
      series[3].data.push(item?.value?.orderPayCount || 0) // 当前数量
    }
  }
  eChartOptions.xAxis!['data'] = dates
  eChartOptions.series = series
  // legend在4个切换到2个的时候，还是显示成4个，需要手动配置一下
  eChartOptions.legend['data'] = series.map((item) => item.name)
  loading.value = false
}

/** 初始化 **/
onMounted(() => {
  handleTimeRangeTypeChange()
})
</script>
