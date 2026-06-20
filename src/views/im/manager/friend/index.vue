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
      <el-form-item label="用户" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="好友" prop="friendUserId">
        <UserSelectV2
          v-model="queryParams.friendUserId"
          placeholder="请选择好友"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="好友状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择好友状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_FRIEND_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="免打扰" prop="silent">
        <el-select
          v-model="queryParams.silent"
          placeholder="请选择免打扰状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="添加时间" prop="addTime">
        <el-date-picker
          v-model="queryParams.addTime"
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
      <el-table-column label="用户" align="center" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.userNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.userId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="好友" align="center" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.friendNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.friendUserId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="displayName" width="120" />
      <el-table-column label="添加来源" align="center" prop="addSource" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_FRIEND_ADD_SOURCE" :value="row.addSource" />
        </template>
      </el-table-column>
      <el-table-column label="免打扰" align="center" prop="silent" width="80">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.silent" />
        </template>
      </el-table-column>
      <el-table-column label="置顶" align="center" prop="pinned" width="80">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.pinned" />
        </template>
      </el-table-column>
      <el-table-column label="拉黑" align="center" prop="blocked" width="80">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.blocked" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_FRIEND_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="添加时间"
        align="center"
        prop="addTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="删除时间"
        align="center"
        prop="deleteTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="goConversation(row)"> 查看对话 </el-button>
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
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions, getBoolDictOptions } from '@/utils/dict'
import * as ManagerFriendApi from '@/api/im/manager/friend'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'ImFriend' })

const { push } = useRouter()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerFriendApi.ImManagerFriendVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  friendUserId: undefined as number | undefined,
  status: undefined as number | undefined,
  silent: undefined as boolean | undefined,
  addTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询好友关系分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerFriendApi.getManagerFriendPage(queryParams)
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

/** 跳转到私聊消息页面，查看该好友关系的对话 */
const goConversation = (row: ManagerFriendApi.ImManagerFriendVO) => {
  push({
    name: 'ImPrivateMessage',
    query: { senderId: row.userId, receiverId: row.friendUserId }
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
