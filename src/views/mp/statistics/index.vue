<template>
  <!-- 搜索工作栏 -->
  <content-wrap>
    <el-form ref="queryForm" class="-mb-15px" :inline="true" label-width="68px">
      <el-form-item label="公众号" prop="accountId">
        <el-select v-model="accountId" @change="getSummary">
          <el-option
            v-for="item in accounts"
            :key="parseInt(item.id)"
            :label="item.name"
            :value="parseInt(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围" prop="dateRange">
        <el-date-picker
          v-model="dateRange"
          style="width: 260px"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="defaultTime"
          @change="getSummary"
        />
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 图表 -->
  <content-wrap>
    <el-row>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>用户增减数据</span>
            </div>
          </template>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <div ref="userSummaryChartRef" style="height: 420px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>累计用户数据</span>
            </div>
          </template>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <div ref="userCumulateChartRef" style="height: 420px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>消息概况数据</span>
            </div>
          </template>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <div ref="upstreamMessageChartRef" style="height: 420px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <div>
              <span>接口分析数据</span>
            </div>
          </template>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <div ref="interfaceSummaryChartRef" style="height: 420px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </content-wrap>
</template>

<script setup lang="ts" name="MpStatistics">
// 引入基本模板
import * as echarts from 'echarts'
import {
  getInterfaceSummary,
  getUpstreamMessage,
  getUserCumulate,
  getUserSummary
} from '@/api/mp/statistics'
import { addTime, beginOfDay, betweenDay, endOfDay, formatDate } from '@/utils/dateUtils'
import { getSimpleAccountList } from '@/api/mp/account'

const message = useMessage() // 消息弹窗

const defaultTime = ref<[Date, Date]>([
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59)
])
const dateRange = ref([
  beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7)),
  endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24))
]) // -1 天
const accountId = ref()
const accounts = ref([
  {
    id: '0',
    name: ''
  }
])

const userSummaryChartRef = ref()
const userCumulateChartRef = ref()
const upstreamMessageChartRef = ref()
const interfaceSummaryChartRef = ref()

const xAxisDate = ref([] as any[]) // X 轴的日期范围
const userSummaryOption = reactive({
  // 用户增减数据
  color: ['#67C23A', '#e5323e'],
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
const userCumulateOption = reactive({
  // 累计用户数据
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
const upstreamMessageOption = reactive({
  // 消息发送概况数据
  color: ['#67C23A', '#e5323e'],
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
const interfaceSummaryOption = reactive({
  // 接口分析况数据
  color: ['#67C23A', '#e5323e', '#E6A23C', '#409EFF'],
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

onMounted(async () => {
  // 获取公众号下拉列表
  await getAccountList()
  // 加载数据
  getSummary()
})
const getAccountList = async () => {
  const data = await getSimpleAccountList()
  accounts.value = data
  // 默认选中第一个
  if (accounts.value.length > 0) {
    accountId.value = accounts.value[0].id
  }
}
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
  xAxisDate.value = []
  const days = betweenDay(dateRange.value[0], dateRange.value[1]) // 相差天数
  for (let i = 0; i <= days; i++) {
    xAxisDate.value.push(
      formatDate(addTime(dateRange.value[0], 3600 * 1000 * 24 * i), 'yyyy-MM-dd')
    )
  }

  // 初始化图表
  initUserSummaryChart()
  initUserCumulateChart()
  initUpstreamMessageChart()
  interfaceSummaryChart()
}
const initUserSummaryChart = async () => {
  userSummaryOption.xAxis.data = []
  userSummaryOption.series[0].data = []
  userSummaryOption.series[1].data = []
  try {
    const data = await getUserSummary({
      accountId: accountId.value,
      date: [
        formatDate(dateRange.value[0], 'yyyy-MM-dd HH:mm:ss'),
        formatDate(dateRange.value[1], 'yyyy-MM-dd HH:mm:ss')
      ]
    })

    userSummaryOption.xAxis.data = xAxisDate.value
    // 处理数据
    xAxisDate.value.forEach((date, index) => {
      data.forEach((item) => {
        // 匹配日期
        const refDate = formatDate(new Date(item.refDate), 'yyyy-MM-dd')
        if (refDate.indexOf(date) === -1) {
          return
        }
        // 设置数据到对应的位置
        userSummaryOption.series[0].data[index] = item.newUser
        userSummaryOption.series[1].data[index] = item.cancelUser
      })
    })
    // 绘制图表
    const userSummaryChart = echarts.init(userSummaryChartRef.value)
    userSummaryChart.setOption(userSummaryOption)
  } catch {}
}
const initUserCumulateChart = async () => {
  userCumulateOption.xAxis.data = []
  userCumulateOption.series[0].data = []
  // 发起请求
  try {
    const data = await getUserCumulate({
      accountId: accountId.value,
      date: [
        formatDate(dateRange.value[0], 'yyyy-MM-dd HH:mm:ss'),
        formatDate(dateRange.value[1], 'yyyy-MM-dd HH:mm:ss')
      ]
    })
    userCumulateOption.xAxis.data = xAxisDate.value
    // 处理数据
    data.forEach((item, index) => {
      userCumulateOption.series[0].data[index] = item.cumulateUser
    })
    // 绘制图表
    const userCumulateChart = echarts.init(userCumulateChartRef.value)
    userCumulateChart.setOption(userCumulateOption)
  } catch {}
}
const initUpstreamMessageChart = async () => {
  upstreamMessageOption.xAxis.data = []
  upstreamMessageOption.series[0].data = []
  upstreamMessageOption.series[1].data = []
  // 发起请求
  try {
    const data = await getUpstreamMessage({
      accountId: accountId.value,
      date: [
        formatDate(dateRange.value[0], 'yyyy-MM-dd HH:mm:ss'),
        formatDate(dateRange.value[1], 'yyyy-MM-dd HH:mm:ss')
      ]
    })
    upstreamMessageOption.xAxis.data = xAxisDate.value
    // 处理数据
    data.forEach((item, index) => {
      upstreamMessageOption.series[0].data[index] = item.messageUser
      upstreamMessageOption.series[1].data[index] = item.messageCount
    })
    // 绘制图表
    const upstreamMessageChart = echarts.init(upstreamMessageChartRef.value)
    upstreamMessageChart.setOption(upstreamMessageOption)
  } catch {}
}
const interfaceSummaryChart = async () => {
  interfaceSummaryOption.xAxis.data = []
  interfaceSummaryOption.series[0].data = []
  interfaceSummaryOption.series[1].data = []
  interfaceSummaryOption.series[2].data = []
  interfaceSummaryOption.series[3].data = []
  // 发起请求
  try {
    const data = await getInterfaceSummary({
      accountId: accountId.value,
      date: [
        formatDate(dateRange.value[0], 'yyyy-MM-dd HH:mm:ss'),
        formatDate(dateRange.value[1], 'yyyy-MM-dd HH:mm:ss')
      ]
    })
    interfaceSummaryOption.xAxis.data = xAxisDate.value
    // 处理数据
    data.forEach((item, index) => {
      interfaceSummaryOption.series[0].data[index] = item.callbackCount
      interfaceSummaryOption.series[1].data[index] = item.failCount
      interfaceSummaryOption.series[2].data[index] = item.maxTimeCost
      interfaceSummaryOption.series[3].data[index] = item.totalTimeCost
    })
    // 绘制图表
    const interfaceSummaryChart = echarts.init(interfaceSummaryChartRef.value)
    interfaceSummaryChart.setOption(interfaceSummaryOption)
  } catch {}
}
</script>
