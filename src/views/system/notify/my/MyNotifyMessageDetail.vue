<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" title="消息详情">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="发送人">
        {{ detailData.templateNickname }}
      </el-descriptions-item>
      <el-descriptions-item label="发送时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="消息类型">
        <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="detailData.templateType" />
      </el-descriptions-item>
      <el-descriptions-item label="是否已读">
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detailData.readStatus" />
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.readStatus" label="阅读时间">
        {{ formatDate(detailData.readTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="内容">
        {{ detailData.templateContent }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'

defineOptions({ name: 'MyNotifyMessageDetailDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as NotifyMessageApi.NotifyMessageVO) // 详情数据

/** 打开弹窗 */
const open = async (data: NotifyMessageApi.NotifyMessageVO) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = data
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
