<template>
  <Dialog
    v-model="dialogVisible"
    :before-close="handleBeforeClose"
    :close-on-click-modal="false"
    :fullscreen="false"
    title="在线编辑工资"
    width="calc(100vw - 32px)"
  >
    <!-- 员工工资列表 -->
    <el-table v-loading="loading" :data="list" border height="calc(100vh - 300px)">
      <el-table-column fixed="left" label="员工姓名" min-width="130" prop="employeeName" />
      <el-table-column fixed="left" label="工号" prop="jobNumber" width="120" />
      <el-table-column fixed="left" label="部门" min-width="130" prop="deptName" />
      <el-table-column fixed="left" label="岗位" min-width="130" prop="postName" />
      <el-table-column
        v-for="option in editableOptions"
        :key="option.code"
        :label="option.name"
        align="center"
        min-width="150"
      >
        <template #default="scope">
          <el-input-number
            :model-value="getSalaryOptionValue(scope.row, option.code)"
            :controls="false"
            :max="100000000"
            :min="0"
            :precision="2"
            class="!w-1/1"
            @update:model-value="(value) => updateSalaryOptionValue(scope.row, option.code, value)"
          />
        </template>
      </el-table-column>
    </el-table>
    <!-- 表单按钮 -->
    <template #footer>
      <el-button
        :disabled="loading || editedEmployeeIdSet.size === 0"
        type="primary"
        @click="submitForm"
      >
        保 存
      </el-button>
      <el-button @click="handleCancel">放弃编辑</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as SalaryMonthRecordApi from '@/api/hrm/salary/month-record'
import * as SalaryMonthEmployeeRecordApi from '@/api/hrm/salary/month-record/employee'
import type { SalaryOptionVO } from '@/api/hrm/salary/config/option'
import { HRM_SALARY_COMPUTED_OPTION_CODES } from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmSalaryBatchEmployeeRecordForm' })

const dialogVisible = ref(false) // 弹窗是否显示
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 数据加载中
const edited = ref(false) // 是否存在未保存修改
const editedEmployeeIdSet = ref<Set<number>>(new Set()) // 已修改员工编号
const list = ref<SalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecordVO[]>([]) // 员工工资列表
const editableOptions = ref<SalaryOptionVO[]>([]) // 可编辑薪资项

/** 打开弹窗 */
async function open(
  record: SalaryMonthRecordApi.SalaryMonthRecordVO,
  queryParams: {
    employeeChangeType?: number
    employeeName?: string
    jobNumber?: string
    deptId?: number
  }
) {
  if (!record.id) {
    return
  }
  dialogVisible.value = true
  loading.value = true
  try {
    // 批量编辑按当前筛选条件取全量数据，不复用主表的分页参数
    const employeeRecords = await SalaryMonthEmployeeRecordApi.getSalaryMonthEmployeeRecordList({
      employeeChangeType: queryParams.employeeChangeType,
      employeeName: queryParams.employeeName,
      jobNumber: queryParams.jobNumber,
      deptId: queryParams.deptId,
      monthRecordId: record.id
    })
    list.value = employeeRecords
    editableOptions.value = getLeafOptions(record.optionHeaders).filter(
      (option) => !HRM_SALARY_COMPUTED_OPTION_CODES.has(option.code)
    )
    edited.value = false
    editedEmployeeIdSet.value = new Set()
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件

/** 获得工资表表头中的明细项，跳过空分类 */
function getLeafOptions(options?: SalaryOptionVO[]) {
  return (options || []).flatMap((category) => category.children || [])
}

/** 获得员工指定薪资项金额 */
function getSalaryOptionValue(
  record: SalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecordVO,
  optionCode: number
) {
  return Number(record.optionValues?.find((option) => option.code === optionCode)?.value || 0)
}

/** 更新员工指定薪资项金额 */
function updateSalaryOptionValue(
  record: SalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecordVO,
  optionCode: number,
  value: number | null | undefined
) {
  const optionValue = record.optionValues?.find((option) => option.code === optionCode)
  if (optionValue) {
    optionValue.value = Number(value || 0)
  } else {
    record.optionValues = [
      ...(record.optionValues || []),
      { code: optionCode, value: Number(value || 0) }
    ]
  }
  handleOptionChange(record.id)
}

/** 标记员工工资已修改 */
function handleOptionChange(employeeRecordId?: number) {
  if (!employeeRecordId) {
    return
  }
  editedEmployeeIdSet.value.add(employeeRecordId)
  editedEmployeeIdSet.value = new Set(editedEmployeeIdSet.value)
  edited.value = true
}

/** 关闭弹窗前确认未保存的修改 */
async function handleBeforeClose(done: () => void) {
  if (!edited.value) {
    done()
    return
  }
  try {
    await message.confirm('当前修改尚未保存，确定放弃编辑吗？')
    edited.value = false
    done()
  } catch {}
}

/** 放弃编辑 */
async function handleCancel() {
  if (!edited.value) {
    dialogVisible.value = false
    return
  }
  try {
    await message.confirm('当前修改尚未保存，确定放弃编辑吗？')
    edited.value = false
    dialogVisible.value = false
  } catch {}
}

/** 保存批量编辑 */
async function submitForm() {
  // 提交请求
  loading.value = true
  try {
    await SalaryMonthEmployeeRecordApi.updateSalaryMonthEmployeeRecordList(
      list.value
        .filter((item) => item.id && editedEmployeeIdSet.value.has(item.id))
        .map((item) => ({
          id: item.id,
          optionValues: item.optionValues || []
        }))
    )
    message.success(t('common.updateSuccess'))
    edited.value = false
    editedEmployeeIdSet.value = new Set()
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
