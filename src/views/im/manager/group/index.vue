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
      <el-form-item label="群主编号" prop="ownerUserId">
        <el-input
          v-model="queryParams.ownerUserId"
          placeholder="请输入群主用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
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
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openMemberDrawer(row)"
            v-hasPermi="['im:manager:group:query']"
          >
            成员
          </el-button>
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

  <!-- 群成员抽屉 -->
  <!-- TODO @AI：DrawerRef 简化下 -->
  <GroupMemberDrawer ref="memberDrawerRef" />

  <!-- 封禁原因弹窗 -->
  <!-- TODO @AI：独立出来 -->
  <el-dialog v-model="banDialogVisible" title="封禁群" width="500" :close-on-click-modal="false">
    <el-form :model="banForm" :rules="banFormRules" ref="banFormRef" label-width="80px">
      <el-form-item label="群名称">
        <span>{{ banForm.groupName }}</span>
      </el-form-item>
      <el-form-item label="封禁原因" prop="reason">
        <el-input
          v-model="banForm.reason"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请输入封禁原因"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="banSubmitting" type="primary" @click="submitBan">确 定</el-button>
      <el-button @click="banDialogVisible = false">取 消</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions, getBoolDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ManagerGroupApi from '@/api/im/manager/group'
import GroupMemberDrawer from './components/GroupMemberDrawer.vue'

defineOptions({ name: 'ImGroup' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化 TODO @AI：这里 linter 报错；

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

const memberDrawerRef = ref<InstanceType<typeof GroupMemberDrawer>>() // 群成员抽屉 Ref

/** 打开群成员抽屉 */
const openMemberDrawer = (row: ManagerGroupApi.ImManagerGroupVO) => {
  memberDrawerRef.value?.open(row.id, row.name)
}

const banDialogVisible = ref(false) // 封禁弹窗的显示
const banSubmitting = ref(false) // 封禁提交的加载中
const banForm = reactive({ id: 0, groupName: '', reason: '' }) // 封禁表单
const banFormRef = ref() // 封禁表单 Ref
const banFormRules = {
  reason: [{ required: true, message: '封禁原因不能为空', trigger: 'blur' }]
}

/** 打开封禁弹窗 */
const openBanDialog = (row: ManagerGroupApi.ImManagerGroupVO) => {
  banForm.id = row.id
  banForm.groupName = row.name
  banForm.reason = ''
  banDialogVisible.value = true
}

/** 提交封禁 */
const submitBan = async () => {
  await banFormRef.value.validate()
  banSubmitting.value = true
  try {
    // 发起封禁
    await ManagerGroupApi.banManagerGroup({ id: banForm.id, reason: banForm.reason })
    message.success('封禁成功')
    banDialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    banSubmitting.value = false
  }
}

/** 解封按钮操作 */
const handleUnban = async (row: ManagerGroupApi.ImManagerGroupVO) => {
  // TODO @AI：对齐 system user info 写的习惯；manager 下其他写的，也检查下；
  try {
    // 解封的二次确认
    await message.confirm(`确认解封群「${row.name}」吗？`)
  } catch {
    return
  }
  // 发起解封
  await ManagerGroupApi.unbanManagerGroup(row.id)
  message.success('解封成功')
  // 刷新列表
  await getList()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
