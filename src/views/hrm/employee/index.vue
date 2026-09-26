<template>
  <doc-alert title="【员工】员工管理" url="https://doc.iocoder.cn/hrm/employee/" />

  <ContentWrap>
    <el-alert
      v-if="queryParams.surveyType === HrmEmployeeSurveyType.ENTRY"
      title="当前筛选：本月入职员工"
      type="info"
      show-icon
      class="mb-12px"
      @close="resetQuery"
    />
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="82px"
    >
      <el-form-item label="员工姓名" prop="name">
        <el-input
          v-model="queryParams.name"
          clearable
          placeholder="请输入员工姓名"
          class="!w-220px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input
          v-model="queryParams.mobile"
          clearable
          placeholder="请输入手机号"
          class="!w-220px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="性别" prop="sex">
        <el-select v-model="queryParams.sex" clearable placeholder="请选择性别" class="!w-220px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="入职时间" prop="entryTime">
        <el-date-picker
          v-model="queryParams.entryTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item v-show="showMoreQuery" label="工号" prop="jobNumber">
        <el-input
          v-model="queryParams.jobNumber"
          clearable
          placeholder="请输入工号"
          class="!w-220px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item v-show="showMoreQuery" label="部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-220px" />
      </el-form-item>
      <el-form-item v-show="showMoreQuery" label="岗位" prop="postName">
        <el-input
          v-model="queryParams.postName"
          clearable
          placeholder="请输入岗位"
          class="!w-220px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item v-show="showMoreQuery" label="转正时间" prop="regularTime">
        <el-date-picker
          v-model="queryParams.regularTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item v-show="showMoreQuery" label="工作地点" prop="workAddress">
        <el-input
          v-model="queryParams.workAddress"
          clearable
          placeholder="请输入工作地点"
          class="!w-220px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item v-show="showMoreQuery" label="招聘渠道" prop="channelId">
        <RecruitChannelSelect v-model="queryParams.channelId" class="!w-220px" />
      </el-form-item>
      <el-form-item v-show="showMoreQuery" label="聘用形式" prop="type">
        <el-select
          v-model="queryParams.type"
          clearable
          placeholder="请选择聘用形式"
          class="!w-220px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
        <el-button link type="primary" @click="showMoreQuery = !showMoreQuery">
          <Icon class="mr-5px" :icon="showMoreQuery ? 'ep:arrow-up' : 'ep:arrow-down'" />
          {{ showMoreQuery ? '收起' : '展开' }}
        </el-button>
        <el-button
          v-hasPermi="['hrm:employee:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" class="mr-5px" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['hrm:employee:create']"
          type="primary"
          plain
          @click="openCreateFromUser"
        >
          <Icon icon="ep:user-filled" class="mr-5px" />
          从后台用户建档
        </el-button>
        <el-button v-hasPermi="['hrm:employee:import']" type="warning" plain @click="handleImport">
          <Icon icon="ep:upload" class="mr-5px" />
          导入
        </el-button>
        <el-button
          v-hasPermi="['hrm:employee:export']"
          type="success"
          plain
          :loading="exportLoading"
          @click="handleExport()"
        >
          <Icon icon="ep:download" class="mr-5px" />
          导出
        </el-button>
        <el-dropdown
          v-if="
            checkPermi([
              'hrm:insurance:employee-info:update',
              'hrm:employee:delete',
              'hrm:employee:update'
            ])
          "
          :disabled="checkedIds.length === 0"
          class="ml-12px"
          @command="handleBatchCommand"
        >
          <el-button
            :disabled="checkedIds.length === 0"
            :loading="batchDeleteLoading"
            plain
            type="primary"
          >
            <Icon icon="ep:operation" class="mr-5px" />批量操作
            <Icon icon="ep:arrow-down" class="ml-5px" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-if="checkPermi(['hrm:insurance:employee-info:update'])"
                command="insurance-scheme"
              >
                设置参保方案
              </el-dropdown-item>
              <el-dropdown-item v-if="checkPermi(['hrm:employee:delete'])" command="delete">
                批量删除
              </el-dropdown-item>
              <el-dropdown-item
                v-if="checkPermi(['hrm:employee:update'])"
                command="send-profile-fill-message"
              >
                发送填写档案通知
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-tabs v-model="activeStatus" @tab-click="handleStatusTabClick">
      <el-tab-pane v-for="item in statusTabOptions" :key="item.value" :name="item.value">
        <template #label>
          {{ item.label }}
          <span class="text-[var(--el-text-color-secondary)]">（{{ item.count }}）</span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column label="员工姓名" align="center" prop="name" fixed="left" min-width="120">
        <template #default="{ row }">
          <el-link type="primary" underline="never" @click="openDetail(row.id)">
            {{ row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="手机号" align="center" prop="mobile" min-width="130" />
      <el-table-column label="招聘渠道" align="center" prop="channelName" min-width="120">
        <template #default="{ row }">{{ row.channelName || '-' }}</template>
      </el-table-column>
      <el-table-column label="性别" align="center" prop="sex" width="80">
        <template #default="{ row }">
          <dict-tag v-if="row.sex != null" :type="DICT_TYPE.SYSTEM_USER_SEX" :value="row.sex" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="入职时间"
        align="center"
        prop="entryTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="部门" align="center" prop="deptName" min-width="120" />
      <el-table-column label="工号" align="center" prop="jobNumber" min-width="120" />
      <el-table-column label="岗位" align="center" prop="postName" min-width="130" />
      <el-table-column label="直属上级" align="center" prop="leaderEmployeeName" min-width="120" />
      <el-table-column label="聘用形式" align="center" prop="type" width="100">
        <template #default="{ row }">
          <dict-tag v-if="row.type != null" :type="DICT_TYPE.HRM_EMPLOYEE_TYPE" :value="row.type" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="员工状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag
            v-if="row.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="row.status"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="入职状态" align="center" prop="entryStatus" width="100">
        <template #default="{ row }">
          <dict-tag
            v-if="row.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="row.entryStatus"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="转正时间"
        align="center"
        prop="regularTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="工作地点" align="center" prop="workAddress" min-width="140" />
      <el-table-column label="银行卡号" align="center" prop="salaryCardNumber" min-width="170" />
      <el-table-column label="开户地区" align="center" prop="salaryCardAreaName" min-width="180" />
      <el-table-column label="银行名称" align="center" prop="salaryCardBankName" min-width="140" />
      <el-table-column
        label="开户支行"
        align="center"
        prop="salaryCardBankBranchName"
        min-width="160"
      />
      <el-table-column
        label="个人社保账号"
        align="center"
        prop="socialSecurityNumber"
        min-width="150"
      />
      <el-table-column
        label="个人公积金账号"
        align="center"
        prop="accumulationFundNumber"
        min-width="160"
      />
      <el-table-column label="操作" align="center" width="140" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['hrm:employee:update']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            编辑
          </el-button>
          <el-dropdown
            v-if="getEmployeeMoreActions(row).length"
            class="!align-middle ml-12px"
            @command="(command) => handleMoreCommand(command, row)"
          >
            <el-button link type="primary">更多</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(action, index) in getEmployeeMoreActions(row)"
                  :key="action.command"
                  :command="action.command"
                  :divided="index > 0 && action.command === 'delete'"
                >
                  {{ action.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <EmployeeForm ref="formRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：从后台用户批量建档 -->
  <EmployeeCreateFromUserForm ref="createFromUserFormRef" @success="handleEmployeeChanged" />
  <!-- 导入弹窗 -->
  <EmployeeImportForm ref="importFormRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：员工转正 -->
  <EmployeeRegularForm ref="regularFormRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：员工调岗 -->
  <EmployeeTransferForm ref="transferFormRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：员工晋升 -->
  <EmployeePromoteForm ref="promoteFormRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：员工降级 -->
  <EmployeeDemoteForm ref="demoteFormRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：员工转为全职 -->
  <EmployeeFullTimeForm ref="fullTimeFormRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：员工离职 -->
  <EmployeeQuitForm ref="quitFormRef" @success="handleEmployeeChanged" />
  <!-- 表单弹窗：设置参保方案 -->
  <EmployeeInsuranceSchemeForm ref="insuranceSchemeFormRef" @success="handleEmployeeChanged" />
</template>

<script lang="ts" setup>
import { ElMessageBox, type FormInstance, type TabsPaneContext } from 'element-plus'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { dateFormatter } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import * as EmployeeApi from '@/api/hrm/employee'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import RecruitChannelSelect from '@/views/hrm/recruit/channel/components/RecruitChannelSelect.vue'
import {
  HrmEmployeeEntryStatus,
  HrmEmployeeStatus,
  HrmEmployeeStatusTab,
  HrmEmployeeSurveyType,
  HrmEmployeeTodoType
} from '@/views/hrm/utils/constants'
import EmployeeDemoteForm from './EmployeeDemoteForm.vue'
import EmployeeCreateFromUserForm from './EmployeeCreateFromUserForm.vue'
import EmployeeForm from './EmployeeForm.vue'
import EmployeeFullTimeForm from './EmployeeFullTimeForm.vue'
import EmployeeImportForm from './EmployeeImportForm.vue'
import EmployeePromoteForm from './EmployeePromoteForm.vue'
import EmployeeQuitForm from './EmployeeQuitForm.vue'
import EmployeeRegularForm from './EmployeeRegularForm.vue'
import EmployeeTransferForm from './EmployeeTransferForm.vue'
import EmployeeInsuranceSchemeForm from './EmployeeInsuranceSchemeForm.vue'

defineOptions({ name: 'HrmEmployee' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const router = useRouter() // 路由
const route = useRoute() // 当前路由
const employeePath = route.path // 缓存页面只响应自身路由

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<EmployeeApi.HrmEmployeeVO[]>([]) // 列表的数据
const statusCounts = ref<EmployeeApi.HrmEmployeeStatusCountVO[]>([]) // 员工状态统计
const activeStatus = ref(String(HrmEmployeeStatusTab.FULL_TIME)) // 当前选中的员工状态
const showMoreQuery = ref(false) // 是否展示更多搜索条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  mobile: undefined as string | undefined,
  sex: undefined as number | undefined,
  entryTime: undefined as string[] | undefined,
  jobNumber: undefined as string | undefined,
  deptId: undefined as number | undefined,
  leaderEmployeeId: undefined as number | undefined,
  postName: undefined as string | undefined,
  regularTime: undefined as string[] | undefined,
  workAddress: undefined as string | undefined,
  channelId: undefined as number | undefined,
  type: undefined as number | undefined,
  entryStatus: undefined as number | undefined,
  status: undefined as number | undefined,
  statusCategory: HrmEmployeeStatusTab.FULL_TIME as number | undefined,
  surveyType: undefined as number | undefined,
  todoType: undefined as number | undefined
})
const queryFormRef = ref<FormInstance>() // 搜索的表单
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
  },
  { status: HrmEmployeeStatusTab.PENDING_ENTRY, label: '待入职' },
  { status: HrmEmployeeStatusTab.PENDING_LEAVE, label: '待离职' },
  { status: HrmEmployeeStatusTab.LEFT, label: '已离职' }
]

/** 员工状态页签 */
const statusTabOptions = computed(() => {
  const countMap = Object.fromEntries(statusCounts.value.map((item) => [item.status, item.count]))
  const items = statusItems.map((item) => ({
    label: item.label,
    value: String(item.status),
    count: countMap[item.status] ?? 0
  }))
  if (queryParams.surveyType === HrmEmployeeSurveyType.ENTRY) {
    items.unshift({ label: '本月入职', value: 'entry', count: total.value })
  }
  return items
})

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await EmployeeApi.getEmployeePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询员工状态数量 */
async function getStatusCounts() {
  statusCounts.value = await EmployeeApi.getEmployeeStatusCount({
    ...queryParams,
    surveyType:
      queryParams.surveyType === HrmEmployeeSurveyType.ENTRY ? undefined : queryParams.surveyType
  })
}

/** 刷新列表和状态统计 */
async function refreshList() {
  await Promise.all([getList(), getStatusCounts()])
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  checkedIds.value = []
  refreshList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  activeStatus.value = String(HrmEmployeeStatusTab.ACTIVE)
  queryParams.statusCategory = HrmEmployeeStatusTab.ACTIVE
  queryParams.surveyType = undefined
  queryParams.todoType = undefined
  syncStatusFilterToRoute()
}

/** tab 切换 */
function handleStatusTabClick(tab: TabsPaneContext) {
  if (tab.paneName === undefined || tab.paneName === 'entry') {
    return
  }
  queryParams.statusCategory = Number(tab.paneName)
  queryParams.entryStatus = undefined
  queryParams.status = undefined
  queryParams.surveyType = undefined
  queryParams.todoType = undefined
  syncStatusFilterToRoute()
}

/** 清除首页筛选并同步当前状态，避免刷新后旧条件恢复 */
function syncStatusFilterToRoute() {
  const statusCategory = String(queryParams.statusCategory)
  if (
    route.query.statusCategory === statusCategory &&
    !route.query.surveyType &&
    !route.query.todoType
  ) {
    handleQuery()
    return
  }
  router.replace({
    query: { ...route.query, statusCategory, surveyType: undefined, todoType: undefined }
  })
}

/** 应用首页跳转携带的员工筛选条件 */
function applyHomeFilter() {
  queryParams.statusCategory = HrmEmployeeStatusTab.FULL_TIME
  queryParams.surveyType = undefined
  queryParams.todoType = undefined
  activeStatus.value = String(HrmEmployeeStatusTab.FULL_TIME)
  const statusCategory = Number(route.query.statusCategory)
  if (statusItems.some((item) => item.status === statusCategory)) {
    queryParams.statusCategory = statusCategory
    activeStatus.value = String(statusCategory)
  }
  const surveyType = Number(route.query.surveyType)
  const surveyTypeValues: number[] = Object.values(HrmEmployeeSurveyType)
  queryParams.surveyType = surveyTypeValues.includes(surveyType) ? surveyType : undefined
  if (queryParams.surveyType) {
    let surveyStatusCategory: number | undefined
    if (queryParams.surveyType === HrmEmployeeSurveyType.LEAVE) {
      surveyStatusCategory = HrmEmployeeStatusTab.LEFT
    } else if (queryParams.surveyType === HrmEmployeeSurveyType.PENDING_ENTRY) {
      surveyStatusCategory = HrmEmployeeStatusTab.PENDING_ENTRY
    } else if (queryParams.surveyType === HrmEmployeeSurveyType.PENDING_LEAVE) {
      surveyStatusCategory = HrmEmployeeStatusTab.PENDING_LEAVE
    }
    queryParams.statusCategory = surveyStatusCategory
    if (queryParams.surveyType === HrmEmployeeSurveyType.ENTRY) {
      activeStatus.value = 'entry'
    } else {
      activeStatus.value = surveyStatusCategory ? String(surveyStatusCategory) : ''
    }
  }
  const todoType = Number(route.query.todoType)
  const todoTypeValues: number[] = Object.values(HrmEmployeeTodoType)
  queryParams.todoType = todoTypeValues.includes(todoType) ? todoType : undefined
  const leaderEmployeeId = Number(route.query.leaderEmployeeId)
  queryParams.leaderEmployeeId =
    Number.isSafeInteger(leaderEmployeeId) && leaderEmployeeId > 0 ? leaderEmployeeId : undefined
}

/** 打开详情 */
function openDetail(id?: number) {
  if (id === undefined) {
    return
  }
  router.push({ name: 'HrmEmployeeDetail', params: { id } })
}

const formRef = ref() // 表单 Ref

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

const createFromUserFormRef = ref<InstanceType<typeof EmployeeCreateFromUserForm>>() // 后台用户建档表单 Ref

/** 打开从后台用户批量建档弹窗 */
function openCreateFromUser() {
  createFromUserFormRef.value?.open()
}

const importFormRef = ref() // 导入表单 Ref

/** 导入按钮操作 */
function handleImport() {
  importFormRef.value.open()
}

/** 打开再入职表单 */
function openRehire(id?: number) {
  if (id === undefined) {
    return
  }
  formRef.value.open('rehire', id)
}

const insuranceSchemeFormRef = ref<InstanceType<typeof EmployeeInsuranceSchemeForm>>() // 参保方案表单

/** 获得员工的更多操作 */
function getEmployeeMoreActions(employee: EmployeeApi.HrmEmployeeVO) {
  const actions: Array<{ command: string; label: string }> = []
  if (checkPermi(['hrm:insurance:employee-info:update']) && isEmployeeInsuranceEligible(employee)) {
    actions.push({ command: 'insurance-scheme', label: '设置参保方案' })
  }
  if (checkPermi(['hrm:employee:update'])) {
    if (employee.entryStatus === HrmEmployeeEntryStatus.PENDING_ENTRY) {
      actions.push({ command: 'confirm-entry', label: '确认入职' })
    } else if (employee.entryStatus === HrmEmployeeEntryStatus.LEFT) {
      actions.push(
        { command: 'rehire', label: '办理再入职' },
        { command: 'quit', label: '修改离职信息' }
      )
    } else if (
      employee.entryStatus === HrmEmployeeEntryStatus.ACTIVE ||
      employee.entryStatus === HrmEmployeeEntryStatus.PENDING_LEAVE
    ) {
      if (employee.status === HrmEmployeeStatus.PROBATION) {
        actions.push({ command: 'regular', label: '办理转正' })
      }
      actions.push(
        { command: 'transfer', label: '调整部门/岗位' },
        { command: 'promotion', label: '晋升' },
        { command: 'demotion', label: '降级' }
      )
      if (
        employee.status === HrmEmployeeStatus.INTERN ||
        employee.status === HrmEmployeeStatus.PART_TIME
      ) {
        actions.push({ command: 'full-time', label: '转为全职' })
      }
      if (employee.entryStatus === HrmEmployeeEntryStatus.ACTIVE) {
        actions.push({ command: 'quit', label: '办理离职' })
      } else {
        actions.push({ command: 'cancel-quit', label: '取消离职' })
      }
    }
  }
  if (checkPermi(['hrm:employee:delete'])) {
    actions.push({ command: 'delete', label: '删除' })
  }
  return actions
}

const regularFormRef = ref<InstanceType<typeof EmployeeRegularForm>>() // 转正表单 Ref
const transferFormRef = ref<InstanceType<typeof EmployeeTransferForm>>() // 调岗表单 Ref
const promoteFormRef = ref<InstanceType<typeof EmployeePromoteForm>>() // 晋升表单 Ref
const demoteFormRef = ref<InstanceType<typeof EmployeeDemoteForm>>() // 降级表单 Ref
const fullTimeFormRef = ref<InstanceType<typeof EmployeeFullTimeForm>>() // 转全职表单 Ref
const quitFormRef = ref<InstanceType<typeof EmployeeQuitForm>>() // 离职表单 Ref

/** 办理员工离职 */
function openQuit(employee: EmployeeApi.HrmEmployeeVO) {
  quitFormRef.value?.open(employee)
}

/** 员工更多操作 */
async function handleMoreCommand(command: string, employee: EmployeeApi.HrmEmployeeVO) {
  if (!employee.id) {
    return
  }
  // 设置参保方案
  if (command === 'insurance-scheme') {
    insuranceSchemeFormRef.value?.open([employee.id])
    return
  }
  // 办理转正
  if (command === 'regular') {
    regularFormRef.value?.open(employee)
    return
  }
  // 调整部门或岗位
  if (command === 'transfer') {
    transferFormRef.value?.open(employee)
    return
  }
  // 晋升
  if (command === 'promotion') {
    promoteFormRef.value?.open(employee)
    return
  }
  // 降级
  if (command === 'demotion') {
    demoteFormRef.value?.open(employee)
    return
  }
  // 转为全职
  if (command === 'full-time') {
    fullTimeFormRef.value?.open(employee)
    return
  }
  // 确认入职
  if (command === 'confirm-entry') {
    formRef.value.open('confirm', employee.id)
    return
  }
  // 办理再入职
  if (command === 'rehire') {
    openRehire(employee.id)
    return
  }
  // 办理离职
  if (command === 'quit') {
    openQuit(employee)
    return
  }
  // 取消离职
  if (command === 'cancel-quit') {
    try {
      const { value } = await ElMessageBox.prompt(
        `请输入取消员工“${employee.name}”离职安排的原因`,
        '取消离职',
        {
          inputValidator: (reason: string) => {
            if (!reason.trim()) {
              return '取消原因不能为空'
            }
            return reason.length <= 500 || '取消原因不能超过 500 个字符'
          }
        }
      )
      await EmployeeApi.cancelEmployeeQuit({ employeeId: employee.id, reason: value })
      message.success('已取消离职')
      await handleEmployeeChanged()
    } catch {}
    return
  }
  // 删除员工
  if (command === 'delete') {
    await handleDelete(employee.id)
  }
}

/** 刷新员工数据 */
async function handleEmployeeChanged() {
  checkedIds.value = []
  checkedEmployees.value = []
  await refreshList()
}

const checkedIds = ref<number[]>([]) // 选中的编号
const checkedEmployees = ref<EmployeeApi.HrmEmployeeVO[]>([]) // 选中的员工

/** 表格选择变化操作 */
function handleSelectionChange(rows: EmployeeApi.HrmEmployeeVO[]) {
  checkedEmployees.value = rows
  checkedIds.value = rows.map((row) => row.id).filter((id): id is number => id !== undefined)
}

const exportLoading = ref(false) // 导出的加载中

/** 导出按钮操作 */
async function handleExport() {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    exportLoading.value = true
    // 发起导出
    const data = await EmployeeApi.exportEmployee(queryParams)
    download.excel(data, '员工档案.xlsx')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 删除按钮操作 */
async function handleDelete(id?: number) {
  if (id === undefined) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await EmployeeApi.deleteEmployee(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await handleEmployeeChanged()
  } catch {}
}

const batchDeleteLoading = ref(false) // 批量删除的加载中

/** 批量删除员工 */
async function handleBatchDelete() {
  if (!checkedIds.value.length) {
    return
  }
  const ids = [...checkedIds.value]
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${ids.length} 份员工档案吗？已绑定的后台账号及历史业务记录将保留。`,
      '批量删除员工',
      {
        confirmButtonText: '确 定',
        cancelButtonText: '取 消',
        type: 'warning'
      }
    )
    batchDeleteLoading.value = true
    // 发起删除
    await EmployeeApi.deleteEmployeeList(ids)
    message.success(t('common.delSuccess'))
    await handleEmployeeChanged()
  } catch {
  } finally {
    batchDeleteLoading.value = false
  }
}

/** 批量操作 */
async function handleBatchCommand(command: string) {
  if (command === 'insurance-scheme') {
    const eligibleEmployees = checkedEmployees.value.filter(isEmployeeInsuranceEligible)
    if (eligibleEmployees.length !== checkedEmployees.value.length) {
      message.warning('只能为正式或试用且未离职的员工设置参保方案')
      return
    }
    insuranceSchemeFormRef.value?.open(
      eligibleEmployees
        .map((employee) => employee.id)
        .filter((id): id is number => id !== undefined)
    )
    return
  }
  if (command === 'delete') {
    await handleBatchDelete()
    return
  }
  if (command === 'send-profile-fill-message') {
    await handleSendArchiveFillMessage()
  }
}

/** 发送填写员工档案通知 */
async function handleSendArchiveFillMessage() {
  if (!checkedIds.value.length) {
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定向选中的 ${checkedIds.value.length} 名员工发送填写档案通知吗？`,
      '发送填写档案通知',
      { confirmButtonText: '发送', cancelButtonText: '取消', type: 'info' }
    )
    const result = await EmployeeApi.sendEmployeeProfileFillMessage([...checkedIds.value])
    message.success(
      `通知发送完成：成功 ${result.successCount} 人，跳过 ${result.skippedCount} 人，失败 ${result.failureCount} 人`
    )
  } catch {}
}

/** 员工是否允许配置参保方案 */
function isEmployeeInsuranceEligible(employee: EmployeeApi.HrmEmployeeVO) {
  return (
    (employee.status === HrmEmployeeStatus.REGULAR ||
      employee.status === HrmEmployeeStatus.PROBATION) &&
    employee.entryStatus !== HrmEmployeeEntryStatus.LEFT
  )
}

/** 首页跳转、缓存页面再次进入及浏览器前进后退时同步筛选 */
watch(
  () => [
    route.path,
    route.query.statusCategory,
    route.query.surveyType,
    route.query.todoType,
    route.query.leaderEmployeeId
  ],
  () => {
    if (route.path !== employeePath) {
      return
    }
    applyHomeFilter()
    handleQuery()
  },
  { immediate: true }
)
</script>
