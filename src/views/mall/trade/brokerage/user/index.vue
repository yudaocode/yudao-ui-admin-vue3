<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="85px"
    >
      <el-form-item label="推广员编号" prop="bindUserId">
        <el-input
          v-model="queryParams.bindUserId"
          placeholder="请输入推广员编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="推广资格" prop="brokerageEnabled">
        <el-select
          v-model="queryParams.brokerageEnabled"
          class="!w-240px"
          clearable
          placeholder="请选择推广资格"
        >
          <el-option label="有" :value="true" />
          <el-option label="无" :value="false" />
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
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="用户编号" align="center" prop="id" min-width="80px" />
      <el-table-column label="头像" align="center" prop="avatar" width="70px">
        <template #default="scope">
          <el-avatar :src="scope.row.avatar" />
        </template>
      </el-table-column>
      <el-table-column label="昵称" align="center" prop="nickname" min-width="80px" />
      <el-table-column label="推广人数" align="center" prop="brokerageUserCount" width="80px" />
      <el-table-column
        label="推广订单数量"
        align="center"
        prop="brokerageOrderCount"
        min-width="110px"
      />
      <el-table-column
        label="推广订单金额"
        align="center"
        prop="brokerageOrderPrice"
        min-width="110px"
        :formatter="fenToYuanFormat"
      />
      <el-table-column
        label="已提现金额"
        align="center"
        prop="withdrawPrice"
        min-width="100px"
        :formatter="fenToYuanFormat"
      />
      <el-table-column label="已提现次数" align="center" prop="withdrawCount" min-width="100px" />
      <el-table-column
        label="未提现金额"
        align="center"
        prop="price"
        min-width="100px"
        :formatter="fenToYuanFormat"
      />
      <el-table-column
        label="冻结中佣金"
        align="center"
        prop="frozenPrice"
        min-width="100px"
        :formatter="fenToYuanFormat"
      />
      <el-table-column label="推广资格" align="center" prop="brokerageEnabled" min-width="80px">
        <template #default="scope">
          <el-switch
            v-model="scope.row.brokerageEnabled"
            active-text="有"
            inactive-text="无"
            inline-prompt
            :disabled="!checkPermi(['trade:brokerage-user:update-bind-user'])"
            @change="handleBrokerageEnabledChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="成为推广员时间"
        align="center"
        prop="brokerageTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="上级推广员编号" align="center" prop="bindUserId" width="150px" />
      <el-table-column
        label="推广员绑定时间"
        align="center"
        prop="bindUserTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="150px" fixed="right">
        <template #default="scope">
          <el-dropdown
            @command="(command) => handleCommand(command, scope.row)"
            v-hasPermi="[
              'trade:brokerage-user:user-query',
              'trade:brokerage-user:order-query',
              'trade:brokerage-user:update-bind-user',
              'trade:brokerage-user:clear-bind-user'
            ]"
          >
            <el-button link type="primary">
              <Icon icon="ep:d-arrow-right" />
              更多
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="openBrokerageUserTable"
                  v-if="checkPermi(['trade:brokerage-user:user-query'])"
                >
                  推广人
                </el-dropdown-item>
                <el-dropdown-item
                  command="openBrokerageOrderTable"
                  v-if="checkPermi(['trade:brokerage-user:order-query'])"
                >
                  推广订单
                </el-dropdown-item>
                <el-dropdown-item
                  command="openUpdateBindUserForm"
                  v-if="checkPermi(['trade:brokerage-user:update-bind-user'])"
                >
                  修改上级推广人
                </el-dropdown-item>
                <el-dropdown-item
                  command="handleClearBindUser"
                  v-if="
                    scope.row.bindUserId && checkPermi(['trade:brokerage-user:clear-bind-user'])
                  "
                >
                  清除上级推广人
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
  <!-- 修改上级推广人表单 -->
  <UpdateBindUserForm ref="updateBindUserFormRef" @success="getList" />
  <!-- 推广人列表 -->
  <BrokerageUserListDialog ref="brokerageUserListDialogRef" />
  <!-- 推广订单列表 -->
  <BrokerageOrderListDialog ref="brokerageOrderListDialogRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as BrokerageUserApi from '@/api/mall/trade/brokerage/user'
import { checkPermi } from '@/utils/permission'
import { fenToYuanFormat } from '@/utils/formatter'
import UpdateBindUserForm from '@/views/mall/trade/brokerage/user/UpdateBindUserForm.vue'
import BrokerageUserListDialog from '@/views/mall/trade/brokerage/user/BrokerageUserListDialog.vue'
import BrokerageOrderListDialog from '@/views/mall/trade/brokerage/user/BrokerageOrderListDialog.vue'

defineOptions({ name: 'TradeBrokerageUser' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  bindUserId: null,
  brokerageEnabled: true,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await BrokerageUserApi.getBrokerageUserPage(queryParams)
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

const handleCommand = (command: string, row: BrokerageUserApi.BrokerageUserVO) => {
  switch (command) {
    case 'openBrokerageUserTable':
      openBrokerageUserTable(row.id)
      break
    case 'openBrokerageOrderTable':
      openBrokerageOrderTable(row.id)
      break
    case 'openUpdateBindUserForm':
      openUpdateBindUserForm(row)
      break
    case 'handleClearBindUser':
      handleClearBindUser(row)
      break
  }
}

/** 打开推广人列表 */
const brokerageUserListDialogRef = ref()
const openBrokerageUserTable = (id: number) => {
  brokerageUserListDialogRef.value.open(id)
}

/** 打开推广订单列表 */
const brokerageOrderListDialogRef = ref()
const openBrokerageOrderTable = (id: number) => {
  brokerageOrderListDialogRef.value.open(id)
}

/** 打开表单：修改上级推广人 */
const updateBindUserFormRef = ref()
const openUpdateBindUserForm = (row: BrokerageUserApi.BrokerageUserVO) => {
  updateBindUserFormRef.value.open(row)
}

/** 清除上级推广人 */
const handleClearBindUser = async (row: BrokerageUserApi.BrokerageUserVO) => {
  try {
    // 二次确认
    await message.confirm(`确认要清除"${row.nickname}"的上级推广人吗？`)
    // 发起修改
    await BrokerageUserApi.clearBindUser({ id: row.id })
    message.success('清除成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 推广资格：开通/关闭 */
const handleBrokerageEnabledChange = async (row: BrokerageUserApi.BrokerageUserVO) => {
  try {
    // 二次确认
    const text = row.brokerageEnabled ? '开通' : '关闭'
    await message.confirm(`确认要${text}"${row.nickname}"的推广资格吗？`)
    // 发起修改
    await BrokerageUserApi.updateBrokerageEnabled({ id: row.id, enabled: row.brokerageEnabled })
    message.success(text + '成功')
    // 刷新列表
    await getList()
  } catch {
    // 异常时，需要重置回之前的值
    row.brokerageEnabled = !row.brokerageEnabled
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
