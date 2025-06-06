<template>
  <Dialog v-model="dialogVisible" title="详情" width="700px">
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户退款单号">
        <el-tag size="small">{{ refundDetail.merchantRefundId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="渠道退款单号">
        <el-tag type="success" size="small" v-if="refundDetail.channelRefundNo">{{
          refundDetail.channelRefundNo
        }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="商户支付单号">
        <el-tag size="small">{{ refundDetail.merchantOrderId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="渠道支付单号">
        <el-tag type="success" size="small">{{ refundDetail.channelOrderNo }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="应用编号">{{ refundDetail.appId }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ refundDetail.appName }}</el-descriptions-item>
      <el-descriptions-item label="支付金额">
        <el-tag type="success" size="small">
          ￥{{ (refundDetail.payPrice / 100.0).toFixed(2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="退款金额">
        <el-tag size="mini" type="danger">
          ￥{{ (refundDetail.refundPrice / 100.0).toFixed(2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="退款状态">
        <dict-tag :type="DICT_TYPE.PAY_REFUND_STATUS" :value="refundDetail.status" />
      </el-descriptions-item>
      <el-descriptions-item label="退款时间">
        {{ formatDate(refundDetail.successTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(refundDetail.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ formatDate(refundDetail.updateTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <!-- 分割线 -->
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="退款渠道">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="refundDetail.channelCode" />
      </el-descriptions-item>
      <el-descriptions-item label="退款原因">{{ refundDetail.reason }}</el-descriptions-item>
      <el-descriptions-item label="退款 IP">{{ refundDetail.userIp }}</el-descriptions-item>
      <el-descriptions-item label="通知 URL">{{ refundDetail.notifyUrl }}</el-descriptions-item>
    </el-descriptions>
    <!-- 分割线 -->
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="渠道错误码">
        {{ refundDetail.channelErrorCode }}
      </el-descriptions-item>
      <el-descriptions-item label="渠道错误码描述">
        {{ refundDetail.channelErrorMsg }}
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions :column="1" label-class-name="desc-label" direction="vertical" border>
      <el-descriptions-item label="支付通道异步回调内容">
        <el-text style="white-space: pre-wrap; word-break: break-word">
          {{ refundDetail.channelNotifyData }}
        </el-text>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as RefundApi from '@/api/pay/refund'

defineOptions({ name: 'PayRefundDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const refundDetail = ref({})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    refundDetail.value = await RefundApi.getRefund(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
