<!-- 设备物模型：设备属性、事件管理、服务调用 -->
<template>
  <ContentWrap>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="设备属性（运行状态）" name="property">
        <DeviceDetailsThingModelProperty :device-id="deviceId" />
      </el-tab-pane>
      <el-tab-pane label="设备事件上报" name="event">
        <DeviceDetailsThingModelEvent
          :device-id="props.deviceId"
          :thing-model-list="props.thingModelList"
        />
      </el-tab-pane>
      <el-tab-pane label="设备服务调用" name="service">
        <DeviceDetailsThingModelService
          :device-id="deviceId"
          :thing-model-list="props.thingModelList"
        />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ThingModelData } from '@/api/iot/thingmodel'
import DeviceDetailsThingModelProperty from './DeviceDetailsThingModelProperty.vue'
import DeviceDetailsThingModelEvent from './DeviceDetailsThingModelEvent.vue'
import DeviceDetailsThingModelService from './DeviceDetailsThingModelService.vue'

const props = defineProps<{
  deviceId: number
  thingModelList: ThingModelData[]
}>()

const activeTab = ref('property') // 默认选中设备属性
</script>
