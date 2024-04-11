<!-- 客户城市分布 -->
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
</template>
<script lang="ts" setup>
import { EChartsOption } from 'echarts'
import china from '@/assets/map/json/china.json'
import echarts from '@/plugins/echarts'
import {
  CrmStatisticCustomerAreaRespVO,
  StatisticsPortraitApi
} from '@/api/crm/statistics/portrait'

defineOptions({ name: 'CustomerArea' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

// 注册地图
echarts?.registerMap('china', china as any)

const loading = ref(false) // 加载中
const areaStatisticsList = ref<CrmStatisticCustomerAreaRespVO[]>([]) // 列表的数据

/** 地图配置（全部客户） */
const echartsOption = reactive<EChartsOption>({
  title: {
    text: '全部客户',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    showDelay: 0,
    transitionDuration: 0.2
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
      name: '客户地域分布',
      type: 'map',
      map: 'china',
      roam: false,
      selectedMode: false,
      data: []
    }
  ]
}) as EChartsOption

/** 地图配置（成交客户） */
const echartsOption2 = reactive<EChartsOption>({
  title: {
    text: '成交客户',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    showDelay: 0,
    transitionDuration: 0.2
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
      name: '客户地域分布',
      type: 'map',
      map: 'china',
      roam: false,
      selectedMode: false,
      data: []
    }
  ]
}) as EChartsOption

/** 获取统计数据 */
const loadData = async () => {
  // 1. 加载统计数据
  loading.value = true
  const areaList = await StatisticsPortraitApi.getCustomerArea(props.queryParams)
  areaStatisticsList.value = areaList.map((item: CrmStatisticCustomerAreaRespVO) => {
    return {
      ...item,
      areaName: item.areaName // TODO @puhui999：这里最好注释下原因哈, 🤣 我从 mall copy 过来的
      // .replace('维吾尔自治区', '')
      // .replace('壮族自治区', '')
      // .replace('回族自治区', '')
      // .replace('自治区', '')
      // .replace('省', '')
    }
  })
  buildLeftMap()
  buildRightMap()
  loading.value = false
}
defineExpose({ loadData })

const buildLeftMap = () => {
  let min = 0
  let max = 0
  echartsOption.series![0].data = areaStatisticsList.value.map((item) => {
    min = Math.min(min, item.customerCount || 0)
    max = Math.max(max, item.customerCount || 0)
    return { ...item, name: item.areaName, value: item.customerCount || 0 }
  })
  echartsOption.visualMap!['min'] = min
  echartsOption.visualMap!['max'] = max
}

const buildRightMap = () => {
  let min = 0
  let max = 0
  echartsOption2.series![0].data = areaStatisticsList.value.map((item) => {
    min = Math.min(min, item.dealCount || 0)
    max = Math.max(max, item.dealCount || 0)
    return { ...item, name: item.areaName, value: item.dealCount || 0 }
  })
  echartsOption2.visualMap!['min'] = min
  echartsOption2.visualMap!['max'] = max
}

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
