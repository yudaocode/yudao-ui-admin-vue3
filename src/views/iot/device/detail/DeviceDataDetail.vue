<template>
  <Dialog title="查看数据" v-model="dialogVisible">
    <p>查看数据</p>
  </Dialog>
</template>
<script setup lang="ts">
import { DeviceApi, DeviceVO } from '@/api/iot/device'
import { ProductApi } from '@/api/iot/product'

/** IoT 设备 表单 */
defineOptions({ name: 'IoTDeviceForm' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false)

/** 打开弹窗 */
const open = async (deviceId: number, identifier: String) => {
  dialogVisible.value = true

  detailLoading.value = true
  try {
    // formData.value = await DeviceApi.getDevice(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
