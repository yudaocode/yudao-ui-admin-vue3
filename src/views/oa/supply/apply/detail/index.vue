<template>
  <ContentWrap>
    <el-descriptions v-loading="detailLoading" :column="2" border>
      <el-descriptions-item label="单据编号">{{ detailData.no }}</el-descriptions-item>
      <el-descriptions-item label="单据状态">
        <el-tag v-if="detailData.status === -1" type="info">未提交</el-tag>
        <DictTag
          v-else-if="detailData.status !== undefined"
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detailData.status"
        />
      </el-descriptions-item>
      <el-descriptions-item label="申请人">{{ detailData.creatorName }}</el-descriptions-item>
      <el-descriptions-item label="申请部门">{{ detailData.deptName }}</el-descriptions-item>
      <el-descriptions-item label="领用日期">
        {{ formatDate(detailData.applyTime, 'YYYY-MM-DD') }}
      </el-descriptions-item>
      <el-descriptions-item label="使用类型">
        <DictTag
          v-if="detailData.useType !== undefined"
          :type="DICT_TYPE.OA_SUPPLY_USE_TYPE"
          :value="detailData.useType"
        />
      </el-descriptions-item>
      <el-descriptions-item label="领取方式">
        <DictTag
          v-if="detailData.pickupMethod !== undefined"
          :type="DICT_TYPE.OA_SUPPLY_PICKUP_METHOD"
          :value="detailData.pickupMethod"
        />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="申请事由" :span="2">
        {{ detailData.reason }}
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ detailData.remark }}</el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <UploadFile :model-value="detailData.fileUrls || []" disabled :is-show-tip="false" />
      </el-descriptions-item>
    </el-descriptions>
    <!-- 领用明细 -->
    <div class="mb-3 mt-5 font-bold">领用明细</div>
    <el-table :data="detailData.items" border show-overflow-tooltip>
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="物品名称" prop="itemName" min-width="160" />
      <el-table-column label="规格型号" prop="model" min-width="120" />
      <el-table-column label="计量单位" prop="unit" width="90" align="center" />
      <el-table-column label="管理类型" width="110" align="center">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="row.manageType" />
        </template>
      </el-table-column>
      <el-table-column label="领用数量" prop="applyQuantity" width="140" />
    </el-table>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as SupplyApplyApi from '@/api/oa/supply/apply'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'OaSupplyApplyBusinessDetail' })

const props = defineProps<{ id?: number | string }>()
const route = useRoute() // 路由
const detailLoading = ref(false) // 详情加载中
const detailData = ref<SupplyApplyApi.SupplyApplyVO>({ items: [], fileUrls: [] }) // 申请详情

/** 获得申请详情 */
async function getInfo() {
  const id = props.id || route.query.id
  if (!id) return
  detailLoading.value = true
  try {
    detailData.value = await SupplyApplyApi.getSupplyApply(Number(id))
  } finally {
    detailLoading.value = false
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id || route.query.id,
  () => {
    getInfo()
  },
  { immediate: true }
)
</script>
