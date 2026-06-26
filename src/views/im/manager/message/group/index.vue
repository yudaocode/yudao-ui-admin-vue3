<template>
  <ContentWrap>
    <!-- 搜索栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="88px"
    >
      <el-form-item label="群" prop="groupId">
        <GroupSelect v-model="queryParams.groupId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="发送人" prop="senderId">
        <UserSelectV2 v-model="queryParams.senderId" placeholder="请选择发送人" class="!w-240px" />
      </el-form-item>
      <el-form-item label="内容类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择内容类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_CONTENT_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="消息内容" prop="content">
        <el-input
          v-model="queryParams.content"
          placeholder="请输入消息内容"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
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
      <el-table-column label="群" align="center" min-width="180">
        <template #default="{ row }">
          <span>{{ row.groupName || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.groupId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="发送人" align="center" min-width="160">
        <template #default="{ row }">
          <span>{{ row.senderNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.senderId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" align="center" prop="type" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_CONTENT_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column
        label="发送时间"
        align="center"
        prop="sendTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="内容预览" align="left" min-width="240">
        <template #default="{ row }">
          <MessageContentPreview
            :type="row.type"
            :content="row.content"
            :sender-nickname="row.senderNickname"
          />
        </template>
      </el-table-column>
      <el-table-column label="@用户" align="left" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="row.atUserIds?.length">
            <span v-for="(userId, idx) in row.atUserIds" :key="userId">
              <span v-if="Number(idx) > 0">、</span>
              <template v-if="userId === IM_AT_ALL_USER_ID">@{{ IM_AT_ALL_NICKNAME }}</template>
              <template v-else>
                @{{ row.atUserNicknames?.[idx] || userId }}
                <span class="text-gray-400">({{ userId }})</span>
              </template>
            </span>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="MESSAGE_GROUP_READ_ENABLED"
        label="回执"
        align="center"
        prop="receiptStatus"
        width="110"
      >
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS" :value="row.receiptStatus" />
        </template>
      </el-table-column>
      <el-table-column
        v-if="MESSAGE_GROUP_READ_ENABLED"
        label="状态"
        align="center"
        prop="status"
        width="100"
      >
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
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
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 详情 -->
  <GroupMessageDetail ref="detailRef" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { IM_AT_ALL_NICKNAME, IM_AT_ALL_USER_ID } from '@/views/im/utils/constants'
import { MESSAGE_GROUP_READ_ENABLED } from '@/views/im/utils/config'
import * as ManagerGroupMessageApi from '@/api/im/manager/message/group'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import GroupSelect from '@/views/im/manager/group/components/GroupSelect.vue'
import MessageContentPreview from '../MessageContentPreview.vue'
import GroupMessageDetail from './GroupMessageDetail.vue'

defineOptions({ name: 'ImGroupMessage' })

const { currentRoute } = useRouter()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerGroupMessageApi.ImManagerGroupMessageVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  groupId: undefined as number | undefined,
  senderId: undefined as number | undefined,
  type: undefined as number | undefined,
  content: undefined as string | undefined,
  sendTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询群聊消息分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerGroupMessageApi.getManagerGroupMessagePage(queryParams)
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

/** 打开详情弹窗 */
const detailRef = ref<InstanceType<typeof GroupMessageDetail>>() // 详情弹窗 Ref
const openDetail = (row: ManagerGroupMessageApi.ImManagerGroupMessageVO) => {
  detailRef.value?.open(row)
}

/** 初始化：从路由 query 读取搜索参数 */
onMounted(() => {
  const query = currentRoute.value.query
  if (query.groupId) {
    queryParams.groupId = Number(query.groupId)
  }
  getList()
})
</script>
