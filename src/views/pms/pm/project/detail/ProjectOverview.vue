<template>
  <!-- 项目一览：统一布局和信息层级 -->
  <div v-loading="loading" class="grid grid-cols-2 gap-16px max-[1200px]:grid-cols-1">
    <!-- 项目公告 -->
    <el-card class="min-h-300px" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-600">项目公告</span>
          <el-button v-if="editable" link type="primary" @click="openAnnouncementConfig">
            <Icon icon="ep:plus" />新建公告
          </el-button>
        </div>
      </template>
      <el-empty v-if="!latestAnnouncement" :image-size="64" description="暂无公告" />
      <template v-else>
        <div class="min-h-178px rounded-4px bg-[var(--el-fill-color-light)] p-18px">
          <div class="flex items-center gap-12px">
            <el-avatar :size="40">
              {{ latestAnnouncement.creatorUserName?.slice(0, 1) || '-' }}
            </el-avatar>
            <div>
              <div class="font-600">{{ latestAnnouncement.creatorUserName || '-' }}</div>
              <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
                发布于 {{ formatDate(latestAnnouncement.createTime) }}
              </div>
            </div>
          </div>
          <div class="mt-18px line-clamp-4 whitespace-pre-wrap leading-24px">
            {{ latestAnnouncement.content }}
          </div>
        </div>
        <el-button class="mt-12px" link type="primary" @click="openAnnouncementConfig">
          查看全部公告
        </el-button>
      </template>
    </el-card>

    <!-- 敏捷项目迭代；通用项目展示工作项趋势 -->
    <el-card v-if="isAgileProject" class="min-h-300px" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-8px">
            <span class="font-600">项目迭代</span>
            <span class="text-12px text-[var(--el-text-color-secondary)]">
              共 {{ iterations.length }} 个未完成迭代
            </span>
          </div>
          <el-button link type="primary" @click="openIterationList">查看更多</el-button>
        </div>
      </template>
      <el-empty v-if="iterations.length === 0" :image-size="64" description="暂无未完成迭代" />
      <div v-else class="max-h-220px overflow-y-auto">
        <div
          v-for="iteration in iterations"
          :key="iteration.id"
          class="cursor-pointer rounded-4px border-0 border-b border-solid border-[var(--el-border-color-lighter)] p-10px last:border-b-0 hover:bg-[var(--el-fill-color-light)]"
          @click="openIteration(iteration)"
        >
          <div class="flex items-center justify-between gap-8px">
            <span class="truncate font-500">{{ iteration.name }}</span>
            <el-tag :type="getIterationStatusTagType(iteration.status)" size="small">
              {{ getIterationStatusName(iteration.status) }}
            </el-tag>
          </div>
          <div
            class="mt-6px flex items-center gap-10px text-12px text-[var(--el-text-color-secondary)]"
          >
            <span>
              {{ formatDate(iteration.startTime, 'YYYY-MM-DD') || '--' }} 至
              {{ formatDate(iteration.endTime, 'YYYY-MM-DD') || '--' }}
            </span>
            <span v-if="iteration.progress !== undefined">完成 {{ iteration.progress }}%</span>
          </div>
          <el-progress
            class="mt-6px"
            :percentage="iteration.progress || 0"
            :stroke-width="6"
            :show-text="false"
          />
        </div>
      </div>
    </el-card>
    <el-card v-else class="min-h-300px" shadow="never">
      <template #header>
        <div class="flex items-center gap-8px">
          <span class="font-600">工作项趋势</span>
          <span class="text-12px text-[var(--el-text-color-secondary)]">近 14 日已完成</span>
        </div>
      </template>
      <Echart :height="220" :options="trendChartOptions" />
    </el-card>

    <!-- 项目基本信息 -->
    <el-card class="min-h-300px" shadow="never">
      <template #header>
        <span class="font-600">项目基本信息</span>
      </template>
      <el-descriptions :column="2">
        <el-descriptions-item label="项目名称" :span="2">
          {{ project.name }}
        </el-descriptions-item>
        <el-descriptions-item label="项目周期" :span="2">
          {{ formatDate(project.startTime, 'YYYY-MM-DD') || '未设置' }} 至
          {{ formatDate(project.endTime, 'YYYY-MM-DD') || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="项目管理员">
          {{ project.adminNames.join('、') || '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="项目成员"> {{ project.memberCount }} 人 </el-descriptions-item>
        <el-descriptions-item label="项目进度" :span="2">
          <el-progress :percentage="formatProjectCompletionRate(project)" :stroke-width="8" />
        </el-descriptions-item>
        <el-descriptions-item label="项目描述" :span="2">
          {{ project.description || '暂无项目描述' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 分配给我的 -->
    <el-card class="min-h-300px" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-600">分配给我的</span>
          <el-button link type="primary" @click="openAssignedWorkItems">查看更多</el-button>
        </div>
      </template>
      <el-empty
        v-if="overview.assignedWorkItems.length === 0"
        description="暂无工作项"
        :image-size="64"
      />
      <div
        v-for="item in overview.assignedWorkItems.slice(0, 5)"
        :key="item.id"
        class="flex cursor-pointer items-center gap-8px border-0 border-b border-solid border-[var(--el-border-color-lighter)] py-10px last:border-b-0"
        @click="openWorkItem(item.id)"
      >
        <div class="min-w-0 flex-1">
          <div class="truncate">{{ item.name }}</div>
          <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
            #{{ item.serialNumber }} · {{ getWorkItemTypeName(item.type) }}
          </div>
        </div>
        <el-progress :percentage="item.progress" :show-text="false" :stroke-width="6" />
      </div>
    </el-card>
  </div>
  <!-- 工作项详情 -->
  <WorkItemDetail ref="workItemDetailRef" @success="getProjectOverview" />
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import { useUserStore } from '@/store/modules/user'
import * as ProjectApi from '@/api/pms/pm/project'
import * as ProjectAnnouncementApi from '@/api/pms/pm/project/announcement'
import * as IterationApi from '@/api/pms/pm/iteration'
import { formatDate } from '@/utils/formatTime'
import { getAllPageItems } from '@/utils/page'
import WorkItemDetail from '@/views/pms/pm/workitem/detail/WorkItemDetail.vue'
import { PmsIterationStatus, PmsProjectType } from '@/views/pms/pm/utils/constants'
import {
  formatProjectCompletionRate,
  getWorkItemTypeName,
  getIterationStatusName,
  getIterationStatusTagType
} from '@/views/pms/pm/utils/format'

defineOptions({ name: 'PmsProjectOverview' })

const props = defineProps<{
  project: ProjectApi.PmsProjectVO
  editable: boolean
}>()

const { push } = useRouter() // 路由操作
const loading = ref(false) // 项目概况加载中
const announcements = ref<ProjectAnnouncementApi.PmsProjectAnnouncementVO[]>([]) // 项目公告
const iterations = ref<IterationApi.PmsIterationVO[]>([]) // 敏捷项目未完成迭代
const overview = ref<ProjectApi.PmsProjectOverviewVO>({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  typeCountMap: {},
  completedTrends: [],
  assignedWorkItems: []
}) // 项目概况
const latestAnnouncement = computed(() => announcements.value[0]) // 最新项目公告
const isAgileProject = computed(() => props.project.type === PmsProjectType.AGILE)
const trendChartOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { top: 0, data: ['工作项数量'] },
  grid: { top: 44, right: 18, bottom: 14, left: 12, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: overview.value.completedTrends.map((point) => point.date.slice(5)),
    axisTick: { show: false }
  },
  yAxis: { type: 'value', minInterval: 1, axisTick: { show: false } },
  series: [
    {
      name: '工作项数量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: overview.value.completedTrends.map((point) => point.count),
      lineStyle: { width: 2, color: '#409eff' },
      itemStyle: { color: '#409eff' }
    }
  ]
})) // 近 14 日完成工作项折线图
const workItemDetailRef = ref<InstanceType<typeof WorkItemDetail>>() // 工作项详情 Ref

/** 查询项目概况 */
async function getProjectOverview() {
  loading.value = true
  try {
    // 并行加载页面所需数据
    const iterationPromise = isAgileProject.value
      ? getAllPageItems<IterationApi.PmsIterationVO>((pageNo, pageSize) => {
          const params = { pageNo, pageSize, projectId: props.project.id }
          return IterationApi.getIterationPage(params)
        })
      : Promise.resolve([] as IterationApi.PmsIterationVO[])
    const [currentOverview, currentAnnouncements, currentIterations] = await Promise.all([
      ProjectApi.getProjectOverview(props.project.id),
      ProjectAnnouncementApi.getProjectAnnouncementList(props.project.id),
      iterationPromise
    ])
    overview.value = currentOverview
    announcements.value = currentAnnouncements
    iterations.value = currentIterations.filter(
      (iteration) => iteration.status !== PmsIterationStatus.COMPLETED
    )
  } finally {
    loading.value = false
  }
}

/** 打开项目公告配置 */
function openAnnouncementConfig() {
  push({
    name: 'PmsProjectConfig',
    params: {
      id: props.project.id
    },
    query: {
      tabs: 'announcement'
    }
  })
}

/** 进入当前项目的全部事项并筛选当前用户负责的事项 */
function openAssignedWorkItems() {
  push({
    name: 'PmsProjectDetail',
    params: { id: props.project.id },
    query: {
      tabs: isAgileProject.value ? 'all' : 'task',
      assigneeUserId: String(useUserStore().getUser.id)
    }
  })
}

/** 打开工作项详情 */
function openWorkItem(id: number) {
  workItemDetailRef.value?.open(id)
}

/** 进入项目迭代列表 */
function openIterationList() {
  push({
    name: 'PmsProjectDetail',
    params: { id: props.project.id },
    query: { tabs: 'iteration' }
  })
}

/** 进入迭代详情 */
function openIteration(iteration: IterationApi.PmsIterationVO) {
  if (!iteration.id) return
  push({ name: 'PmsIterationDetail', params: { id: iteration.id } })
}

/** 初始化 */
onMounted(() => {
  getProjectOverview()
})
</script>
