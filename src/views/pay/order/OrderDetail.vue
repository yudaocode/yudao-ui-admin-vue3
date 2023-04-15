<template>
  <Dialog v-model="dialogVisible" title="详情" width="50%">
    <el-descriptions :column="2">
      <el-descriptions-item label="商户名称">{{ detailData.merchantName }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ detailData.appName }}</el-descriptions-item>
      <el-descriptions-item label="商品名称">{{ detailData.subject }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2">
      <el-descriptions-item label="商户订单号">
        <el-tag>{{ detailData.merchantOrderId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="渠道订单号">
        <el-tag class="tag-purple">{{ detailData.channelOrderNo }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="支付订单号">
        <el-tag v-if="detailData.payOrderExtension" class="tag-pink">
          {{ detailData.payOrderExtension.no }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="金额">
        <el-tag type="success">￥{{ parseFloat(detailData.amount / 100, 2).toFixed(2) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="手续费">
        <el-tag type="warning">
          ￥{{ parseFloat(detailData.channelFeeAmount / 100, 2).toFixed(2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="手续费比例">
        {{ parseFloat(detailData.channelFeeRate / 100, 2) }}%
      </el-descriptions-item>
      <el-descriptions-item label="支付状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item label="回调状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_NOTIFY_STATUS" :value="detailData.notifyStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="回调地址">{{ detailData.notifyUrl }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付时间">
        {{ formatDate(detailData.successTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="失效时间">
        {{ formatDate(detailData.expireTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="通知时间">
        {{ formatDate(detailData.notifyTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="2">
      <el-descriptions-item label="支付渠道"
        >{{ detailData.channelCodeName }}
      </el-descriptions-item>
      <el-descriptions-item label="支付IP">{{ detailData.userIp }}</el-descriptions-item>
      <el-descriptions-item label="退款状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_REFUND_STATUS" :value="detailData.refundStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="退款次数">{{ detailData.refundTimes }}</el-descriptions-item>
      <el-descriptions-item label="退款金额">
        <el-tag type="warning">
          {{ parseFloat(detailData.refundAmount / 100, 2) }}
        </el-tag>
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="1" border direction="vertical">
      <el-descriptions-item label="商品描述">
        {{ detailData.body }}
      </el-descriptions-item>
      <el-descriptions-item label="支付通道异步回调内容">
        <div style="width: 700px; overflow: auto">
          {{ detailData.payOrderExtension?.channelNotifyData }}
        </div>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" name="PayOrderDetail" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as OrderApi from '@/api/pay/order'
import { formatDate } from '@/utils/formatTime'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = await OrderApi.getOrderDetail(id)
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

.tag-pink {
  color: #eb2f96;
  background: #fff0f6;
  border-color: #ffadd2;
}
</style>
