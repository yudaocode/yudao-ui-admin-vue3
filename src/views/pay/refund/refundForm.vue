<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="50%">
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户名称">{{ refundDetail.merchantName }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ refundDetail.appName }}</el-descriptions-item>
      <el-descriptions-item label="商品名称">{{ refundDetail.subject }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户退款单号">
        <el-tag size="small">{{ refundDetail.merchantRefundNo }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="商户订单号"
        >{{ refundDetail.merchantOrderId }}
      </el-descriptions-item>
      <el-descriptions-item label="交易订单号">{{ refundDetail.tradeNo }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="支付金额">
        {{ parseFloat(refundDetail.payAmount / 100).toFixed(2) }}
      </el-descriptions-item>
      <el-descriptions-item label="退款金额" size="small">
        <el-tag class="tag-purple" size="small">
          {{ parseFloat(refundDetail.refundAmount / 100).toFixed(2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="退款类型">
        <dict-tag :type="DICT_TYPE.PAY_REFUND_ORDER_TYPE" :value="refundDetail.type" />
      </el-descriptions-item>
      <el-descriptions-item label="退款状态">
        <dict-tag :type="DICT_TYPE.PAY_REFUND_ORDER_STATUS" :value="refundDetail.status" />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间"
        >{{ formatDate(refundDetail.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="退款成功时间"
        >{{ formatDate(refundDetail.successTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="退款失效时间"
        >{{ formatDate(refundDetail.expireTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间"
        >{{ formatDate(refundDetail.updateTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="支付渠道">
        {{ refundDetail.channelCodeName }}
      </el-descriptions-item>
      <el-descriptions-item label="支付IP" size="small">
        {{ refundDetail.userIp }}
      </el-descriptions-item>
      <el-descriptions-item label="回调地址">{{ refundDetail.notifyUrl }}</el-descriptions-item>
      <el-descriptions-item label="回调状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_NOTIFY_STATUS" :value="refundDetail.notifyStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="回调时间"
        >{{ formatDate(refundDetail.notifyTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="渠道订单号"
        >{{ refundDetail.channelOrderNo }}
      </el-descriptions-item>
      <el-descriptions-item label="渠道退款单号"
        >{{ refundDetail.channelRefundNo }}
      </el-descriptions-item>
      <el-descriptions-item label="渠道错误码"
        >{{ refundDetail.channelErrorCode }}
      </el-descriptions-item>
      <el-descriptions-item label="渠道错误码描述"
        >{{ refundDetail.channelErrorMsg }}
      </el-descriptions-item>
    </el-descriptions>
    <br />
    <el-descriptions :column="1" label-class-name="desc-label" direction="vertical" border>
      <el-descriptions-item label="渠道额外参数"
        >{{ refundDetail.channelExtras }}
      </el-descriptions-item>
      <el-descriptions-item label="退款原因">{{ refundDetail.reason }}</el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script setup lang="ts" name="refundForm">
import { DICT_TYPE } from '@/utils/dict'
import * as RefundApi from '@/api/pay/refund'
import { formatDate } from '@/utils/formatTime'

const { t } = useI18n() // 国际化
// const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('退款订单详情') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const defaultrefundDetail = {
  id: null,
  appId: null,
  appName: '',
  channelCode: '',
  channelCodeName: '',
  channelErrorCode: '',
  channelErrorMsg: '',
  channelExtras: '',
  channelId: null,
  channelOrderNo: '',
  channelRefundNo: '',
  createTime: null,
  expireTime: null,
  merchantId: null,
  merchantName: '',
  merchantOrderId: '',
  merchantRefundNo: '',
  notifyStatus: null,
  notifyTime: null,
  notifyUrl: '',
  orderId: null,
  payAmount: null,
  reason: '',
  refundAmount: null,
  status: null,
  subject: '',
  successTime: null,
  tradeNo: '',
  type: null,
  userIp: ''
}
const refundDetail = ref(JSON.parse(JSON.stringify(defaultrefundDetail)))

/** 打开弹窗 */
const open = async (id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.preview')
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      refundDetail.value = await RefundApi.getRefundApi(id)
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
</style>
