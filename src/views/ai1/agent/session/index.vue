<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="Agent" prop="agentId">
        <AgentSelect
          v-model="queryParams.agentId"
          clearable
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="用户" prop="userId">
        <div class="!w-240px">
          <UserSelect v-model="queryParams.userId" />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="Agent" align="center" prop="agentName" min-width="160">
        <template #default="scope">{{ scope.row.agentName || scope.row.agentId }}</template>
      </el-table-column>
      <el-table-column label="标题" align="left" prop="title" min-width="220" />
      <el-table-column label="用户" align="center" prop="userNickname" min-width="140">
        <template #default="scope">{{ scope.row.userNickname || scope.row.userId }}</template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="最近活跃"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="120px" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 会话明细弹窗 -->
  <SessionDetail ref="detailRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { SessionApi, Session } from '@/api/ai1/session'
import AgentSelect from '@/views/ai1/agent/components/AgentSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import SessionDetail from './SessionDetail.vue'

/** AI1 对话管理 */
defineOptions({ name: 'Ai1SessionRecord' })

const route = useRoute() // 路由

const loading = ref(true) // 列表的加载中
const list = ref<Session[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  agentId: Number(route.query.agentId) || undefined, // 从 Agent 管理跳转时预选
  title: undefined as string | undefined,
  userId: undefined as number | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SessionApi.getSessionPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 查看会话明细 */
const detailRef = ref()
const openDetail = (row: Session) => {
  detailRef.value.open(row)
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
