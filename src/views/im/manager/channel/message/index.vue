<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="频道" prop="channelId">
        <el-select v-model="queryParams.channelId" placeholder="全部" clearable class="!w-200px">
          <el-option v-for="c in channelList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="发送时间" prop="sendTime">
        <el-date-picker
          v-model="queryParams.sendTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始"
          end-placeholder="结束"
          class="!w-300px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openSendForm"
          v-hasPermi="['im:manager:channel-message:send']"
        >
          <Icon icon="ep:promotion" class="mr-5px" />立即推送
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="频道" align="center" prop="channelName" width="120" />
      <el-table-column
        label="素材标题"
        align="left"
        prop="materialTitle"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column label="接收人" align="center" prop="receiverUserIds" width="120">
        <template #default="scope">
          <el-tag
            v-if="!scope.row.receiverUserIds || scope.row.receiverUserIds.length === 0"
            type="warning"
            size="small"
          >
            全员
          </el-tag>
          <span v-else>{{ scope.row.receiverUserIds.length }} 人</span>
        </template>
      </el-table-column>
      <el-table-column
        label="发送时间"
        align="center"
        prop="sendTime"
        width="170"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['im:manager:channel-message:delete']"
          >
            删除
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

  <ChannelMessageSendForm ref="sendFormRef" :channel-list="channelList" @success="getList" />
</template>

<script lang="ts" setup>
// TODO @AI：补充一些注释，对齐 system user index；
import { dateFormatter } from '@/utils/formatTime'
import * as MessageApi from '@/api/im/manager/channel/message'
import * as ChannelApi from '@/api/im/manager/channel'
import ChannelMessageSendForm from './ChannelMessageSendForm.vue'

defineOptions({ name: 'ImChannelMessage' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref<MessageApi.ImManagerChannelMessageVO[]>([])
const channelList = ref<ChannelApi.ImManagerChannelVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  channelId: undefined as number | undefined,
  sendTime: [] as string[]
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await MessageApi.getManagerChannelMessagePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const sendFormRef = ref()
const openSendForm = () => {
  sendFormRef.value.open()
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
  } catch {
    return
  }
  await MessageApi.deleteManagerChannelMessage(id)
  message.success(t('common.delSuccess'))
  await getList()
}

onMounted(async () => {
  channelList.value = await ChannelApi.getEnabledChannelList()
  getList()
})
</script>
