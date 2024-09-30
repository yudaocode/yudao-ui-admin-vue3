<template>
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" ref="queryForm" :inline="true" label-width="68px">
      <el-form-item label="公众号" prop="accountId">
        <WxAccountSelect @change="onAccountChanged" />
      </el-form-item>
      <el-form-item label="时间范围" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          @change="getSummary"
          class="!w-240px"
        />
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 图表 -->
  <ContentWrap>
    <el-row>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>用户增减数据</span>
            </div>
          </template>
          <Echart :options="userSummaryOption" :height="420" />
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>累计用户数据</span>
            </div>
          </template>
          <Echart :options="userCumulateOption" :height="420" />
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>消息概况数据</span>
            </div>
          </template>
          <Echart :options="upstreamMessageOption" :height="420" />
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>接口分析数据</span>
            </div>
          </template>
          <Echart :options="interfaceSummaryOption" :height="420" />
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { formatDate, addTime, betweenDay, beginOfDay, endOfDay } from '@/utils/formatTime'
import * as StatisticsApi from '@/api/mp/statistics'
import WxAccountSelect from '@/views/mp/components/wx-account-select'

defineOptions({ name: 'MpStatistics' })

const message = useMessage() // 消息弹窗

// 默认开始时间是当前日期-7，结束时间是当前日期-1
const dateRange = ref([
  beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7)),
  endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24))
])
const accountId = ref(-1) // 选中的公众号编号

const xAxisDate = ref([] as any[]) // X 轴的日期范围
// 用户增减数据图表配置项
const userSummaryOption = reactive({
  color: ['#67C23A', '#E5323E'],
  legend: {
    data: ['新增用户', '取消关注的用户']
  },
  tooltip: {},
  xAxis: {
    data: [] as any[] // X 轴的日期范围
  },
  yAxis: {
    minInterval: 1
  },
  series: [
    {
      name: '新增用户',
      type: 'bar',
      label: {
        show: true
      },
      barGap: 0,
      data: [] as any[] // 新增用户的数据
    },
    {
      name: '取消关注的用户',
      type: 'bar',
      label: {
        show: true
      },
      data: [] as any[] // 取消关注的用户的数据
    }
  ]
})
// 累计用户数据图表配置项
const userCumulateOption = reactive({
  legend: {
    data: ['累计用户量']
  },
  xAxis: {
    type: 'category',
    data: [] as any[]
  },
  yAxis: {
    minInterval: 1
  },
  series: [
    {
      name: '累计用户量',
      data: [] as any[], // 累计用户量的数据
      type: 'line',
      smooth: true,
      label: {
        show: true
      }
    }
  ]
})
// 消息发送概况数据图表配置项
const upstreamMessageOption = reactive({
  color: ['#67C23A', '#E5323E'],
  legend: {
    data: ['用户发送人数', '用户发送条数']
  },
  tooltip: {},
  xAxis: {
    data: [] as any[] // X 轴的日期范围
  },
  yAxis: {
    minInterval: 1
  },
  series: [
    {
      name: '用户发送人数',
      type: 'line',
      smooth: true,
      label: {
        show: true
      },
      data: [] as any[] // 用户发送人数的数据
    },
    {
      name: '用户发送条数',
      type: 'line',
      smooth: true,
      label: {
        show: true
      },
      data: [] as any[] // 用户发送条数的数据
    }
  ]
})
// 接口分析况数据图表配置项
const interfaceSummaryOption = reactive({
  color: ['#67C23A', '#E5323E', '#E6A23C', '#409EFF'],
  legend: {
    data: ['被动回复用户消息的次数', '失败次数', '最大耗时', '总耗时']
  },
  tooltip: {},
  xAxis: {
    data: [] as any[] // X 轴的日期范围
  },
  yAxis: {},
  series: [
    {
      name: '被动回复用户消息的次数',
      type: 'bar',
      label: {
        show: true
      },
      barGap: 0,
      data: [] as any[] // 被动回复用户消息的次数的数据
    },
    {
      name: '失败次数',
      type: 'bar',
      label: {
        show: true
      },
      data: [] as any[] // 失败次数的数据
    },
    {
      name: '最大耗时',
      type: 'bar',
      label: {
        show: true
      },
      data: [] as any[] // 最大耗时的数据
    },
    {
      name: '总耗时',
      type: 'bar',
      label: {
        show: true
      },
      data: [] as any[] // 总耗时的数据
    }
  ]
})

/** 侦听公众号变化 **/
const onAccountChanged = (id: number) => {
  accountId.value = id
  getSummary()
}

/** 加载数据 */
const getSummary = () => {
  // 如果没有选中公众号账号，则进行提示。
  if (!accountId) {
    message.error('未选中公众号，无法统计数据')
    return false
  }
  // 必须选择 7 天内，因为公众号有时间跨度限制为 7
  if (betweenDay(dateRange.value[0], dateRange.value[1]) >= 7) {
    message.error('时间间隔 7 天以内，请重新选择')
    return false
  }
  // 清空横坐标日期
  xAxisDate.value = []
  // 横坐标加载日期数据
  const days = betweenDay(dateRange.value[0], dateRange.value[1]) // 相差天数
  for (let i = 0; i <= days; i++) {
    xAxisDate.value.push(
      formatDate(addTime(dateRange.value[0], 3600 * 1000 * 24 * i), 'YYYY-MM-DD')
    )
  }
  // 初始化图表
  initUserSummaryChart()
  initUserCumulateChart()
  initUpstreamMessageChart()
  interfaceSummaryChart()
}

/** 用户增减数据 */
const initUserSummaryChart = async () => {
  userSummaryOption.xAxis.data = []
  userSummaryOption.series[0].data = []
  userSummaryOption.series[1].data = []
  try {
    // 用户增减数据
    const data = await StatisticsApi.getUserSummary({
      accountId: accountId.value,
      date: [formatDate(dateRange.value[0]), formatDate(dateRange.value[1])]
    })
    // 横坐标
    userSummaryOption.xAxis.data = xAxisDate.value
    // 处理数据
    xAxisDate.value.forEach((date, index) => {
      data.forEach((item) => {
        // 匹配日期
        const refDate = formatDate(new Date(item.refDate), 'YYYY-MM-DD')
        if (refDate.indexOf(date) === -1) {
          return
        }
        // 设置数据到对应的位置
        userSummaryOption.series[0].data[index] = item.newUser
        userSummaryOption.series[1].data[index] = item.cancelUser
      })
    })
  } catch {}
}

/** 累计用户数据 */
const initUserCumulateChart = async () => {
  userCumulateOption.xAxis.data = []
  userCumulateOption.series[0].data = []
  // 发起请求
  try {
    const data = await StatisticsApi.getUserCumulate({
      accountId: accountId.value,
      date: [formatDate(dateRange.value[0]), formatDate(dateRange.value[1])]
    })
    userCumulateOption.xAxis.data = xAxisDate.value
    // 处理数据
    data.forEach((item, index) => {
      userCumulateOption.series[0].data[index] = item.cumulateUser
    })
  } catch {}
}

/** 消息概况数据 */
const initUpstreamMessageChart = async () => {
  upstreamMessageOption.xAxis.data = []
  upstreamMessageOption.series[0].data = []
  upstreamMessageOption.series[1].data = []
  // 发起请求
  try {
    const data = await StatisticsApi.getUpstreamMessage({
      accountId: accountId.value,
      date: [formatDate(dateRange.value[0]), formatDate(dateRange.value[1])]
    })
    upstreamMessageOption.xAxis.data = xAxisDate.value
    // 处理数据
    data.forEach((item, index) => {
      upstreamMessageOption.series[0].data[index] = item.messageUser
      upstreamMessageOption.series[1].data[index] = item.messageCount
    })
  } catch {}
}

/** 接口分析数据 */
const interfaceSummaryChart = async () => {
  interfaceSummaryOption.xAxis.data = []
  interfaceSummaryOption.series[0].data = []
  interfaceSummaryOption.series[1].data = []
  interfaceSummaryOption.series[2].data = []
  interfaceSummaryOption.series[3].data = []
  // 发起请求
  try {
    const data = await StatisticsApi.getInterfaceSummary({
      accountId: accountId.value,
      date: [formatDate(dateRange.value[0]), formatDate(dateRange.value[1])]
    })
    interfaceSummaryOption.xAxis.data = xAxisDate.value
    // 处理数据
    data.forEach((item, index) => {
      interfaceSummaryOption.series[0].data[index] = item.callbackCount
      interfaceSummaryOption.series[1].data[index] = item.failCount
      interfaceSummaryOption.series[2].data[index] = item.maxTimeCost
      interfaceSummaryOption.series[3].data[index] = item.totalTimeCost
    })
  } catch {}
}
</script>
