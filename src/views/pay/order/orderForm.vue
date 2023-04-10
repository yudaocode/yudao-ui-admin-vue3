<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="50%">
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户名称">{{ orderDetail.merchantName }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ orderDetail.appName }}</el-descriptions-item>
      <el-descriptions-item label="商品名称">{{ orderDetail.subject }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户订单号">
        <el-tag size="small">{{ orderDetail.merchantOrderId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="渠道订单号">
        <el-tag class="tag-purple" size="small">{{ orderDetail.channelOrderNo }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="支付订单号">
        <el-tag v-if="orderDetail.payOrderExtension.no !== ''" class="tag-pink" size="small">
          {{ orderDetail.payOrderExtension.no }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="金额">
        <el-tag type="success" size="small">{{ parseFloat(orderDetail.amount / 100, 2) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="手续费">
        <el-tag type="warning" size="small"
          >{{ parseFloat(orderDetail.channelFeeAmount / 100, 2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="手续费比例">
        {{ parseFloat(orderDetail.channelFeeRate / 100, 2) }}%
      </el-descriptions-item>
      <el-descriptions-item label="支付状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_STATUS" :value="orderDetail.status" />
      </el-descriptions-item>
      <el-descriptions-item label="回调状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_NOTIFY_STATUS" :value="orderDetail.notifyStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="回调地址">{{ orderDetail.notifyUrl }}</el-descriptions-item>
      <el-descriptions-item label="创建时间" :formatter="dateFormatter">
        {{ formatDate(orderDetail.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付时间" :formatter="dateFormatter">
        {{ formatDate(orderDetail.successTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="失效时间" :formatter="dateFormatter">
        {{ formatDate(orderDetail.expireTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="通知时间" :formatter="dateFormatter">
        {{ formatDate(orderDetail.notifyTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="支付渠道"
        >{{ orderDetail.channelCodeName }}
      </el-descriptions-item>
      <el-descriptions-item label="支付IP">{{ orderDetail.userIp }}</el-descriptions-item>
      <el-descriptions-item label="退款状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_REFUND_STATUS" :value="orderDetail.refundStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="退款次数">{{ orderDetail.refundTimes }}</el-descriptions-item>
      <el-descriptions-item label="退款金额">
        <el-tag type="warning">
          {{ parseFloat(orderDetail.refundAmount / 100, 2) }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="1" label-class-name="desc-label" direction="vertical" border>
      <el-descriptions-item label="商品描述">
        {{ orderDetail.body }}
      </el-descriptions-item>
      <el-descriptions-item label="支付通道异步回调内容">
        {{ orderDetail.payOrderExtension.channelNotifyData }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script setup lang="ts" name="orderForm">
import { DICT_TYPE } from '@/utils/dict'
import * as OrderApi from '@/api/pay/order'
import { dateFormatter, formatDate } from '@/utils/formatTime'

const { t } = useI18n() // 国际化
// const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('订单详情') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const defaultOrderDetail = {
  merchantName: '',
  appName: '',
  channelCodeName: '',
  subject: '',
  merchantOrderId: null,
  channelOrderNo: '',
  body: '',
  amount: null,
  channelFeeRate: null,
  channelFeeAmount: null,
  userIp: '',
  status: null,
  notifyUrl: '',
  notifyStatus: null,
  refundStatus: null,
  refundTimes: '',
  refundAmount: null,
  createTime: '',
  successTime: '',
  notifyTime: '',
  expireTime: '',
  payOrderExtension: {
    channelNotifyData: '',
    no: ''
  }
}
const orderDetail = ref(JSON.parse(JSON.stringify(defaultOrderDetail)))

/** 打开弹窗 */
const open = async (id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.preview')
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      orderDetail.value = await OrderApi.getOrderDetail(id)
      if (orderDetail.value.payOrderExtension === null) {
        orderDetail.value.payOrderExtension = Object.assign(
          defaultOrderDetail.payOrderExtension,
          {}
        )
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
<style>
.tag-purple {
  color: #722ed1;
  background: #f9f0ff;
  border-color: #d3adf7;
}

.tag-pink {
  color: #eb2f96;
  background: #fff0f6;
  border-color: #ffadd2;
}
</style>
