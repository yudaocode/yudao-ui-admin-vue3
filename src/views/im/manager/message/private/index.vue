<template>
  <ContentWrap>
    <!-- 搜索栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="发送人编号" prop="senderId">
        <el-input
          v-model="queryParams.senderId"
          placeholder="请输入发送人用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="接收人编号" prop="receiverId">
        <el-input
          v-model="queryParams.receiverId"
          placeholder="请输入接收人用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="消息类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择消息类型"
          clearable
          class="!w-160px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_MESSAGE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="消息状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择消息状态"
          clearable
          class="!w-160px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_MESSAGE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发送时间" prop="sendTime">
        <el-date-picker
          v-model="queryParams.sendTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="100" />
      <el-table-column label="发送人" align="center" min-width="160">
        <template #default="{ row }">
          <span>{{ row.senderNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.senderId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="接收人" align="center" min-width="160">
        <template #default="{ row }">
          <span>{{ row.receiverNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.receiverId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" align="center" prop="type" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_MESSAGE_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column label="内容预览" align="left" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          {{ getContentPreview(row.content) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="发送时间"
        align="center"
        prop="sendTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openDetail(row)"
            v-hasPermi="['im:manager:message:query']"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" title="私聊消息详情" width="700">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="客户端编号">{{ detail.clientMessageId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="发送人">{{ detail.senderNickname }} ({{ detail.senderId }})</el-descriptions-item>
      <el-descriptions-item label="接收人">{{ detail.receiverNickname }} ({{ detail.receiverId }})</el-descriptions-item>
      <el-descriptions-item label="类型">
        <dict-tag :type="DICT_TYPE.IM_MESSAGE_TYPE" :value="detail.type" />
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <dict-tag :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="detail.status" />
      </el-descriptions-item>
      <el-descriptions-item label="发送时间">{{ formatDate(detail.sendTime) }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formatDate(detail.createTime) }}</el-descriptions-item>
      <el-descriptions-item label="消息内容（原始 JSON）" :span="2">
        <pre class="content-pre">{{ formatJson(detail.content) }}</pre>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script lang="ts" setup>
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ManagerPrivateMessageApi from '@/api/im/manager/message/private'
import { getContentPreview, formatJson } from '../utils'

defineOptions({ name: 'ImPrivateMessage' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerPrivateMessageApi.ImManagerPrivateMessageVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  senderId: undefined as number | undefined,
  receiverId: undefined as number | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  sendTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询私聊消息分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerPrivateMessageApi.getManagerPrivateMessagePage(queryParams)
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

/** 详情弹窗 */
const detailVisible = ref(false) // 详情弹窗的显示
const detail = ref<ManagerPrivateMessageApi.ImManagerPrivateMessageVO>(
  {} as ManagerPrivateMessageApi.ImManagerPrivateMessageVO
) // 当前详情数据

/** 打开详情弹窗 */
const openDetail = (row: ManagerPrivateMessageApi.ImManagerPrivateMessageVO) => {
  detail.value = row
  detailVisible.value = true
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style scoped>
.content-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
}
</style>
