<template>
  <Dialog v-model="dialogVisible" title="选择出差申请单" width="1100px" append-to-body>
    <!-- 搜索 -->
    <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="68px">
      <el-form-item label="单据编号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入单据编号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="出差事由" prop="reason">
        <el-input
          v-model="queryParams.reason"
          placeholder="请输入出差事由"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="报销状态" prop="reimburseStatus">
        <el-select
          v-model="queryParams.reimburseStatus"
          placeholder="请选择报销状态"
          clearable
          class="!w-240px"
          @change="handleQuery"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.OA_REIMBURSE_STATUS)"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 列表：仅从本人已审批通过的申请中选择 -->
    <el-table
      v-loading="loading"
      :data="list"
      row-key="id"
      height="440px"
      highlight-current-row
      @row-click="handleSelect"
      @row-dblclick="handleConfirmRow"
    >
      <el-table-column width="55" align="center">
        <template #default="{ row }">
          <el-radio
            v-model="selectedId"
            :value="row.id"
            :aria-label="'选择 ' + row.no"
            @change="handleSelect(row)"
          >
            <span class="sr-only">选择</span>
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column label="单据编号" prop="no" width="180" />
      <el-table-column label="出差事由" prop="reason" min-width="220" show-overflow-tooltip />
      <el-table-column label="开始日期" width="180">
        <template #default="{ row }">{{ formatDate(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="结束日期" width="180">
        <template #default="{ row }">{{ formatDate(row.endTime) }}</template>
      </el-table-column>
      <el-table-column label="天数" prop="days" width="80" align="center" />
      <el-table-column label="报销状态" width="110" align="center">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_REIMBURSE_STATUS" :value="row.reimburseStatus" />
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
    <template #footer>
      <el-button type="primary" :disabled="loading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { TravelApplyVO } from '@/api/oa/travel/apply'
import * as TravelApi from '@/api/oa/travel/apply'
import { DICT_TYPE, getBoolDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'OaTravelApplySelect' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<TravelApplyVO[]>([]) // 当前页申请列表
const total = ref(0) // 总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: '',
  reason: '',
  reimburseStatus: undefined as boolean | undefined
}) // 查询参数
const queryFormRef = ref() // 搜索表单
const selectedId = ref<number>() // 选中申请编号
const selectedApply = ref<TravelApplyVO>() // 待确认的申请，取消不修改主表单

/** 打开弹窗 */
async function open(id?: number) {
  dialogVisible.value = true
  await nextTick()
  queryFormRef.value.resetFields()
  queryParams.pageNo = 1
  selectedId.value = id
  selectedApply.value = undefined
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询本人已通过的申请，按筛选结果分页 */
async function getList() {
  loading.value = true
  try {
    // 1. 查询可选申请，按单号、事由及报销状态筛选
    const applies: TravelApplyVO[] = await TravelApi.getApprovedTravelApplyList()
    const filteredList = applies.filter(
      (item) =>
        (!queryParams.no || (item.no || '').includes(queryParams.no)) &&
        (!queryParams.reason || (item.reason || '').includes(queryParams.reason)) &&
        (queryParams.reimburseStatus === undefined ||
          queryParams.reimburseStatus === null ||
          queryParams.reimburseStatus === item.reimburseStatus)
    )
    // 2. 回显原有选择，并按当前页截取列表
    selectedApply.value = applies.find((item) => item.id === selectedId.value)
    total.value = filteredList.length
    const start = (queryParams.pageNo - 1) * queryParams.pageSize
    list.value = filteredList.slice(start, start + queryParams.pageSize)
  } finally {
    loading.value = false
  }
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置搜索 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 选中申请 */
function handleSelect(row: TravelApplyVO) {
  selectedId.value = row.id
  selectedApply.value = row
}

/** 双击申请直接确认 */
function handleConfirmRow(row: TravelApplyVO) {
  handleSelect(row)
  submitForm()
}

const emit = defineEmits<{ select: [apply: TravelApplyVO] }>() // 确认选中的申请

/** 确认选择 */
function submitForm() {
  if (!selectedApply.value) {
    message.warning('请选择出差申请单')
    return
  }
  emit('select', selectedApply.value)
  dialogVisible.value = false
}
</script>
