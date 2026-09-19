<template>
  <doc-alert
    title="【PMS】项目中心、工作台与项目管理"
    url="https://doc.iocoder.cn/pms/pm/project/"
  />

  <ContentWrap v-loading="favoriteLoading">
    <!-- 星标项目 -->
    <div class="mb-16px flex items-baseline gap-12px">
      <span class="text-16px font-600">星标项目</span>
      <span class="text-13px text-[var(--el-text-color-secondary)]"> 快速访问经常使用的项目 </span>
    </div>
    <div
      v-if="favoriteProjectList.length"
      class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-12px"
    >
      <div
        v-for="project in favoriteProjectList"
        :key="project.id"
        class="relative flex min-w-0 cursor-pointer items-start gap-12px rounded-6px border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)] py-16px pl-16px pr-52px transition-[border-color] hover:border-[var(--el-color-primary-light-5)]"
        @click="openProjectDetail(project)"
      >
        <span
          class="inline-flex h-34px w-34px shrink-0 items-center justify-center rounded-6px bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)]"
        >
          <Icon :icon="project.icon || 'ep:folder'" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="truncate font-500 text-[var(--el-color-primary)]">
            {{ project.name }}
          </div>
          <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
            {{ project.description || `${formatProjectType(project.type)} · 暂无项目描述` }}
          </div>
          <el-progress
            class="mt-10px"
            :percentage="formatProjectCompletionRate(project)"
            :stroke-width="5"
            :show-text="false"
          />
          <Echart
            v-if="project.completedTrends"
            class="mt-6px"
            :height="56"
            :options="getFavoriteTrendChartOptions(project)"
          />
        </div>
        <el-tooltip content="取消星标" placement="top">
          <el-button
            aria-label="取消星标"
            class="absolute right-12px top-12px !text-[var(--el-color-warning)]"
            link
            @click.stop="handleCollect(project)"
          >
            <Icon :size="20" icon="ep:star-filled" />
          </el-button>
        </el-tooltip>
        <div class="absolute bottom-8px right-12px" @click.stop>
          <el-dropdown @command="(command) => handleProjectCommand(command, project)">
            <el-button aria-label="更多操作" link>
              <Icon :size="18" icon="ep:more-filled" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="project.adminStatus"
                  v-hasPermi="['pms:pm:project:update']"
                  command="config"
                >
                  项目设置
                </el-dropdown-item>
                <template v-if="project.memberStatus">
                  <el-dropdown-item disabled divided>移动到分组</el-dropdown-item>
                  <el-dropdown-item
                    v-for="group in movableGroupList"
                    :key="group.id"
                    :command="`group:${group.id}`"
                  >
                    {{ group.name }}
                  </el-dropdown-item>
                </template>
                <el-dropdown-item
                  v-if="project.exitStatus"
                  v-hasPermi="['pms:pm:project-member:query']"
                  command="exit"
                  divided
                >
                  退出项目
                </el-dropdown-item>
                <template v-if="checkPermi(['pms:pm:project:update'])">
                  <el-dropdown-item
                    v-if="project.adminStatus"
                    command="archive"
                    :divided="!project.exitStatus"
                  >
                    归档项目
                  </el-dropdown-item>
                  <el-dropdown-item v-if="project.adminStatus" command="recycle">
                    移入回收站
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
    <el-empty v-else :image-size="72" description="暂无星标项目" />
  </ContentWrap>

  <ContentWrap>
    <!-- 搜索 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入项目名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="排序方式" prop="sortType">
        <el-select v-model="queryParams.sortType" class="!w-240px" @change="handleQuery">
          <el-option label="按访问时间" :value="PmsProjectSortType.ACCESS_TIME" />
          <el-option label="按创建时间" :value="PmsProjectSortType.CREATE_TIME" />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="queryParams.sceneType === PmsProjectSceneType.PARTICIPATED"
        label="个人分组"
        prop="groupId"
      >
        <el-select
          v-model="queryParams.groupId"
          class="!w-240px"
          placeholder="请选择个人分组"
          @change="handleQuery"
        >
          <el-option
            v-for="group in groupList"
            :key="group.id"
            :label="`${group.name}（${group.projectCount}）`"
            :value="group.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" />
          重置
        </el-button>
        <el-button
          v-hasPermi="['pms:pm:project:create']"
          type="primary"
          @click="openForm('create')"
        >
          新建项目
        </el-button>
        <el-button v-hasPermi="['pms:pm:project-group:query']" @click="openGroupManageDialog">
          管理分组
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <!-- 项目范围 -->
    <el-tabs v-model="queryParams.sceneType" class="-mt-8px" @tab-change="handleSceneChange">
      <el-tab-pane label="全部项目" :name="PmsProjectSceneType.ALL" />
      <el-tab-pane label="我负责的" :name="PmsProjectSceneType.MANAGED" />
      <el-tab-pane label="我参与的" :name="PmsProjectSceneType.PARTICIPATED" />
    </el-tabs>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="projectList" :show-overflow-tooltip="true">
      <el-table-column fixed="left" label="项目名称" min-width="220">
        <template #default="scope">
          <div class="flex items-center">
            <span
              class="mr-10px inline-flex h-34px w-34px items-center justify-center rounded-6px bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)]"
            >
              <Icon :icon="scope.row.icon || 'ep:folder'" />
            </span>
            <div class="flex min-w-0 items-center gap-8px">
              <div
                class="truncate cursor-pointer font-500 text-[var(--el-color-primary)]"
                @click="openProjectDetail(scope.row)"
              >
                {{ scope.row.name }}
              </div>
              <el-tag effect="plain" size="small" type="info">
                {{ formatProjectTypeShort(scope.row.type) }}
              </el-tag>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="完成度" min-width="200">
        <template #default="scope">
          <div class="flex items-center gap-12px">
            <el-progress
              class="flex-1"
              :percentage="formatProjectCompletionRate(scope.row)"
              :show-text="false"
            />
            <el-tooltip content="已完成 / 未开始 / 进行中" placement="top">
              <span class="whitespace-nowrap text-12px text-[var(--el-text-color-secondary)]">
                {{ formatProjectWorkItemCounts(scope.row) }}
              </span>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column align="center" label="截止时间" prop="endTime" width="140">
        <template #default="scope">
          <el-tag v-if="scope.row.endTime" effect="plain" type="info">
            {{ formatDate(scope.row.endTime, 'M月D日截止') }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        width="170"
      />
      <el-table-column label="管理员" min-width="140">
        <template #default="scope">{{ scope.row.adminNames.join('、') || '-' }}</template>
      </el-table-column>
      <el-table-column
        v-if="queryParams.sceneType !== PmsProjectSceneType.ALL"
        align="center"
        width="72"
      >
        <template #header>
          <el-tooltip content="是否星标" placement="top">
            <Icon :size="17" icon="ep:star" />
          </el-tooltip>
        </template>
        <template #default="scope">
          <el-switch :model-value="scope.row.favoriteStatus" @change="handleCollect(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="76">
        <template #default="scope">
          <el-dropdown @command="(command) => handleProjectCommand(command, scope.row)">
            <el-button link type="primary">更多</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="scope.row.adminStatus"
                  v-hasPermi="['pms:pm:project:update']"
                  command="config"
                >
                  项目设置
                </el-dropdown-item>
                <template v-if="isParticipatedProjectScene && scope.row.memberStatus">
                  <el-dropdown-item disabled divided>移动到分组</el-dropdown-item>
                  <el-dropdown-item
                    v-for="group in movableGroupList"
                    :key="group.id"
                    :command="`group:${group.id}`"
                  >
                    {{ group.name }}
                  </el-dropdown-item>
                </template>
                <el-dropdown-item
                  v-if="scope.row.exitStatus"
                  v-hasPermi="['pms:pm:project-member:query']"
                  command="exit"
                  divided
                >
                  退出项目
                </el-dropdown-item>
                <template v-if="checkPermi(['pms:pm:project:update'])">
                  <el-dropdown-item
                    v-if="scope.row.adminStatus"
                    command="archive"
                    :divided="!scope.row.exitStatus"
                  >
                    归档项目
                  </el-dropdown-item>
                  <el-dropdown-item v-if="scope.row.adminStatus" command="recycle">
                    移入回收站
                  </el-dropdown-item>
                </template>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getProjectList"
    />
  </ContentWrap>

  <!-- 新建或修改项目 -->
  <ProjectForm ref="formRef" @success="handleProjectChanged" />
  <!-- 管理项目分组 -->
  <ProjectGroupList ref="groupListRef" @success="getGroupList" />
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import Echart from '@/components/Echart/src/Echart.vue'
import * as ProjectApi from '@/api/pms/pm/project'
import * as ProjectFavoriteApi from '@/api/pms/pm/project/favorite'
import * as ProjectMemberApi from '@/api/pms/pm/project/member'
import * as ProjectGroupApi from '@/api/pms/pm/project/group'
import {
  PmsProjectGroupType,
  PmsProjectSceneType,
  PmsProjectSortType,
  PmsProjectStatus,
  PmsProjectType
} from '@/views/pms/pm/utils/constants'
import {
  formatProjectCompletionRate,
  formatProjectType,
  formatProjectTypeShort,
  formatProjectWorkItemCounts
} from '@/views/pms/pm/utils/format'
import ProjectForm from '../components/ProjectForm.vue'
import ProjectGroupList from './components/group/ProjectGroupList.vue'

defineOptions({ name: 'PmsProjectList' })

const message = useMessage() // 消息弹窗
const { push, replace } = useRouter() // 路由
const route = useRoute() // 当前路由
const PROJECT_SCENE_TAB_MAP: Record<number, string> = {
  [PmsProjectSceneType.ALL]: 'all',
  [PmsProjectSceneType.MANAGED]: 'owner',
  [PmsProjectSceneType.PARTICIPATED]: 'participate'
} // 项目范围与路由页签参数的映射
const initialized = ref(false) // 页面是否完成初始化
const loading = ref(true) // 列表加载中
const favoriteLoading = ref(false) // 星标项目加载中
const total = ref(0) // 列表总数
const projectList = ref<ProjectApi.PmsProjectVO[]>([]) // 项目列表
const favoriteProjectList = ref<ProjectApi.PmsProjectVO[]>([]) // 星标项目列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  sceneType: getProjectSceneByRoute() as number,
  groupId: undefined as number | undefined,
  status: PmsProjectStatus.ACTIVE,
  sortType: PmsProjectSortType.ACCESS_TIME as number
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref
const groupList = ref<ProjectGroupApi.PmsProjectGroupVO[]>([]) // 当前用户的个人项目分组列表
const formRef = ref<InstanceType<typeof ProjectForm>>() // 项目表单 Ref
const groupListRef = ref<InstanceType<typeof ProjectGroupList>>() // 项目分组列表弹窗 Ref
const isParticipatedProjectScene = computed(
  () => queryParams.sceneType === PmsProjectSceneType.PARTICIPATED
) // 是否“我参与的项目”场景
const movableGroupList = computed(() =>
  groupList.value.filter((group) => group.type !== PmsProjectGroupType.ALL)
) // 可以移动到的个人分组

/** 生成星标项目近十四日完成趋势图配置 */
function getFavoriteTrendChartOptions(project: ProjectApi.PmsProjectVO): EChartsOption {
  const trends = project.completedTrends || []
  return {
    animation: false,
    grid: { top: 8, right: 8, bottom: 8, left: 8 },
    xAxis: { type: 'category', show: false, data: trends.map((item) => item.date.slice(5)) },
    yAxis: { type: 'value', show: false, minInterval: 1 },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: trends.map((item) => item.count),
        lineStyle: { width: 2, color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.12)' }
      }
    ]
  }
}

/** 根据路由页签参数获得项目范围 */
function getProjectSceneByRoute() {
  const tabs = typeof route.query.tabs === 'string' ? route.query.tabs : undefined
  const sceneType = Object.entries(PROJECT_SCENE_TAB_MAP).find(([, tab]) => tab === tabs)?.[0]
  return sceneType ? Number(sceneType) : PmsProjectSceneType.PARTICIPATED
}

/** 查询项目分页 */
async function getProjectList() {
  loading.value = true
  try {
    const data = await ProjectApi.getProjectPage(queryParams)
    projectList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询星标项目列表 */
async function getFavoriteProjectList() {
  favoriteLoading.value = true
  try {
    const projects = await ProjectApi.getFavoriteProjectList()
    favoriteProjectList.value = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        completedTrends: (await ProjectApi.getProjectOverview(project.id)).completedTrends
      }))
    )
  } finally {
    favoriteLoading.value = false
  }
}

/** 查询个人项目分组 */
async function getGroupList() {
  groupList.value = await ProjectGroupApi.getProjectGroupList()
  if (!queryParams.groupId) {
    queryParams.groupId = groupList.value.find(
      (group) => group.type === PmsProjectGroupType.ALL
    )?.id
  }
}

/** 打开项目详情 */
function openProjectDetail(project: ProjectApi.PmsProjectVO) {
  push({
    name: 'PmsProjectDetail',
    params: {
      id: project.id
    },
    query:
      project.type === PmsProjectType.AGILE
        ? {
            tabs: 'planning'
          }
        : undefined
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getProjectList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.sceneType = getProjectSceneByRoute()
  queryParams.status = PmsProjectStatus.ACTIVE
  queryParams.sortType = PmsProjectSortType.ACCESS_TIME
  queryParams.groupId = groupList.value.find((group) => group.type === PmsProjectGroupType.ALL)?.id
  handleQuery()
}

/** 切换项目范围 */
function handleSceneChange() {
  replace({
    name: 'PmsProjectList',
    query: {
      ...route.query,
      tabs: PROJECT_SCENE_TAB_MAP[queryParams.sceneType]
    }
  })
}

/** 打开项目表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 打开项目设置 */
function openProjectConfig(id: number) {
  push({
    name: 'PmsProjectConfig',
    params: { id }
  })
}

/** 打开项目分组管理弹窗 */
function openGroupManageDialog() {
  groupListRef.value?.open()
}

/** 移动项目到个人分组 */
async function handleMoveGroup(projectId: number, groupId: number) {
  await ProjectGroupApi.moveProjectToGroup({ projectId, groupId })
  message.success('项目分组已更新')
  // 并行加载页面所需数据
  await Promise.all([getProjectList(), getGroupList()])
}

/** 星标或取消星标项目 */
async function handleCollect(project: ProjectApi.PmsProjectVO) {
  if (project.favoriteStatus) {
    await ProjectFavoriteApi.deleteProjectFavorite(project.id)
  } else {
    await ProjectFavoriteApi.createProjectFavorite(project.id)
  }
  const favoriteStatus = !project.favoriteStatus
  message.success(favoriteStatus ? '星标成功' : '已取消星标')
  await Promise.all([getProjectList(), getFavoriteProjectList()])
}

/** 主动退出项目 */
async function handleExit(project: ProjectApi.PmsProjectVO) {
  try {
    // 退出的二次确认
    await message.confirm(
      `确认退出项目“${project.name}”吗？退出后将不能访问该项目，需要项目管理员重新邀请才能加入。`
    )
    // 发起退出
    await ProjectMemberApi.exitProject(project.id)
    message.success('已退出项目')
    await handleProjectChanged()
  } catch {}
}

/** 处理项目生命周期操作 */
async function handleProjectCommand(command: string, project: ProjectApi.PmsProjectVO) {
  if (command === 'config') {
    openProjectConfig(project.id)
    return
  }
  if (command === 'exit') {
    await handleExit(project)
    return
  }
  if (command.startsWith('group:')) {
    await handleMoveGroup(project.id, Number(command.substring('group:'.length)))
    return
  }
  try {
    // 操作的二次确认
    if (command === 'archive') {
      await message.confirm(`确认归档项目“${project.name}”吗？`)
      await ProjectApi.archiveProject(project.id)
      message.success('项目已归档')
    } else if (command === 'recycle') {
      await message.confirm(`确认将项目“${project.name}”移入回收站吗？`)
      await ProjectApi.recycleProject(project.id)
      message.success('项目已移入回收站')
    }
    await handleProjectChanged()
  } catch {}
}

/** 项目发生变化后刷新项目与个人分组 */
async function handleProjectChanged() {
  await Promise.all([getProjectList(), getGroupList(), getFavoriteProjectList()])
}

/** 初始化 */
onMounted(async () => {
  // 1. 修正无效的项目范围页签
  if (
    typeof route.query.tabs !== 'string' ||
    !Object.values(PROJECT_SCENE_TAB_MAP).includes(route.query.tabs)
  ) {
    await replace({
      name: 'PmsProjectList',
      query: {
        ...route.query,
        tabs: PROJECT_SCENE_TAB_MAP[PmsProjectSceneType.PARTICIPATED]
      }
    })
    queryParams.sceneType = getProjectSceneByRoute()
  }
  // 2.1 加载个人项目分组
  await getGroupList()
  // 2.2 并行加载项目列表和星标项目
  await Promise.all([getProjectList(), getFavoriteProjectList()])
  initialized.value = true
})

/** 监听路由页签变化并切换项目范围 */
watch(
  () => route.query.tabs,
  async () => {
    if (!initialized.value) {
      return
    }
    queryParams.status = PmsProjectStatus.ACTIVE
    queryParams.sceneType = getProjectSceneByRoute()
    queryParams.pageNo = 1
    await Promise.all([getProjectList(), getFavoriteProjectList()])
  }
)
</script>
