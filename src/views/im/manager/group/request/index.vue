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
      <el-form-item label="群" prop="groupId">
        <GroupSelect v-model="queryParams.groupId" placeholder="请选择群" class="!w-240px" />
      </el-form-item>
      <el-form-item label="申请人" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" placeholder="请选择申请人" class="!w-240px" />
      </el-form-item>
      <el-form-item label="邀请人" prop="inviterUserId">
        <UserSelectV2
          v-model="queryParams.inviterUserId"
          placeholder="请选择邀请人"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="处理结果" prop="handleResult">
        <el-select
          v-model="queryParams.handleResult"
          placeholder="请选择处理结果"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="加入来源" prop="addSource">
        <el-select
          v-model="queryParams.addSource"
          placeholder="请选择加入来源"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_GROUP_ADD_SOURCE)"
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
      <el-table-column label="群" align="center" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.groupName || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.groupId }})</span>
        </template>
      </el-table-column>
      <el-table-column
        label="申请人 / 被邀请人"
        align="center"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row.userNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.userId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="邀请人" align="center" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="row.inviterUserId">
            <span>{{ row.inviterNickname || '-' }}</span>
            <span class="text-gray-400 ml-5px">({{ row.inviterUserId }})</span>
          </template>
          <span v-else class="text-gray-400">主动申请</span>
        </template>
      </el-table-column>
      <el-table-column
        label="申请理由"
        align="center"
        prop="applyContent"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column label="加入来源" align="center" prop="addSource" width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_GROUP_ADD_SOURCE" :value="row.addSource" />
        </template>
      </el-table-column>
      <el-table-column label="处理结果" align="center" prop="handleResult" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT" :value="row.handleResult" />
        </template>
      </el-table-column>
      <el-table-column label="处理人" align="center" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="row.handleUserId">
            <span>{{ row.handleNickname || '-' }}</span>
            <span class="text-gray-400 ml-5px">({{ row.handleUserId }})</span>
          </template>
          <span v-else class="text-gray-400">-</span>
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
import * as ManagerGroupRequestApi from '@/api/im/manager/group/request'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import GroupSelect from '@/views/im/manager/group/components/GroupSelect.vue'

defineOptions({ name: 'ImGroupRequest' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerGroupRequestApi.ImManagerGroupRequestVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  groupId: undefined as number | undefined,
  userId: undefined as number | undefined,
  inviterUserId: undefined as number | undefined,
  handleResult: undefined as number | undefined,
  addSource: undefined as number | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询加群申请分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerGroupRequestApi.getManagerGroupRequestPage(queryParams)
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
