<template>
  <Dialog v-model="dialogVisible" title="详情" width="50%">
    <el-descriptions :column="2">
      <el-descriptions-item label="商户名称">{{ detailData.merchantName }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ detailData.appName }}</el-descriptions-item>
      <el-descriptions-item label="商品名称">{{ detailData.subject }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2">
      <el-descriptions-item label="商户退款单号">
        <el-tag>{{ detailData.merchantRefundNo }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="商户订单号">
        {{ detailData.merchantOrderId }}
      </el-descriptions-item>
      <el-descriptions-item label="交易订单号">{{ detailData.tradeNo }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2">
      <el-descriptions-item label="支付金额">
        <el-tag type="success">￥{{ parseFloat(detailData.payAmount / 100, 2).toFixed(2) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="退款金额">
        <el-tag class="tag-purple">
          ￥{{ parseFloat(detailData.refundAmount / 100).toFixed(2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="退款类型">
        <dict-tag :type="DICT_TYPE.PAY_REFUND_ORDER_TYPE" :value="detailData.type" />
      </el-descriptions-item>
      <el-descriptions-item label="退款状态">
        <dict-tag :type="DICT_TYPE.PAY_REFUND_ORDER_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="退款成功时间">
        {{ formatDate(detailData.successTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="退款失效时间">
        {{ formatDate(detailData.expireTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ formatDate(detailData.updateTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2">
      <el-descriptions-item label="支付渠道">
        {{ detailData.channelCodeName }}
      </el-descriptions-item>
      <el-descriptions-item label="支付 IP">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item label="回调地址">{{ detailData.notifyUrl }}</el-descriptions-item>
      <el-descriptions-item label="回调状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_NOTIFY_STATUS" :value="detailData.notifyStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="回调时间">
        {{ formatDate(detailData.notifyTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2">
      <el-descriptions-item label="渠道订单号">
        {{ detailData.channelOrderNo }}
      </el-descriptions-item>
      <el-descriptions-item label="渠道退款单号">
        {{ detailData.channelRefundNo }}
      </el-descriptions-item>
      <el-descriptions-item label="渠道错误码">
        {{ detailData.channelErrorCode }}
      </el-descriptions-item>
      <el-descriptions-item label="渠道错误码描述">
        {{ detailData.channelErrorMsg }}
      </el-descriptions-item>
    </el-descriptions>
    <br />
    <el-descriptions :column="1" border direction="vertical">
      <el-descriptions-item label="渠道额外参数">
        {{ detailData.channelExtras }}
      </el-descriptions-item>
      <el-descriptions-item label="退款原因">{{ detailData.reason }}</el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" name="PayRefundDetail" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as RefundApi from '@/api/pay/refund'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = await RefundApi.getRefund(id)
  } finally {
    detailLoading.value = false
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
