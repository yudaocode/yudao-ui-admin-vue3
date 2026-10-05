<template>
  <doc-alert
    title="【薪资】计薪设置、薪资档案、月度工资、工资条"
    url="https://doc.iocoder.cn/hrm/salary/config/"
  />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="员工" prop="search">
        <el-input
          v-model="queryParams.search"
          class="!w-220px"
          clearable
          placeholder="请输入姓名或工号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-220px" />
      </el-form-item>
      <el-form-item label="岗位" prop="postName">
        <el-input
          v-model="queryParams.postName"
          class="!w-180px"
          clearable
          placeholder="请输入岗位名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="changeType">
        <el-select
          v-model="queryParams.changeType"
          class="!w-170px"
          clearable
          placeholder="请选择档案状态"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.HRM_SALARY_CHANGE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon class="mr-5px" icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon class="mr-5px" icon="ep:refresh" />重置</el-button>
        <el-button
          v-hasPermi="['hrm:salary:employee-info:update']"
          plain
          type="primary"
          @click="employeeInfoBatchFormRef?.open(selectedEmployeeIds)"
        >
          <Icon class="mr-5px" icon="ep:operation" />批量调薪
        </el-button>
        <el-button
          v-hasPermi="['hrm:salary:employee-info:import']"
          plain
          type="warning"
          @click="importFormRef?.open('fix')"
        >
          <Icon class="mr-5px" icon="ep:upload" />导入定薪
        </el-button>
        <el-button
          v-hasPermi="['hrm:salary:employee-info:import']"
          plain
          type="warning"
          @click="importFormRef?.open('change')"
        >
          <Icon class="mr-5px" icon="ep:upload" />导入调薪
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 薪资档案列表 -->
  <ContentWrap>
    <el-tabs v-model="activeStatus" @tab-change="handleStatusTabChange">
      <el-tab-pane v-for="item in statusItems" :key="item.status" :name="String(item.status)">
        <template #label>{{ item.label }}（{{ statusCountMap[item.status] || 0 }}）</template>
      </el-tab-pane>
    </el-tabs>
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" />
      <el-table-column fixed="left" label="员工姓名" min-width="140">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="openDetail(scope.row.employeeId)">
            {{ scope.row.employeeName || '-' }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="工号" prop="jobNumber" width="120" />
      <el-table-column label="部门" min-width="140" prop="deptName" />
      <el-table-column label="岗位" prop="postName" min-width="140" />
      <el-table-column align="center" label="员工状态" width="100">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="scope.row.status"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="入职日期"
        prop="entryTime"
        width="120"
      />
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="转正日期"
        prop="regularTime"
        width="120"
      />
      <el-table-column
        :formatter="dateFormatter2"
        align="center"
        label="最近调整日期"
        prop="effectTime"
        width="120"
      />
      <el-table-column align="center" label="调薪原因" prop="changeReason" width="120">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.changeReason != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="scope.row.changeReason"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="right" label="工资合计" width="130">
        <template #default="scope">{{ formatHrmMoney(getSalaryTotal(scope.row)) }}</template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="140">
        <template #default="scope">
          <el-button
            v-hasPermi="['hrm:salary:employee-info:update']"
            link
            type="primary"
            @click="employeeInfoFormRef?.open(scope.row.employeeId)"
          >
            {{ scope.row.id ? '调薪' : '定薪' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 定薪、批量调薪和导入弹窗 -->
  <SalaryEmployeeInfoForm ref="employeeInfoFormRef" @success="getList" />
  <SalaryEmployeeInfoBatchForm ref="employeeInfoBatchFormRef" @success="getList" />
  <SalaryEmployeeInfoImportForm ref="importFormRef" @success="getList" />
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { dateFormatter2 } from '@/utils/formatTime'
import * as SalaryEmployeeInfoApi from '@/api/hrm/salary/employee-info'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { HrmEmployeeStatus, HrmEmployeeStatusTab } from '@/views/hrm/utils/constants'
import { formatHrmMoney } from '@/views/hrm/utils/format'
import SalaryEmployeeInfoBatchForm from './SalaryEmployeeInfoBatchForm.vue'
import SalaryEmployeeInfoForm from './SalaryEmployeeInfoForm.vue'
import SalaryEmployeeInfoImportForm from './SalaryEmployeeInfoImportForm.vue'

defineOptions({ name: 'HrmSalaryEmployeeInfo' })

const router = useRouter() // 路由
const loading = ref(false) // 列表加载中
const total = ref(0) // 列表总数
const list = ref<SalaryEmployeeInfoApi.SalaryEmployeeInfoVO[]>([]) // 薪资档案列表
const activeStatus = ref(String(HrmEmployeeStatusTab.ACTIVE)) // 当前员工状态
const statusCountMap = ref<Record<number, number>>({}) // 员工状态数量
const selectedEmployeeIds = ref<number[]>([]) // 选中员工编号
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  search: undefined,
  deptId: undefined,
  postName: undefined,
  statusCategory: HrmEmployeeStatusTab.ACTIVE as number,
  changeType: undefined
}) // 查询参数
const queryFormRef = ref<FormInstance>() // 查询表单
const employeeInfoFormRef = ref<InstanceType<typeof SalaryEmployeeInfoForm>>() // 定薪/调薪表单
const employeeInfoBatchFormRef = ref<InstanceType<typeof SalaryEmployeeInfoBatchForm>>() // 批量调薪表单
const importFormRef = ref<InstanceType<typeof SalaryEmployeeInfoImportForm>>() // 导入表单
const statusItems = [
  { status: HrmEmployeeStatusTab.ACTIVE, label: '在职' },
  { status: HrmEmployeeStatusTab.FULL_TIME, label: '全职' },
  {
    status: HrmEmployeeStatus.INTERN,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.INTERN)
  },
  {
    status: HrmEmployeeStatus.LABOR,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.LABOR)
  },
  {
    status: HrmEmployeeStatus.CONSULTANT,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.CONSULTANT)
  },
  {
    status: HrmEmployeeStatus.REHIRE,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.REHIRE)
  },
  {
    status: HrmEmployeeStatus.OUTSOURCE,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.OUTSOURCE)
  },
  {
    status: HrmEmployeeStatus.PART_TIME,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.PART_TIME)
  },
  {
    status: HrmEmployeeStatus.PROBATION,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.PROBATION)
  },
  {
    status: HrmEmployeeStatus.REGULAR,
    label: getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, HrmEmployeeStatus.REGULAR)
  }
]

/** 查询薪资档案列表 */
async function getList() {
  loading.value = true
  try {
    const [data, statusCounts] = await Promise.all([
      SalaryEmployeeInfoApi.getSalaryEmployeeInfoPage(queryParams),
      SalaryEmployeeInfoApi.getSalaryEmployeeInfoStatusCount(queryParams)
    ])
    list.value = data.list
    total.value = data.total
    statusCountMap.value = statusCounts.reduce<Record<number, number>>((countMap, item) => {
      countMap[item.status] = item.count
      return countMap
    }, {})
    selectedEmployeeIds.value = []
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
  queryFormRef.value?.resetFields()
  activeStatus.value = String(HrmEmployeeStatusTab.ACTIVE)
  queryParams.statusCategory = HrmEmployeeStatusTab.ACTIVE
  handleQuery()
}

/** 切换员工状态 */
function handleStatusTabChange() {
  queryParams.statusCategory = Number(activeStatus.value)
  handleQuery()
}

/** 处理表格选择 */
function handleSelectionChange(rows: SalaryEmployeeInfoApi.SalaryEmployeeInfoVO[]) {
  selectedEmployeeIds.value = rows
    .map((row) => row.employeeId)
    .filter((employeeId): employeeId is number => employeeId !== undefined)
}

/** 打开薪资档案详情 */
function openDetail(employeeId?: number) {
  if (!employeeId) {
    return
  }
  router.push({ name: 'HrmSalaryEmployeeInfoDetail', params: { id: employeeId } })
}

/** 获得员工当前工资合计 */
function getSalaryTotal(salaryEmployee: SalaryEmployeeInfoApi.SalaryEmployeeInfoVO) {
  return salaryEmployee.status === HrmEmployeeStatus.PROBATION
    ? salaryEmployee.probationSalary
    : salaryEmployee.regularSalary
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
