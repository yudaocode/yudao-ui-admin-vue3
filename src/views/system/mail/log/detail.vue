<template>
  <Dialog title="详情" v-model="dialogVisible" :scroll="true" :max-height="500">
    <Descriptions :schema="allSchemas.detailSchema" :data="detailData">
      <!-- 展示 HTML 内容 -->
      <template #templateContent="{ row }">
        <div v-html="row.templateContent"></div>
      </template>
    </Descriptions>
  </Dialog>
</template>
<script setup lang="ts">
import * as MailLogApi from '@/api/system/mail/log'
import { allSchemas } from './log.data'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref() // 详情数据

/** 打开弹窗 */
const openModal = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = await MailLogApi.getMailLog(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗
</script>
