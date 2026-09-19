<template>
  <doc-alert
    title="【PMS】项目中心、工作台与项目管理"
    url="https://doc.iocoder.cn/pms/pm/project/"
  />

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
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="projectList" :show-overflow-tooltip="true">
      <el-table-column label="项目名称" min-width="320" prop="name" />
      <el-table-column :formatter="dateFormatter" label="删除时间" prop="recycleTime" width="220" />
      <el-table-column fixed="right" label="操作" width="180">
        <template #default="scope">
          <el-button
            v-if="scope.row.adminStatus && checkPermi(['pms:pm:project:update'])"
            link
            type="primary"
            @click="handleRestore(scope.row)"
          >
            恢复项目
          </el-button>
          <el-button
            v-if="scope.row.ownerStatus && checkPermi(['pms:pm:project:delete'])"
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >
            彻底删除
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

defineOptions({ name: 'PmsProjectRecycle' })

const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表加载中
const total = ref(0) // 列表总数
const projectList = ref<ProjectApi.PmsProjectVO[]>([]) // 项目列表
const queryFormRef = ref() // 查询表单
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  sceneType: PmsProjectSceneType.ALL,
  status: PmsProjectStatus.RECYCLED,
  sortType: PmsProjectSortType.ACCESS_TIME
}) // 查询参数

/** 执行搜索 */
function handleQuery() {
  queryParams.pageNo = 1
  getProjectList()
}

/** 重置搜索 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 查询回收站项目分页 */
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

/** 恢复回收站项目 */
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

/** 彻底删除回收站项目 */
async function handleDelete(project: ProjectApi.PmsProjectVO) {
  try {
    // 1. 删除的二次确认
    await message.confirm(`彻底删除后不可恢复，确认删除项目“${project.name}”吗？`)
    // 2. 彻底删除项目
    await ProjectApi.deleteProject(project.id)
    message.success('项目已彻底删除')
    // 3. 刷新列表
    await getProjectList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getProjectList()
})
</script>
