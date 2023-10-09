<template>
  <div class="flex flex-col">
    <el-row :gutter="16" class="summary">
      <el-col :sm="6" :xs="12" v-loading="loading">
        <TradeTrendValue
          title="累计会员数"
          icon="fa-solid:users"
          icon-color="bg-blue-100"
          icon-bg-color="text-blue-500"
          :value="summary?.userCount || 0"
        />
      </el-col>
      <el-col :sm="6" :xs="12" v-loading="loading">
        <TradeTrendValue
          title="累计充值人数"
          icon="fa-solid:user"
          icon-color="bg-purple-100"
          icon-bg-color="text-purple-500"
          :value="summary?.rechargeUserCount || 0"
        />
      </el-col>
      <el-col :sm="6" :xs="12" v-loading="loading">
        <TradeTrendValue
          title="累计充值金额"
          icon="fa-solid:money-check-alt"
          icon-color="bg-yellow-100"
          icon-bg-color="text-yellow-500"
          prefix="￥"
          :decimals="2"
          :value="fenToYuan(summary?.rechargePrice || 0)"
        />
      </el-col>
      <el-col :sm="6" :xs="12" v-loading="loading">
        <TradeTrendValue
          title="累计消费金额"
          icon="fa-solid:yen-sign"
          icon-color="bg-green-100"
          icon-bg-color="text-green-500"
          prefix="￥"
          :decimals="2"
          :value="fenToYuan(summary?.expensePrice || 0)"
        />
      </el-col>
    </el-row>
    <el-row :gutter="16" class="mb-4">
      <el-col :md="18" :sm="24">
        <el-card shadow="never">
          <template #header>
            <div class="flex flex-row items-center justify-between">
              <span>会员概览</span>
              <!-- 查询条件 -->
              <div class="my--2 flex flex-row items-center gap-2">
                <el-radio-group v-model="shortcutDays" @change="handleDateTypeChange">
                  <el-radio-button :label="1">昨天</el-radio-button>
                  <el-radio-button :label="7">最近7天</el-radio-button>
                  <el-radio-button :label="30">最近30天</el-radio-button>
                </el-radio-group>
                <el-date-picker
                  v-model="queryParams.times"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
                  :shortcuts="shortcuts"
                  class="!w-240px"
                  @change="getMemberAnalyse"
                />
              </div>
            </div>
          </template>
          <div class="min-w-225 py-1.75" v-loading="analyseLoading">
            <div class="relative h-24 flex">
              <div class="h-full w-75% bg-blue-50 <lg:w-35% <xl:w-55%">
                <div class="ml-15 h-full flex flex-col justify-center">
                  <div class="font-bold">
                    注册用户数量：{{ analyseData?.comparison?.value?.userCount || 0 }}
                  </div>
                  <div class="mt-2 text-3.5">
                    环比增长率：{{
                      calculateRelativeRate(
                        analyseData?.comparison?.value?.userCount,
                        analyseData?.comparison?.reference?.userCount
                      )
                    }}%
                  </div>
                </div>
              </div>
              <div
                class="trapezoid1 ml--38.5 mt-1.5 h-full w-77 flex flex-col items-center justify-center bg-blue-5 text-3.5 text-white"
              >
                <span class="text-6 font-bold">{{ analyseData?.visitorCount || 0 }}</span>
                <span>访客</span>
              </div>
            </div>
            <div class="relative h-24 flex">
              <div class="h-full w-75% flex bg-cyan-50 <lg:w-35% <xl:w-55%">
                <div class="ml-15 h-full flex flex-col justify-center">
                  <div class="font-bold">
                    活跃用户数量：{{ analyseData?.comparison?.value?.activeUserCount || 0 }}
                  </div>
                  <div class="mt-2 text-3.5">
                    环比增长率：{{
                      calculateRelativeRate(
                        analyseData?.comparison?.value?.activeUserCount,
                        analyseData?.comparison?.reference?.activeUserCount
                      )
                    }}%
                  </div>
                </div>
              </div>
              <div
                class="trapezoid2 ml--28 mt-1.7 h-25 w-56 flex flex-col items-center justify-center bg-cyan-5 text-3.5 text-white"
              >
                <span class="text-6 font-bold">{{ analyseData?.orderUserCount || 0 }}</span>
                <span>下单</span>
              </div>
            </div>
            <div class="relative h-24 flex">
              <div class="w-75% flex bg-slate-50 <lg:w-35% <xl:w-55%">
                <div class="ml-15 h-full flex flex-row gap-x-16">
                  <div class="flex flex-col justify-center">
                    <div class="font-bold">
                      充值用户数量：{{ analyseData?.comparison?.value?.rechargeUserCount || 0 }}
                    </div>
                    <div class="mt-2 text-3.5">
                      环比增长率：{{
                        calculateRelativeRate(
                          analyseData?.comparison?.value?.rechargeUserCount,
                          analyseData?.comparison?.reference?.rechargeUserCount
                        )
                      }}%
                    </div>
                  </div>
                  <div class="flex flex-col justify-center">
                    <div class="font-bold">客单价：{{ fenToYuan(analyseData?.atv || 0) }}</div>
                  </div>
                </div>
              </div>
              <div
                class="trapezoid3 ml--18 mt-3.25 h-23 w-36 flex flex-col items-center justify-center bg-slate-5 text-3.5 text-white"
              >
                <span class="text-6 font-bold">{{ analyseData?.payUserCount || 0 }}</span>
                <span>成交用户</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :md="6" :sm="24">
        <el-card shadow="never" header="会员终端" v-loading="loading">
          <Echart :height="300" :options="terminalChartOptions" />
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :md="18" :sm="24">
        <el-card shadow="never" header="会员地域分布">
          <el-row v-loading="loading">
            <el-col :span="10">
              <Echart :height="300" :options="areaChartOptions" />
            </el-col>
            <el-col :span="14">
              <el-table :data="areaStatisticsList" :height="300">
                <el-table-column
                  label="省份"
                  prop="areaName"
                  align="center"
                  min-width="80"
                  show-overflow-tooltip
                  sortable
                  :sort-method="(obj1, obj2) => obj1.areaName.localeCompare(obj2.areaName, 'zh-CN')"
                />
                <el-table-column
                  label="会员数量"
                  prop="userCount"
                  align="center"
                  min-width="105"
                  sortable
                />
                <el-table-column
                  label="订单创建数量"
                  prop="orderCreateCount"
                  align="center"
                  min-width="135"
                  sortable
                />
                <el-table-column
                  label="订单支付数量"
                  prop="orderPayCount"
                  align="center"
                  min-width="135"
                  sortable
                />
                <el-table-column
                  label="订单支付金额"
                  prop="orderPayPrice"
                  align="center"
                  min-width="135"
                  sortable
                  :formatter="fenToYuanFormat"
                />
              </el-table>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :md="6" :sm="24">
        <el-card shadow="never" header="会员性别比例" v-loading="loading">
          <Echart :height="300" :options="sexChartOptions" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script lang="ts" setup>
import * as TradeMemberApi from '@/api/mall/statistics/member'
import TradeTrendValue from '../trade/components/TradeTrendValue.vue'
import { EChartsOption } from 'echarts'
import china from '@/assets/map/json/china.json'
import dayjs from 'dayjs'
import { fenToYuan } from '@/utils'
import * as DateUtil from '@/utils/formatTime'
import {
  MemberAnalyseRespVO,
  MemberAreaStatisticsRespVO,
  MemberSexStatisticsRespVO,
  MemberAnalyseReqVO,
  MemberSummaryRespVO,
  MemberTerminalStatisticsRespVO
} from '@/api/mall/statistics/member'
import { DICT_TYPE, DictDataType, getIntDictOptions } from '@/utils/dict'
import echarts from '@/plugins/echarts'
import { fenToYuanFormat } from '@/utils/formatter'

/** 会员统计 */
defineOptions({ name: 'MemberStatistics' })

const loading = ref(true) // 加载中
const analyseLoading = ref(true) // 会员概览加载中
const queryParams = reactive<MemberAnalyseReqVO>({ times: ['', ''] }) // 会员概览查询参数
const shortcutDays = ref(7) // 日期快捷天数（单选按钮组）, 默认7天
const summary = ref<MemberSummaryRespVO>() // 会员统计数据
const analyseData = ref<MemberAnalyseRespVO>() // 会员分析数据
const areaStatisticsList = shallowRef<MemberAreaStatisticsRespVO[]>() // 省份会员统计

// 注册地图
echarts?.registerMap('china', china!)

/** 日期快捷选择 */
const shortcuts = [
  {
    text: '昨天',
    value: () => DateUtil.getDayRange(new Date(), -1)
  },
  {
    text: '最近7天',
    value: () => DateUtil.getLast7Days()
  },
  {
    text: '本月',
    value: () => [dayjs().startOf('M'), dayjs().subtract(1, 'd')]
  },
  {
    text: '最近30天',
    value: () => DateUtil.getLast30Days()
  },
  {
    text: '最近1年',
    value: () => DateUtil.getLast1Year()
  }
]

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

/** 会员性别统计图配置 */
const sexChartOptions = reactive<EChartsOption>({
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
      name: '会员性别',
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

const areaChartOptions = reactive<EChartsOption>({
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      return `${params?.data?.areaName || params?.name}<br/>
会员数量：${params?.data?.userCount || 0}<br/>
订单创建数量：${params?.data?.orderCreateCount || 0}<br/>
订单支付数量：${params?.data?.orderPayCount || 0}<br/>
订单支付金额：${fenToYuan(params?.data?.orderPayPrice || 0)}`
    }
  },
  visualMap: {
    text: ['高', '低'],
    realtime: false,
    calculable: true,
    top: 'middle',
    inRange: {
      color: ['#fff', '#3b82f6']
    }
  },
  series: [
    {
      name: '会员地域分布',
      type: 'map',
      map: 'china',
      roam: false,
      selectedMode: false,
      data: []
    }
  ]
}) as EChartsOption

/** 计算环比 */
const calculateRelativeRate = (value?: number, reference?: number) => {
  // 防止除0
  if (!reference) return 0

  return ((100 * ((value || 0) - reference)) / reference).toFixed(0)
}

/** 设置时间范围 */
function setTimes() {
  const beginDate = dayjs().subtract(shortcutDays.value, 'd')
  const yesterday = dayjs().subtract(1, 'd')
  queryParams.times = DateUtil.getDateRange(beginDate, yesterday)
}

/** 处理会员概览查询（日期单选按钮组选择后） */
const handleDateTypeChange = async () => {
  // 设置时间范围
  setTimes()
  // 查询数据
  await getMemberAnalyse()
}

/** 查询会员统计 */
const getMemberSummary = async () => {
  summary.value = await TradeMemberApi.getMemberSummary()
}

/** 按照省份，查询会员统计列表 */
const getMemberAreaStatisticsList = async () => {
  const list = await TradeMemberApi.getMemberAreaStatisticsList()
  areaStatisticsList.value = list.map((item: MemberAreaStatisticsRespVO) => {
    return {
      ...item,
      areaName: item.areaName
        .replace('维吾尔自治区', '')
        .replace('壮族自治区', '')
        .replace('回族自治区', '')
        .replace('自治区', '')
        .replace('省', '')
    }
  })
  let min = 0
  let max = 0
  areaChartOptions.series[0].data = areaStatisticsList.value.map((item) => {
    min = Math.min(min, item.orderPayCount)
    max = Math.max(max, item.orderPayCount)
    return { ...item, name: item.areaName, value: item.orderPayCount || 0 }
  })
  areaChartOptions.visualMap.min = min
  areaChartOptions.visualMap.max = max
}

/** 按照性别，查询会员统计列表 */
const getMemberSexStatisticsList = async () => {
  const list = await TradeMemberApi.getMemberSexStatisticsList()
  const dictDataList = getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)
  sexChartOptions.series[0].data = dictDataList.map((dictData: DictDataType) => {
    const userCount = list.find((item: MemberSexStatisticsRespVO) => item.sex === dictData.value)
      ?.userCount
    return {
      name: dictData.label,
      value: userCount || 0
    }
  })
}

/** 按照终端，查询会员统计列表 */
const getMemberTerminalStatisticsList = async () => {
  const list = await TradeMemberApi.getMemberTerminalStatisticsList()
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
}

/** 查询会员概览数据列表 */
const getMemberAnalyse = async () => {
  analyseLoading.value = true
  const times = queryParams.times
  // 开始与截止在同一天的, 环比出不来, 需要延长一天
  if (DateUtil.isSameDay(times[0], times[1])) {
    // 前天
    times[0] = DateUtil.formatDate(dayjs(times[0]).subtract(1, 'd'))
  }
  // 查询数据
  analyseData.value = await TradeMemberApi.getMemberAnalyse({ times })
  analyseLoading.value = false
}

/** 初始化 **/
onMounted(async () => {
  loading.value = true
  await Promise.all([
    getMemberSummary(),
    getMemberTerminalStatisticsList(),
    getMemberAreaStatisticsList(),
    getMemberSexStatisticsList(),
    handleDateTypeChange()
  ])
  loading.value = false
})
</script>
<style lang="scss" scoped>
.summary {
  .el-col {
    margin-bottom: 1rem;
  }
}
.trapezoid1 {
  transform: perspective(5em) rotateX(-11deg);
}
.trapezoid2 {
  transform: perspective(7em) rotateX(-20deg);
}
.trapezoid3 {
  transform: perspective(3em) rotateX(-13deg);
}
</style>
