<template>
  <PerformancePlanDetailsHeader :loading="loading" :plan="plan" @back="close">
    <el-space wrap>
      <el-button
        v-if="isEditable"
        v-hasPermi="['hrm:performance:plan:update']"
        type="primary"
        @click="openForm"
      >
        <Icon class="mr-5px" icon="ep:edit" />编辑
      </el-button>
      <el-button v-else type="primary" plain @click="openSettings">
        <Icon class="mr-5px" icon="ep:view" />查看考核设置
      </el-button>
      <el-button
        v-if="isEditable"
        v-hasPermi="['hrm:performance:plan:update']"
        type="success"
        @click="handleAction('start')"
      >
        启动
      </el-button>
      <el-button
        v-if="plan.status === HrmPerformancePlanStatus.RUNNING && plan.scoringReady"
        v-hasPermi="['hrm:performance:plan:update']"
        type="warning"
        @click="handleAction('open')"
      >
        开启评分
      </el-button>
      <el-dropdown v-if="showMoreActions" trigger="click">
        <el-button>更多<Icon class="ml-5px" icon="ep:arrow-down" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-if="plan.status === HrmPerformancePlanStatus.RUNNING && plan.interviewReady"
              @click="handleAction('interview')"
            >
              发起面谈
            </el-dropdown-item>
            <el-dropdown-item
              v-if="plan.status === HrmPerformancePlanStatus.RUNNING && plan.archiveReady"
              @click="handleAction('archive')"
            >
              归档
            </el-dropdown-item>
            <el-dropdown-item
              v-if="plan.status === HrmPerformancePlanStatus.RUNNING"
              @click="handleAction('terminate')"
            >
              终止
            </el-dropdown-item>
            <el-dropdown-item v-if="isEditable" @click="handleDelete">删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-space>
  </PerformancePlanDetailsHeader>

  <el-col>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="详细资料" name="details">
        <PerformancePlanDetailsInfo :plan="plan" />
      </el-tab-pane>
      <el-tab-pane :label="`参评员工（${employeeTotal}）`" name="employees">
        <ContentWrap>
          <el-form
            ref="employeeQueryFormRef"
            :inline="true"
            :model="employeeQuery"
            class="-mb-15px"
            label-width="76px"
          >
            <el-form-item label="员工信息" prop="search">
              <el-input
                v-model="employeeQuery.search"
                clearable
                class="!w-220px"
                placeholder="请输入姓名、工号或手机号"
                @keyup.enter="handleEmployeeQuery"
              />
            </el-form-item>
            <el-form-item label="部门" prop="deptId">
              <DeptSelect v-model="employeeQuery.deptId" class="!w-180px" />
            </el-form-item>
            <el-form-item label="聘用形式" prop="employeeType">
              <el-select
                v-model="employeeQuery.employeeType"
                clearable
                class="!w-150px"
                placeholder="请选择"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_TYPE)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="员工状态" prop="employeeStatus">
              <el-select
                v-model="employeeQuery.employeeStatus"
                clearable
                class="!w-150px"
                placeholder="请选择"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_STATUS)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="当前阶段" prop="stageType">
              <el-select
                v-model="employeeQuery.stageType"
                clearable
                class="!w-150px"
                placeholder="请选择"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="结果等级">
              <el-select
                v-model="resultLevelFilter"
                clearable
                class="!w-140px"
                placeholder="请选择"
              >
                <el-option v-for="level in levelList" :key="level" :label="level" :value="level" />
                <el-option label="未定级" :value="RESULT_LEVEL_EMPTY_VALUE" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button @click="handleEmployeeQuery">
                <Icon icon="ep:search" class="mr-5px" />搜索
              </el-button>
              <el-button @click="resetEmployeeQuery">
                <Icon icon="ep:refresh" class="mr-5px" />重置
              </el-button>
              <el-button
                v-if="isEditable"
                v-hasPermi="['hrm:performance:plan:update']"
                plain
                type="primary"
                @click="assessmentAddFormRef?.open(id)"
              >
                <Icon icon="ep:plus" class="mr-5px" />添加员工
              </el-button>
              <el-button
                v-if="isEditable"
                v-hasPermi="['hrm:performance:plan:update']"
                :disabled="!selectedEmployeeIds.length"
                plain
                type="danger"
                @click="handleRemoveEmployees"
              >
                <Icon icon="ep:delete" class="mr-5px" />移除员工
              </el-button>
            </el-form-item>
          </el-form>
        </ContentWrap>
        <ContentWrap>
          <div v-if="stageCountList.length" class="mb-12px flex flex-wrap gap-8px">
            <el-tag v-for="item in stageCountList" :key="item.stageType" effect="plain">
              {{
                getDictLabel(DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS, item.stageType) || '未知阶段'
              }}（{{ item.count }}）
            </el-tag>
          </div>
          <el-table
            ref="employeeTableRef"
            v-loading="employeeLoading"
            :data="employeeList"
            row-key="id"
            @selection-change="handleEmployeeSelectionChange"
          >
            <el-table-column v-if="isEditable" type="selection" width="50" />
            <el-table-column label="员工姓名" prop="employeeName" min-width="130">
              <template #default="scope">
                <el-button link type="primary" @click="openAssessmentDetail(scope.row.id)">
                  {{ scope.row.employeeName || '-' }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="工号" prop="jobNumber" min-width="120" />
            <el-table-column label="手机号" prop="mobile" min-width="130" />
            <el-table-column label="部门" prop="deptName" min-width="130" show-overflow-tooltip />
            <el-table-column align="center" label="聘用形式" width="100">
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.HRM_EMPLOYEE_TYPE" :value="scope.row.employeeType" />
              </template>
            </el-table-column>
            <el-table-column align="center" label="员工状态" width="100">
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.HRM_EMPLOYEE_STATUS" :value="scope.row.employeeStatus" />
              </template>
            </el-table-column>
            <el-table-column align="center" label="阶段" width="120">
              <template #default="scope">
                <dict-tag
                  :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
                  :value="scope.row.stageType"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="当前处理人"
              prop="currentHandlerName"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column align="center" label="分数" prop="score" width="90" />
            <el-table-column align="center" label="等级" prop="resultLevel" width="90" />
            <el-table-column align="center" label="系数" prop="coefficient" width="90" />
          </el-table>
          <Pagination
            v-model:page="employeeQuery.pageNo"
            v-model:limit="employeeQuery.pageSize"
            :total="employeeTotal"
            @pagination="getEmployeeList"
          />
        </ContentWrap>
      </el-tab-pane>
      <el-tab-pane label="操作日志" name="operateLog">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <PerformancePlanAssessmentAddForm ref="assessmentAddFormRef" @success="getData" />
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { TableInstance } from 'element-plus'
import type { OperateLogVO } from '@/api/system/operatelog'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { getOperateLogPage } from '@/api/hrm/operate-log'
import * as PerformancePlanApi from '@/api/hrm/performance/plan'
import * as PerformanceAssessmentApi from '@/api/hrm/performance/assessment'
import { HrmBizType, HrmPerformancePlanStatus } from '@/views/hrm/utils/constants'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import PerformancePlanAssessmentAddForm from '../PerformancePlanAssessmentAddForm.vue'
import PerformancePlanDetailsHeader from './PerformancePlanDetailsHeader.vue'
import PerformancePlanDetailsInfo from './PerformancePlanDetailsInfo.vue'

defineOptions({ name: 'HrmPerformancePlanDetail' })

const RESULT_LEVEL_EMPTY_VALUE = '__RESULT_LEVEL_EMPTY__' // 未定级绩效结果的筛选哨兵值
const route = useRoute() // 当前路由
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 页签操作
const id = (parseId(route.params.id) as number) // 绩效计划编号
const loading = ref(false) // 详情加载中
const employeeLoading = ref(false) // 参评员工加载中
const plan = ref<PerformancePlanApi.PerformancePlanVO>({ name: '' }) // 绩效计划
const employeeList = ref<PerformanceAssessmentApi.PerformanceAssessmentVO[]>([]) // 参评员工列表
const employeeTotal = ref(0) // 参评员工总数
const levelList = ref<string[]>([]) // 结果等级列表
const stageCountList = ref<PerformanceAssessmentApi.PerformanceStageCountVO[]>([]) // 阶段统计列表
const selectedEmployeeIds = ref<number[]>([]) // 选中的员工编号
const logList = ref<OperateLogVO[]>([]) // 操作日志列表
const activeTab = ref(route.query.tab === 'employees' ? 'employees' : 'details') // 当前页签
const assessmentAddFormRef = ref<InstanceType<typeof PerformancePlanAssessmentAddForm>>() // 新增考核表单 Ref
const employeeQueryFormRef = ref() // 员工搜索表单 Ref
const employeeTableRef = ref<TableInstance>() // 员工表格 Ref
const employeeQuery = reactive({
  pageNo: 1,
  pageSize: 10,
  planId: id,
  search: undefined,
  deptId: undefined,
  employeeType: undefined,
  employeeStatus: undefined,
  stageType: undefined,
  resultLevel: undefined as string | undefined,
  resultLevelEmpty: undefined as boolean | undefined
})
const resultLevelFilter = computed({
  get: () =>
    employeeQuery.resultLevelEmpty ? RESULT_LEVEL_EMPTY_VALUE : employeeQuery.resultLevel,
  set: (value?: string) => {
    employeeQuery.resultLevel = value && value !== RESULT_LEVEL_EMPTY_VALUE ? value : undefined
    employeeQuery.resultLevelEmpty = value === RESULT_LEVEL_EMPTY_VALUE ? true : undefined
  }
})
const isEditable = computed(
  () =>
    plan.value.status === HrmPerformancePlanStatus.DRAFT ||
    plan.value.status === HrmPerformancePlanStatus.NOT_STARTED
)
const showMoreActions = computed(
  () => isEditable.value || plan.value.status === HrmPerformancePlanStatus.RUNNING
)

/** 关闭详情 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmPerformancePlan' })
}

/** 打开 KPI 考核表单 */
function openForm() {
  push({
    name: 'HrmPerformancePlanForm',
    query: { type: 'update', id }
  })
}

/** 查看 KPI 考核设置 */
function openSettings() {
  push({
    name: 'HrmPerformancePlanForm',
    query: { type: 'view', id }
  })
}

/** 打开员工考核详情 */
function openAssessmentDetail(assessmentId?: number) {
  if (!assessmentId) {
    return
  }
  push({
    name: 'HrmPerformanceAssessmentDetail',
    params: { id: assessmentId },
    query: { planId: id }
  })
}

/** 获得计划详情 */
async function getPlan() {
  loading.value = true
  try {
    const data = await PerformancePlanApi.getPerformancePlan(id)
    if (!data) {
      close()
      return
    }
    plan.value = data
  } finally {
    loading.value = false
  }
}

/** 获得参评员工 */
async function getEmployeeList() {
  employeeLoading.value = true
  try {
    const data = await PerformanceAssessmentApi.getPerformanceAssessmentPage(employeeQuery)
    employeeList.value = data.list
    employeeTotal.value = data.total
    selectedEmployeeIds.value = []
    employeeTableRef.value?.clearSelection()
  } finally {
    employeeLoading.value = false
  }
}

/** 获得参评员工统计 */
async function getEmployeeStatistics() {
  const [stageCounts, levelCounts] = await Promise.all([
    PerformancePlanApi.getPerformancePlanStageCount(id),
    PerformancePlanApi.getPerformancePlanLevelCount(id)
  ])
  stageCountList.value = stageCounts
  levelList.value = levelCounts
    .map((item) => item.levelName)
    .filter((levelName): levelName is string => !!levelName)
}

/** 获得操作日志 */
async function getOperateLog() {
  const data = await getOperateLogPage({
    bizType: HrmBizType.PERFORMANCE_PLAN,
    bizId: id
  })
  logList.value = data.list
}

/** 刷新详情 */
async function getData() {
  await Promise.all([getPlan(), getEmployeeList(), getEmployeeStatistics(), getOperateLog()])
}

/** 搜索参评员工 */
function handleEmployeeQuery() {
  employeeQuery.pageNo = 1
  getEmployeeList()
}

/** 重置参评员工搜索 */
function resetEmployeeQuery() {
  employeeQueryFormRef.value?.resetFields()
  resultLevelFilter.value = undefined
  handleEmployeeQuery()
}

/** 处理参评员工选择 */
function handleEmployeeSelectionChange(rows: PerformanceAssessmentApi.PerformanceAssessmentVO[]) {
  selectedEmployeeIds.value = rows
    .map((row) => row.employeeId)
    .filter((employeeId): employeeId is number => !!employeeId)
}

/** 移除参评员工 */
async function handleRemoveEmployees() {
  try {
    await message.confirm(`确认移除选中的 ${selectedEmployeeIds.value.length} 名参评员工？`)
    await PerformanceAssessmentApi.removePerformancePlanEmployees({
      planId: id,
      employeeIds: selectedEmployeeIds.value
    })
    message.success('参评员工移除成功')
    await getData()
  } catch {}
}

/** 执行计划生命周期操作 */
async function handleAction(action: 'start' | 'open' | 'interview' | 'archive' | 'terminate') {
  const actionName = {
    start: '启动计划',
    open: '开启评分',
    interview: '发起绩效面谈',
    archive: '归档计划',
    terminate: '终止计划'
  }[action]
  try {
    await message.confirm(`确认${actionName}？`)
    if (action === 'start') {
      await PerformancePlanApi.startPerformancePlan(id)
    } else if (action === 'open') {
      await PerformancePlanApi.openPerformancePlanScoring(id)
    } else if (action === 'interview') {
      await PerformancePlanApi.startPerformancePlanInterview(id)
    } else if (action === 'archive') {
      await PerformancePlanApi.archivePerformancePlan(id)
    } else {
      await PerformancePlanApi.terminatePerformancePlan(id)
    }
    message.success(t('common.updateSuccess'))
    if (action === 'terminate') {
      close()
      return
    }
    await getData()
  } catch {}
}

/** 删除绩效计划 */
async function handleDelete() {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PerformancePlanApi.deletePerformancePlan(id)
    message.success(t('common.delSuccess'))
    close()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getData()
})
</script>
