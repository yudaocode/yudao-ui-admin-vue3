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
      <el-form-item label="发起方" prop="fromUserId">
        <UserSelectV2
          v-model="queryParams.fromUserId"
          placeholder="请选择发起方"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="接收方" prop="toUserId">
        <UserSelectV2 v-model="queryParams.toUserId" placeholder="请选择接收方" class="!w-240px" />
      </el-form-item>
      <el-form-item label="处理结果" prop="handleResult">
        <el-select
          v-model="queryParams.handleResult"
          placeholder="请选择处理结果"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="添加来源" prop="addSource">
        <el-select
          v-model="queryParams.addSource"
          placeholder="请选择添加来源"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_FRIEND_ADD_SOURCE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
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
      <el-table-column label="发起方" align="center" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.fromNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.fromUserId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="接收方" align="center" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.toNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.toUserId }})</span>
        </template>
      </el-table-column>
      <el-table-column
        label="申请理由"
        align="center"
        prop="applyContent"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column label="备注" align="center" prop="displayName" width="120" />
      <el-table-column label="添加来源" align="center" prop="addSource" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_FRIEND_ADD_SOURCE" :value="row.addSource" />
        </template>
      </el-table-column>
      <el-table-column label="处理结果" align="center" prop="handleResult" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT" :value="row.handleResult" />
        </template>
      </el-table-column>
      <el-table-column
        label="处理理由"
        align="center"
        prop="handleContent"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column
        label="处理时间"
        align="center"
        prop="handleTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ManagerFriendRequestApi from '@/api/im/manager/friend/request'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'ImFriendRequest' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerFriendRequestApi.ImManagerFriendRequestVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  fromUserId: undefined as number | undefined,
  toUserId: undefined as number | undefined,
  handleResult: undefined as number | undefined,
  addSource: undefined as number | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询好友申请分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerFriendRequestApi.getManagerFriendRequestPage(queryParams)
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

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
