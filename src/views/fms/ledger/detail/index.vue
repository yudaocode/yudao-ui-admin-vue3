<template>
  <doc-alert title="【账簿】账簿管理" url="https://doc.iocoder.cn/fms/ledger/" />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <FmsLedgerSearchBar
      :end-month="queryParams.endMonth"
      :export-loading="exportLoading"
      permission-prefix="fms:ledger:detail"
      print-target="fms-detail-ledger-table"
      print-title="明细账"
      :subjects="subjects"
      :show-subject="true"
      :auto-query="true"
      :start-month="queryParams.startMonth"
      :subject-id="queryParams.subjectId"
      @export="handleExport"
      @search="handleQuery"
    />
  </ContentWrap>

  <!-- 科目树和明细账列表 -->
  <ContentWrap>
    <div class="flex gap-16px">
      <div
        class="h-[calc(100vh-265px)] flex-[0_0_260px] overflow-auto border-r border-r-[var(--el-border-color-lighter)] border-r-solid pr-14px [&_.el-tree]:mt-12px"
      >
        <el-input v-model="subjectKeyword" clearable placeholder="搜索科目" prefix-icon="Search" />
        <el-tree
          ref="subjectTreeRef"
          :data="subjects"
          :filter-node-method="filterSubject"
          :props="{ label: getSubjectLabel, children: 'children' }"
          :current-node-key="queryParams.subjectId"
          node-key="id"
          highlight-current
          @node-click="handleSubjectClick"
        />
      </div>
      <el-table
        id="fms-detail-ledger-table"
        v-loading="loading"
        :data="list"
        :row-class-name="getRowClassName"
        border
        stripe
        height="calc(100vh - 265px)"
        class="flex-1"
      >
        <el-table-column align="center" label="日期" prop="accountDate" width="110" />
        <el-table-column align="center" label="凭证字号" width="110">
          <template #default="scope">
            <el-button
              v-if="scope.row.voucherId"
              v-hasPermi="['fms:voucher:query']"
              link
              type="primary"
              @click="openVoucher(scope.row)"
            >
              {{ scope.row.voucherNumber }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="摘要" min-width="180" prop="digest" />
        <el-table-column align="right" label="借方" width="140">
          <template #default="scope">{{ formatMoney(scope.row.debitAmount) }}</template>
        </el-table-column>
        <el-table-column align="right" label="贷方" width="140">
          <template #default="scope">{{ formatMoney(scope.row.creditAmount) }}</template>
        </el-table-column>
        <el-table-column align="center" label="方向" prop="balanceDirection" width="80" />
        <el-table-column align="right" label="余额" width="150">
          <template #default="scope">{{ formatMoney(scope.row.balance) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { ElTree } from 'element-plus'
import download from '@/utils/download'
import { formatDate } from '@/utils/formatTime'
import { FmsLedgerApi } from '@/api/fms/ledger'
import type { FmsLedgerDetailVO, FmsLedgerListReqVO } from '@/api/fms/ledger/types'
import * as FmsSubjectApi from '@/api/fms/config/subject'
import type { FmsSubjectVO } from '@/api/fms/config/subject'
import { handleTree, treeToList } from '@/utils/tree'
import FmsLedgerSearchBar from '@/views/fms/ledger/components/FmsLedgerSearchBar.vue'
import { useFmsStore } from '@/views/fms/store/fms'
import { buildPeriodFilename, formatMoney } from '@/views/fms/utils/format'

defineOptions({ name: 'FmsDetailLedger' })

const router = useRouter()
const route = useRoute()
const fmsStore = useFmsStore()
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 列表的加载中
const list = ref<FmsLedgerDetailVO[]>([]) // 明细账列表
const subjects = ref<FmsSubjectVO[]>([]) // 会计科目树
const subjectKeyword = ref('') // 科目搜索关键字
const subjectTreeRef = ref<InstanceType<typeof ElTree>>() // 科目树 Ref
const currentMonth = formatDate(new Date(), 'YYYY-MM') // 当前月份
const queryParams = reactive<FmsLedgerListReqVO>({
  accountSetId: 0,
  startMonth: currentMonth,
  endMonth: currentMonth
})

watch(accountSetId, () => init())
watch(subjectKeyword, (value) => subjectTreeRef.value?.filter(value))

/** 初始化明细账页面 */
async function init() {
  if (!accountSetId.value) {
    subjects.value = []
    list.value = []
    return
  }
  queryParams.accountSetId = accountSetId.value
  const accountingMonth = await fmsStore.loadCurrentMonth()
  queryParams.startMonth = String(route.query.startMonth || accountingMonth || currentMonth)
  queryParams.endMonth = String(route.query.endMonth || accountingMonth || currentMonth)
  queryParams.subjectId = parseId(route.query.subjectId) || 0
  await loadSubjectTree()
  await getList()
}

/** 按查询期间加载有发生额的科目树，并保留当前科目选择 */
async function loadSubjectTree() {
  if (!accountSetId.value) {
    subjects.value = []
    return
  }
  const subjectList = await FmsSubjectApi.getDetailSubjectList({
    accountSetId: accountSetId.value,
    startMonth: queryParams.startMonth,
    endMonth: queryParams.endMonth
  })
  subjects.value = handleTree(subjectList)
  const subjectIds = treeToList<FmsSubjectVO[]>(subjects.value).map((subject) => subject.id)
  if (!queryParams.subjectId || !subjectIds.includes(queryParams.subjectId)) {
    queryParams.subjectId = subjectIds[0] || 0
  }
  await nextTick()
  subjectTreeRef.value?.setCurrentKey(queryParams.subjectId)
}

/** 查询明细账列表 */
async function getList() {
  if (!accountSetId.value || !queryParams.subjectId) return
  loading.value = true
  try {
    list.value = await FmsLedgerApi.getDetailList(queryParams)
  } finally {
    loading.value = false
  }
}

/** 处理查询条件变化 */
async function handleQuery(value: Omit<FmsLedgerListReqVO, 'accountSetId'>) {
  const periodChanged =
    value.startMonth !== queryParams.startMonth || value.endMonth !== queryParams.endMonth
  Object.assign(queryParams, value, { accountSetId: accountSetId.value })
  if (periodChanged) {
    await loadSubjectTree()
  }
  if (queryParams.subjectId) {
    subjectTreeRef.value?.setCurrentKey(queryParams.subjectId)
  }
  await getList()
}

/** 处理科目树点击 */
function handleSubjectClick(subject: FmsSubjectVO) {
  queryParams.subjectId = subject.id
  getList()
}

/** 按编码或名称过滤科目 */
function filterSubject(value: string, data: FmsSubjectVO) {
  if (!value) return true
  return `${data.code} ${data.name}`.toLowerCase().includes(value.toLowerCase())
}

/** 获得科目展示文本 */
function getSubjectLabel(subject: FmsSubjectVO) {
  return `${subject.code} ${subject.name}`
}

/** 获得汇总行样式类名 */
function getRowClassName({ row }: { row: FmsLedgerDetailVO }) {
  return row.rowType === 2 ? '' : '[--el-table-tr-bg-color:var(--el-fill-color-light)] font-600'
}

/** 打开凭证详情 */
function openVoucher(row: FmsLedgerDetailVO) {
  router.push({ path: '/fms/voucher/create', query: { id: row.voucherId } })
}

/** 导出明细账 */
const exportLoading = ref(false) // 导出的加载中
async function handleExport() {
  exportLoading.value = true
  try {
    const data = await FmsLedgerApi.exportDetail(queryParams)
    download.excel(
      data,
      buildPeriodFilename('明细账', queryParams.startMonth, queryParams.endMonth)
    )
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  init()
})
</script>
