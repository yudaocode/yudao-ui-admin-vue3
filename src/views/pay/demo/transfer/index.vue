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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')"
          ><Icon icon="ep:plus" />创建业务转账单
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="订单编号" align="center" prop="id" />
      <el-table-column label="转账类型" align="center" prop="type" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_TRANSFER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="转账金额" align="center" prop="price">
        <template #default="scope">
          <span>￥{{ (scope.row.price / 100.0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收款人姓名" align="center" prop="userName" width="120" />
      <el-table-column label="支付宝登录账号" align="center" prop="alipayLogonId" width="180" />
      <el-table-column label="微信 openid" align="center" prop="openid" width="120" />
      <el-table-column label="转账状态" align="center" prop="transferStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_TRANSFER_STATUS" :value="scope.row.transferStatus" />
        </template>
      </el-table-column>
      <el-table-column label="转账单号" align="center" prop="payTransferId" />
      <el-table-column label="支付渠道" align="center" prop="payChannelCode" />
      <el-table-column
        label="转账时间"
        align="center"
        prop="transferTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="100"
        fixed="right"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleTransfer(scope.row)"
            v-if="scope.row.transferStatus === 0"
            v-hasPermi="['pay:transfer:create']"
          >
            发起转账
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

  <!-- 表单弹窗：添加/修改 -->
  <DemoTransferForm ref="demoFormRef" @success="getList" />
  <CreatePayTransfer ref="payTransferRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as DemoTransferApi from '@/api/pay/demo/transfer'
import * as PayTransferApi from '@/api/pay/transfer'
import DemoTransferForm from './DemoTransferForm.vue'
import CreatePayTransfer from '../../transfer/CreatePayTransfer.vue'
import { DICT_TYPE } from '@/utils/dict'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})
const queryFormRef = ref() // 搜索的表单

let payTransfer = {
  appId: undefined,
  merchantTransferId: undefined,
  type: undefined,
  price: undefined,
  subject: undefined,
  userName: undefined,
  alipayLogonId: undefined,
  openid: undefined
} as PayTransferApi.TransferVO // 传递给转账订单的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DemoTransferApi.getDemoTransferPage(queryParams)
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

/** 创建业务转账单操作 */
const demoFormRef = ref()
const payTransferRef = ref()
const openForm = (type: string) => {
  demoFormRef.value.open(type)
}

/** 发起转账操作 */
const handleTransfer = (row: any) => {
  payTransfer = { ...row }
  payTransfer.merchantTransferId = row.id.toString()
  payTransfer.subject = '示例转账'
  payTransferRef.value.showPayTransfer(payTransfer)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
