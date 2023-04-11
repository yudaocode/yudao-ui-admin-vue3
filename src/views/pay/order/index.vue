<template>
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
          @clear="
            () => {
              queryParams.merchantId = null
            }
          "
          filterable
          remote
          reserve-keyword
          placeholder="请选择所属商户"
          @change="handleGetAppListByMerchantId"
          :remote-method="handleGetMerchantListByName"
          :loading="merchantLoading"
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
        <el-select clearable v-model="queryParams.appId" filterable placeholder="请选择应用信息">
          <el-option v-for="item in appList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="渠道编码" prop="channelCode">
        <el-select
          v-model="queryParams.channelCode"
          placeholder="请输入渠道编码"
          clearable
          @clear="
            () => {
              queryParams.channelCode = null
            }
          "
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商户订单编号" prop="merchantOrderId">
        <el-input
          v-model="queryParams.merchantOrderId"
          placeholder="请输入商户订单编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="渠道订单号" prop="channelOrderNo">
        <el-input
          v-model="queryParams.channelOrderNo"
          placeholder="请输入渠道订单号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="支付状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择支付状态" clearable size="small">
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.PAY_ORDER_STATUS)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="退款状态" prop="refundStatus">
        <el-select v-model="queryParams.refundStatus" placeholder="请选择退款状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.PAY_ORDER_REFUND_STATUS)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="回调商户状态" prop="notifyStatus">
        <el-select
          v-model="queryParams.notifyStatus"
          placeholder="请选择订单回调商户状态"
          clearable
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.PAY_ORDER_NOTIFY_STATUS)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
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
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:tenant:export']"
        >
          <Icon icon="ep:download" class="mr-5px" />
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <content-wrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="订单编号" align="center" prop="id" />
      <el-table-column label="商户名称" align="center" prop="merchantName" width="120" />
      <el-table-column label="应用名称" align="center" prop="appName" width="120" />
      <el-table-column label="渠道名称" align="center" prop="channelCodeName" width="120" />
      <el-table-column label="渠道订单号" align="center" prop="merchantOrderId" width="120" />
      <el-table-column label="商品标题" align="center" prop="subject" width="250" />
      <el-table-column label="商品描述" align="center" prop="body" width="250" />
      <el-table-column label="异步通知地址" align="center" prop="notifyUrl" width="250" />
      <el-table-column label="回调状态" align="center" prop="notifyStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="支付订单" align="left">
        <template #default="scope">
          <p class="order-font">
            <el-tag size="small">商户</el-tag>
            {{ scope.row.merchantOrderId }}
          </p>
          <p class="order-font">
            <el-tag size="small" type="warning">支付</el-tag>
            {{ scope.row.channelOrderNo }}
          </p>
        </template>
      </el-table-column>
      <el-table-column label="支付金额" align="center" prop="amount">
        <template #default="scope">
          ￥{{ parseFloat(scope.row.amount / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="手续金额" align="center" prop="channelFeeAmount">
        <template #default="scope">
          ￥{{ parseFloat(scope.row.channelFeeAmount / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="退款金额" align="center" prop="refundAmount">
        <template #default="scope">
          ￥{{ parseFloat(scope.row.refundAmount / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="支付状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="回调状态" align="center" prop="notifyStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_ORDER_NOTIFY_STATUS" :value="scope.row.notifyStatus" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="100"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="支付时间"
        align="center"
        prop="successTime"
        width="100"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="操作"
        align="center"
        fixed="right"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-search"
            @click="openForm(scope.row.id)"
            v-hasPermi="['pay:order:query']"
            >查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </content-wrap>

  <!-- 表单弹窗：预览 -->
  <OrderForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts" name="Order">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import * as MerchantApi from '@/api/pay/merchant'
import * as OrderApi from '@/api/pay/order'
import download from '@/utils/download'
import * as AppApi from '@/api/pay/app'
import { dateFormatter } from '@/utils/formatTime'
import OrderForm from '@/views/pay/order/orderForm.vue'

const message = useMessage() // 消息弹窗

// const { t } = useI18n() // 国际化
const queryFormRef = ref() // 搜索的表单
const merchantList = ref([]) // 商户列表
const merchantLoading = ref(false) // 商户加载遮罩层
const appList = ref([]) // 支付应用列表集合
const loading = ref(false) // 列表的加载中
const exportLoading = ref(false) // 导出等待
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  merchantId: undefined,
  appId: undefined,
  channelId: undefined,
  channelCode: undefined,
  merchantOrderId: undefined,
  subject: undefined,
  body: undefined,
  notifyUrl: undefined,
  notifyStatus: undefined,
  amount: undefined,
  channelFeeRate: undefined,
  channelFeeAmount: undefined,
  status: undefined,
  userIp: undefined,
  successExtensionId: undefined,
  refundStatus: undefined,
  refundTimes: undefined,
  refundAmount: undefined,
  channelUserId: undefined,
  channelOrderNo: undefined,
  expireTime: [],
  successTime: [],
  notifyTime: [],
  createTime: []
})

/**
 * 根据商户名称模糊匹配商户信息
 * @param name 商户名称
 */
const handleGetMerchantListByName = async (name) => {
  merchantList.value = await MerchantApi.getMerchantListByName(name)
}

/**
 * 根据商户 ID 查询支付应用信息
 */
const handleGetAppListByMerchantId = () => {
  queryParams.appId = undefined
  if (queryParams.merchantId) {
    AppApi.getAppListByMerchantId(queryParams.merchantId).then((response) => {
      appList.value = response.data
    })
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getOrderPage(queryParams)
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
  // 处理查询参数
  // 导出的二次确认
  await message.exportConfirm()
  // 发起导出
  exportLoading.value = true
  const data = await OrderApi.exportOrder(queryParams)
  download.excel(data, '支付订单.xls')
}
/** 预览详情 */
const formRef = ref()
const openForm = (id?: number) => {
  formRef.value.open(id)
}
/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>

<style>
.order-font {
  font-size: 12px;
  padding: 2px 0;
}
</style>
