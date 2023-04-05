<template>
  <Dialog title="详情" v-model="dialogVisible">
    <Descriptions :schema="allSchemas.detailSchema" :data="detailData" />
  </Dialog>
</template>
<script setup lang="ts">
import * as MailAccountApi from '@/api/system/mail/account'
import { allSchemas } from './account.data'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref() // 详情数据

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = await MailAccountApi.getMailAccount(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
