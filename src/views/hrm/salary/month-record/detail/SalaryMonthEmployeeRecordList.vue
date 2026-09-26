<template>
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="76px"
    >
      <el-form-item label="员工姓名" prop="employeeName">
        <el-input
          v-model="queryParams.employeeName"
          class="!w-180px"
          clearable
          placeholder="请输入员工姓名"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工号" prop="jobNumber">
        <el-input
          v-model="queryParams.jobNumber"
          class="!w-160px"
          clearable
          placeholder="请输入工号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-200px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon class="mr-5px" icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon class="mr-5px" icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      :summary-method="getSummaries"
      border
      show-summary
    >
      <el-table-column fixed="left" label="员工姓名" min-width="130" prop="employeeName" />
      <el-table-column fixed="left" label="工号" prop="jobNumber" width="120" />
      <el-table-column label="部门" min-width="130" prop="deptName" />
      <el-table-column label="岗位" min-width="130" prop="postName" />
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
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import type { SalaryOptionValueVO, SalaryOptionVO } from '@/api/hrm/salary/config/option'
import * as SalaryMonthRecordApi from '@/api/hrm/salary/month-record'
import * as SalaryMonthEmployeeRecordApi from '@/api/hrm/salary/month-record/employee'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { formatHrmMoney } from '@/views/hrm/utils/format'

defineOptions({ name: 'HrmSalaryMonthEmployeeRecordList' })

const props = defineProps<{
  record: SalaryMonthRecordApi.SalaryMonthRecordVO
}>()

const loading = ref(false) // 列表加载中
const total = ref(0) // 列表总数
const list = ref<SalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecordVO[]>([]) // 员工工资列表
const summaryList = ref<SalaryOptionValueVO[]>([]) // 工资项汇总
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  monthRecordId: props.record.id,
  employeeName: undefined as string | undefined,
  jobNumber: undefined as string | undefined,
  deptId: undefined as number | undefined
}) // 查询参数
const queryFormRef = ref<FormInstance>() // 查询表单
const optionColumns = computed(() => getLeafOptions(props.record.optionHeaders)) // 动态薪资项列
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

/** 查询员工工资明细 */
async function getList() {
  loading.value = true
  try {
    const data = await SalaryMonthEmployeeRecordApi.getSalaryMonthEmployeeRecordPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询工资项汇总 */
async function getSummary() {
  summaryList.value = await SalaryMonthRecordApi.getSalaryMonthOptionSummary(queryParams)
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1
  Promise.all([getList(), getSummary()])
}

/** 重置搜索 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
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

/** 初始化 */
async function init() {
  await Promise.all([getList(), getSummary()])
}

/** 初始化 */
onMounted(() => {
  init()
})
</script>
