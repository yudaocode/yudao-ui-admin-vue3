<template>
  <div v-loading="detailLoading">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="标题" :span="2"> {{ detailData.title }} </el-descriptions-item>
      <el-descriptions-item label="紧急程度">
        <DictTag :type="DICT_TYPE.OA_APPLY_URGENCY" :value="detailData.urgency ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="证明人">
        <UserSelect :model-value="detailData.witnessUserId" disabled />
      </el-descriptions-item>
      <el-descriptions-item label="相关客户"> {{ detailData.customerName }} </el-descriptions-item>
      <el-descriptions-item label="报销方式">
        <DictTag
          :type="DICT_TYPE.OA_REIMBURSEMENT_PAYMENT_METHOD"
          :value="detailData.paymentMethod ?? ''"
        />
      </el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <UploadFile :model-value="detailData.fileUrls" disabled :is-show-tip="false" />
      </el-descriptions-item>
      <el-descriptions-item label="申请原因" :span="2">
        <span class="whitespace-pre-wrap break-words">{{ detailData.reason }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="申请人"> {{ detailData.creatorName }} </el-descriptions-item>
      <el-descriptions-item label="申请时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="审批状态">
        <el-tag v-if="detailData.status === BpmProcessInstanceStatus.NOT_START" type="info">
          未提交
        </el-tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detailData.status ?? ''"
        />
      </el-descriptions-item>
    </el-descriptions>
    <!-- 报销费用明细 -->
    <el-table :data="detailData.items" border class="mt-16px">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column
        label="费用发生时间"
        prop="expenseTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="费用类型" min-width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_EXPENSE_TYPE" :value="row.expenseType" />
        </template>
      </el-table-column>
      <el-table-column label="费用说明" prop="description" min-width="180" show-overflow-tooltip />
      <el-table-column label="票据张数" prop="invoiceCount" width="100" />
      <el-table-column label="报销金额" prop="price" width="120" />
    </el-table>
    <div class="mt-12px text-right">
      票据合计：{{ detailData.invoiceCount }} 张；金额合计：{{ detailData.totalPrice }} 元
    </div>
  </div>
</template>

<script setup lang="ts">
import * as ReimbursementApi from '@/api/oa/reimbursement'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate, dateFormatter } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaReimbursementDetail' })

const props = defineProps<{ id?: number | string }>() // 费用报销编号，BPM 通过业务编号传入
const route = useRoute() // 路由参数
const detailLoading = ref(false) // 详情的加载中
const detailData = ref<ReimbursementApi.ReimbursementVO>({ items: [], fileUrls: [] }) // 详情数据

/** 查询详情 */
async function getInfo() {
  const id = props.id || route.params.id || route.query.id
  if (!id) return
  detailLoading.value = true
  try {
    detailData.value = await ReimbursementApi.getReimbursement(Number(id))
  } finally {
    detailLoading.value = false
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id || route.params.id || route.query.id,
  () => {
    getInfo()
  },
  { immediate: true }
)
</script>
