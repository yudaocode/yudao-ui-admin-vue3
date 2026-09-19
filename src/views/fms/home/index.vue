<template>
  <doc-alert title="FMS 手册（功能开启）" url="https://doc.iocoder.cn/fms/build/" />

  <div class="flex flex-col gap-16px">
    <FmsHomeShortcuts />
    <ContentWrap v-loading="loading">
      <FmsHomeMetricCards
        :home="home"
        :selected-metric-key="selectedMetricKey"
        @select="selectMetric"
      />
      <FmsHomeMetricCharts
        class="mt-28px"
        :home="home"
        :metric-detail="metricDetail"
        :selected-metric-key="selectedMetricKey"
        :loading="metricLoading"
      />
    </ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import { FmsHomeApi } from '@/api/fms/home'
import type { FmsHomeMetricDetailVO, FmsHomeMetricVO, FmsHomeVO } from '@/api/fms/home'
import { useFmsStore } from '@/views/fms/store/fms'
import FmsHomeMetricCards from './components/FmsHomeMetricCards.vue'
import FmsHomeMetricCharts from './components/FmsHomeMetricCharts.vue'
import FmsHomeShortcuts from './components/FmsHomeShortcuts.vue'

defineOptions({ name: 'FmsHome' })

const fmsStore = useFmsStore() // FMS Store

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 首页加载状态
const metricLoading = ref(false) // 指标明细加载状态
const home = ref<FmsHomeVO>() // 首页数据
const metricDetail = ref<FmsHomeMetricDetailVO>() // 指标明细
const selectedMetricKey = ref<string>() // 选中的指标标识
let metricRequestSequence = 0 // 指标明细请求序号

watch(accountSetId, init, { immediate: true })

/** 初始化首页 */
async function init() {
  metricRequestSequence++
  home.value = undefined
  metricLoading.value = false
  selectedMetricKey.value = undefined
  metricDetail.value = undefined
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) {
    loading.value = false
    return
  }
  await getHome(currentAccountSetId)
}

/** 加载首页数据 */
async function getHome(currentAccountSetId: number) {
  loading.value = true
  try {
    const result = await FmsHomeApi.getHome(currentAccountSetId)
    if (accountSetId.value === currentAccountSetId) {
      home.value = result
      const firstMetric = result.metrics[0]
      if (firstMetric) await selectMetric(firstMetric)
    }
  } finally {
    if (accountSetId.value === currentAccountSetId) {
      loading.value = false
    }
  }
}

/** 选择财务指标 */
async function selectMetric(metric: FmsHomeMetricVO) {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) return
  const requestSequence = ++metricRequestSequence
  selectedMetricKey.value = metric.key
  metricDetail.value = undefined
  metricLoading.value = true
  try {
    const result = await FmsHomeApi.getHomeMetricDetail(currentAccountSetId, metric.key)
    if (requestSequence === metricRequestSequence) {
      metricDetail.value = result
    }
  } finally {
    if (requestSequence === metricRequestSequence) {
      metricLoading.value = false
    }
  }
}
</script>
