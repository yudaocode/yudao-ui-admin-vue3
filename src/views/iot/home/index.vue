<template>
  <!-- 第一行：统计卡片行 -->
  <el-row :gutter="16" class="mb-4">
    <el-col :span="6">
      <ComparisonCard
        title="分类数量"
        :value="statsData.productCategoryCount"
        :todayCount="statsData.productCategoryTodayCount"
        icon="ep:menu"
        iconColor="text-blue-400"
        :loading="loading"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="产品数量"
        :value="statsData.productCount"
        :todayCount="statsData.productTodayCount"
        icon="ep:box"
        iconColor="text-orange-400"
        :loading="loading"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="设备数量"
        :value="statsData.deviceCount"
        :todayCount="statsData.deviceTodayCount"
        icon="ep:cpu"
        iconColor="text-purple-400"
        :loading="loading"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="设备消息数"
        :value="statsData.deviceMessageCount"
        :todayCount="statsData.deviceMessageTodayCount"
        icon="ep:message"
        iconColor="text-teal-400"
        :loading="loading"
      />
    </el-col>
  </el-row>

  <!-- 第二行：图表行 -->
  <el-row :gutter="16" class="mb-4">
    <el-col :span="12">
      <DeviceCountCard :statsData="statsData" :loading="loading" />
    </el-col>
    <el-col :span="12">
      <DeviceStateCountCard :statsData="statsData" :loading="loading" />
    </el-col>
  </el-row>

  <!-- 第三行：消息统计行 -->
  <el-row>
    <el-col :span="24">
      <MessageTrendCard />
    </el-col>
  </el-row>

  <!-- TODO 第四行：地图 -->
</template>

<script setup lang="ts" name="Index">
import { IotStatisticsSummaryRespVO, StatisticsApi } from '@/api/iot/statistics'
import ComparisonCard from './components/ComparisonCard.vue'
import DeviceCountCard from './components/DeviceCountCard.vue'
import DeviceStateCountCard from './components/DeviceStateCountCard.vue'
import MessageTrendCard from './components/MessageTrendCard.vue'

/** IoT 首页 */
defineOptions({ name: 'IoTHome' })

const statsData = ref<IotStatisticsSummaryRespVO>({
  productCategoryCount: -1,
  productCount: -1,
  deviceCount: -1,
  deviceMessageCount: -1,
  productCategoryTodayCount: -1,
  productTodayCount: -1,
  deviceTodayCount: -1,
  deviceMessageTodayCount: -1,
  deviceOnlineCount: -1,
  deviceOfflineCount: -1,
  deviceInactiveCount: -1,
  productCategoryDeviceCounts: {}
}) // 基础统计数据

const loading = ref(true) // 加载状态

/** 获取统计数据 */
const getStats = async () => {
  loading.value = true
  try {
    // 获取基础统计数据
    statsData.value = await StatisticsApi.getStatisticsSummary()
  } catch (error) {
    console.error('获取统计数据出错:', error)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getStats()
})
</script>
