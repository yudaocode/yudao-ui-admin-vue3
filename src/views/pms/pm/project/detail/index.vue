<template>
  <ContentWrap v-loading="loading">
    <!-- 项目工作区标题 -->
    <div class="flex items-center justify-between gap-16px pb-16px">
      <div class="flex min-w-0 items-center gap-12px">
        <el-button circle @click="close">
          <Icon icon="ep:arrow-left" />
        </el-button>
        <div class="min-w-0">
          <h2 class="m-0 truncate text-20px font-600">{{ project.name }}</h2>
          <div class="mt-4px text-13px text-[var(--el-text-color-secondary)]">
            {{ project.description || '暂无项目描述' }}
          </div>
        </div>
      </div>
      <el-dropdown v-if="project.id" trigger="click" @command="handleProjectCommand">
        <el-button>
          更多
          <Icon class="ml-4px" icon="ep:arrow-down" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="project.memberStatus" command="favorite">
              {{ project.favoriteStatus ? '取消星标' : '星标项目' }}
            </el-dropdown-item>
            <el-dropdown-item v-if="project.adminStatus" command="config">
              项目设置
            </el-dropdown-item>
            <el-dropdown-item v-if="project.exitStatus" command="exit" divided>
              退出项目
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-tabs
      v-if="project.id"
      v-model="activeTab"
      class="[&_.el-tabs__header]:!mb-20px"
      @tab-change="handleTabChange"
    >
      <el-tab-pane label="项目概况" lazy name="overview">
        <ProjectOverview v-if="activeTab === 'overview'" :editable="editable" :project="project" />
      </el-tab-pane>
      <el-tab-pane v-if="agileProject" label="待规划" lazy name="planning">
        <PlanningBoard :editable="editable" :project-id="project.id" :project-type="project.type" />
      </el-tab-pane>
      <el-tab-pane v-if="agileProject" label="迭代" lazy name="iteration">
        <IterationList :editable="editable" :project-id="project.id" />
      </el-tab-pane>
      <el-tab-pane v-if="agileProject" label="全部事项" lazy name="all">
        <WorkItemAllList
          :editable="editable"
          :project-id="project.id"
          :project-type="project.type"
        />
      </el-tab-pane>
      <el-tab-pane v-if="agileProject" label="需求" lazy name="requirement">
        <WorkItemList
          :editable="editable"
          :project-id="project.id"
          :project-type="project.type"
          :type="PmsWorkItemType.REQUIREMENT"
        />
      </el-tab-pane>
      <el-tab-pane label="任务" lazy name="task">
        <WorkItemList
          default-view-mode="board"
          :editable="editable"
          :project-id="project.id"
          :project-type="project.type"
          :type="PmsWorkItemType.TASK"
        />
      </el-tab-pane>
      <el-tab-pane v-if="agileProject" label="缺陷" lazy name="defect">
        <WorkItemList
          :editable="editable"
          :project-id="project.id"
          :project-type="project.type"
          :type="PmsWorkItemType.DEFECT"
        />
      </el-tab-pane>
      <el-tab-pane label="甘特图" lazy name="gantt">
        <ProjectGantt :editable="editable" :project-id="project.id" :project-type="project.type" />
      </el-tab-pane>
      <el-tab-pane v-if="agileProject" label="工时" lazy name="worklog">
        <ProjectWorkLog
          :editable="editable"
          :project-id="project.id"
          :project-type="project.type"
        />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as ProjectApi from '@/api/pms/pm/project'
import * as ProjectFavoriteApi from '@/api/pms/pm/project/favorite'
import * as ProjectMemberApi from '@/api/pms/pm/project/member'
import { PmsProjectStatus, PmsProjectType, PmsWorkItemType } from '@/views/pms/pm/utils/constants'
import IterationList from '@/views/pms/pm/iteration/list/IterationList.vue'
import WorkItemAllList from '@/views/pms/pm/workitem/list/WorkItemAllList.vue'
import WorkItemList from '@/views/pms/pm/workitem/list/WorkItemList.vue'
import PlanningBoard from './PlanningBoard.vue'
import ProjectGantt from './ProjectGantt.vue'
import ProjectOverview from './ProjectOverview.vue'
import ProjectWorkLog from './ProjectWorkLog.vue'

defineOptions({ name: 'PmsProjectDetail' })

type ProjectDetailTab =
  | 'overview'
  | 'planning'
  | 'iteration'
  | 'all'
  | 'requirement'
  | 'task'
  | 'defect'
  | 'gantt'
  | 'worklog'

const message = useMessage() // 消息弹窗
const { delView } = useTagsViewStore() // 视图操作
const { push, replace, currentRoute } = useRouter() // 路由操作
const route = useRoute() // 当前路由
const loading = ref(true) // 项目详情加载中
const project = ref<ProjectApi.PmsProjectVO>({} as ProjectApi.PmsProjectVO) // 项目详情
const activeTab = ref<ProjectDetailTab>('task') // 当前项目详情页签
const agileProject = computed(() => project.value.type === PmsProjectType.AGILE) // 是否为敏捷项目
const editable = computed(
  () => project.value.writeStatus && project.value.status === PmsProjectStatus.ACTIVE
) // 当前用户是否可以编辑项目业务数据
const agileTabs: ProjectDetailTab[] = [
  'overview',
  'planning',
  'iteration',
  'all',
  'requirement',
  'task',
  'defect',
  'gantt',
  'worklog'
] // 敏捷项目页签
const generalTabs: ProjectDetailTab[] = ['overview', 'task', 'gantt'] // 普通项目页签

/** 查询项目详情 */
async function getProject() {
  loading.value = true
  try {
    // 1. 查询项目详情
    project.value = await ProjectApi.getProject(Number(route.params.id))
    // 2. 初始化当前业务页签
    initActiveTab()
  } finally {
    loading.value = false
  }
}

/** 初始化当前业务页签 */
function initActiveTab() {
  const availableTabs = agileProject.value ? agileTabs : generalTabs
  const requestedTab =
    typeof route.query.tabs === 'string' ? (route.query.tabs as ProjectDetailTab) : undefined
  activeTab.value = requestedTab && availableTabs.includes(requestedTab) ? requestedTab : 'task'
}

/** 切换项目详情页签 */
function handleTabChange(tab: string | number) {
  replace({
    query: {
      ...route.query,
      tabs: String(tab)
    }
  })
}

/** 切换项目关注状态 */
async function handleCollect() {
  if (project.value.favoriteStatus) {
    await ProjectFavoriteApi.deleteProjectFavorite(project.value.id)
  } else {
    await ProjectFavoriteApi.createProjectFavorite(project.value.id)
  }
  // 更新当前页面的关注状态
  project.value.favoriteStatus = !project.value.favoriteStatus
  message.success(project.value.favoriteStatus ? '收藏成功' : '已取消收藏')
}

/** 处理项目更多操作 */
function handleProjectCommand(command: string) {
  if (command === 'favorite') {
    handleCollect()
  } else if (command === 'config') {
    openProjectConfig()
  } else if (command === 'exit') {
    handleExit()
  }
}

/** 打开项目配置 */
function openProjectConfig() {
  push({
    name: 'PmsProjectConfig',
    params: {
      id: project.value.id
    }
  })
}

/** 主动退出项目 */
async function handleExit() {
  try {
    // 1. 退出的二次确认
    await message.confirm(
      `确认退出项目“${project.value.name}”吗？退出后将不能访问该项目，需要项目管理员重新邀请才能加入。`
    )
    // 2. 发起退出
    await ProjectMemberApi.exitProject(project.value.id)
    message.success('已退出项目')
    close()
  } catch {}
}

/** 关闭项目详情 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'PmsProject' })
}

/** 初始化 */
onMounted(() => {
  if (!route.params.id || Number.isNaN(Number(route.params.id))) {
    message.warning('参数错误，项目不能为空！')
    close()
    return
  }
  getProject()
})

/** 同步浏览器前进、后退触发的页签变化 */
watch(
  () => route.query.tabs,
  () => {
    if (project.value.id) initActiveTab()
  }
)
</script>
