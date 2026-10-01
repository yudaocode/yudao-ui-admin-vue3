<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="82px"
    >
      <el-form-item label="Agent 名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入Agent 名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['ai1:agent:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="isEmpty(checkedIds)"
          @click="handleDeleteBatch"
          v-hasPermi="['ai1:agent:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" /> 批量删除
        </el-button>
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
      @selection-change="handleRowCheckboxChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="Agent 名称" align="center" prop="name" min-width="140" />
      <el-table-column label="介绍" align="center" prop="introduction" min-width="200" />
      <el-table-column label="模型供应商" align="center" prop="providerName" min-width="120" />
      <el-table-column label="对话模型" align="center" prop="modelName" min-width="140" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="CommonStatusEnum.ENABLE"
            :inactive-value="CommonStatusEnum.DISABLE"
            :disabled="!checkPermi(['ai1:agent:update'])"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="280px" fixed="right">
        <template #default="scope">
          <el-tooltip
            content="请先开启 Agent"
            :disabled="scope.row.status === CommonStatusEnum.ENABLE"
          >
            <span class="mr-12px inline-flex">
              <el-button
                link
                type="primary"
                :disabled="scope.row.status !== CommonStatusEnum.ENABLE"
                @click="openSession(scope.row)"
                v-hasPermi="['ai1:session:my']"
              >
                前往会话
              </el-button>
            </span>
          </el-tooltip>
          <el-button
            link
            type="primary"
            @click="openSessionRecord(scope.row)"
            v-hasPermi="['ai1:session:query']"
          >
            会话记录
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['ai1:agent:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai1:agent:delete']"
          >
            删除
          </el-button>
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

  <!-- 表单弹窗：添加/修改 -->
  <AgentForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import { AgentApi, Agent } from '@/api/ai1/agent'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { checkPermi } from '@/utils/permission'
import AgentForm from './AgentForm.vue'

/** AI1 Agent 列表 */
defineOptions({ name: 'Ai1Agent' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<Agent[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await AgentApi.getAgentPage(queryParams)
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 前往会话 */
const { push } = useRouter() // 路由
const openSession = (row: Agent) => {
  if (row.status !== CommonStatusEnum.ENABLE) {
    message.warning('请先开启 Agent')
    return
  }
  push({ path: '/ai1/session', query: { agentId: row.id } })
}

/** 查看会话记录 */
const openSessionRecord = (row: Agent) => {
  push({ name: 'Ai1AgentSession', params: { agentId: row.id } })
}

/** 修改状态 */
const handleStatusChange = async (row: Agent) => {
  try {
    // 修改状态的二次确认
    const text = getDictLabel(DICT_TYPE.COMMON_STATUS, row.status)
    await message.confirm(`确认要${text} Agent「${row.name}」吗？`)
    await AgentApi.updateAgentStatus(row.id!, row.status!)
    // 刷新列表
    await getList()
  } catch {
    // 取消后，恢复开关
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm('删除 Agent 将同时删除其全部会话与消息，且不可恢复，是否确认删除？')
    // 发起删除
    await AgentApi.deleteAgent(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除按钮操作 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm('删除 Agent 将同时删除其全部会话与消息，且不可恢复，是否确认删除？')
    // 发起批量删除
    await AgentApi.deleteAgentList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([]) // 表格勾选的编号
const handleRowCheckboxChange = (records: Agent[]) => {
  checkedIds.value = records.map((item) => item.id!)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
