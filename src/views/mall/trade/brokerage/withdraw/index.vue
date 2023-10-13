<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="提现类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择提现类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_WITHDRAW_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="账号" prop="accountNo">
        <el-input
          v-model="queryParams.accountNo"
          placeholder="请输入账号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="提现银行" prop="bankName">
        <el-select
          v-model="queryParams.bankName"
          placeholder="请选择提现银行"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.BROKERAGE_BANK_NAME)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_WITHDRAW_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="申请时间" prop="createTime">
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
      <el-table-column label="编号" align="left" prop="id" min-width="60px" />
      <el-table-column label="用户信息" align="left" min-width="120px">
        <template #default="scope">
          <div>编号：{{ scope.row.userId }}</div>
          <div>昵称：{{ scope.row.userNickname }}</div>
        </template>
      </el-table-column>
      <el-table-column label="提现金额" align="left" prop="price" min-width="80px">
        <template #default="scope">
          <div>金　额：￥{{ fenToYuan(scope.row.price) }}</div>
          <div>手续费：￥{{ fenToYuan(scope.row.feePrice) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="提现方式" align="left" prop="type" min-width="120px">
        <template #default="scope">
          <div v-if="scope.row.type === BrokerageWithdrawTypeEnum.WALLET.type"> 余额 </div>
          <div v-else>
            {{ getDictLabel(DICT_TYPE.BROKERAGE_WITHDRAW_TYPE, scope.row.type) }}
            <span v-if="scope.row.accountNo">账号：{{ scope.row.accountNo }}</span>
          </div>
          <template v-if="scope.row.type === BrokerageWithdrawTypeEnum.BANK.type">
            <div>真实姓名：{{ scope.row.name }}</div>
            <div>
              银行名称：
              <dict-tag :type="DICT_TYPE.BROKERAGE_BANK_NAME" :value="scope.row.bankName" />
            </div>
            <div>开户地址：{{ scope.row.bankAddress }}</div>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="收款码" align="left" prop="accountQrCodeUrl" min-width="70px">
        <template #default="scope">
          <el-image
            v-if="scope.row.accountQrCodeUrl"
            :src="scope.row.accountQrCodeUrl"
            class="h-40px w-40px"
            :preview-src-list="[scope.row.accountQrCodeUrl]"
            preview-teleported
          />
          <span v-else>无</span>
        </template>
      </el-table-column>
      <el-table-column
        label="申请时间"
        align="left"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="备注" align="left" prop="remark" />
      <el-table-column label="状态" align="left" prop="status" min-width="120px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BROKERAGE_WITHDRAW_STATUS" :value="scope.row.status" />
          <div v-if="scope.row.auditTime" class="text-xs">
            时间：{{ formatDate(scope.row.auditTime) }}
          </div>
          <div v-if="scope.row.auditReason" class="text-xs">
            原因：{{ scope.row.auditReason }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="left" width="110px" fixed="right">
        <template #default="scope">
          <template v-if="scope.row.status === BrokerageWithdrawStatusEnum.AUDITING.status">
            <el-button
              link
              type="primary"
              @click="handleApprove(scope.row.id)"
              v-hasPermi="['trade:brokerage-withdraw:audit']"
            >
              通过
            </el-button>
            <el-button
              link
              type="danger"
              @click="openForm(scope.row.id)"
              v-hasPermi="['trade:brokerage-withdraw:audit']"
            >
              驳回
            </el-button>
          </template>
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

  <!-- 表单弹窗：添加/修改 -->
  <BrokerageWithdrawRejectForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getDictLabel, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import * as BrokerageWithdrawApi from '@/api/mall/trade/brokerage/withdraw'
import BrokerageWithdrawRejectForm from './BrokerageWithdrawRejectForm.vue'
import { BrokerageWithdrawStatusEnum, BrokerageWithdrawTypeEnum } from '@/utils/constants'
import { fenToYuanFormat } from '@/utils/formatter'
import { fenToYuan } from '@/utils'

defineOptions({ name: 'BrokerageWithdraw' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: null,
  type: null,
  name: null,
  accountNo: null,
  bankName: null,
  status: null,
  auditReason: null,
  auditTime: [],
  remark: null,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await BrokerageWithdrawApi.getBrokerageWithdrawPage(queryParams)
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (id: number) => {
  formRef.value.open(id)
}

/** 审核通过 */
const handleApprove = async (id: number) => {
  try {
    loading.value = true
    await message.confirm('确定要审核通过吗？')
    await BrokerageWithdrawApi.approveBrokerageWithdraw(id)
    await message.success(t('common.success'))
    await getList()
  } finally {
    loading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
