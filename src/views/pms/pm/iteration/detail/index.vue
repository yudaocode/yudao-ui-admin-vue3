<template>
  <ContentWrap v-loading="loading">
    <!-- 迭代详情标题 -->
    <div class="mb-16px flex items-center justify-between gap-16px">
      <div class="flex min-w-0 items-center gap-12px">
        <el-button circle @click="close">
          <Icon icon="ep:arrow-left" />
        </el-button>
        <div class="min-w-0">
          <div class="flex items-center gap-8px">
            <h2 class="m-0 truncate text-20px font-600">
              {{ iteration?.name || '迭代详情' }}
            </h2>
            <el-tag v-if="iteration" :type="getIterationStatusTagType(iteration.status)">
              {{ getIterationStatusName(iteration.status) }}
            </el-tag>
          </div>
          <div class="mt-4px text-13px text-[var(--el-text-color-secondary)]">
            {{ iteration?.target || '暂无迭代目标' }}
          </div>
        </div>
      </div>
      <div v-if="iteration && editable" class="flex shrink-0 items-center gap-8px">
        <el-button
          v-if="
            iteration.status === PmsIterationStatus.PLANNED &&
            checkPermi(['pms:pm:iteration:update'])
          "
          type="primary"
          @click="openStartForm"
        >
          开始迭代
        </el-button>
        <el-button
          v-if="
            iteration.status === PmsIterationStatus.ACTIVE &&
            checkPermi(['pms:pm:iteration:update'])
          "
          type="primary"
          @click="handleComplete"
        >
          完成迭代
        </el-button>
        <el-dropdown trigger="click" @command="handleIterationCommand">
          <el-button aria-label="更多操作"><Icon icon="ep:more-filled" /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="checkPermi(['pms:pm:iteration:update'])" command="edit">
                编辑迭代
              </el-dropdown-item>
              <el-dropdown-item
                v-if="checkPermi(['pms:pm:iteration:delete'])"
                command="delete"
                divided
              >
                删除迭代
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 迭代概览与事项 -->
    <div v-if="iteration">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="概览" name="overview">
          <!-- 迭代核心指标 -->
          <el-row :gutter="12">
            <el-col v-for="card in cards" :key="card.label" :span="6">
              <el-card shadow="never">
                <div class="text-13px text-[var(--el-text-color-secondary)]">{{ card.label }}</div>
                <div class="mt-8px text-24px font-600">{{ card.value }}</div>
              </el-card>
            </el-col>
          </el-row>
          <div class="my-18px">
            <div class="mb-8px flex justify-between">
              <span>迭代进度</span><span>{{ overview.progress }}%</span>
            </div>
            <el-progress :percentage="overview.progress" :stroke-width="12" />
          </div>
          <!-- 迭代信息与事项类型分布 -->
          <el-row :gutter="16">
            <el-col :span="12">
              <el-card header="迭代信息" shadow="never">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="状态">
                    {{ getIterationStatusName(iteration?.status) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="负责人">
                    {{ iteration?.ownerUserName || '未设置' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="开始时间">
                    {{ formatDate(iteration?.startTime, 'YYYY-MM-DD') || '--' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="结束时间">
                    {{ formatDate(iteration?.endTime, 'YYYY-MM-DD') || '--' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="迭代目标" :span="2">
                    {{ iteration?.target || '未设置' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="参与成员" :span="2">
                    {{ teamNames.join('、') || '暂无参与成员' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="迭代描述" :span="2">
                    {{ iteration?.description || '暂无描述' }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card header="事项分布" shadow="never">
                <Echart :height="220" :options="distributionChartOptions" />
              </el-card>
            </el-col>
          </el-row>
          <!-- 状态趋势与燃尽数据 -->
          <el-row class="mt-16px" :gutter="16">
            <el-col :span="12">
              <el-card header="事项状态趋势" shadow="never">
                <Echart :height="210" :options="statusTrendChartOptions" />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card header="燃尽数据" shadow="never">
                <!-- 列表 -->
                <el-table :data="overview.burnDowns" height="210" size="small">
                  <el-table-column label="日期" prop="date" />
                  <el-table-column align="center" label="理想剩余工时" prop="idealRemaining" />
                  <el-table-column align="center" label="实际剩余工时" prop="actualRemaining" />
                </el-table>
              </el-card>
            </el-col>
          </el-row>
          <!-- 状态分布与最近活动 -->
          <el-row class="mt-16px items-stretch" :gutter="16">
            <el-col class="!flex" :span="12">
              <el-card class="h-full w-full" header="当前状态分布" shadow="never">
                <div
                  v-for="item in statusDistribution"
                  :key="item.name"
                  class="min-h-56px flex items-center gap-12px"
                >
                  <span class="!w-56px">{{ item.name }}</span>
                  <el-progress
                    class="flex-1"
                    :percentage="getTypePercentage(item.count)"
                    :status="item.progressStatus"
                    :stroke-width="12"
                  />
                  <strong class="w-28px text-right">{{ item.count }}</strong>
                </div>
              </el-card>
            </el-col>
            <el-col class="!flex" :span="12">
              <el-card class="h-full w-full" header="最近活动" shadow="never">
                <el-empty
                  v-if="overview.recentActivities.length === 0"
                  :image-size="60"
                  description="暂无活动"
                />
                <el-timeline v-else class="max-h-260px overflow-y-auto pr-8px">
                  <el-timeline-item
                    v-for="activity in overview.recentActivities"
                    :key="activity.id"
                    :timestamp="formatDate(activity.createTime)"
                  >
                    <div>
                      <strong>{{ activity.operatorUserName || '系统' }}</strong>
                      {{ activity.content }}
                    </div>
                    <div class="mt-3px text-12px text-[var(--el-text-color-secondary)]">
                      #{{ activity.workItemSerialNumber }} {{ activity.workItemName }}
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
        <!-- 迭代事项 -->
        <el-tab-pane :label="`事项（${workItemList.length}）`" name="items">
          <el-tabs v-model="activeWorkItemTab" type="card">
            <el-tab-pane label="全部" lazy name="all">
              <WorkItemAllList
                :editable="editable"
                :iteration-id="iteration.id"
                :project-id="iteration.projectId"
                :project-type="project?.type || PmsProjectType.AGILE"
                @changed="loadData"
              />
            </el-tab-pane>
            <el-tab-pane label="需求" lazy name="requirement">
              <WorkItemList
                default-view-mode="board"
                :editable="editable"
                :iteration-id="iteration.id"
                :project-id="iteration.projectId"
                :project-type="project?.type || PmsProjectType.AGILE"
                :type="PmsWorkItemType.REQUIREMENT"
                @changed="loadData"
              />
            </el-tab-pane>
            <el-tab-pane label="任务" lazy name="task">
              <WorkItemList
                default-view-mode="board"
                :editable="editable"
                :iteration-id="iteration.id"
                :project-id="iteration.projectId"
                :project-type="project?.type || PmsProjectType.AGILE"
                :type="PmsWorkItemType.TASK"
                @changed="loadData"
              />
            </el-tab-pane>
            <el-tab-pane label="缺陷" lazy name="defect">
              <WorkItemList
                default-view-mode="board"
                :editable="editable"
                :iteration-id="iteration.id"
                :project-id="iteration.projectId"
                :project-type="project?.type || PmsProjectType.AGILE"
                :type="PmsWorkItemType.DEFECT"
                @changed="loadData"
              />
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
      </el-tabs>
    </div>
  </ContentWrap>
  <!-- 迭代编辑和开始弹窗 -->
  <IterationForm ref="formRef" @success="handleIterationChanged" />
  <IterationStartForm ref="startFormRef" @success="handleIterationChanged" />
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import * as IterationApi from '@/api/pms/pm/iteration'
import * as ProjectApi from '@/api/pms/pm/project'
import * as WorkItemApi from '@/api/pms/pm/workitem'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import {
  PmsIterationStatus,
  PmsIterationOverviewCardOptions,
  PmsProjectStatus,
  PmsProjectType,
  PmsWorkItemStatusType,
  PmsWorkItemType
} from '@/views/pms/pm/utils/constants'
import { getAllPageItems } from '@/utils/page'
import WorkItemAllList from '@/views/pms/pm/workitem/list/WorkItemAllList.vue'
import WorkItemList from '@/views/pms/pm/workitem/list/WorkItemList.vue'
import IterationForm from '@/views/pms/pm/iteration/components/IterationForm.vue'
import IterationStartForm from '@/views/pms/pm/iteration/components/IterationStartForm.vue'
import { getIterationStatusName, getIterationStatusTagType } from '@/views/pms/pm/utils/format'

defineOptions({ name: 'PmsIterationDetail' })

const { push } = useRouter() // 路由操作
const route = useRoute() // 当前路由
const message = useMessage() // 消息弹窗
const loading = ref(false) // 数据加载中
const activeTab = ref<'overview' | 'items'>('overview') // 当前详情页签
const activeWorkItemTab = ref<'all' | 'requirement' | 'task' | 'defect'>('all') // 当前事项类型页签
const iteration = ref<IterationApi.PmsIterationVO>() // 当前迭代
const project = ref<ProjectApi.PmsProjectVO>() // 所属项目
const workItemList = ref<WorkItemApi.PmsWorkItemVO[]>([]) // 迭代事项列表
const formRef = ref<InstanceType<typeof IterationForm>>() // 迭代表单 Ref
const startFormRef = ref<InstanceType<typeof IterationStartForm>>() // 开始迭代表单 Ref
const editable = computed(() =>
  Boolean(project.value?.writeStatus && project.value.status === PmsProjectStatus.ACTIVE)
) // 是否允许编辑迭代
const overview = ref<IterationApi.PmsIterationOverviewVO>({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  progress: 0,
  typeCountMap: {},
  typeStatusCountMap: {},
  statusTrends: [],
  burnDowns: [],
  recentActivities: []
}) // 迭代概览
const cards = computed(() =>
  PmsIterationOverviewCardOptions.map((option) => ({
    label: option.label,
    value: overview.value[option.field]
  }))
) // 状态统计卡片
const typeDistribution = computed(() =>
  getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE).map((option) => ({
    type: option.value,
    name: option.label,
    count: overview.value.typeCountMap[option.value] || 0
  }))
) // 事项类型分布
const statusTrendChartOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['已完成', '进行中', '未开始'] },
  grid: { top: 40, right: 16, bottom: 12, left: 12, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: overview.value.statusTrends.map((item) => item.date.slice(5))
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '已完成',
      type: 'line',
      data: overview.value.statusTrends.map((item) => item.completedCount),
      itemStyle: { color: '#36b37e' }
    },
    {
      name: '进行中',
      type: 'line',
      data: overview.value.statusTrends.map((item) => item.processingCount),
      itemStyle: { color: '#ffab00' }
    },
    {
      name: '未开始',
      type: 'line',
      data: overview.value.statusTrends.map((item) => item.pendingCount),
      itemStyle: { color: '#0065ff' }
    }
  ]
})) // 近 14 天事项状态趋势
const distributionChartOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0, data: ['已完成', '进行中', '未开始'] },
  grid: { top: 10, right: 16, bottom: 36, left: 12, containLabel: true },
  xAxis: { type: 'value', minInterval: 1 },
  yAxis: { type: 'category', data: typeDistribution.value.map((item) => item.name) },
  series: [
    {
      name: '已完成',
      type: 'bar',
      stack: 'total',
      data: typeDistribution.value.map(
        (item) =>
          overview.value.typeStatusCountMap[item.type]?.[PmsWorkItemStatusType.COMPLETED] || 0
      ),
      itemStyle: { color: '#36b37e' }
    },
    {
      name: '进行中',
      type: 'bar',
      stack: 'total',
      data: typeDistribution.value.map(
        (item) =>
          overview.value.typeStatusCountMap[item.type]?.[PmsWorkItemStatusType.PROCESSING] || 0
      ),
      itemStyle: { color: '#ffab00' }
    },
    {
      name: '未开始',
      type: 'bar',
      stack: 'total',
      data: typeDistribution.value.map(
        (item) => overview.value.typeStatusCountMap[item.type]?.[PmsWorkItemStatusType.PENDING] || 0
      ),
      itemStyle: { color: '#0065ff' }
    }
  ]
})) // 事项类型和状态交叉分布
const statusDistribution = computed(() => {
  const statusCountMap = {
    [PmsWorkItemStatusType.PENDING]: overview.value.pendingCount,
    [PmsWorkItemStatusType.PROCESSING]: overview.value.processingCount,
    [PmsWorkItemStatusType.COMPLETED]: overview.value.completedCount
  }
  return getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE).map((option) => ({
    name: option.label,
    count: statusCountMap[option.value],
    progressStatus:
      option.value === PmsWorkItemStatusType.COMPLETED ? ('success' as const) : undefined
  }))
}) // 当前状态分布
const teamNames = computed(() => {
  const names = new Set<string>()
  workItemList.value.forEach((item) => {
    if (item.assigneeUserName) names.add(item.assigneeUserName)
    item.memberUserNames?.forEach((name) => names.add(name))
  })
  return Array.from(names)
}) // 迭代参与成员

/** 加载迭代概览数据 */
async function loadData() {
  if (!iteration.value) return
  loading.value = true
  try {
    const currentIteration = iteration.value
    // 并行加载页面所需数据
    const [currentOverview, currentWorkItems] = await Promise.all([
      IterationApi.getIterationOverview(currentIteration.id!),
      getAllPageItems<WorkItemApi.PmsWorkItemVO>((pageNo, pageSize) => {
        const params = {
          pageNo,
          pageSize,
          projectId: currentIteration.projectId,
          iterationId: currentIteration.id
        }
        return WorkItemApi.getWorkItemPage(params)
      })
    ])
    overview.value = currentOverview
    workItemList.value = currentWorkItems
  } finally {
    loading.value = false
  }
}

/** 计算工作项类型占比 */
function getTypePercentage(count: number) {
  return overview.value.totalCount > 0 ? Math.round((count * 100) / overview.value.totalCount) : 0
}

/** 打开开始迭代弹窗 */
function openStartForm() {
  if (iteration.value) {
    startFormRef.value?.open(iteration.value)
  }
}

/** 处理迭代更多操作 */
function handleIterationCommand(command: 'edit' | 'delete') {
  if (!iteration.value) return
  if (command === 'edit') {
    formRef.value?.open('update', iteration.value.projectId, iteration.value.id)
    return
  }
  handleDelete()
}

/** 完成迭代 */
async function handleComplete() {
  if (!iteration.value) return
  try {
    await message.confirm(`确认完成迭代“${iteration.value.name}”吗？`)
    await IterationApi.completeIteration(iteration.value.id!)
    message.success('迭代已完成')
    await handleIterationChanged()
  } catch {}
}

/** 删除迭代 */
async function handleDelete() {
  if (!iteration.value) return
  try {
    await message.delConfirm(`确认删除迭代“${iteration.value.name}”吗？`)
    await IterationApi.deleteIteration(iteration.value.id!)
    message.success('删除成功')
    close()
  } catch {}
}

/** 刷新迭代详情和概览 */
async function handleIterationChanged() {
  if (!iteration.value?.id) return
  iteration.value = await IterationApi.getIteration(iteration.value.id)
  await loadData()
}

/** 返回所属项目的迭代列表 */
function close() {
  if (!iteration.value) {
    return
  }
  push({
    name: 'PmsProjectDetail',
    params: { id: iteration.value.projectId },
    query: { tabs: 'iteration' }
  })
}

/** 初始化 */
onMounted(async () => {
  loading.value = true
  try {
    // 1. 查询迭代及所属项目
    iteration.value = await IterationApi.getIteration(Number(route.params.id))
    project.value = await ProjectApi.getProject(iteration.value.projectId)
    // 2. 加载迭代统计和事项
    await loadData()
  } finally {
    loading.value = false
  }
})
</script>
