<template>
  <Dialog v-model="dialogVisible" title="详情">
    <Descriptions :data="detailData" :schema="allSchemas.detailSchema" />
  </Dialog>
</template>
<script lang="ts" setup>
import * as MailAccountApi from '@/api/system/mail/account'
import { allSchemas } from './account.data'

defineOptions({ name: 'SystemMailAccountDetail' })

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
