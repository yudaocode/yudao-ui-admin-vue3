<template>
  <doc-alert title="【报表】财务报表" url="https://doc.iocoder.cn/fms/report/" />
  <!-- 工具栏 -->
  <ContentWrap>
    <el-form v-if="statementAdjustmentMode || adjustmentMode" class="-mb-15px" :inline="true">
      <el-form-item>
        <el-button
          v-if="adjustmentMode && fmsStore.isAccountSetWritable"
          v-hasPermi="['fms:report:cash-flow-statement:update']"
          type="primary"
          :loading="submitting"
          @click="saveAdjustment(true)"
        >
          下一步
        </el-button>
        <el-button
          v-if="adjustmentMode && fmsStore.isAccountSetWritable"
          v-hasPermi="['fms:report:cash-flow-statement:update']"
          :disabled="submitting"
          @click="clearAdjustment"
        >
          清空并重算
        </el-button>
        <el-button v-if="adjustmentMode" :disabled="submitting" @click="closeAdjustment">
          返回
        </el-button>
        <el-button
          v-if="statementAdjustmentMode && fmsStore.isAccountSetWritable"
          v-hasPermi="['fms:report:cash-flow-statement:update']"
          type="primary"
          :loading="submitting"
          @click="saveStatementAdjustment"
        >
          保存
        </el-button>
        <el-button
          v-if="statementAdjustmentMode && fmsStore.isAccountSetWritable"
          :disabled="submitting"
          @click="returnToAdjustment"
        >
          上一步
        </el-button>
        <el-button
          v-if="statementAdjustmentMode && fmsStore.isAccountSetWritable"
          v-hasPermi="['fms:report:cash-flow-statement:update']"
          :disabled="submitting"
          @click="clearStatementAdjustment"
        >
          清空并重算
        </el-button>
        <FmsReportPrintButton
          v-hasPermi="['fms:report:cash-flow-statement:print']"
          :disabled="!queryParams.endMonth || loading"
          :period-label="periodLabel"
          target="fms-cash-flow-statement-table"
          title="现金流量表"
        />
        <el-button
          v-hasPermi="['fms:report:cash-flow-statement:export']"
          :disabled="!queryParams.endMonth"
          :loading="exportLoading"
          type="success"
          plain
          @click="handleExport"
        >
          <Icon icon="ep:download" class="mr-5px" />
          导出
        </el-button>
      </el-form-item>
    </el-form>
    <FmsReportPeriodBar v-else @query="handleQuery">
      <FmsReportPrintButton
        v-hasPermi="['fms:report:cash-flow-statement:print']"
        :disabled="!queryParams.endMonth"
        :period-label="periodLabel"
        target="fms-cash-flow-statement-table"
        title="现金流量表"
      />
      <el-button
        v-hasPermi="['fms:report:cash-flow-statement:export']"
        :disabled="!queryParams.endMonth"
        :loading="exportLoading"
        type="success"
        plain
        @click="handleExport"
      >
        <Icon icon="ep:download" class="mr-5px" />
        导出
      </el-button>
      <el-button
        v-hasPermi="['fms:report:cash-flow-statement:update']"
        type="primary"
        @click="openAdjustment"
        v-if="fmsStore.isAccountSetWritable"
      >
        调整
      </el-button>
    </FmsReportPeriodBar>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <FmsReportCheckAlert
      v-if="!adjustmentMode && !statementAdjustmentMode"
      :result="checkResult"
      :report-type="FMS_REPORT_TYPE.CASH_FLOW_STATEMENT"
    />
    <el-alert
      v-if="adjustmentMode"
      class="!mb-16px"
      title="辅助数据用于现金流量表 EX 项取数；可编辑公式或直接调整本期、本年金额"
      type="info"
      show-icon
      :closable="false"
    />
    <el-alert
      v-if="statementAdjustmentMode"
      class="!mb-16px"
      title="可直接调整非行次公式项目；金额为 0 时重新按公式计算"
      type="warning"
      show-icon
      :closable="false"
    />
    <el-table
      id="fms-cash-flow-statement-table"
      v-loading="loading"
      :data="tableList"
      border
      height="calc(100vh - 240px)"
    >
      <el-table-column label="项目" min-width="480">
        <template #default="scope">
          <div :class="itemClass(scope.row)">
            <span>{{ scope.row.name }}</span>
            <el-tooltip v-if="adjustmentMode && scope.row.remark" :content="scope.row.remark">
              <Icon
                icon="ep:question-filled"
                class="ml-6px text-[var(--el-text-color-placeholder)]"
              />
            </el-tooltip>
            <el-button
              v-if="adjustmentMode && scope.row.editable && fmsStore.isAccountSetWritable"
              v-hasPermi="['fms:report:cash-flow-statement:update']"
              class="invisible ml-8px group-hover:visible"
              link
              type="primary"
              @click="openFormula(scope.row)"
            >
              <Icon icon="ep:edit" />
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="行次" width="90" align="center">
        <template #default="scope">{{ scope.row.rowNo || '' }}</template>
      </el-table-column>
      <el-table-column
        :label="adjustmentMode ? '本年数' : '本年累计金额'"
        min-width="180"
        align="right"
      >
        <template #default="scope">
          <el-input-number
            v-if="adjustmentMode && scope.row.editable"
            v-model="scope.row.yearAmount"
            :controls="false"
            :precision="2"
            class="w-full [&_.el-input__inner]:text-right"
            @change="recalculateAdjustmentLineItems"
          />
          <div v-else-if="statementAdjustmentMode && isAmountAdjustable(scope.row)">
            <el-input-number
              v-model="scope.row.yearAmount"
              :controls="false"
              :precision="2"
              class="w-full [&_.el-input__inner]:text-right"
            />
          </div>
          <span v-else>{{ formatMoney(scope.row.yearAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="adjustmentMode ? '本期数' : '本期金额'"
        min-width="180"
        align="right"
      >
        <template #default="scope">
          <el-input-number
            v-if="adjustmentMode && scope.row.editable"
            v-model="scope.row.currentAmount"
            :controls="false"
            :precision="2"
            class="w-full [&_.el-input__inner]:text-right"
            @change="recalculateAdjustmentLineItems"
          />
          <div v-else-if="statementAdjustmentMode && isAmountAdjustable(scope.row)">
            <el-input-number
              v-model="scope.row.currentAmount"
              :controls="false"
              :precision="2"
              class="w-full [&_.el-input__inner]:text-right"
            />
          </div>
          <span v-else>{{ formatMoney(scope.row.currentAmount) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div
      v-if="adjustmentMode"
      class="px-16px pt-12px text-right text-[var(--el-text-color-secondary)]"
    >
      共 {{ adjustmentList.length }} 条
    </div>
  </ContentWrap>

  <!-- 公式编辑弹窗 -->
  <FmsReportFormulaForm ref="formulaFormRef" @success="getAdjustmentList" />
</template>

<script lang="ts" setup>
import download from '@/utils/download'
import { FmsCashFlowStatementApi } from '@/api/fms/report/cashFlowStatement'
import type {
  FmsCashFlowAdjustmentVO,
  FmsCashFlowCheckVO
} from '@/api/fms/report/cashFlowStatement'
import type { FmsReportItemVO, FmsReportListReqVO } from '@/api/fms/report'
import FmsReportFormulaForm from '@/views/fms/report/components/FmsReportFormulaForm.vue'
import FmsReportCheckAlert from '@/views/fms/report/components/FmsReportCheckAlert.vue'
import FmsReportPeriodBar from '@/views/fms/report/components/FmsReportPeriodBar.vue'
import FmsReportPrintButton from '@/views/fms/report/components/FmsReportPrintButton.vue'
import { useFmsStore } from '@/views/fms/store/fms'
import { formatMoney } from '@/views/fms/utils/format'
import { FMS_REPORT_TYPE } from '@/views/fms/utils/constants'

defineOptions({ name: 'FmsCashFlowStatement' })

const message = useMessage()
const fmsStore = useFmsStore()
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 列表的加载中
const exportLoading = ref(false) // 导出的加载中
const submitting = ref(false) // 辅助数据保存的提交中
const adjustmentMode = ref(false) // 是否为辅助数据调整模式
const statementAdjustmentMode = ref(false) // 是否为现金流量表人工调整模式
const list = ref<FmsReportItemVO[]>([]) // 现金流量表的项目列表
const checkResult = ref<FmsCashFlowCheckVO>() // 检查结果
const adjustmentList = ref<FmsCashFlowAdjustmentVO[]>([]) // 现金流量辅助数据列表
const tableList = computed<Array<FmsReportItemVO | FmsCashFlowAdjustmentVO>>(() =>
  adjustmentMode.value ? adjustmentList.value : list.value
) // 表格数据：辅助数据调整模式展示辅助数据列表，否则展示项目列表
const periodLabel = ref('') // 会计期间文本，用于导出文件名
const formulaFormRef = ref<InstanceType<typeof FmsReportFormulaForm>>() // 公式编辑弹窗
const queryParams = reactive<FmsReportListReqVO>({
  accountSetId: 0,
  startMonth: '',
  endMonth: ''
})

watch(accountSetId, () => {
  adjustmentMode.value = false
  statementAdjustmentMode.value = false
  getList()
})

/** 工具栏查询 */
async function handleQuery(value: { startMonth: string; endMonth: string; label: string }) {
  periodLabel.value = value.label
  Object.assign(queryParams, value, { accountSetId: accountSetId.value })
  await getList()
}

/** 查询列表和检查结果 */
async function getList() {
  if (!accountSetId.value || !queryParams.endMonth) {
    list.value = []
    checkResult.value = undefined
    return
  }
  loading.value = true
  try {
    queryParams.accountSetId = accountSetId.value
    list.value = await FmsCashFlowStatementApi.getCashFlowStatement(queryParams)
    checkResult.value = await FmsCashFlowStatementApi.checkCashFlowStatement(queryParams)
  } finally {
    loading.value = false
  }
}

/** 导出 Excel */
async function handleExport() {
  exportLoading.value = true
  try {
    const data = await FmsCashFlowStatementApi.exportCashFlowStatement(queryParams)
    download.excel(data, `现金流量表-${periodLabel.value}.xls`)
  } finally {
    exportLoading.value = false
  }
}

/** 进入辅助数据调整模式 */
async function openAdjustment() {
  statementAdjustmentMode.value = false
  adjustmentMode.value = true
  await getAdjustmentList()
}

/** 保存现金流量表 */
async function saveStatementAdjustment() {
  const items = list.value.filter(isAmountAdjustable).map(({ id, currentAmount, yearAmount }) => ({
    id,
    currentAmount: Number(currentAmount || 0),
    yearAmount: Number(yearAmount || 0)
  }))
  if (!accountSetId.value || !items.length) return
  submitting.value = true
  try {
    await FmsCashFlowStatementApi.updateCashFlowStatement({ ...queryParams, items })
    message.success('保存成功')
    statementAdjustmentMode.value = false
    await getList()
  } finally {
    submitting.value = false
  }
}

/** 清空现金流量表金额，保存后重新按公式计算 */
function clearStatementAdjustment() {
  list.value.filter(isAmountAdjustable).forEach((item) => {
    item.currentAmount = 0
    item.yearAmount = 0
  })
}

/** 查询辅助数据列表 */
async function getAdjustmentList() {
  if (!accountSetId.value || !queryParams.endMonth) return
  loading.value = true
  try {
    queryParams.accountSetId = accountSetId.value
    adjustmentList.value = await FmsCashFlowStatementApi.getCashFlowAdjustmentList(queryParams)
  } finally {
    loading.value = false
  }
}

/** 保存辅助数据 */
async function saveAdjustment(next = false) {
  const items = adjustmentList.value
    .filter((item) => item.editable)
    .map((item) => ({
      id: item.id,
      currentAmount: Number(item.currentAmount || 0),
      yearAmount: Number(item.yearAmount || 0)
    }))
  if (!accountSetId.value || !items.length) return
  submitting.value = true
  try {
    await FmsCashFlowStatementApi.updateCashFlowAdjustment({
      accountSetId: accountSetId.value,
      items
    })
    message.success('保存成功')
    adjustmentMode.value = false
    statementAdjustmentMode.value = next
    await getList()
  } finally {
    submitting.value = false
  }
}

/** 清空辅助数据金额，保存后重新按科目公式计算 */
function clearAdjustment() {
  adjustmentList.value
    .filter((item) => item.editable)
    .forEach((item) => {
      item.currentAmount = 0
      item.yearAmount = 0
    })
  recalculateAdjustmentLineItems()
}

/** 根据当前辅助数据即时重算行次公式项目 */
function recalculateAdjustmentLineItems() {
  const lineMap = new Map(adjustmentList.value.map((item) => [item.rowNo, item]))
  adjustmentList.value.forEach((item) => {
    if (!item.formula?.includes('L')) return
    item.currentAmount = calculateAdjustmentLineAmount(item.formula, lineMap, 'currentAmount')
    item.yearAmount = calculateAdjustmentLineAmount(item.formula, lineMap, 'yearAmount')
    lineMap.set(item.rowNo, item)
  })
}

/** 按后端相同的 +/- L行次 语义计算辅助数据金额 */
function calculateAdjustmentLineAmount(
  formula: string,
  lineMap: Map<number, FmsCashFlowAdjustmentVO>,
  amountField: 'currentAmount' | 'yearAmount'
) {
  let expressions: unknown
  try {
    expressions = JSON.parse(formula)
  } catch {
    return 0
  }
  if (!Array.isArray(expressions) || typeof expressions[0] !== 'string') return 0
  let amount = 0
  for (const match of expressions[0].matchAll(/([+-]?)(L\d+)/g)) {
    const rowAmount = Number(lineMap.get(Number(match[2].slice(1)))?.[amountField] || 0)
    amount += match[1] === '-' ? -rowAmount : rowAmount
  }
  return Number(amount.toFixed(2))
}

/** 返回现金流量表 */
async function closeAdjustment() {
  adjustmentMode.value = false
  adjustmentList.value = []
  await getList()
}

/** 返回辅助数据调整 */
async function returnToAdjustment() {
  statementAdjustmentMode.value = false
  adjustmentMode.value = true
  await getAdjustmentList()
}

/** 是否允许直接修改现金流量表金额 */
function isAmountAdjustable(item: FmsReportItemVO) {
  return Boolean(item.rowNo && !item.formula?.includes('L'))
}

/** 打开公式编辑弹窗 */
function openFormula(item: FmsCashFlowAdjustmentVO) {
  formulaFormRef.value?.open(item, 'cash-flow')
}

/** 项目名称样式：按层级缩进，汇总项加粗；group 用于悬停显示公式编辑按钮 */
function itemClass(item: FmsReportItemVO | FmsCashFlowAdjustmentVO) {
  return [
    'group flex min-h-32px items-center',
    { 'pl-20px': item.level === 2, 'pl-40px': item.level === 3, 'font-600': !item.editable }
  ]
}
</script>
