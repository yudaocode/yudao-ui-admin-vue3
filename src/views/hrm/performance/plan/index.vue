<template>
  <doc-alert
    title="【绩效】绩效模板、绩效计划"
    url="https://doc.iocoder.cn/hrm/performance/template-plan/"
  />

  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :model="queryParams"
      :inline="true"
      label-width="76px"
    >
      <el-form-item label="计划名称" prop="name">
        <el-input
          v-model="queryParams.name"
          clearable
          class="!w-220px"
          placeholder="请输入计划名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['hrm:performance:plan:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-tabs v-model="queryParams.status" class="-mt-10px mb-10px" @tab-change="handleStatusChange">
      <el-tab-pane
        v-for="tab in statusTabs"
        :key="tab.value"
        :label="`${tab.label}（${tab.count}）`"
        :name="tab.value"
      />
    </el-tabs>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="计划名称" prop="name" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        label="考核模板"
        prop="assessmentTemplateName"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column
        label="结果模板"
        prop="resultTemplateName"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column label="考核周期" align="center" prop="cycle" width="120" />
      <el-table-column label="起止日期" align="center" min-width="190">
        <template #default="scope">
          {{ formatHrmDateRange(scope.row.startTime, scope.row.endTime) }}
        </template>
      </el-table-column>
      <el-table-column label="参评/完成" align="center" width="110">
        <template #default="scope">
          {{ scope.row.employeeCount || 0 }} / {{ scope.row.finishedCount || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.HRM_PERFORMANCE_PLAN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="阶段" align="center" prop="stageType" width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS" :value="scope.row.stageType" />
        </template>
      </el-table-column>
      <el-table-column label="阶段人数" min-width="260">
        <template #default="scope">
          <div v-if="getStageCountList(scope.row).length" class="flex flex-wrap gap-6px">
            <el-tag
              v-for="item in getStageCountList(scope.row)"
              :key="item.stageType"
              effect="plain"
              size="small"
            >
              {{
                getDictLabel(DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS, item.stageType) || '未知阶段'
              }}（{{ item.count }}）
            </el-tag>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="170"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" min-width="380" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('view', scope.row.id)">
            查看考核设置
          </el-button>
          <el-button
            v-if="scope.row.status === HrmPerformancePlanStatus.NOT_STARTED"
            v-hasPermi="['hrm:performance:plan:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除考核
          </el-button>
          <el-button
            v-if="scope.row.status === HrmPerformancePlanStatus.NOT_STARTED"
            v-hasPermi="['hrm:performance:plan:update']"
            link
            type="success"
            @click="openDetail(scope.row.id, 'employees')"
          >
            检查并开启考核
          </el-button>
          <el-button
            v-if="scope.row.status === HrmPerformancePlanStatus.RUNNING && scope.row.scoringReady"
            v-hasPermi="['hrm:performance:plan:update']"
            link
            type="warning"
            @click="handleAction(scope.row, 'score')"
          >
            开始评分
          </el-button>
          <el-button
            v-if="scope.row.status === HrmPerformancePlanStatus.RUNNING && scope.row.interviewReady"
            v-hasPermi="['hrm:performance:plan:update']"
            link
            type="warning"
            @click="handleAction(scope.row, 'interview')"
          >
            发起绩效面谈
          </el-button>
          <el-button
            v-if="scope.row.status === HrmPerformancePlanStatus.RUNNING && scope.row.archiveReady"
            v-hasPermi="['hrm:performance:plan:update']"
            link
            type="success"
            @click="handleAction(scope.row, 'archive')"
          >
            归档
          </el-button>
          <el-button
            v-if="scope.row.status === HrmPerformancePlanStatus.RUNNING"
            v-hasPermi="['hrm:performance:plan:update']"
            link
            type="danger"
            @click="handleAction(scope.row, 'terminate')"
          >
            终止考核
          </el-button>
          <el-button
            v-if="
              scope.row.status === HrmPerformancePlanStatus.RUNNING ||
              scope.row.status === HrmPerformancePlanStatus.TERMINATED
            "
            link
            type="primary"
            @click="openDetail(scope.row.id, 'employees')"
          >
            {{ scope.row.status === HrmPerformancePlanStatus.TERMINATED ? '考核记录' : '考核结果' }}
          </el-button>
          <el-button
            v-if="scope.row.status === HrmPerformancePlanStatus.ARCHIVED"
            v-hasPermi="['hrm:performance:plan:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as PerformancePlanApi from '@/api/hrm/performance/plan'
import { HrmPerformancePlanStatus } from '@/views/hrm/utils/constants'
import { formatHrmDateRange } from '@/views/hrm/utils/format'

defineOptions({ name: 'HrmPerformancePlan' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由操作
const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<PerformancePlanApi.PerformancePlanVO[]>([]) // 列表的数据
const statusCount = ref<Record<number, number>>({}) // 状态数量
const queryFormRef = ref() // 搜索的表单
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  status: HrmPerformancePlanStatus.NOT_STARTED
})
const statusTabs = computed(() => [
  {
    label: '未开始',
    value: HrmPerformancePlanStatus.NOT_STARTED,
    count: statusCount.value[HrmPerformancePlanStatus.NOT_STARTED] || 0
  },
  {
    label: '进行中',
    value: HrmPerformancePlanStatus.RUNNING,
    count: statusCount.value[HrmPerformancePlanStatus.RUNNING] || 0
  },
  {
    label: '已归档',
    value: HrmPerformancePlanStatus.ARCHIVED,
    count: statusCount.value[HrmPerformancePlanStatus.ARCHIVED] || 0
  },
  {
    label: '已终止',
    value: HrmPerformancePlanStatus.TERMINATED,
    count: statusCount.value[HrmPerformancePlanStatus.TERMINATED] || 0
  }
])

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await PerformancePlanApi.getPerformancePlanPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询状态统计 */
async function getStatusCount() {
  statusCount.value = await PerformancePlanApi.getPerformancePlanStatusCount(queryParams)
}

/** 刷新列表和状态统计 */
async function refresh() {
  await Promise.all([getList(), getStatusCount()])
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  refresh()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value.resetFields()
  queryParams.status = HrmPerformancePlanStatus.NOT_STARTED
  handleQuery()
}

/** 切换状态 */
function handleStatusChange() {
  queryParams.pageNo = 1
  getList()
}

/** 打开 KPI 考核表单 */
function openForm(type: string, id?: number) {
  push({
    name: 'HrmPerformancePlanForm',
    query: { type, id }
  })
}

/** 打开绩效计划详情 */
function openDetail(id?: number, tab?: 'employees') {
  if (!id) {
    return
  }
  push({ name: 'HrmPerformancePlanDetail', params: { id }, query: tab ? { tab } : undefined })
}

/** 获得阶段人数列表 */
function getStageCountList(plan: PerformancePlanApi.PerformancePlanVO) {
  return Object.entries(plan.stageCountMap || {})
    .map(([stageType, count]) => ({ stageType: Number(stageType), count }))
    .filter((item) => item.count > 0)
    .sort((left, right) => left.stageType - right.stageType)
}

/** 执行绩效计划操作 */
async function handleAction(
  plan: PerformancePlanApi.PerformancePlanVO,
  action: 'score' | 'interview' | 'archive' | 'terminate'
) {
  const actionName = {
    score: '开始评分',
    interview: '发起绩效面谈',
    archive: '归档',
    terminate: '终止考核'
  }[action]
  try {
    await message.confirm(`确认${actionName}“${plan.name}”？`)
    if (action === 'score') {
      await PerformancePlanApi.openPerformancePlanScoring(plan.id!)
    } else if (action === 'interview') {
      await PerformancePlanApi.startPerformancePlanInterview(plan.id!)
    } else if (action === 'archive') {
      await PerformancePlanApi.archivePerformancePlan(plan.id!)
    } else {
      await PerformancePlanApi.terminatePerformancePlan(plan.id!)
    }
    message.success(t('common.updateSuccess'))
    await refresh()
  } catch {}
}

/** 删除绩效计划 */
async function handleDelete(plan: PerformancePlanApi.PerformancePlanVO) {
  try {
    // 删除的二次确认
    await message.delConfirm(`确认删除绩效计划“${plan.name}”？`)
    // 发起删除
    await PerformancePlanApi.deletePerformancePlan(plan.id!)
    message.success(t('common.delSuccess'))
    await refresh()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  refresh()
})
</script>
