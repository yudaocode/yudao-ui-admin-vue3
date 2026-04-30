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
      <!-- TODO @AI：使用 userselectv2 组件 -->
      <el-form-item label="用户编号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <!-- TODO @AI：使用 userselectv2 组件 -->
      <el-form-item label="好友编号" prop="friendUserId">
        <el-input
          v-model="queryParams.friendUserId"
          placeholder="请输入好友用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="好友状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择好友状态"
          clearable
          class="!w-160px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_FRIEND_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="免打扰" prop="muted">
        <el-select
          v-model="queryParams.muted"
          placeholder="请选择免打扰状态"
          clearable
          class="!w-160px"
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
      <!-- TODO @AI：宽度调整下 -->
      <el-table-column label="用户" align="center" min-width="160">
        <template #default="{ row }">
          <span>{{ row.userNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.userId }})</span>
        </template>
      </el-table-column>
      <!-- TODO @AI：宽度调整下 -->
      <el-table-column label="好友" align="center" min-width="160">
        <template #default="{ row }">
          <span>{{ row.friendNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.friendUserId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="displayName" width="120" />
      <el-table-column label="免打扰" align="center" prop="muted" width="80">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.muted" />
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

defineOptions({ name: 'ImFriend' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerFriendApi.ImManagerFriendVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  friendUserId: undefined as number | undefined,
  status: undefined as number | undefined,
  muted: undefined as boolean | undefined,
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

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
