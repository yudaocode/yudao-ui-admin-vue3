<template>
  <doc-alert title="【薪资】月度工资、工资条" url="https://doc.iocoder.cn/hrm/salary/payroll/" />

  <ContentWrap v-loading="pageLoading">
    <template v-if="record.id">
      <div class="flex items-center">
        <span class="text-18px font-bold">月度工资表</span>
        <span class="ml-8px text-14px text-[var(--el-text-color-secondary)]">
          （计薪周期：{{ formatHrmDateRange(record.startTime, record.endTime) }}）
        </span>
      </div>

      <!-- 搜索工作栏 -->
      <el-form :inline="true" :model="queryParams" class="mt-16px -mb-15px" label-width="68px">
        <el-form-item label="员工姓名" prop="employeeName">
          <el-input
            v-model="queryParams.employeeName"
            class="!w-240px"
            clearable
            placeholder="请输入员工姓名"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="工号" prop="jobNumber">
          <el-input
            v-model="queryParams.jobNumber"
            class="!w-240px"
            clearable
            placeholder="请输入工号"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="部门" prop="deptId">
          <DeptSelect v-model="queryParams.deptId" class="!w-240px" placeholder="请选择部门" />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"> <Icon class="mr-5px" icon="ep:search" />搜索 </el-button>
          <el-button @click="resetQuery"> <Icon class="mr-5px" icon="ep:refresh" />重置 </el-button>
          <el-button
            v-if="isWritable"
            v-hasPermi="['hrm:salary:month-record:update']"
            plain
            type="primary"
            @click="openBatchEdit"
          >
            <Icon class="mr-5px" icon="ep:edit" />在线编辑
          </el-button>
          <el-button
            v-if="isWritable"
            v-hasPermi="['hrm:salary:month-record:compute']"
            plain
            type="primary"
            @click="computeFormRef?.open(record)"
          >
            <Icon class="mr-5px" icon="ep:cpu" />核算工资
          </el-button>
          <el-button
            v-if="isComputed"
            v-hasPermi="['hrm:salary:slip:create']"
            plain
            type="primary"
            @click="openSlipSendForm"
          >
            <Icon class="mr-5px" icon="ep:promotion" />发送工资条
          </el-button>
          <el-button
            v-hasPermi="['hrm:salary:month-record:create']"
            plain
            type="primary"
            @click="handleCreateNext"
          >
            <Icon class="mr-5px" icon="ep:plus" />创建下月工资表
          </el-button>
          <el-button
            v-if="isWritable"
            v-hasPermi="['hrm:salary:month-record:delete']"
            plain
            type="danger"
            @click="handleDelete"
          >
            <Icon class="mr-5px" icon="ep:delete" />删除工资表
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="isArchived"
        :closable="false"
        class="!mt-8px"
        show-icon
        title="当前工资表已归档，仅可查询。"
        type="info"
      />
      <!-- 核算准备提示 -->
      <SalaryPayrollReadinessAlert ref="readinessAlertRef" :month-record-id="record.id" />
    </template>

    <!-- 空状态 -->
    <el-empty v-else description="暂无月度工资表">
      <el-button
        v-hasPermi="['hrm:salary:month-record:create']"
        :loading="createLoading"
        type="primary"
        @click="handleCreate"
      >
        初始化月度工资表
      </el-button>
    </el-empty>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap v-if="record.id">
    <el-tabs v-model="queryParams.employeeChangeType" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in employeeChangeTabs" :key="tab.type" :name="tab.type">
        <template #label>{{ tab.label }}（{{ employeeChangeCount[tab.type] || 0 }}）</template>
      </el-tab-pane>
    </el-tabs>

    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      :summary-method="getSummaries"
      border
      show-summary
    >
      <el-table-column fixed="left" label="姓名" min-width="130" prop="employeeName" />
      <el-table-column label="工号" prop="jobNumber" width="120" />
      <el-table-column label="部门" min-width="130" prop="deptName" />
      <el-table-column label="岗位" min-width="130" prop="postName" />
      <el-table-column align="right" label="计薪天数" width="110">
        <template #default="scope">{{ formatHrmDays(scope.row.needWorkDay) }}</template>
      </el-table-column>
      <el-table-column align="right" label="实际计薪天数" width="130">
        <template #default="scope">{{ formatHrmDays(scope.row.actualWorkDay) }}</template>
      </el-table-column>
      <el-table-column
        v-for="option in optionColumns"
        :key="option.code"
        :label="option.name"
        :prop="`option-${option.code}`"
        align="right"
        min-width="120"
      >
        <template #default="scope">
          {{ formatHrmMoney(getSalaryOptionValue(scope.row, option.code)) }}
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 员工工资批量编辑、工资核算和工资条发放弹窗 -->
  <SalaryBatchEmployeeRecordForm ref="batchFormRef" @success="refreshData" />
  <SalaryMonthComputeForm ref="computeFormRef" @success="refreshData" />
  <SalarySlipSendForm ref="slipSendFormRef" />
</template>

<script lang="ts" setup>
import type { SalaryOptionValueVO } from '@/api/hrm/salary/config/option'
import * as SalaryMonthRecordApi from '@/api/hrm/salary/month-record'
import * as SalaryMonthEmployeeRecordApi from '@/api/hrm/salary/month-record/employee'
import type { SalaryOptionVO } from '@/api/hrm/salary/config/option'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { HrmSalaryEmployeeChangeType, HrmSalaryMonthStatus } from '@/views/hrm/utils/constants'
import { formatHrmDateRange, formatHrmDays, formatHrmMoney } from '@/views/hrm/utils/format'
import SalaryBatchEmployeeRecordForm from './SalaryBatchEmployeeRecordForm.vue'
import SalaryMonthComputeForm from './SalaryMonthComputeForm.vue'
import SalaryPayrollReadinessAlert from './SalaryPayrollReadinessAlert.vue'
import SalarySlipSendForm from '../slip/send-record/SalarySlipSendForm.vue'

defineOptions({ name: 'HrmSalaryMonthRecord' })

const message = useMessage() // 消息弹窗
const pageLoading = ref(false) // 页面加载中
const createLoading = ref(false) // 工资表创建中
const record = ref<SalaryMonthRecordApi.SalaryMonthRecordVO>({}) // 工资表
const loading = ref(false) // 员工工资加载中
const total = ref(0) // 员工工资总数
const list = ref<SalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecordVO[]>([]) // 员工工资列表
const employeeChangeCount = ref<Record<number, number>>({}) // 员工异动分类数量
const summaryList = ref<SalaryOptionValueVO[]>([]) // 工资项汇总
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  monthRecordId: undefined as number | undefined,
  employeeName: undefined as string | undefined,
  jobNumber: undefined as string | undefined,
  deptId: undefined as number | undefined,
  employeeChangeType: HrmSalaryEmployeeChangeType.ALL
}) // 查询参数
const batchFormRef = ref<InstanceType<typeof SalaryBatchEmployeeRecordForm>>() // 批量编辑表单
const computeFormRef = ref<InstanceType<typeof SalaryMonthComputeForm>>() // 核算表单
const slipSendFormRef = ref<InstanceType<typeof SalarySlipSendForm>>() // 工资条发放表单
const readinessAlertRef = ref<InstanceType<typeof SalaryPayrollReadinessAlert>>() // 核算准备提示
const isArchived = computed(() => record.value.status === HrmSalaryMonthStatus.HISTORY) // 是否已归档
const isComputed = computed(() => record.value.status === HrmSalaryMonthStatus.COMPUTED) // 是否已核算
const isWritable = computed(() => !isArchived.value) // 是否可编辑
const employeeChangeTabs = [
  { type: HrmSalaryEmployeeChangeType.ALL, label: '计薪人数' },
  { type: HrmSalaryEmployeeChangeType.ENTRY, label: '新入职' },
  { type: HrmSalaryEmployeeChangeType.LEAVE, label: '离职' },
  { type: HrmSalaryEmployeeChangeType.REGULAR, label: '转正' },
  { type: HrmSalaryEmployeeChangeType.TRANSFER, label: '调岗' }
]
const optionColumns = computed(() => getLeafOptions(record.value.optionHeaders)) // 动态薪资项列
const summaryMap = computed<Record<number, number>>(() =>
  Object.fromEntries(
    summaryList.value
      .filter((option) => option.code !== undefined)
      .map((option) => [option.code, Number(option.value || 0)])
  )
)

/** 获得工资表表头中的明细项，跳过空分类 */
function getLeafOptions(options?: SalaryOptionVO[]) {
  return (options || []).flatMap((category) => category.children || [])
}

/** 获得员工指定薪资项金额 */
function getSalaryOptionValue(
  employeeRecord: SalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecordVO,
  optionCode: number
) {
  return employeeRecord.optionValues?.find((option) => option.code === optionCode)?.value
}

/** 查询工资表 */
async function getRecord() {
  if (!record.value.id) {
    return
  }
  record.value = await SalaryMonthRecordApi.getSalaryMonthRecord(record.value.id)
}

/** 查询员工工资明细 */
async function getList() {
  if (!queryParams.monthRecordId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const data = await SalaryMonthEmployeeRecordApi.getSalaryMonthEmployeeRecordPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询员工异动分类数量 */
async function getEmployeeChangeCount() {
  if (!queryParams.monthRecordId) {
    employeeChangeCount.value = {}
    return
  }
  employeeChangeCount.value =
    await SalaryMonthEmployeeRecordApi.getSalaryMonthEmployeeChangeCount(queryParams)
}

/** 刷新工资表 */
async function refreshData() {
  await Promise.all([
    getRecord(),
    getList(),
    getEmployeeChangeCount(),
    getSummary(),
    getReadiness()
  ])
}

/** 搜索 */
async function handleQuery() {
  queryParams.pageNo = 1
  await Promise.all([getList(), getEmployeeChangeCount(), getSummary()])
}

/** 重置搜索 */
function resetQuery() {
  queryParams.employeeName = undefined
  queryParams.jobNumber = undefined
  queryParams.deptId = undefined
  handleQuery()
}

/** 切换员工异动分类 */
function handleTabChange() {
  queryParams.pageNo = 1
  Promise.all([getList(), getSummary()])
}

/** 打开批量编辑 */
function openBatchEdit() {
  batchFormRef.value?.open(record.value, queryParams)
}

/** 初始化工资表 */
async function handleCreate() {
  createLoading.value = true
  try {
    await SalaryMonthRecordApi.createNextSalaryMonthRecord()
    message.success('新建成功')
    await init()
  } finally {
    createLoading.value = false
  }
}

/** 创建下月工资表 */
async function handleCreateNext() {
  try {
    await message.confirm(
      '新建下月工资表后，当前工资表将归入历史工资且不可修改。请确认要新建下月工资表吗？'
    )
    await SalaryMonthRecordApi.createNextSalaryMonthRecord()
    message.success('新建成功')
    await init()
  } catch {}
}

/** 打开发送工资条表单 */
function openSlipSendForm() {
  if (record.value.id) {
    slipSendFormRef.value?.open(record.value.id)
  }
}

/** 删除工资表 */
async function handleDelete() {
  if (!record.value.id) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm(
      '删除当前工资表后，上月工资表将恢复为当前工资表且支持修改。请确认要删除当前工资表吗？'
    )
    // 发起删除
    await SalaryMonthRecordApi.deleteSalaryMonthRecord(record.value.id)
    message.success('删除成功')
    await init()
  } catch {}
}

/** 查询工资项汇总 */
async function getSummary() {
  if (!record.value.id) {
    summaryList.value = []
    return
  }
  summaryList.value = await SalaryMonthRecordApi.getSalaryMonthOptionSummary(queryParams)
}

/** 计算工资项合计行 */
function getSummaries({ columns }: { columns: Array<{ property?: string }> }) {
  return columns.map((column, index) => {
    if (index === 0) {
      return '合计'
    }
    const optionCode = Number(column.property?.replace('option-', ''))
    return Number.isSafeInteger(optionCode) ? formatHrmMoney(summaryMap.value[optionCode]) : ''
  })
}

/** 查询薪资核算准备状态 */
async function getReadiness() {
  await nextTick()
  await readinessAlertRef.value?.refresh()
}

/** 初始化 */
async function init() {
  pageLoading.value = true
  try {
    record.value = (await SalaryMonthRecordApi.getLastSalaryMonthRecord()) || {}
    queryParams.monthRecordId = record.value.id
    queryParams.pageNo = 1
    if (!record.value.id) {
      list.value = []
      total.value = 0
      employeeChangeCount.value = {}
      summaryList.value = []
      return
    }
    await Promise.all([getList(), getEmployeeChangeCount(), getSummary(), getReadiness()])
  } finally {
    pageLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  init()
})
</script>
