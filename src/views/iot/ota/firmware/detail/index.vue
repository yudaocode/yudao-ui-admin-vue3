<template>
  <div class="app-container">
    <!-- 固件信息 -->
    <ContentWrap title="固件信息" class="mb-20px">
      <el-descriptions :column="3" v-loading="firmwareLoading" border>
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

    <!-- 升级设备统计 -->
    <ContentWrap title="升级设备统计" class="mb-20px">
      <el-row :gutter="20" class="py-20px" v-loading="firmwareStatisticsLoading">
        <el-col :span="6">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-blue-500">
              {{
                Object.values(firmwareStatistics).reduce((sum, count) => sum + (count || 0), 0) || 0
              }}
            </div>
            <div class="text-14px text-gray-600">升级设备总数</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-gray-400">
              {{ firmwareStatistics[IoTOtaTaskRecordStatusEnum.PENDING.value] || 0 }}
            </div>
            <div class="text-14px text-gray-600">待推送</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-blue-400">
              {{ firmwareStatistics[IoTOtaTaskRecordStatusEnum.PUSHED.value] || 0 }}
            </div>
            <div class="text-14px text-gray-600">已推送</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-yellow-500">
              {{ firmwareStatistics[IoTOtaTaskRecordStatusEnum.UPGRADING.value] || 0 }}
            </div>
            <div class="text-14px text-gray-600">正在升级</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-green-500">
              {{ firmwareStatistics[IoTOtaTaskRecordStatusEnum.SUCCESS.value] || 0 }}
            </div>
            <div class="text-14px text-gray-600">升级成功</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-red-500">
              {{ firmwareStatistics[IoTOtaTaskRecordStatusEnum.FAILURE.value] || 0 }}
            </div>
            <div class="text-14px text-gray-600">升级失败</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-gray-400">
              {{ firmwareStatistics[IoTOtaTaskRecordStatusEnum.CANCELED.value] || 0 }}
            </div>
            <div class="text-14px text-gray-600">升级取消</div>
          </div>
        </el-col>
      </el-row>
    </ContentWrap>

    <!-- 任务管理 -->
    <OtaTaskList
      :firmware-id="firmwareId"
      :product-id="firmware?.productId"
      @success="getStatistics"
    />
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

const route = useRoute() // 路由

const firmwareId = ref(Number(route.params.id)) // 固件编号
const firmwareLoading = ref(false) // 固件加载状态
const firmware = ref<IoTOtaFirmware>({} as IoTOtaFirmware) // 固件信息

const firmwareStatisticsLoading = ref(false) // 统计信息加载状态
const firmwareStatistics = ref<Record<string, number>>({}) // 统计信息

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
  firmwareStatisticsLoading.value = true
  try {
    firmwareStatistics.value = await IoTOtaTaskRecordApi.getOtaTaskRecordStatusStatistics(
      firmwareId.value
    )
  } finally {
    firmwareStatisticsLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getFirmwareInfo()
  getStatistics()
})
</script>
