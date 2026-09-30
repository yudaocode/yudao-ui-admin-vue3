<template>
  <ContentWrap>
    <!-- 申请信息 -->
    <el-descriptions v-loading="detailLoading" :column="2" border>
      <el-descriptions-item label="申请单号">{{ detailData.no }}</el-descriptions-item>
      <el-descriptions-item label="车牌号">{{ detailData.vehicleNo }}</el-descriptions-item>
      <el-descriptions-item label="预计出车时间">
        {{ formatDate(detailData.startTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="预计回车时间">
        {{ formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="出车地点">{{ detailData.startLocation }}</el-descriptions-item>
      <el-descriptions-item label="预计回车地点">{{ detailData.endLocation }}</el-descriptions-item>
      <el-descriptions-item label="用车事由" :span="2">
        {{ detailData.reason }}
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
      <el-descriptions-item label="还车状态">
        {{ getDictLabel(DICT_TYPE.OA_VEHICLE_RETURN_STATUS, detailData.returnStatus) }}
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ detailData.remark }}</el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <UploadFile :model-value="detailData.fileUrls || []" disabled :is-show-tip="false" />
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as VehicleApplyApi from '@/api/oa/vehicle/apply'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaVehicleApplyBusinessDetail' })

const props = defineProps<{ id?: number | string }>()
const { query } = useRoute() // 查询参数
const detailLoading = ref(false) // 详情加载中
const detailData = ref<VehicleApplyApi.VehicleApplyVO>({ fileUrls: [] }) // 申请详情

/** 获得申请详情 */
async function getInfo() {
  const id = props.id || query.id
  if (!id) return
  detailLoading.value = true
  detailData.value = { fileUrls: [] }
  try {
    // 查询申请详情，BPM 通过业务编号传入 id
    detailData.value = await VehicleApplyApi.getVehicleApply(Number(id))
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
