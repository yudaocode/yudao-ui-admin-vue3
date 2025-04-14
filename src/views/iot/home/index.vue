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
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="产品数量"
        :value="statsData.productCount"
        :todayCount="statsData.productTodayCount"
        icon="ep:box"
        iconColor="text-orange-400"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="设备数量"
        :value="statsData.deviceCount"
        :todayCount="statsData.deviceTodayCount"
        icon="ep:cpu"
        iconColor="text-purple-400"
      />
    </el-col>
    <el-col :span="6">
      <ComparisonCard
        title="设备消息数"
        :value="statsData.deviceMessageCount"
        :todayCount="statsData.deviceMessageTodayCount"
        icon="ep:message"
        iconColor="text-teal-400"
      />
    </el-col>
  </el-row>

  <!-- 第二行：图表行 -->
  <el-row :gutter="16" class="mb-4">
    <el-col :span="12">
      <DeviceCountCard :statsData="statsData" />
    </el-col>
    <el-col :span="12">
      <DeviceStateCountCard :statsData="statsData" />
    </el-col>
  </el-row>

  <!-- 第三行：消息统计行 -->
  <el-row>
    <el-col :span="24">
      <MessageTrendCard 
        :messageStats="messageStats"
        @time-range-change="handleTimeRangeChange"
      />
    </el-col>
  </el-row>

  <!-- TODO 第四行：地图 -->
</template>

<script setup lang="ts" name="Index">
import {
  IotStatisticsDeviceMessageSummaryRespVO,
  IotStatisticsSummaryRespVO,
  ProductCategoryApi
} from '@/api/iot/statistics'
import { formatDate } from '@/utils/formatTime'
import ComparisonCard from './components/ComparisonCard.vue'
import DeviceCountCard from './components/DeviceCountCard.vue'
import DeviceStateCountCard from './components/DeviceStateCountCard.vue'
import MessageTrendCard from './components/MessageTrendCard.vue'

/** IoT 首页 */
defineOptions({ name: 'IoTHome' })

// TODO @super：使用下 Echart 组件，参考 yudao-ui-admin-vue3/src/views/mall/home/components/TradeTrendCard.vue 等

const timeRange = ref('7d') // 修改默认选择为近一周
const dateRange = ref<[Date, Date] | null>(null)

const queryParams = reactive({
  startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 设置默认开始时间为 7 天前
  endTime: Date.now() // 设置默认结束时间为当前时间
})


// 基础统计数据
// TODO @super：初始为 -1，然后界面展示先是加载中？试试用 cursor 改哈
const statsData = ref<IotStatisticsSummaryRespVO>({
  productCategoryCount: 0,
  productCount: 0,
  deviceCount: 0,
  deviceMessageCount: 0,
  productCategoryTodayCount: 0,
  productTodayCount: 0,
  deviceTodayCount: 0,
  deviceMessageTodayCount: 0,
  deviceOnlineCount: 0,
  deviceOfflineCount: 0,
  deviceInactiveCount: 0,
  productCategoryDeviceCounts: {}
})

// 消息统计数据
const messageStats = ref<IotStatisticsDeviceMessageSummaryRespVO>({
  upstreamCounts: {},
  downstreamCounts: {}
})

/** 处理时间范围变化 */
const handleTimeRangeChange = (params: { startTime: number; endTime: number }) => {
  queryParams.startTime = params.startTime
  queryParams.endTime = params.endTime
  getStats()
}

/** 获取统计数据 */
const getStats = async () => {
  // 获取基础统计数据
  statsData.value = await ProductCategoryApi.getIotStatisticsSummary()
  // 获取消息统计数据
  messageStats.value = await ProductCategoryApi.getIotStatisticsDeviceMessageSummary(queryParams)
}

/** 初始化 */
onMounted(() => {
  getStats()
})
</script>

<style lang="scss" scoped></style>
