<template>
  <div class="app-container">
    <!-- 固件信息 -->
    <ContentWrap title="固件信息" class="mb-20px">
      <el-descriptions :column="3" v-loading="firmwareLoading">
        <el-descriptions-item label="固件名称">
          {{ firmware?.name }}
        </el-descriptions-item>
        <el-descriptions-item label="所属产品">
          {{ firmware?.productName }}
        </el-descriptions-item>
        <el-descriptions-item label="固件版本">
          {{ firmware?.version }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ firmware?.createTime ? formatDate(firmware.createTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="固件描述" :span="2">
          {{ firmware?.description }}
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>

    <!-- 固件升级设备统计 -->
    <ContentWrap title="固件升级设备统计" class="mb-20px">
      <el-row :gutter="20" class="py-20px" v-loading="statisticsLoading">
        <el-col :span="6">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-blue-500">{{ statistics.total || 0 }}</div>
            <div class="text-14px text-gray-600">升级设备总数</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-gray-400">
              {{ statistics.pending || 0 }}
            </div>
            <div class="text-14px text-gray-600">待推送</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-blue-400">{{ statistics.pushed || 0 }}</div>
            <div class="text-14px text-gray-600">已推送</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-yellow-500">
              {{ statistics.inProgress || 0 }}
            </div>
            <div class="text-14px text-gray-600">正在升级</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-green-500">
              {{ statistics.success || 0 }}
            </div>
            <div class="text-14px text-gray-600">升级成功</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-red-500">{{ statistics.failed || 0 }}</div>
            <div class="text-14px text-gray-600">升级失败</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-gray-400">
              {{ statistics.cancelled || 0 }}
            </div>
            <div class="text-14px text-gray-600">升级取消</div>
          </div>
        </el-col>
      </el-row>
    </ContentWrap>

    <!-- 任务管理 -->
    <OtaTaskList ref="otaTaskListRef" :firmware-id="firmwareId" />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { IoTOtaFirmwareApi, IoTOtaFirmware } from '@/api/iot/ota/firmware'
import { IoTOtaTaskRecordApi } from '@/api/iot/ota/task/record'
import { IoTOtaTaskRecordStatusEnum } from '@/views/iot/utils/constants'
import OtaTaskList from '../../task/OtaTaskList.vue'

/** IoT OTA 固件详情 */
defineOptions({ name: 'IoTOtaFirmwareDetail' })

const route = useRoute()
const firmwareId = ref(Number(route.params.id))

// 固件信息
const firmwareLoading = ref(false)
const firmware = ref<IoTOtaFirmware>({} as IoTOtaFirmware)

// 统计信息
const statisticsLoading = ref(false)
const statistics = ref({
  total: 0,
  pending: 0,
  pushed: 0,
  inProgress: 0,
  success: 0,
  failed: 0,
  cancelled: 0
})

// 任务列表组件引用
const otaTaskListRef = ref()

/** 获取固件信息 */
const getFirmwareInfo = async () => {
  firmwareLoading.value = true
  try {
    firmware.value = await IoTOtaFirmwareApi.getOtaFirmware(firmwareId.value)
  } finally {
    firmwareLoading.value = false
  }
}

/** 获取升级统计 */
const getStatistics = async () => {
  statisticsLoading.value = true
  try {
    const data = await IoTOtaTaskRecordApi.getOtaTaskRecordStatusCount(firmwareId.value)
    statistics.value = {
      pending: data[IoTOtaTaskRecordStatusEnum.PENDING.value] || 0,
      pushed: data[IoTOtaTaskRecordStatusEnum.PUSHED.value] || 0,
      inProgress: data[IoTOtaTaskRecordStatusEnum.IN_PROGRESS.value] || 0,
      success: data[IoTOtaTaskRecordStatusEnum.SUCCESS.value] || 0,
      failed: data[IoTOtaTaskRecordStatusEnum.FAILED.value] || 0,
      cancelled: data[IoTOtaTaskRecordStatusEnum.CANCELLED.value] || 0,
      total: 0
    }
    // 计算总数
    statistics.value.total =
      statistics.value.pending +
      statistics.value.pushed +
      statistics.value.inProgress +
      statistics.value.success +
      statistics.value.failed +
      statistics.value.cancelled
  } finally {
    statisticsLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getFirmwareInfo()
  getStatistics()
})
</script>
