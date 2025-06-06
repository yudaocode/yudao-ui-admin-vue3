<!-- 销售漏斗分析 -->
<template>
  <!-- Echarts图 -->
  <el-card shadow="never">
    <el-row>
      <el-col :span="24">
        <el-button-group class="mb-10px">
          <el-button type="primary" @click="handleActive(true)">客户视角</el-button>
          <el-button type="primary" @click="handleActive(false)">动态视角</el-button>
        </el-button-group>
        <el-skeleton :loading="loading" animated>
          <Echart :height="500" :options="echartsOption" />
        </el-skeleton>
      </el-col>
    </el-row>
  </el-card>

  <!-- 统计列表 -->
  <el-card class="mt-16px" shadow="never">
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="序号" type="index" width="80" />
      <el-table-column align="center" label="阶段" prop="endStatus" width="200">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.CRM_BUSINESS_END_STATUS_TYPE" :value="scope.row.endStatus" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="商机数" min-width="200" prop="businessCount" />
      <el-table-column align="center" label="商机总金额(元)" min-width="200" prop="totalPrice" />
    </el-table>
  </el-card>
</template>
<script lang="ts" setup>
import { CrmStatisticFunnelRespVO, StatisticFunnelApi } from '@/api/crm/statistics/funnel'
import { EChartsOption } from 'echarts'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'FunnelBusiness' })
const props = defineProps<{ queryParams: any }>() // 搜索参数

const active = ref(true)
const loading = ref(false) // 加载中
const list = ref<CrmStatisticFunnelRespVO[]>([]) // 列表的数据

/** 销售漏斗 */
const echartsOption = reactive<EChartsOption>({
  title: {
    text: '销售漏斗'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}'
  },
  toolbox: {
    feature: {
      dataView: { readOnly: false },
      restore: {},
      saveAsImage: {}
    }
  },
  legend: {
    data: ['客户', '商机', '赢单']
  },
  series: [
    {
      name: '销售漏斗',
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 60,
      width: '80%',
      min: 0,
      max: 100,
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside'
      },
      labelLine: {
        length: 10,
        lineStyle: {
          width: 1,
          type: 'solid'
        }
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      emphasis: {
        label: {
          fontSize: 20
        }
      },
      data: [
        { value: 60, name: '客户-0个' },
        { value: 40, name: '商机-0个' },
        { value: 20, name: '赢单-0个' }
      ]
    }
  ]
}) as EChartsOption

const handleActive = async (val: boolean) => {
  active.value = val
  await loadData()
}

/** 获取统计数据 */
const loadData = async () => {
  loading.value = true
  // 1. 加载漏斗数据
  const data = (await StatisticFunnelApi.getFunnelSummary(
    props.queryParams
  )) as CrmStatisticFunnelRespVO
  // 2.1 更新 Echarts 数据
  if (
    !!data &&
    echartsOption.series &&
    echartsOption.series[0] &&
    echartsOption.series[0]['data']
  ) {
    // tips：写死 value 值是为了保持漏斗顺序不变
    const list: { value: number; name: string }[] = []
    if (active.value) {
      list.push({ value: 60, name: `客户-${data.customerCount || 0}个` })
      list.push({ value: 40, name: `商机-${data.businessCount || 0}个` })
      list.push({ value: 20, name: `赢单-${data.businessWinCount || 0}个` })
    } else {
      list.push({ value: data.customerCount || 0, name: `客户-${data.customerCount || 0}个` })
      list.push({ value: data.businessCount || 0, name: `商机-${data.businessCount || 0}个` })
      list.push({ value: data.businessWinCount || 0, name: `赢单-${data.businessWinCount || 0}个` })
    }

    echartsOption.series[0]['data'] = list
  }
  // 2.2 获取商机结束状态统计
  list.value = await StatisticFunnelApi.getBusinessSummaryByEndStatus(props.queryParams)
  loading.value = false
}
defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>
