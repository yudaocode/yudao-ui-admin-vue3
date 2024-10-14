<!-- 客户总量统计 -->
<template>
  <!-- Echarts图 -->
  <el-card shadow="never">
    <el-skeleton :loading="loading" animated>
      <Echart :height="500" :options="echartsOption" />
    </el-skeleton>
  </el-card>

  <!-- 统计列表 -->
  <el-card class="mt-16px" shadow="never">
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" fixed="left" label="序号" type="index" width="80" />
      <el-table-column align="center" fixed="left" label="商机名称" prop="name" width="160">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="left" label="客户名称" prop="customerName" width="120">
        <template #default="scope">
          <el-link
            :underline="false"
            type="primary"
            @click="openCustomerDetail(scope.row.customerId)"
          >
            {{ scope.row.customerName }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="erpPriceTableColumnFormatter"
        align="center"
        label="商机金额（元）"
        prop="totalPrice"
        width="140"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="预计成交日期"
        prop="dealTime"
        width="180px"
      />
      <el-table-column align="center" label="备注" prop="remark" width="200" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="下次联系时间"
        prop="contactNextTime"
        width="180px"
      />
      <el-table-column align="center" label="负责人" prop="ownerUserName" width="100px" />
      <el-table-column align="center" label="所属部门" prop="ownerUserDeptName" width="100px" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="最后跟进时间"
        prop="contactLastTime"
        width="180px"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="更新时间"
        prop="updateTime"
        width="180px"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="180px"
      />
      <el-table-column align="center" label="创建人" prop="creatorName" width="100px" />
      <el-table-column
        align="center"
        fixed="right"
        label="商机状态组"
        prop="statusTypeName"
        width="140"
      />
      <el-table-column
        align="center"
        fixed="right"
        label="商机阶段"
        prop="statusName"
        width="120"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams0.pageSize"
      v-model:page="queryParams0.pageNo"
      :total="total"
      @pagination="getList"
    />
  </el-card>
</template>
<script lang="ts" setup>
import {
  CrmStatisticsBusinessInversionRateSummaryByDateRespVO,
  StatisticFunnelApi
} from '@/api/crm/statistics/funnel'
import { EChartsOption } from 'echarts'
import { erpCalculatePercentage, erpPriceTableColumnFormatter } from '@/utils'
import { dateFormatter } from '@/utils/formatTime'

defineOptions({ name: 'BusinessSummary' })

const props = defineProps<{ queryParams: any }>() // 搜索参数
const queryParams0 = reactive({
  pageNo: 1,
  pageSize: 10
})
const loading = ref(false) // 加载中
const list = ref([]) // 列表的数据
const total = ref(0)
/** 将传进来的值赋值给 queryParams0 */
watch(
  () => props.queryParams,
  (data) => {
    if (!data) {
      return
    }
    const newObj = { ...queryParams0, ...data }
    Object.assign(queryParams0, newObj)
  },
  {
    immediate: true
  }
)
/** 柱状图配置：纵向 */
const echartsOption = reactive<EChartsOption>({
  color: ['#6ca2ff', '#6ac9d7', '#ff7474'],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      // 坐标轴指示器，坐标轴触发有效
      type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
    }
  },
  legend: {
    data: ['赢单转化率', '商机总数', '赢单商机数'],
    bottom: '0px',
    itemWidth: 14
  },
  grid: {
    top: '40px',
    left: '40px',
    right: '40px',
    bottom: '40px',
    containLabel: true,
    borderColor: '#fff'
  },
  xAxis: [
    {
      type: 'category',
      data: [],
      axisTick: {
        alignWithLabel: true,
        lineStyle: { width: 0 }
      },
      axisLabel: {
        color: '#BDBDBD'
      },
      /** 坐标轴轴线相关设置 */
      axisLine: {
        lineStyle: { color: '#BDBDBD' }
      },
      splitLine: {
        show: false
      }
    }
  ],
  yAxis: [
    {
      type: 'value',
      name: '赢单转化率',
      axisTick: {
        alignWithLabel: true,
        lineStyle: { width: 0 }
      },
      axisLabel: {
        color: '#BDBDBD',
        formatter: '{value}%'
      },
      /** 坐标轴轴线相关设置 */
      axisLine: {
        lineStyle: { color: '#BDBDBD' }
      },
      splitLine: {
        show: false
      }
    },
    {
      type: 'value',
      name: '商机数',
      axisTick: {
        alignWithLabel: true,
        lineStyle: { width: 0 }
      },
      axisLabel: {
        color: '#BDBDBD',
        formatter: '{value}个'
      },
      /** 坐标轴轴线相关设置 */
      axisLine: {
        lineStyle: { color: '#BDBDBD' }
      },
      splitLine: {
        show: false
      }
    }
  ],
  series: [
    {
      name: '赢单转化率',
      type: 'line',
      yAxisIndex: 0,
      data: []
    },
    {
      name: '商机总数',
      type: 'bar',
      yAxisIndex: 1,
      barWidth: 15,
      data: []
    },
    {
      name: '赢单商机数',
      type: 'bar',
      yAxisIndex: 1,
      barWidth: 15,
      data: []
    }
  ]
}) as EChartsOption

/** 获取数据并填充图表 */
const fetchAndFill = async () => {
  // 1. 加载统计数据
  const businessSummaryByDate = await StatisticFunnelApi.getBusinessInversionRateSummaryByDate(
    props.queryParams
  )
  // 2.1 更新 Echarts 数据
  if (echartsOption.xAxis && echartsOption.xAxis[0] && echartsOption.xAxis[0]['data']) {
    echartsOption.xAxis[0]['data'] = businessSummaryByDate.map(
      (s: CrmStatisticsBusinessInversionRateSummaryByDateRespVO) => s.time
    )
  }
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = businessSummaryByDate.map(
      (s: CrmStatisticsBusinessInversionRateSummaryByDateRespVO) =>
        erpCalculatePercentage(s.businessWinCount, s.businessCount)
    )
  }
  if (echartsOption.series && echartsOption.series[1] && echartsOption.series[1]['data']) {
    echartsOption.series[1]['data'] = businessSummaryByDate.map(
      (s: CrmStatisticsBusinessInversionRateSummaryByDateRespVO) => s.businessCount
    )
  }
  if (echartsOption.series && echartsOption.series[2] && echartsOption.series[2]['data']) {
    echartsOption.series[2]['data'] = businessSummaryByDate.map(
      (s: CrmStatisticsBusinessInversionRateSummaryByDateRespVO) => s.businessWinCount
    )
  }

  // 2.2 更新列表数据
  await getList()
}
/** 获取商机列表 */
const getList = async () => {
  const data = await StatisticFunnelApi.getBusinessPageByDate(props.queryParams)
  list.value = data.list
  total.value = data.total
}
/** 打开客户详情 */
const { push } = useRouter()
const openDetail = (id: number) => {
  push({ name: 'CrmBusinessDetail', params: { id } })
}

/** 打开客户详情 */
const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 获取统计数据 */
const loadData = async () => {
  loading.value = true
  try {
    await fetchAndFill()
  } finally {
    loading.value = false
  }
}

defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
