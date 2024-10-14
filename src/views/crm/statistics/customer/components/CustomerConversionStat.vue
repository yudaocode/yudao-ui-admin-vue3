<!-- 客户转化率分析 -->
<template>
  <!-- Echarts图 -->
  <el-card shadow="never">
    <el-skeleton :loading="loading" animated>
      <Echart :height="500" :options="echartsOption" />
    </el-skeleton>
  </el-card>

  <!-- 统计列表 -->
  <el-card shadow="never" class="mt-16px">
    <el-table v-loading="loading" :data="list">
      <el-table-column label="序号" align="center" type="index" width="80" fixed="left" />
      <el-table-column
        label="客户名称"
        align="center"
        prop="customerName"
        min-width="200"
        fixed="left"
      />
      <el-table-column label="合同名称" align="center" prop="contractName" min-width="200" />
      <el-table-column
        label="合同总金额"
        align="center"
        prop="totalPrice"
        min-width="200"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        label="回款金额"
        align="center"
        prop="receivablePrice"
        min-width="200"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column align="center" label="客户来源" prop="source" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="scope.row.source" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="客户行业" prop="industryId" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" :value="scope.row.industryId" />
        </template>
      </el-table-column>
      <el-table-column label="负责人" align="center" prop="ownerUserName" min-width="200" />
      <el-table-column label="创建人" align="center" prop="creatorUserName" min-width="200" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        min-width="200"
      />
      <el-table-column
        label="下单日期"
        align="center"
        prop="orderDate"
        :formatter="dateFormatter"
        min-width="200"
        fixed="right"
      />
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import {
  StatisticsCustomerApi,
  CrmStatisticsCustomerSummaryByDateRespVO
} from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'
import { dateFormatter } from '@/utils/formatTime'
import { erpPriceTableColumnFormatter } from '@/utils'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'CustomerConversionStat' })

const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticsCustomerSummaryByDateRespVO[]>([]) // 列表的数据

/** 柱状图配置：纵向 */
const echartsOption = reactive<EChartsOption>({
  grid: {
    left: 20,
    right: 40, // 让 X 轴右侧显示完整
    bottom: 20,
    containLabel: true
  },
  legend: {},
  series: [
    {
      name: '客户转化率',
      type: 'line',
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
      saveAsImage: { show: true, name: '客户转化率分析' } // 保存为图片
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  yAxis: {
    type: 'value',
    name: '转化率(%)'
  },
  xAxis: {
    type: 'category',
    name: '日期',
    data: []
  }
}) as EChartsOption

/** 获取数据并填充图表 */
const fetchAndFill = async () => {
  // 1. 加载统计数据
  const customerCount = await StatisticsCustomerApi.getCustomerSummaryByDate(props.queryParams)
  const contractSummary = await StatisticsCustomerApi.getContractSummary(props.queryParams)
  // 2.1 更新 Echarts 数据
  if (echartsOption.xAxis && echartsOption.xAxis['data']) {
    echartsOption.xAxis['data'] = customerCount.map(
      (s: CrmStatisticsCustomerSummaryByDateRespVO) => s.time
    )
  }
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = customerCount.map(
      (item: CrmStatisticsCustomerSummaryByDateRespVO) => {
        return {
          name: item.time,
          value: item.customerCreateCount
            ? ((item.customerDealCount / item.customerCreateCount) * 100).toFixed(2)
            : 0
        }
      }
    )
  }
  // 2.2 更新列表数据
  list.value = contractSummary
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
