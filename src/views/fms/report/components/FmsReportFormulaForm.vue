<template>
  <Dialog v-model="dialogVisible" :title="`编辑公式——${currentItem?.name || ''}`" width="900px">
    <div v-loading="loading">
      <!-- 公式项编辑 -->
      <el-form class="-mb-15px" :inline="true">
        <el-form-item label="科目">
          <FmsSubjectSelect v-model="subjectId" :options="enabledSubjects" class="!w-240px" />
        </el-form-item>
        <el-form-item label="取数规则">
          <el-select v-model="rules" class="!w-120px">
            <el-option
              v-for="option in ruleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="运算符号">
          <el-radio-group v-model="operator">
            <el-radio value="+">+</el-radio>
            <el-radio value="-">-</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addFormula">添加</el-button>
        </el-form-item>
      </el-form>

      <!-- 公式项列表 -->
      <el-table
        :data="formulaList"
        border
        class="mt-8px"
        max-height="320"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column label="科目" min-width="240">
          <template #default="scope">
            {{ scope.row.subjectNumber }} {{ scope.row.subjectName }}
            <el-tag v-if="!scope.row.subjectId" class="ml-6px" size="small" type="danger">
              科目已失效
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="运算符号" prop="operator" width="90" align="center" />
        <el-table-column label="取数规则" width="150">
          <template #default="scope">{{ getRuleName(scope.row.rules) }}</template>
        </el-table-column>
        <el-table-column v-if="formulaType === 'balance'" label="期末数" align="right">
          <template #default="scope">{{ formatMoney(scope.row.closingAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="formulaType === 'balance'" label="年初数" align="right">
          <template #default="scope">{{ formatMoney(scope.row.openingAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="formulaType !== 'balance'" label="本期金额" align="right">
          <template #default="scope">{{ formatMoney(scope.row.currentAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="formulaType !== 'balance'" label="本年累计金额" align="right">
          <template #default="scope">{{ formatMoney(scope.row.yearAmount) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="scope">
            <el-button link type="danger" @click="removeFormula(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-alert
        class="!mt-16px"
        :title="
          formulaType === 'balance'
            ? '新公式将应用于当前报表和以后尚未生成的报表，不影响其他已生成的历史报表'
            : '新公式仅应用于当前报表，不影响其他期间报表'
        "
        type="warning"
        show-icon
        :closable="false"
      />
    </div>
    <template #footer>
      <el-button :disabled="loading" type="primary" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { TableColumnCtx } from 'element-plus'
import * as FmsSubjectApi from '@/api/fms/config/subject'
import type { FmsSubjectVO } from '@/api/fms/config/subject'
import { FmsBalanceSheetApi } from '@/api/fms/report/balanceSheet'
import { FmsCashFlowStatementApi } from '@/api/fms/report/cashFlowStatement'
import type { FmsCashFlowAdjustmentVO } from '@/api/fms/report/cashFlowStatement'
import { FmsIncomeStatementApi } from '@/api/fms/report/incomeStatement'
import type {
  FmsReportFormulaUpdateReqVO,
  FmsReportFormulaVO,
  FmsReportItemVO
} from '@/api/fms/report'
import FmsSubjectSelect from '@/views/fms/config/subject/components/FmsSubjectSelect.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { useFmsStore } from '@/views/fms/store/fms'
import { FMS_FORMULA_RULE, FMS_SUBJECT_STATUS } from '@/views/fms/utils/constants'
import { formatMoney } from '@/views/fms/utils/format'
import { treeToList } from '@/utils/tree'

defineOptions({ name: 'FmsReportFormulaForm' })

/** 公式编辑适用的报表类型 */
type FormulaType = 'balance' | 'income' | 'cash-flow'

interface SummaryMethodProps {
  columns: TableColumnCtx<FmsReportFormulaVO>[]
  data: FmsReportFormulaVO[]
}

const message = useMessage()
const fmsStore = useFmsStore()

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 弹窗的加载中
const formulaType = ref<FormulaType>('balance') // 当前报表类型
const currentItem = ref<FmsReportItemVO | FmsCashFlowAdjustmentVO>() // 当前编辑的报表项目
const subjects = ref<FmsSubjectVO[]>([]) // 账套下的平铺科目列表
const formulaList = ref<FmsReportFormulaVO[]>([]) // 编辑中的公式项列表
const subjectId = ref<number>() // 待添加的科目编号
const rules = ref<number>(FMS_FORMULA_RULE.BALANCE) // 待添加的取数规则
const operator = ref<'+' | '-'>('+') // 待添加的运算符
const balanceFormulaRuleOptions = getIntDictOptions(DICT_TYPE.FMS_FORMULA_RULE).filter((item) =>
  [FMS_FORMULA_RULE.BALANCE, FMS_FORMULA_RULE.DEBIT_BALANCE, FMS_FORMULA_RULE.CREDIT_BALANCE].some(
    (rule) => rule === item.value
  )
)
const incomeFormulaRuleOptions = getIntDictOptions(DICT_TYPE.FMS_FORMULA_RULE).filter((item) =>
  [
    FMS_FORMULA_RULE.DEBIT_AMOUNT,
    FMS_FORMULA_RULE.CREDIT_AMOUNT,
    FMS_FORMULA_RULE.PROFIT_LOSS_AMOUNT
  ].some((rule) => rule === item.value)
)

/** 启用状态的科目 */
const enabledSubjects = computed(() =>
  subjects.value.filter((subject) => subject.status === FMS_SUBJECT_STATUS.ENABLED)
)
/** 取数规则选项：资产负债表使用余额类规则，其他报表使用发生额类规则 */
const ruleOptions = computed(() =>
  formulaType.value === 'balance' ? balanceFormulaRuleOptions : incomeFormulaRuleOptions
)

/** 打开弹窗 */
async function open(item: FmsReportItemVO | FmsCashFlowAdjustmentVO, type: FormulaType) {
  const accountSetId = fmsStore.getAccountSetId
  if (!accountSetId) return
  dialogVisible.value = true
  loading.value = true
  formulaType.value = type
  currentItem.value = item
  subjectId.value = undefined
  operator.value = '+'
  rules.value = type === 'balance' ? FMS_FORMULA_RULE.BALANCE : FMS_FORMULA_RULE.DEBIT_AMOUNT
  formulaList.value = parseFormula(item.formula)
  try {
    subjects.value = treeToList(await FmsSubjectApi.getSubjectSimpleList(accountSetId))
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

const emit = defineEmits<{ success: [] }>()

/** 添加公式项 */
function addFormula() {
  const subject = subjects.value.find((item) => item.id === subjectId.value)
  if (!subject) {
    message.warning('请选择科目')
    return
  }
  if (formulaList.value.some((item) => item.subjectId === subject.id)) {
    message.warning('科目不能重复添加')
    return
  }
  formulaList.value.unshift({
    subjectId: subject.id,
    subjectName: subject.name,
    subjectNumber: subject.code,
    operator: operator.value,
    rules: rules.value,
    openingAmount: 0,
    closingAmount: 0,
    currentAmount: 0,
    yearAmount: 0
  })
  subjectId.value = undefined
}

/** 删除公式项 */
function removeFormula(index: number) {
  formulaList.value.splice(index, 1)
}

/** 提交保存 */
async function submitForm() {
  const accountSetId = fmsStore.getAccountSetId
  if (!accountSetId || !currentItem.value) return
  if (formulaList.value.some((item) => !item.subjectId)) {
    message.warning('公式中存在已失效科目，请删除后保存')
    return
  }
  loading.value = true
  try {
    const data: FmsReportFormulaUpdateReqVO = {
      accountSetId,
      id: currentItem.value.id,
      formulas: formulaList.value.map((item) => ({
        subjectId: item.subjectId as number,
        operator: item.operator,
        rules: item.rules
      }))
    }
    if (formulaType.value === 'balance') {
      await FmsBalanceSheetApi.updateBalanceSheetFormula(data)
    } else if (formulaType.value === 'income') {
      await FmsIncomeStatementApi.updateIncomeStatementFormula(data)
    } else {
      await FmsCashFlowStatementApi.updateCashFlowAdjustmentFormula(data)
    }
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

/** 解析报表项目的公式 JSON，无法解析时返回空列表 */
function parseFormula(formula: string): FmsReportFormulaVO[] {
  try {
    const values: unknown = JSON.parse(formula)
    if (!Array.isArray(values)) return []
    return values.filter(
      (item): item is FmsReportFormulaVO =>
        typeof item === 'object' && item !== null && 'subjectNumber' in item
    )
  } catch {
    return []
  }
}

/** 获得取数规则名称 */
function getRuleName(value: number) {
  return ruleOptions.value.find((item) => item.value === value)?.label || '-'
}

/** 表格合计行 */
function getSummaries({ columns, data }: SummaryMethodProps) {
  // 金额列固定在取数规则列之后：资产负债表为期末/年初数，其他报表为本期/本年累计金额
  const amountFields: (keyof FmsReportFormulaVO)[] =
    formulaType.value === 'balance'
      ? ['closingAmount', 'openingAmount']
      : ['currentAmount', 'yearAmount']
  return columns.map((_, index) => {
    if (index === 0) return '合计'
    const field = amountFields[index - 3]
    if (!field) return ''
    const total = data.reduce((result, item) => {
      const amount = Number(item[field] || 0)
      return result + (item.operator === '-' ? -amount : amount)
    }, 0)
    return formatMoney(total)
  })
}
</script>
