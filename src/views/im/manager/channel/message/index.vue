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
        <ChannelSelect
          v-model="queryParams.channelId"
          placeholder="全部"
          clearable
          class="!w-200px"
        />
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
      <el-table-column label="封面" align="center" prop="materialCoverUrl" width="80">
        <template #default="scope">
          <el-image
            v-if="scope.row.materialCoverUrl"
            :src="scope.row.materialCoverUrl"
            class="w-40px h-40px rounded"
            fit="cover"
          />
        </template>
      </el-table-column>
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

  <ChannelMessageSendForm ref="sendFormRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as MessageApi from '@/api/im/manager/channel/message'
import ChannelSelect from '../list/components/ChannelSelect.vue'
import ChannelMessageSendForm from './ChannelMessageSendForm.vue'

defineOptions({ name: 'ImChannelMessage' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<MessageApi.ImManagerChannelMessageVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  channelId: undefined as number | undefined,
  sendTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询消息分页 */
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

/** 打开「立即推送」弹窗 */
const sendFormRef = ref()
const openSendForm = () => {
  sendFormRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MessageApi.deleteManagerChannelMessage(id)
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
