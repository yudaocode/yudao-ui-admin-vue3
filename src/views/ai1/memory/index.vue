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
      <el-form-item label="用户" prop="userId">
        <div class="!w-240px">
          <UserSelect v-model="queryParams.userId" />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="danger"
          plain
          :disabled="checkedIds.length === 0"
          @click="handleDeleteBatch"
          v-hasPermi="['ai1:memory:delete']"
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
      <el-table-column label="Agent" align="center" prop="agentName" min-width="160">
        <template #default="scope">{{ scope.row.agentName || scope.row.agentId }}</template>
      </el-table-column>
      <el-table-column label="用户" align="center" prop="userNickname" min-width="140">
        <template #default="scope">{{ scope.row.userNickname || scope.row.userId }}</template>
      </el-table-column>
      <el-table-column label="已归档消息编号" align="center" prop="lastMessageId" width="140" />
      <el-table-column
        label="更新时间"
        align="center"
        prop="updateTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="180px" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openDetail(scope.row)"
            v-hasPermi="['ai1:memory:query']"
          >
            查看
          </el-button>
          <el-button
            link
            type="primary"
            @click="openForm(scope.row.id)"
            v-hasPermi="['ai1:memory:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai1:memory:delete']"
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

  <!-- 详情弹窗 -->
  <MemoryDetail ref="detailRef" />
  <!-- 表单弹窗：修改 -->
  <MemoryForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { MemoryApi, Memory } from '@/api/ai1/memory'
import AgentSelect from '@/views/ai1/agent/components/AgentSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import MemoryDetail from './MemoryDetail.vue'
import MemoryForm from './MemoryForm.vue'

/** AI1 长期记忆 */
defineOptions({ name: 'Ai1Memory' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<Memory[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  agentId: undefined as number | undefined,
  userId: undefined as number | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MemoryApi.getMemoryPage(queryParams)
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

/** 查看详情 */
const detailRef = ref()
const openDetail = (row: Memory) => {
  detailRef.value.open(row)
}

/** 修改操作 */
const formRef = ref()
const openForm = (id: number) => {
  formRef.value.open(id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm('删除后将根据历史对话重新生成该记忆，是否确认删除？')
    // 发起删除
    await MemoryApi.deleteMemory(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除按钮操作 */
const checkedIds = ref<number[]>([])
const handleRowCheckboxChange = (rows: Memory[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm('删除后将根据历史对话重新生成所选记忆，是否确认删除？')
    // 发起批量删除
    await MemoryApi.deleteMemoryList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
