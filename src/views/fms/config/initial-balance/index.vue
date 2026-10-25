<template>
  <doc-alert
    title="【设置】币别、科目、辅助核算、初始余额"
    url="https://doc.iocoder.cn/fms/config/accounting/"
  />
  <ContentWrap>
    <el-form class="-mb-15px" :inline="true" label-width="68px">
      <el-form-item label="科目类别">
        <el-select v-model="subjectType" class="!w-240px" @change="changeSubjectType">
          <el-option
            v-for="item in subjectTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          v-if="editable && fmsStore.isAccountSetWritable"
          type="primary"
          :loading="saving"
          @click="handleSave"
          v-hasPermi="['fms:config:initial-balance:update']"
        >
          保存
        </el-button>
        <el-button
          type="primary"
          plain
          @click="openTrialBalance"
          v-hasPermi="['fms:config:initial-balance:query']"
        >
          试算平衡
        </el-button>
        <el-button
          v-if="editable && fmsStore.isAccountSetWritable"
          type="warning"
          plain
          @click="openImportForm"
          v-hasPermi="['fms:config:initial-balance:import']"
        >
          <Icon icon="ep:upload" class="mr-5px" /> 导入
        </el-button>
        <el-button
          type="success"
          plain
          :loading="exportLoading"
          @click="handleExport"
          v-hasPermi="['fms:config:initial-balance:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-alert
      v-if="isJanuary"
      class="mb-16px"
      :closable="false"
      show-icon
      title="账套从一月启用，只需录入期初余额"
      type="info"
    />
    <el-alert
      v-if="accountStartTime && !editable"
      class="mb-16px"
      :closable="false"
      show-icon
      title="账套已结账，初始余额不可修改"
      type="warning"
    />
    <el-alert
      v-if="edited"
      class="mb-16px"
      :closable="false"
      show-icon
      title="当前修改尚未保存，切换科目类别或离开页面前请先保存"
      type="warning"
    />

    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column fixed="left" label="科目编码" min-width="140">
        <template #default="scope">
          <span :class="{ 'assist-row-text': scope.row.isAssist }">
            {{ scope.row.subjectCode }}
          </span>
        </template>
      </el-table-column>
      <el-table-column fixed="left" label="科目名称" min-width="240">
        <template #default="scope">
          <span
            :class="{ 'assist-row-text': scope.row.isAssist }"
            :style="{ paddingLeft: `${(scope.row.level - 1) * 14}px` }"
          >
            {{ getRowName(scope.row) }}
          </span>
          <el-button
            v-if="canAddAssist(scope.row)"
            class="ml-8px"
            link
            type="primary"
            @click="openAssistForm(scope.row)"
          >
            <Icon icon="ep:plus" /> 添加明细
          </el-button>
          <el-button
            v-if="scope.row.isAssist && editable && fmsStore.isAccountSetWritable"
            class="ml-8px"
            link
            type="danger"
            @click="removeAssist(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="left" label="方向" width="72">
        <template #default="scope">
          {{ scope.row.balanceDirection === FMS_DEBIT_CREDIT_DIRECTION.DEBIT ? '借' : '贷' }}
        </template>
      </el-table-column>

      <el-table-column label="期初余额" align="center">
        <el-table-column align="right" label="数量" min-width="135">
          <template #default="scope">
            <AmountInput
              v-if="canEdit(scope.row) && scope.row.quantityAccounting"
              v-model="scope.row.openingQuantity"
              :precision="4"
              @change="handleAmountChange(scope.row)"
            />
            <span v-else>
              {{ formatQuantity(scope.row.openingQuantity, scope.row.quantityAccounting) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column align="right" label="金额" min-width="145">
          <template #default="scope">
            <AmountInput
              v-if="canEdit(scope.row)"
              v-model="scope.row.openingAmount"
              @change="handleAmountChange(scope.row)"
            />
            <span v-else>{{ formatAmount(scope.row.openingAmount) }}</span>
          </template>
        </el-table-column>
      </el-table-column>

      <template v-if="!isJanuary">
        <el-table-column label="本年累计借方" align="center">
          <el-table-column align="right" label="数量" min-width="135">
            <template #default="scope">
              <AmountInput
                v-if="canEdit(scope.row) && scope.row.quantityAccounting"
                v-model="scope.row.yearDebitQuantity"
                :precision="4"
                @change="handleAmountChange(scope.row)"
              />
              <span v-else>
                {{ formatQuantity(scope.row.yearDebitQuantity, scope.row.quantityAccounting) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column align="right" label="金额" min-width="145">
            <template #default="scope">
              <AmountInput
                v-if="canEdit(scope.row)"
                v-model="scope.row.yearDebitAmount"
                @change="handleAmountChange(scope.row)"
              />
              <span v-else>{{ formatAmount(scope.row.yearDebitAmount) }}</span>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="本年累计贷方" align="center">
          <el-table-column align="right" label="数量" min-width="135">
            <template #default="scope">
              <AmountInput
                v-if="canEdit(scope.row) && scope.row.quantityAccounting"
                v-model="scope.row.yearCreditQuantity"
                :precision="4"
                @change="handleAmountChange(scope.row)"
              />
              <span v-else>
                {{ formatQuantity(scope.row.yearCreditQuantity, scope.row.quantityAccounting) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column align="right" label="金额" min-width="145">
            <template #default="scope">
              <AmountInput
                v-if="canEdit(scope.row)"
                v-model="scope.row.yearCreditAmount"
                @change="handleAmountChange(scope.row)"
              />
              <span v-else>{{ formatAmount(scope.row.yearCreditAmount) }}</span>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="年初余额" align="center">
          <el-table-column align="right" label="数量" min-width="135">
            <template #default="scope">
              {{ formatQuantity(scope.row.yearOpeningQuantity, scope.row.quantityAccounting) }}
            </template>
          </el-table-column>
          <el-table-column align="right" label="金额" min-width="145">
            <template #default="scope">{{ formatAmount(scope.row.yearOpeningAmount) }}</template>
          </el-table-column>
        </el-table-column>
        <el-table-column
          v-if="subjectType === FMS_SUBJECT_TYPE.PROFIT_LOSS"
          align="center"
          label="实际损益发生额"
        >
          <el-table-column align="right" label="数量" min-width="135">
            <template #default="scope">
              <AmountInput
                v-if="canEdit(scope.row) && scope.row.quantityAccounting"
                v-model="scope.row.profitLossQuantity"
                :precision="4"
                @change="handleProfitLossAmountChange"
              />
              <span v-else>
                {{ formatQuantity(scope.row.profitLossQuantity, scope.row.quantityAccounting) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column align="right" label="金额" min-width="145">
            <template #default="scope">
              <AmountInput
                v-if="canEdit(scope.row)"
                v-model="scope.row.profitLossAmount"
                @change="handleProfitLossAmountChange"
              />
              <span v-else>{{ formatAmount(scope.row.profitLossAmount) }}</span>
            </template>
          </el-table-column>
        </el-table-column>
      </template>
    </el-table>
  </ContentWrap>

  <!-- 添加明细、导入和试算平衡弹窗 -->
  <FmsInitialAssistForm ref="assistFormRef" @success="addAssist" />
  <FmsInitialBalanceImportForm ref="importFormRef" @success="loadPage" />
  <FmsTrialBalanceDialog ref="trialBalanceRef" />
</template>

<script lang="ts" setup>
import { FmsAccountSetApi } from '@/api/fms/config/account-set'
import type { FmsAuxiliaryItemOptionVO } from '@/api/fms/config/auxiliary/item'
import { FmsInitialBalanceApi } from '@/api/fms/config/initial-balance'
import type {
  FmsInitialBalanceAmountsVO,
  FmsInitialBalanceAssistVO,
  FmsInitialBalanceAuxiliaryItemVO,
  FmsInitialBalanceUpdateVO,
  FmsInitialBalanceVO
} from '@/api/fms/config/initial-balance'
import { useFmsStore } from '@/views/fms/store/fms'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { FMS_DEBIT_CREDIT_DIRECTION, FMS_SUBJECT_TYPE } from '@/views/fms/utils/constants'
import { formatAmount, formatQuantity } from '@/views/fms/utils/format'
import dayjs from 'dayjs'
import { ElInputNumber } from 'element-plus'
import FmsInitialAssistForm from './FmsInitialAssistForm.vue'
import FmsInitialBalanceImportForm from './FmsInitialBalanceImportForm.vue'
import FmsTrialBalanceDialog from './FmsTrialBalanceDialog.vue'

defineOptions({ name: 'FmsInitialBalance' })

const subjectTypeOptions = getIntDictOptions(DICT_TYPE.FMS_SUBJECT_TYPE)

type ViewRow = FmsInitialBalanceVO & {
  rowKey: string
  isAssist?: boolean
  isLeaf?: boolean
  level: number
  auxiliaryItemIds?: number[]
  auxiliaries?: FmsInitialBalanceAuxiliaryItemVO[]
}

/** 金额和数量字段，父级行由子级行汇总 */
const AMOUNT_FIELDS: (keyof FmsInitialBalanceAmountsVO)[] = [
  'openingAmount',
  'openingQuantity',
  'yearDebitAmount',
  'yearDebitQuantity',
  'yearCreditAmount',
  'yearCreditQuantity',
  'yearOpeningAmount',
  'yearOpeningQuantity',
  'profitLossAmount',
  'profitLossQuantity'
]
/** 汇总时不区分余额方向、直接累加的字段 */
const DIRECT_SUM_FIELDS: Set<keyof FmsInitialBalanceAmountsVO> = new Set([
  'yearDebitAmount',
  'yearDebitQuantity',
  'yearCreditAmount',
  'yearCreditQuantity'
])

/** 金额数量输入框，隐藏控制按钮，最小值为 0 */
const AmountInput = defineComponent({
  props: {
    modelValue: { type: Number, default: 0 },
    precision: { type: Number, default: 2 }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    return () =>
      h(ElInputNumber, {
        modelValue: props.modelValue,
        'onUpdate:modelValue': (value: number | undefined) => emit('update:modelValue', value || 0),
        controls: false,
        min: 0,
        precision: props.precision,
        class: 'amount-input',
        onChange: () => emit('change')
      })
  }
})

// ==================== 页面状态 ====================

const message = useMessage() // 消息弹窗
const fmsStore = useFmsStore() // FMS 状态
const loading = ref(false) // 列表的加载中
const saving = ref(false) // 保存的提交中
const exportLoading = ref(false) // 导出的加载中
const edited = ref(false) // 是否存在未保存修改
const subjectType = ref<number>(FMS_SUBJECT_TYPE.ASSET) // 当前科目类别
const loadedSubjectType = ref<number>(subjectType.value) // 当前列表对应的科目类别
const tableData = ref<ViewRow[]>([]) // 列表的数据
const accountStartTime = ref<number>() // 账套启用时间
const currentMonth = ref<string>() // 当前会计期间
const assistSubject = ref<ViewRow>() // 正在添加辅助核算明细的科目
const assistFormRef = ref<InstanceType<typeof FmsInitialAssistForm>>()
const importFormRef = ref<InstanceType<typeof FmsInitialBalanceImportForm>>()
const trialBalanceRef = ref<InstanceType<typeof FmsTrialBalanceDialog>>()
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const isJanuary = computed(
  () => !!accountStartTime.value && new Date(accountStartTime.value).getMonth() === 0
) // 账套是否从一月启用
const editable = computed(
  () =>
    !!accountStartTime.value &&
    !!currentMonth.value &&
    currentMonth.value === dayjs(accountStartTime.value).format('YYYY-MM')
) // 是否可编辑，结账后初始余额不可修改

watch(accountSetId, () => loadPage())

// ==================== 页面加载 ====================

/** 加载账套信息、初始余额列表和当前会计期间 */
async function loadPage() {
  if (!accountSetId.value) {
    tableData.value = []
    return
  }
  loading.value = true
  try {
    const [accountSet, balances, month] = await Promise.all([
      FmsAccountSetApi.getAccountSet(accountSetId.value),
      FmsInitialBalanceApi.getInitialBalanceList(accountSetId.value, subjectType.value),
      fmsStore.loadCurrentMonth()
    ])
    accountStartTime.value = accountSet.startTime
    currentMonth.value = month
    tableData.value = buildViewRows(balances)
    loadedSubjectType.value = subjectType.value
    edited.value = false
  } finally {
    loading.value = false
  }
}

/** 切换科目类别 */
async function changeSubjectType(type: number) {
  if (edited.value) {
    try {
      await message.confirm('当前修改尚未保存，确定放弃修改并切换科目类别吗？')
    } catch {
      subjectType.value = loadedSubjectType.value
      return
    }
  }
  if (isJanuary.value && type === FMS_SUBJECT_TYPE.PROFIT_LOSS) {
    message.warning('年初启用的账套不需要录入损益初始余额')
    return
  }
  subjectType.value = type
  await loadPage()
}

/** 打开导入弹窗 */
function openImportForm() {
  if (!accountSetId.value) return
  importFormRef.value?.open(accountSetId.value)
}

/** 打开试算平衡 */
function openTrialBalance() {
  if (!accountSetId.value) return
  trialBalanceRef.value?.open(accountSetId.value)
}

/** 导出初始余额 */
async function handleExport() {
  if (!accountSetId.value || exportLoading.value) return
  exportLoading.value = true
  try {
    download.excel(
      await FmsInitialBalanceApi.exportInitialBalance(accountSetId.value),
      '财务初始余额.xlsx'
    )
  } finally {
    exportLoading.value = false
  }
}

/** 构建平铺行：父级科目在前，辅助明细紧跟所属科目 */
function buildViewRows(list: FmsInitialBalanceVO[]): ViewRow[] {
  const rows: ViewRow[] = []
  const levelMap = new Map<number, number>()
  const parentIds = new Set(list.map((item) => item.parentId))
  list.forEach((item) => {
    const level = (item.parentId ? levelMap.get(item.parentId) || 0 : 0) + 1
    levelMap.set(item.subjectId, level)
    const subjectRow: ViewRow = {
      ...item,
      rowKey: `subject-${item.subjectId}`,
      isLeaf: !parentIds.has(item.subjectId),
      level
    }
    rows.push(subjectRow)
    item.assistBalances.forEach((assist, index) => {
      rows.push(buildAssistViewRow(subjectRow, assist, index))
    })
  })
  return rows
}

// ==================== 辅助核算余额 ====================

/** 构建辅助核算明细行 */
function buildAssistViewRow(
  subject: ViewRow,
  assist: FmsInitialBalanceAssistVO,
  index: number
): ViewRow {
  return {
    ...subject,
    ...assist,
    rowKey: `assist-${subject.subjectId}-${assist.assistCombinationId || index}`,
    isAssist: true,
    level: subject.level + 1,
    auxiliaryItemIds: assist.auxiliaries.map((item) => item.itemId),
    assistBalances: []
  }
}

/** 判断是否可编辑：辅助明细行，或未启用辅助核算的末级科目行 */
function canEdit(row: ViewRow) {
  return (
    fmsStore.isAccountSetWritable &&
    editable.value &&
    (row.isAssist || (row.isLeaf && !row.auxiliaryAccounting))
  )
}

/** 判断是否可添加明细：启用辅助核算的末级科目行 */
function canAddAssist(row: ViewRow) {
  return (
    fmsStore.isAccountSetWritable &&
    editable.value &&
    !row.isAssist &&
    row.isLeaf &&
    row.auxiliaryAccounting
  )
}

/** 获得行名称，辅助明细行拼接“科目名称_项目名称” */
function getRowName(row: ViewRow) {
  if (!row.isAssist) return row.subjectName
  return `${row.subjectName}_${row.auxiliaries?.map((item) => item.name).join('_')}`
}

/** 打开添加明细弹窗 */
function openAssistForm(row: ViewRow) {
  if (!accountSetId.value) return
  assistSubject.value = row
  assistFormRef.value?.open(row)
}

/** 添加辅助核算明细行 */
function addAssist(combinations: FmsAuxiliaryItemOptionVO[][]) {
  const subject = assistSubject.value
  if (!subject) return
  // 插入到所属科目的最后一条辅助明细之后
  let insertIndex = tableData.value.findIndex((row) => row.rowKey === subject.rowKey) + 1
  while (
    insertIndex < tableData.value.length &&
    tableData.value[insertIndex].isAssist &&
    tableData.value[insertIndex].subjectId === subject.subjectId
  ) {
    insertIndex++
  }
  const newRows = combinations
    .filter(
      (items) =>
        !tableData.value.some(
          (row) =>
            row.isAssist &&
            row.subjectId === subject.subjectId &&
            row.auxiliaryItemIds?.length === items.length &&
            items.every((item) => row.auxiliaryItemIds?.includes(item.id))
        )
    )
    .map((items, index) =>
      buildAssistViewRow(
        subject,
        {
          ...zeroAmounts(),
          auxiliaries: subject.auxiliaryConfigs.map((config, configIndex) => {
            const item = items[configIndex]
            return {
              type: config.type,
              typeId: config.auxiliaryTypeId,
              itemId: item.id,
              name: item.name
            }
          })
        },
        Date.now() + index
      )
    )
  if (!newRows.length) {
    message.warning('所选辅助核算明细均已存在')
    return
  }
  tableData.value.splice(insertIndex, 0, ...newRows)
  edited.value = true
  aggregateRows()
}

/** 删除辅助核算明细行 */
function removeAssist(row: ViewRow) {
  tableData.value = tableData.value.filter((item) => item.rowKey !== row.rowKey)
  edited.value = true
  aggregateRows()
}

/** 金额变化时按余额方向重算年初余额，并汇总父级 */
function handleAmountChange(row: ViewRow) {
  if (!isJanuary.value) {
    if (row.balanceDirection === FMS_DEBIT_CREDIT_DIRECTION.DEBIT) {
      row.yearOpeningAmount = row.openingAmount - row.yearDebitAmount + row.yearCreditAmount
      row.yearOpeningQuantity = row.openingQuantity - row.yearDebitQuantity + row.yearCreditQuantity
    } else {
      row.yearOpeningAmount = row.openingAmount + row.yearDebitAmount - row.yearCreditAmount
      row.yearOpeningQuantity = row.openingQuantity + row.yearDebitQuantity - row.yearCreditQuantity
    }
  }
  edited.value = true
  aggregateRows()
}

/** 实际损益发生额变化时标记未保存并汇总父级 */
function handleProfitLossAmountChange() {
  edited.value = true
  aggregateRows()
}

// ==================== 汇总与保存 ====================

/** 汇总父级科目余额：辅助明细计入所属科目，子科目计入父科目 */
function aggregateRows() {
  const rows = tableData.value
  const subjectMap = new Map<number, ViewRow>()
  // 1. 非末级科目和启用辅助核算的科目由明细汇总，先清零
  rows.forEach((row) => {
    if (row.isAssist) return
    subjectMap.set(row.subjectId, row)
    if (!row.isLeaf || row.auxiliaryAccounting) {
      AMOUNT_FIELDS.forEach((field) => (row[field] = 0))
    }
  })
  // 2. 平铺列表父级在前，倒序遍历时子级先完成汇总，再逐级累加到父级
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index]
    const parent = row.isAssist ? subjectMap.get(row.subjectId) : subjectMap.get(row.parentId!)
    if (!parent) continue
    AMOUNT_FIELDS.forEach((field) => {
      const amount = Number(row[field] || 0)
      parent[field] =
        Number(parent[field] || 0) +
        (DIRECT_SUM_FIELDS.has(field) || row.balanceDirection === parent.balanceDirection
          ? amount
          : -amount)
    })
  }
}

/** 保存初始余额 */
async function handleSave() {
  if (!accountSetId.value || !editable.value) return
  const assistRows = tableData.value.filter((row) => row.isAssist)
  const balances: FmsInitialBalanceUpdateVO[] = tableData.value
    .filter((row) => !row.isAssist && row.isLeaf)
    .map((row) => ({
      subjectId: row.subjectId,
      ...pickAmounts(row),
      assistBalances: assistRows
        .filter((item) => item.subjectId === row.subjectId)
        .map((item) => ({
          auxiliaryItemIds: item.auxiliaryItemIds || [],
          ...pickAmounts(item)
        }))
    }))
  if (
    subjectType.value === FMS_SUBJECT_TYPE.PROFIT_LOSS &&
    balances.some((item) => Math.abs(item.yearOpeningAmount) >= 0.005)
  ) {
    message.warning('损益类科目的年初余额必须为 0')
    return
  }
  saving.value = true
  try {
    await FmsInitialBalanceApi.saveInitialBalance(accountSetId.value, balances)
    message.success('保存成功')
    await loadPage()
  } finally {
    saving.value = false
  }
}

/** 提取行的金额和数量字段 */
function pickAmounts(row: ViewRow): FmsInitialBalanceAmountsVO {
  return {
    openingAmount: Number(row.openingAmount || 0),
    openingQuantity: Number(row.openingQuantity || 0),
    yearDebitAmount: Number(row.yearDebitAmount || 0),
    yearDebitQuantity: Number(row.yearDebitQuantity || 0),
    yearCreditAmount: Number(row.yearCreditAmount || 0),
    yearCreditQuantity: Number(row.yearCreditQuantity || 0),
    yearOpeningAmount: Number(row.yearOpeningAmount || 0),
    yearOpeningQuantity: Number(row.yearOpeningQuantity || 0),
    profitLossAmount: Number(row.profitLossAmount || 0),
    profitLossQuantity: Number(row.profitLossQuantity || 0)
  }
}

/** 构建全零的金额和数量字段 */
function zeroAmounts(): FmsInitialBalanceAmountsVO {
  return {
    openingAmount: 0,
    openingQuantity: 0,
    yearDebitAmount: 0,
    yearDebitQuantity: 0,
    yearCreditAmount: 0,
    yearCreditQuantity: 0,
    yearOpeningAmount: 0,
    yearOpeningQuantity: 0,
    profitLossAmount: 0,
    profitLossQuantity: 0
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  loadPage()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (!edited.value) return true
  try {
    await message.confirm('当前修改尚未保存，确定放弃修改并离开页面吗？')
    edited.value = false
    return true
  } catch {
    return false
  }
})

/** 浏览器刷新或关闭前提示未保存修改 */
function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!edited.value) return
  event.preventDefault()
  event.returnValue = ''
}
</script>

<style lang="scss" scoped>
.assist-row-text {
  color: var(--el-text-color-secondary);
}

:deep(.amount-input) {
  width: 118px;
}

:deep(.amount-input .el-input__inner) {
  text-align: right;
}
</style>
