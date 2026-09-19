<template>
  <div v-loading="loading">
    <!-- 单据信息 -->
    <el-descriptions :column="3" border>
      <el-descriptions-item label="单据编号">{{ detail.no }}</el-descriptions-item>
      <el-descriptions-item label="申请人">{{ detail.creatorName }}</el-descriptions-item>
      <el-descriptions-item label="申请部门">{{ detail.deptName }}</el-descriptions-item>
      <el-descriptions-item label="单据状态">
        <el-tag v-if="detail.status === BpmProcessInstanceStatus.NOT_START" type="info">
          未提交
        </el-tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detail.status ?? ''"
        />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间" :span="2">
        {{ formatDate(detail.createTime) }}
      </el-descriptions-item>

      <el-descriptions-item label="出差事由" :span="3">{{ detail.reason }}</el-descriptions-item>
      <el-descriptions-item label="开始日期">
        {{ formatDate(detail.startTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="结束日期">
        {{ formatDate(detail.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="出差天数">{{ detail.days }}</el-descriptions-item>
      <el-descriptions-item label="同行人">{{ detail.companion }}</el-descriptions-item>
      <el-descriptions-item label="预计费用">{{ detail.estimatedPrice }}</el-descriptions-item>
      <el-descriptions-item label="报销状态">
        <DictTag :type="DICT_TYPE.OA_REIMBURSE_STATUS" :value="detail.reimburseStatus ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="3">{{ detail.remark }}</el-descriptions-item>
      <el-descriptions-item label="附件" :span="3">
        <UploadFile :model-value="detail.fileUrls || []" disabled :is-show-tip="false" />
      </el-descriptions-item>
    </el-descriptions>
    <!-- 行程明细 -->
    <div class="mb-12px mt-20px font-bold">行程明细</div>
    <el-table :data="detail.items" border>
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="出发城市" min-width="180">
        <template #default="{ row }">
          <AreaSelect :model-value="row.departureAreaId" disabled check-strictly class="!w-full" />
        </template>
      </el-table-column>
      <el-table-column label="到达城市" min-width="180">
        <template #default="{ row }">
          <AreaSelect :model-value="row.arrivalAreaId" disabled check-strictly class="!w-full" />
        </template>
      </el-table-column>
      <el-table-column label="开始日期" width="120">
        <template #default="{ row }">{{ formatDate(row.startTime, 'YYYY-MM-DD') }}</template>
      </el-table-column>
      <el-table-column label="结束日期" width="120">
        <template #default="{ row }">{{ formatDate(row.endTime, 'YYYY-MM-DD') }}</template>
      </el-table-column>
      <el-table-column label="交通方式" width="140">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_TRANSPORT_TYPE" :value="row.transportType ?? ''" />
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="180" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import * as TravelApi from '@/api/oa/travel/apply'
import AreaSelect from '@/views/system/area/components/AreaSelect.vue'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaTravelApplyDetail' })

const props = defineProps<{ id?: number | string }>() // 单据编号，列表弹窗与 BPM 业务表单共用
const loading = ref(false) // 详情加载中
const detail = ref<TravelApi.TravelApplyVO>({ items: [], fileUrls: [] }) // 出差申请信息

/** 查询详情 */
async function getInfo() {
  detail.value = { items: [], fileUrls: [] }
  if (!props.id) return
  loading.value = true
  try {
    detail.value = await TravelApi.getTravelApply(Number(props.id))
  } finally {
    loading.value = false
  }
}

/** 初始化及切换单据 */
watch(
  () => props.id,
  () => {
    getInfo()
  },
  { immediate: true }
)
</script>
