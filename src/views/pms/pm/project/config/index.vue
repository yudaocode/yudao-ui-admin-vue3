<template>
  <ContentWrap v-loading="loading">
    <!-- 项目设置标题 -->
    <div class="mb-16px flex items-center gap-12px">
      <div
        class="h-48px w-48px flex shrink-0 items-center justify-center rounded-6px border border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)] text-[var(--el-color-primary)]"
      >
        <Icon :icon="project.icon || 'ep:folder'" :size="30" />
      </div>
      <div class="min-w-0">
        <h2 class="m-0 truncate text-20px font-600">项目设置</h2>
        <div class="mt-4px text-13px text-[var(--el-text-color-secondary)]">
          {{ project.name || '项目' }}
        </div>
      </div>
    </div>

    <!-- 项目设置页签 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="基本信息" name="basic">
        <ProjectBasicInfo
          v-if="project.id"
          :editable="editable"
          :project="project"
          @success="getProject"
        />
      </el-tab-pane>
      <el-tab-pane label="成员" lazy name="member">
        <ProjectMemberList v-if="project.id" :editable="editable" :project="project" />
      </el-tab-pane>
      <el-tab-pane label="项目公告" lazy name="announcement">
        <ProjectAnnouncementList v-if="project.id" :editable="editable" :project-id="project.id" />
      </el-tab-pane>
      <el-tab-pane label="协作配置" name="configuration">
        <ProjectCollaborationConfig
          v-if="project.id"
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
import { PmsProjectStatus } from '@/views/pms/pm/utils/constants'
import ProjectAnnouncementList from './ProjectAnnouncementList.vue'
import ProjectBasicInfo from './ProjectBasicInfo.vue'
import ProjectCollaborationConfig from './ProjectCollaborationConfig.vue'
import ProjectMemberList from './ProjectMemberList.vue'

defineOptions({ name: 'PmsProjectConfig' })

type ProjectConfigTab = 'basic' | 'member' | 'announcement' | 'configuration'

const message = useMessage() // 消息弹窗
const route = useRoute() // 当前路由
const { push, resolve, currentRoute } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 页签视图操作
const loading = ref(false) // 项目设置加载中
const project = ref<ProjectApi.PmsProjectVO>({} as ProjectApi.PmsProjectVO) // 项目详情
const activeTab = ref<ProjectConfigTab>('basic') // 当前配置页签
const projectId = computed(() => Number(route.params.id)) // 当前项目编号
const editable = computed(
  () => project.value.writeStatus && project.value.status === PmsProjectStatus.ACTIVE
) // 当前项目是否允许编辑

/** 查询项目详情 */
async function getProject() {
  loading.value = true
  try {
    project.value = await ProjectApi.getProject(projectId.value)
  } finally {
    loading.value = false
  }
}

/** 切换项目设置页签 */
function handleTabChange(tab: string | number) {
  const tabs = String(tab)
  const url = resolve({
    name: String(route.name),
    params: route.params,
    query: {
      ...route.query,
      tabs
    }
  }).href
  window.history.replaceState(window.history.state, '', url)
}

/** 根据路由初始化项目设置页签 */
function initActiveTab() {
  activeTab.value = String(route.query.tabs || 'basic') as ProjectConfigTab
}

/** 关闭项目设置 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'PmsProjectDetail', params: { id: projectId.value } })
}

/** 初始化 */
onMounted(() => {
  if (!projectId.value || Number.isNaN(projectId.value)) {
    message.warning('参数错误，项目不能为空！')
    close()
    return
  }
  // 初始化路由指定页签
  initActiveTab()
  // 查询项目设置基础数据
  getProject()
})

/** 同步浏览器前进、后退触发的页签变化 */
watch(
  () => route.query.tabs,
  () => initActiveTab()
)
</script>
