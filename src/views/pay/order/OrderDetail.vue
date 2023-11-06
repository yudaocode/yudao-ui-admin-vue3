<template>
  <Dialog v-model="dialogVisible" title="订单详情" width="700px">
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户单号">
        <el-tag size="small">{{ detailData.merchantOrderId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="支付单号">
        <el-tag type="warning" size="small" v-if="detailData.no">{{ detailData.no }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="应用编号">{{ detailData.appId }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ detailData.appName }}</el-descriptions-item>
      <el-descriptions-item label="支付状态">
        <dict-tag :type="DICT_TYPE.PAY_ORDER_STATUS" :value="detailData.status" size="small" />
      </el-descriptions-item>
      <el-descriptions-item label="支付金额">
        <el-tag type="success" size="small">￥{{ (detailData.price / 100.0).toFixed(2) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="手续费">
        <el-tag type="warning" size="small">
          ￥{{ (detailData.channelFeePrice / 100.0).toFixed(2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="手续费比例">
        {{ (detailData.channelFeeRate / 100.0).toFixed(2) }}%
      </el-descriptions-item>
      <el-descriptions-item label="支付时间">
        {{ formatDate(detailData.successTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="失效时间">
        {{ formatDate(detailData.expireTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ formatDate(detailData.updateTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <!-- 分割线 -->
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商品标题">{{ detailData.subject }}</el-descriptions-item>
      <el-descriptions-item label="商品描述">{{ detailData.body }}</el-descriptions-item>
      <el-descriptions-item label="支付渠道">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="detailData.channelCode" />
      </el-descriptions-item>
      <el-descriptions-item label="支付 IP">{{ detailData.userIp }}</el-descriptions-item>
      <el-descriptions-item label="渠道单号">
        <el-tag size="mini" type="success" v-if="detailData.channelOrderNo">
          {{ detailData.channelOrderNo }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="渠道用户">{{ detailData.channelUserId }}</el-descriptions-item>
      <el-descriptions-item label="退款金额">
        <el-tag size="mini" type="danger">
          ￥{{ (detailData.refundPrice / 100.0).toFixed(2) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="通知 URL">{{ detailData.notifyUrl }}</el-descriptions-item>
    </el-descriptions>
    <!-- 分割线 -->
    <el-divider />
    <el-descriptions :column="1" label-class-name="desc-label" direction="vertical" border>
      <el-descriptions-item label="支付通道异步回调内容">
        <el-text>{{ detailData.extension.channelNotifyData }}</el-text>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as OrderApi from '@/api/pay/order'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'PayOrderDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({
  extension: {}
})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = await OrderApi.getOrderDetail(id)
    if (!detailData.value.extension) {
      detailData.value.extension = {}
    }
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
