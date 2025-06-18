<!-- 设备服务调用 -->
<template>
  <ContentWrap>
    <div class="text-center p-4">
      <el-empty description="设备服务调用功能开发中..." />
    </div>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ProductVO } from '@/api/iot/product/product'
import { DeviceVO } from '@/api/iot/device/device'

const props = defineProps<{ product: ProductVO; device: DeviceVO }>()

// TODO: 实现设备服务调用功能
</script>
