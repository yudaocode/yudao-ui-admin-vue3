<template>
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="120px"
    >
      <el-form-item label="所属商户" prop="merchantId">
        <el-select
          v-model="queryParams.merchantId"
          clearable
          placeholder="请选择所属商户"
          class="!w-240px"
        >
          <el-option
            v-for="item in merchantList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="应用编号" prop="appId">
        <el-select
          v-model="queryParams.appId"
          clearable
          placeholder="请选择应用信息"
          class="!w-240px"
        >
          <el-option v-for="item in appList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="渠道编码" prop="channelCode">
        <el-select
          v-model="queryParams.channelCode"
          placeholder="请输入渠道编码"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="退款类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择退款类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PAY_REFUND_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商户退款订单号" prop="merchantRefundNo">
        <el-input
          v-model="queryParams.merchantRefundNo"
          placeholder="请输入商户退款订单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="退款状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择退款状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PAY_REFUND_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="退款回调状态" prop="notifyStatus">
        <el-select
          v-model="queryParams.notifyStatus"
          placeholder="请选择通知商户退款结果的回调状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PAY_ORDER_NOTIFY_STATUS)"
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
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:tenant:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="商户名称" align="center" prop="merchantName" width="120" />
      <el-table-column label="应用名称" align="center" prop="appName" width="120" />
      <el-table-column label="渠道名称" align="center" prop="channelCodeName" width="120" />
      <el-table-column label="交易订单号" align="center" prop="tradeNo" width="140" />
      <el-table-column label="商户订单编号" align="center" prop="merchantOrderId" width="140" />
      <el-table-column label="商户订单号" align="left" width="230">
        <template #default="scope">
          <p class="order-font">
            <el-tag>退款</el-tag>
            {{ scope.row.merchantRefundNo }}
          </p>
          <p class="order-font">
            <el-tag type="success">交易</el-tag>
            {{ scope.row.merchantOrderId }}
          </p>
        </template>
      </el-table-column>
      <el-table-column label="支付订单号" align="center" prop="merchantRefundNo" width="250">
        <template #default="scope">
          <p class="order-font">
            <el-tag>交易</el-tag>
            {{ scope.row.tradeNo }}
          </p>
          <p class="order-font">
            <el-tag type="warning">渠道</el-tag>
            {{ scope.row.channelOrderNo }}
          </p>
        </template>
      </el-table-column>
      <el-table-column label="支付金额(元)" align="center" prop="payAmount" width="100">
        <template #default="scope">
          ￥{{ parseFloat(scope.row.payAmount / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="退款金额(元)" align="center" prop="refundAmount" width="100">
        <template #default="scope">
          ￥{{ parseFloat(scope.row.refundAmount / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="退款类型" align="center" prop="type" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_REFUND_ORDER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="退款状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_REFUND_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="回调状态" align="center" prop="notifyStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_ORDER_NOTIFY_STATUS" :value="scope.row.notifyStatus" />
        </template>
      </el-table-column>
      <el-table-column
        label="退款原因"
        align="center"
        prop="reason"
        width="140"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="退款成功时间"
        align="center"
        prop="successTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" fixed="right">
        <template #default="scope">
          <el-button
            type="primary"
            link
            @click="openDetail(scope.row.id)"
            v-hasPermi="['pay:order:query']"
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

  <!-- 表单弹窗：预览 -->
  <RefundDetail ref="detailRef" @success="getList" />
</template>
<script setup lang="ts" name="PayRefund">
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as MerchantApi from '@/api/pay/merchant'
import * as RefundApi from '@/api/pay/refund'
import RefundDetail from './RefundDetail.vue'
const message = useMessage() // 消息弹窗
import download from '@/utils/download'

const loading = ref(false) // 列表遮罩层
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  merchantId: undefined,
  appId: undefined,
  channelId: undefined,
  channelCode: undefined,
  orderId: undefined,
  tradeNo: undefined,
  merchantOrderId: undefined,
  merchantRefundNo: undefined,
  notifyUrl: undefined,
  notifyStatus: undefined,
  status: undefined,
  type: undefined,
  payAmount: undefined,
  refundAmount: undefined,
  reason: undefined,
  userIp: undefined,
  channelOrderNo: undefined,
  channelRefundNo: undefined,
  channelErrorCode: undefined,
  channelErrorMsg: undefined,
  channelExtras: undefined,
  expireTime: [],
  successTime: [],
  notifyTime: [],
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出等待
const appList = ref([]) // 支付应用列表集合
const merchantList = ref([]) // 商户列表

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await RefundApi.getRefundPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await RefundApi.exportRefund(queryParams)
    download.excel(data, '支付订单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 预览详情 */
const detailRef = ref()
const openDetail = (id: number) => {
  detailRef.value.open(id)
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 加载商户列表
  merchantList.value = await MerchantApi.getMerchantListByName()
  // TODO 芋艿：候选少一个查询应用列表的接口
  // appList.value = await AppApi.getAppListByMerchantId()
})
</script>

<style>
.order-font {
  font-size: 12px;
  padding: 2px 0;
}
</style>
