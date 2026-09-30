<template>
  <ContentWrap>
    <el-page-header @back="close">
      <template #content>
        <span class="text-16px font-600">会话记录</span>
        <span class="ml-12px text-14px text-[var(--el-text-color-secondary)]">
          Agent：{{ agent?.name || '-' }}
        </span>
      </template>
    </el-page-header>
  </ContentWrap>

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
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
          <UserSelect v-model="queryParams.userId" placeholder="请选择用户" />
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
      <el-table-column label="操作" align="center" width="140px" fixed="right">
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
import { useTagsViewStore } from '@/store/modules/tagsView'
import { AgentApi, Agent } from '@/api/ai1/agent'
import { SessionApi, Session } from '@/api/ai1/session'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import SessionDetail from './SessionDetail.vue'

/** AI1 Agent 会话记录 */
defineOptions({ name: 'Ai1AgentSession' })

const message = useMessage() // 消息弹窗
const { params } = useRoute() // 路由参数

const agentId = Number(params.agentId) // Agent 编号
const agent = ref<Agent>() // Agent 信息
const loading = ref(true) // 列表的加载中
const list = ref<Session[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  agentId,
  title: undefined,
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
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 查看会话明细 */
const detailRef = ref()
const openDetail = (row: Session) => {
  detailRef.value.open(row)
}

/** 关闭 */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({
    name: 'Ai1Agent'
  })
}

/** 初始化 **/
onMounted(async () => {
  if (!agentId) {
    message.warning('参数错误，Agent 不能为空！')
    close()
    return
  }
  getList()
  agent.value = await AgentApi.getAgent(agentId)
})
</script>
