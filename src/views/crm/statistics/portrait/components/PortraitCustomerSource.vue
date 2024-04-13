<!-- 客户来源分析 -->
<template>
  <!-- Echarts图 -->
  <el-card shadow="never">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-skeleton :loading="loading" animated>
          <Echart :height="500" :options="echartsOption" />
        </el-skeleton>
      </el-col>
      <el-col :span="12">
        <el-skeleton :loading="loading" animated>
          <Echart :height="500" :options="echartsOption2" />
        </el-skeleton>
      </el-col>
    </el-row>
  </el-card>

  <!-- 统计列表 -->
  <el-card class="mt-16px" shadow="never">
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="序号" type="index" width="80" />
      <el-table-column align="center" label="客户来源" prop="source" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="scope.row.source" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="客户个数" min-width="200" prop="customerCount" />
      <el-table-column align="center" label="成交个数" min-width="200" prop="dealCount" />
      <el-table-column align="center" label="来源占比(%)" min-width="200" prop="sourcePortion" />
      <el-table-column align="center" label="成交占比(%)" min-width="200" prop="dealPortion" />
    </el-table>
  </el-card>
</template>
<script lang="ts" setup>
import {
  CrmStatisticCustomerSourceRespVO,
  StatisticsPortraitApi
} from '@/api/crm/statistics/portrait'
import { EChartsOption } from 'echarts'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { erpCalculatePercentage, getSumValue } from '@/utils'

defineOptions({ name: 'PortraitCustomerSource' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticCustomerSourceRespVO[]>([]) // 列表的数据

/** 饼图配置（全部客户） */
const echartsOption = reactive<EChartsOption>({
  title: {
    text: '全部客户',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  toolbox: {
    feature: {
      saveAsImage: { show: true, name: '全部客户' } // 保存为图片
    }
  },
  series: [
    {
      name: '全部客户',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 40,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }
  ]
}) as EChartsOption

/** 饼图配置（成交客户） */
const echartsOption2 = reactive<EChartsOption>({
  title: {
    text: '成交客户',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  toolbox: {
    feature: {
      saveAsImage: { show: true, name: '成交客户' } // 保存为图片
    }
  },
  series: [
    {
      name: '成交客户',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 40,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }
  ]
}) as EChartsOption

/** 获取统计数据 */
const loadData = async () => {
  // 1. 加载统计数据
  loading.value = true
  const sourceList = await StatisticsPortraitApi.getCustomerSource(props.queryParams)
  // 2.1 更新 Echarts 数据
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = sourceList.map((r: CrmStatisticCustomerSourceRespVO) => {
      return {
        name: getDictLabel(DICT_TYPE.CRM_CUSTOMER_SOURCE, r.source),
        value: r.customerCount
      }
    })
  }
  // 2.2 更新 Echarts2 数据
  if (echartsOption2.series && echartsOption2.series[0] && echartsOption2.series[0]['data']) {
    echartsOption2.series[0]['data'] = sourceList.map((r: CrmStatisticCustomerSourceRespVO) => {
      return {
        name: getDictLabel(DICT_TYPE.CRM_CUSTOMER_SOURCE, r.source),
        value: r.dealCount
      }
    })
  }
  // 3. 计算比例
  calculateProportion(sourceList)
  list.value = sourceList
  loading.value = false
}
defineExpose({ loadData })

/** 计算比例 */
const calculateProportion = (sourceList: CrmStatisticCustomerSourceRespVO[]) => {
  if (isEmpty(sourceList)) {
    return
  }
  // 这里类型丢失了所以重新搞个变量
  const list = sourceList as unknown as CrmStatisticCustomerSourceRespVO[]
  const sumCustomerCount = getSumValue(list.map((item) => item.customerCount))
  const sumDealCount = getSumValue(list.map((item) => item.dealCount))
  list.forEach((item) => {
    item.sourcePortion =
      item.customerCount === 0 ? 0 : erpCalculatePercentage(item.customerCount, sumCustomerCount)
    item.dealPortion =
      item.dealCount === 0 ? 0 : erpCalculatePercentage(item.dealCount, sumDealCount)
  })
}

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
