<template>
  <ContentWrap>
    <!-- 还车信息 -->
    <el-descriptions v-loading="detailLoading" :column="2" border>
      <el-descriptions-item label="还车申请单号">{{ detailData.no }}</el-descriptions-item>
      <el-descriptions-item label="用车申请单号">{{ detailData.applyNo }}</el-descriptions-item>
      <el-descriptions-item label="车牌号">{{ detailData.vehicleNo }}</el-descriptions-item>
      <el-descriptions-item label="实际出车时间">
        {{ formatDate(detailData.actualStartTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="实际出车地点">
        {{ detailData.startLocation }}
      </el-descriptions-item>
      <el-descriptions-item label="用车事由">{{ detailData.reason }}</el-descriptions-item>
      <el-descriptions-item label="随行人">{{ detailData.passenger }}</el-descriptions-item>
      <el-descriptions-item label="实际回车时间">
        {{ formatDate(detailData.actualReturnTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="实际回车地点">
        {{ detailData.returnLocation }}
      </el-descriptions-item>
      <el-descriptions-item label="审批状态">
        <el-tag v-if="detailData.status === BpmProcessInstanceStatus.NOT_START" type="info">
          未提交
        </el-tag>
        <DictTag
          v-else-if="detailData.status !== undefined"
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detailData.status"
        />
      </el-descriptions-item>
      <el-descriptions-item label="还车说明" :span="2">
        {{ detailData.remark }}
      </el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <UploadFile :model-value="detailData.fileUrls || []" disabled :is-show-tip="false" />
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as VehicleReturnApi from '@/api/oa/vehicle/return'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaVehicleReturnBusinessDetail' })

const props = defineProps<{ id?: number | string }>()
const { query } = useRoute() // 查询参数
const detailLoading = ref(false) // 详情加载中
const detailData = ref<VehicleReturnApi.VehicleReturnVO>({ fileUrls: [] }) // 申请详情

/** 获得申请详情 */
async function getInfo() {
  const id = props.id || query.id
  if (!id) return
  detailLoading.value = true
  detailData.value = { fileUrls: [] }
  try {
    // 查询申请详情，BPM 通过业务编号传入 id
    detailData.value = await VehicleReturnApi.getVehicleReturn(Number(id))
  } finally {
    detailLoading.value = false
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id || query.id,
  () => {
    getInfo()
  },
  { immediate: true }
)
</script>
