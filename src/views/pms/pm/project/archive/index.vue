<template>
  <doc-alert
    title="【PMS】项目中心、工作台与项目管理"
    url="https://doc.iocoder.cn/pms/pm/project/"
  />

  <ContentWrap>
    <el-table v-loading="loading" :data="projectList" :show-overflow-tooltip="true">
      <el-table-column label="项目名称" min-width="320" prop="name" />
      <el-table-column :formatter="dateFormatter" label="归档时间" prop="archiveTime" width="220" />
      <el-table-column fixed="right" label="操作" width="120">
        <template #default="scope">
          <el-button
            v-if="scope.row.adminStatus && checkPermi(['pms:pm:project:update'])"
            link
            type="primary"
            @click="handleRestore(scope.row)"
          >
            恢复项目
          </el-button>
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
</template>

<script lang="ts" setup>
import * as ProjectApi from '@/api/pms/pm/project'
import { dateFormatter } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import {
  PmsProjectSceneType,
  PmsProjectSortType,
  PmsProjectStatus
} from '@/views/pms/pm/utils/constants'

defineOptions({ name: 'PmsProjectArchive' })

const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表加载中
const total = ref(0) // 列表总数
const projectList = ref<ProjectApi.PmsProjectVO[]>([]) // 项目列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  sceneType: PmsProjectSceneType.ALL,
  status: PmsProjectStatus.ARCHIVED,
  sortType: PmsProjectSortType.ACCESS_TIME
}) // 查询参数

/** 查询归档项目分页 */
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

/** 恢复归档项目 */
async function handleRestore(project: ProjectApi.PmsProjectVO) {
  try {
    // 1. 恢复的二次确认
    await message.confirm(`确认恢复项目“${project.name}”吗？`)
    // 2. 恢复项目
    await ProjectApi.restoreProject(project.id)
    message.success('项目已恢复')
    // 3. 刷新列表
    await getProjectList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getProjectList()
})
</script>
