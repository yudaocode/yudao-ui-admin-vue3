<!-- 设备物模型：设备属性、事件管理、服务调用 -->
<template>
  <ContentWrap>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="设备属性（运行状态）" name="property">
        <DeviceDetailsThingModelProperty :product="product" :device="device" />
      </el-tab-pane>
      <el-tab-pane label="设备事件" name="event">
        <DeviceDetailsThingModelEvent :product="product" :device="device" />
      </el-tab-pane>
      <el-tab-pane label="服务调用" name="service">
        <DeviceDetailsThingModelService :product="product" :device="device" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ProductVO } from '@/api/iot/product/product'
import { DeviceVO } from '@/api/iot/device/device'
import DeviceDetailsThingModelProperty from './DeviceDetailsThingModelProperty.vue'
import DeviceDetailsThingModelEvent from './DeviceDetailsThingModelEvent.vue'
import DeviceDetailsThingModelService from './DeviceDetailsThingModelService.vue'

const props = defineProps<{ product: ProductVO; device: DeviceVO }>()

const activeTab = ref('property') // 默认选中设备属性
</script>
