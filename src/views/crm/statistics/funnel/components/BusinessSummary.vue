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
  CrmStatisticsBusinessSummaryByDateRespVO,
  StatisticFunnelApi
} from '@/api/crm/statistics/funnel'
import { EChartsOption } from 'echarts'
import { erpPriceTableColumnFormatter } from '@/utils'
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
  grid: {
    left: 30,
    right: 30, // 让 X 轴右侧显示完整
    bottom: 20,
    containLabel: true
  },
  legend: {},
  series: [
    {
      name: '新增商机数量',
      type: 'bar',
      yAxisIndex: 0,
      data: []
    },
    {
      name: '新增商机金额',
      type: 'bar',
      yAxisIndex: 1,
      data: []
    }
  ],
  toolbox: {
    feature: {
      dataZoom: {
        xAxisIndex: false // 数据区域缩放：Y 轴不缩放
      },
      brush: {
        type: ['lineX', 'clear'] // 区域缩放按钮、还原按钮
      },
      saveAsImage: { show: true, name: '新增商机分析' } // 保存为图片
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '新增商机数量',
      min: 0,
      minInterval: 1 // 显示整数刻度
    },
    {
      type: 'value',
      name: '新增商机金额',
      min: 0,
      minInterval: 1, // 显示整数刻度
      splitLine: {
        lineStyle: {
          type: 'dotted', // 右侧网格线虚化, 减少混乱
          opacity: 0.7
        }
      }
    }
  ],
  xAxis: {
    type: 'category',
    name: '日期',
    data: []
  }
}) as EChartsOption

/** 获取数据并填充图表 */
const fetchAndFill = async () => {
  // 1. 加载统计数据
  const businessSummaryByDate = await StatisticFunnelApi.getBusinessSummaryByDate(props.queryParams)
  // 2.1 更新 Echarts 数据
  if (echartsOption.xAxis && echartsOption.xAxis['data']) {
    echartsOption.xAxis['data'] = businessSummaryByDate.map(
      (s: CrmStatisticsBusinessSummaryByDateRespVO) => s.time
    )
  }
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = businessSummaryByDate.map(
      (s: CrmStatisticsBusinessSummaryByDateRespVO) => s.businessCreateCount
    )
  }
  if (echartsOption.series && echartsOption.series[1] && echartsOption.series[1]['data']) {
    echartsOption.series[1]['data'] = businessSummaryByDate.map(
      (s: CrmStatisticsBusinessSummaryByDateRespVO) => s.totalPrice
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
