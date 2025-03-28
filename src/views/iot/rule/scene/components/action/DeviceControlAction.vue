<template>
  <div class="bg-[#dbe5f6] p-10px">
    <div class="flex items-center mb-10px">
      <span class="mr-10px w-60px">产品</span>
      <el-button type="primary" @click="productTableSelectRef?.open()" size="small" plain>
        {{ product ? product.name : '选择产品' }}
      </el-button>
    </div>
    <div class="flex items-center mb-10px">
      <span class="mr-10px w-60px">设备</span>
      <el-button type="primary" @click="openDeviceSelect" size="small" plain>
        {{ isEmpty(deviceList) ? '选择设备' : deviceControlConfig.deviceNames.join(',') }}
      </el-button>
    </div>
    <div class="flex items-center mb-10px">
      <span class="mr-10px w-60px">消息类型</span>
      <el-select
        v-model="deviceControlConfig.type"
        class="!w-160px"
        clearable
        placeholder="选择消息类型"
      >
        <el-option label="属性" :value="IotDeviceMessageTypeEnum.PROPERTY" />
        <el-option label="服务" :value="IotDeviceMessageTypeEnum.SERVICE" />
      </el-select>
    </div>
    <div v-if="deviceControlConfig.type" class="flex items-center mb-10px">
      <span class="mr-10px w-60px">具体操作</span>
      <el-select
        v-model="deviceControlConfig.identifier"
        class="!w-240px"
        clearable
        placeholder="选择操作项"
      >
        <template v-if="deviceControlConfig.type === IotDeviceMessageTypeEnum.PROPERTY">
          <el-option :value="IotDeviceMessageIdentifierEnum.PROPERTY_SET" label="属性设置" />
        </template>
        <template v-else-if="deviceControlConfig.type === IotDeviceMessageTypeEnum.SERVICE">
          <el-option
            v-for="model in thingModelTSL?.services"
            :key="model.identifier"
            :label="model.name"
            :value="model.identifier"
          />
        </template>
      </el-select>
    </div>
    <DeviceActionControl
      v-if="deviceControlConfig.identifier && deviceControlConfig.type"
      :model-value="deviceControlConfig.data"
      :thing-models="getThingModels()"
      :message-type="deviceControlConfig.type"
      :identifier="deviceControlConfig.identifier"
      @update:model-value="(val) => (deviceControlConfig.data = val)"
    />
  </div>

  <!-- 产品、设备的选择 -->
  <ProductTableSelect ref="productTableSelectRef" @success="handleProductSelect" />
  <DeviceTableSelect
    ref="deviceTableSelectRef"
    multiple
    :product-id="product?.id"
    @success="handleDeviceSelect"
  />
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'
import ProductTableSelect from '@/views/iot/product/product/components/ProductTableSelect.vue'
import DeviceTableSelect from '@/views/iot/device/device/components/DeviceTableSelect.vue'
import DeviceActionControl from './DeviceActionControl.vue'
import { ProductVO } from '@/api/iot/product/product'
import { DeviceVO } from '@/api/iot/device/device'
import { ThingModelApi } from '@/api/iot/thingmodel'
import {
  ActionDeviceControl,
  IotDeviceMessageIdentifierEnum,
  IotDeviceMessageTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 设备控制执行器组件 */
defineOptions({ name: 'DeviceControlAction' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const deviceControlConfig = useVModel(props, 'modelValue', emits) as Ref<ActionDeviceControl>

const message = useMessage()

// 初始化设备控制执行器结构
const initDeviceControlConfig = () => {
  if (!deviceControlConfig.value) {
    deviceControlConfig.value = {
      productKey: '',
      deviceNames: [],
      type: IotDeviceMessageTypeEnum.PROPERTY,
      identifier: IotDeviceMessageIdentifierEnum.PROPERTY_SET,
      data: {}
    } as ActionDeviceControl
  }
}

// 初始化
onMounted(() => {
  initDeviceControlConfig()
})

// 产品和设备选择
const productTableSelectRef = ref<InstanceType<typeof ProductTableSelect>>()
const deviceTableSelectRef = ref<InstanceType<typeof DeviceTableSelect>>()
const product = ref<ProductVO>()
const deviceList = ref<DeviceVO[]>([])

/** 处理产品选择 */
const handleProductSelect = (val: ProductVO) => {
  product.value = val
  deviceControlConfig.value.productKey = val.productKey
  deviceList.value = []
  getThingModelTSL()
}

/** 处理设备选择 */
const handleDeviceSelect = (val: DeviceVO[]) => {
  deviceList.value = val
  deviceControlConfig.value.deviceNames = val.map((item) => item.deviceName)
}

/** 打开设备选择器 */
const openDeviceSelect = () => {
  if (!product.value) {
    message.warning('请先选择一个产品')
    return
  }
  deviceTableSelectRef.value?.open()
}

/** 获取产品物模型 */
const thingModelTSL = ref<any>()
const getThingModelTSL = async () => {
  if (!product.value) {
    return
  }
  thingModelTSL.value = await ThingModelApi.getThingModelTSLByProductId(product.value.id)
}

/** 根据消息类型和标识符获取对应的物模型 */
const getThingModels = () => {
  if (!deviceControlConfig.value) return []
  
  switch (deviceControlConfig.value.type) {
    case IotDeviceMessageTypeEnum.PROPERTY:
      return thingModelTSL.value?.properties || []
    case IotDeviceMessageTypeEnum.SERVICE:
      return thingModelTSL.value?.services.find(
        (s: any) => s.identifier === deviceControlConfig.value.identifier
      ) || {}
  }
  return []
}
</script> 
