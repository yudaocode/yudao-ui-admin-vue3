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
      <el-table-column align="center" label="客户来源" min-width="200" prop="levelName" />
      <el-table-column align="center" label="客户个数" min-width="200" prop="customerCount" />
      <el-table-column align="center" label="成交个数" min-width="200" prop="dealCount" />
      <el-table-column align="center" label="级别占比(%)" min-width="200" prop="levelPortion" />
      <el-table-column align="center" label="成交占比(%)" min-width="200" prop="dealPortion" />
    </el-table>
  </el-card>
</template>
<script lang="ts" setup>
import {
  CrmStatisticCustomerLevelRespVO,
  StatisticsCustomerApi
} from '@/api/crm/statistics/customer'
import { EChartsOption } from 'echarts'

defineOptions({ name: 'CustomerSource' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

const loading = ref(false) // 加载中
const list = ref<CrmStatisticCustomerLevelRespVO[]>([]) // 列表的数据

/** 饼图配置 */
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
/** 饼图配置 */
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
  const levelList = await StatisticsCustomerApi.getCustomerLevel(props.queryParams)
  // 2.1 更新 Echarts 数据
  if (echartsOption.series && echartsOption.series[0] && echartsOption.series[0]['data']) {
    echartsOption.series[0]['data'] = levelList.map((r: CrmStatisticCustomerLevelRespVO) => {
      return {
        name: r.levelName,
        value: r.customerCount
      }
    })
  }
  // 2.2 更新 Echarts2 数据
  if (echartsOption2.series && echartsOption2.series[0] && echartsOption2.series[0]['data']) {
    echartsOption2.series[0]['data'] = levelList.map((r: CrmStatisticCustomerLevelRespVO) => {
      return {
        name: r.levelName,
        value: r.dealCount
      }
    })
  }
  list.value = levelList
  loading.value = false
}
defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
