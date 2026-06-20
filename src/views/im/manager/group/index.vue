<template>
  <ContentWrap>
    <!-- 搜索栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="群名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入群名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="群主" prop="ownerUserId">
        <UserSelectV2 v-model="queryParams.ownerUserId" placeholder="请选择群主" class="!w-240px" />
      </el-form-item>
      <el-form-item label="群状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择群状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_GROUP_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否封禁" prop="banned">
        <el-select
          v-model="queryParams.banned"
          placeholder="请选择封禁状态"
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
      <el-table-column label="头像" align="center" width="80">
        <template #default="{ row }">
          <el-avatar :src="row.avatar" :size="40">
            {{ row.name?.charAt(0) ?? '?' }}
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column
        label="群名称"
        align="center"
        prop="name"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column label="群主" align="center" min-width="160">
        <template #default="{ row }">
          <span>{{ row.ownerNickname || '-' }}</span>
          <span class="text-gray-400 ml-5px">({{ row.ownerUserId }})</span>
        </template>
      </el-table-column>
      <el-table-column label="成员数" align="center" prop="memberCount" width="90" />
      <el-table-column label="群状态" align="center" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_GROUP_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="封禁状态" align="center" prop="banned" width="120">
        <template #default="{ row }">
          <!-- 已封禁需要 tooltip 展示封禁原因，故 wrap 一层 -->
          <el-tooltip v-if="row.banned" :content="row.bannedReason" placement="top">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.banned" />
          </el-tooltip>
          <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.banned" />
        </template>
      </el-table-column>
      <el-table-column label="全群禁言" align="center" prop="mutedAll" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.mutedAll" type="danger">已禁言</el-tag>
          <el-tag v-else type="info">未禁言</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="340" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openDetail(row)"
            v-hasPermi="['im:manager:group:query']"
          >
            详情
          </el-button>
          <el-button link type="primary" @click="goConversation(row)"> 查看对话 </el-button>
          <el-button
            v-if="!row.banned"
            link
            type="danger"
            @click="openBanDialog(row)"
            v-hasPermi="['im:manager:group:ban']"
          >
            封禁
          </el-button>
          <el-button
            v-else
            link
            type="primary"
            @click="handleUnban(row)"
            v-hasPermi="['im:manager:group:ban']"
          >
            解封
          </el-button>
          <el-button
            v-if="row.status === CommonStatusEnum.ENABLE"
            link
            type="danger"
            @click="handleDissolve(row)"
            v-hasPermi="['im:manager:group:dissolve']"
          >
            解散
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

  <!-- 群详情 -->
  <GroupDetail ref="detailRef" />
  <!-- 群封禁因弹窗 -->
  <GroupBanForm ref="banFormRef" @success="getList" />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions, getBoolDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
import * as ManagerGroupApi from '@/api/im/manager/group'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import GroupDetail from './GroupDetail.vue'
import GroupBanForm from './GroupBanForm.vue'

defineOptions({ name: 'ImGroup' })

const { push } = useRouter()
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<ManagerGroupApi.ImManagerGroupVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  ownerUserId: undefined as number | undefined,
  status: undefined as number | undefined,
  banned: undefined as boolean | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 查询群分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerGroupApi.getManagerGroupPage(queryParams)
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

/** 打开群详情 */
const detailRef = ref()
const openDetail = (row: ManagerGroupApi.ImManagerGroupVO) => {
  detailRef.value.open(row)
}

/** 打开封禁弹窗 */
const banFormRef = ref()
const openBanDialog = (row: ManagerGroupApi.ImManagerGroupVO) => {
  banFormRef.value.open(row)
}

/** 解封按钮操作 */
const handleUnban = async (row: ManagerGroupApi.ImManagerGroupVO) => {
  try {
    // 解封的二次确认
    await message.confirm(`确认解封群「${row.name}」吗？`)
    // 发起解封
    await ManagerGroupApi.unbanManagerGroup(row.id)
    message.success('解封成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 解散按钮操作 */
const handleDissolve = async (row: ManagerGroupApi.ImManagerGroupVO) => {
  try {
    // 解散的二次确认
    await message.confirm(`确认解散群「${row.name}」吗？`)
    // 发起解散
    await ManagerGroupApi.dissolveManagerGroup(row.id)
    message.success('解散成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 跳转到群聊消息页面，查看该群的对话 */
const goConversation = (row: ManagerGroupApi.ImManagerGroupVO) => {
  push({
    name: 'ImGroupMessage',
    query: { groupId: row.id }
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
