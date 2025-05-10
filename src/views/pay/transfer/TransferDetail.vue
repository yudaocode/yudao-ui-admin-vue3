<template>
  <Dialog v-model="dialogVisible" title="转账单详情" width="700px">
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户单号">
        <el-tag size="small">{{ detailData.merchantTransferId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="转账单号">
        <el-tag type="warning" size="small" v-if="detailData.no">{{ detailData.no }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="应用编号">{{ detailData.appId }}</el-descriptions-item>
      <el-descriptions-item label="转账状态">
        <dict-tag :type="DICT_TYPE.PAY_TRANSFER_STATUS" :value="detailData.status" size="small" />
      </el-descriptions-item>
      <el-descriptions-item label="转账金额">
        <el-tag type="success" size="small">￥{{ (detailData.price / 100.0).toFixed(2) }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="转账时间">
        {{ formatDate(detailData.successTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <!-- 分割线 -->
    <el-divider />
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="收款人姓名">{{ detailData.userName }}</el-descriptions-item>
      <el-descriptions-item label="收款人账号">{{ detailData.userAccount }}</el-descriptions-item>
      <el-descriptions-item label="支付渠道">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="detailData.channelCode" />
      </el-descriptions-item>
      <el-descriptions-item label="支付 IP">{{ detailData.userIp }}</el-descriptions-item>
      <el-descriptions-item label="渠道单号">
        <el-tag size="mini" type="success" v-if="detailData.channelTransferNo">
          {{ detailData.channelTransferNo }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="通知 URL">{{ detailData.notifyUrl }}</el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <el-descriptions :column="1" label-class-name="desc-label" direction="vertical" border>
      <el-descriptions-item label="转账渠道通知内容">
        <el-text style="white-space: pre-wrap; word-break: break-word">
          {{ detailData.channelNotifyData }}
        </el-text>
      </el-descriptions-item>
    </el-descriptions>
    <el-divider />
    <div style="text-align: right">
      <el-button @click="dialogVisible = false">取 消</el-button>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as TransferApi from '@/api/pay/transfer'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'PayTransferDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = await TransferApi.getTransfer(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>

<style scoped></style>
