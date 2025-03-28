<template>
  <div class="m-10px">
    <div class="relative bg-[#eff3f7] h-50px flex items-center px-10px">
      <div class="flex items-center mr-60px">
        <span class="mr-10px">执行动作</span>
        <el-select
          v-model="actionConfig.type"
          class="!w-240px"
          clearable
          placeholder="请选择执行类型"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_RULE_SCENE_ACTION_TYPE_ENUM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </div>
      <div
        v-if="actionConfig.type === IotRuleSceneActionTypeEnum.DEVICE_CONTROL"
        class="flex items-center mr-60px"
      >
        <span class="mr-10px">产品</span>
        <el-button type="primary" @click="productTableSelectRef?.open()" size="small" plain>
          {{ product ? product.name : '选择产品' }}
        </el-button>
      </div>
      <div
        v-if="actionConfig.type === IotRuleSceneActionTypeEnum.DEVICE_CONTROL"
        class="flex items-center mr-60px"
      >
        <span class="mr-10px">设备</span>
        <el-button type="primary" @click="openDeviceSelect" size="small" plain>
          {{ isEmpty(deviceList) ? '选择设备' : actionConfig.deviceControl?.deviceNames.join(',') }}
        </el-button>
      </div>
      <!-- 删除执行器 -->
      <div class="absolute top-auto right-16px bottom-auto">
        <el-tooltip content="删除执行器" placement="top">
          <slot></slot>
        </el-tooltip>
      </div>
    </div>

    <!-- 设备控制执行器 -->
    <DeviceControlAction
      v-if="actionConfig.type === IotRuleSceneActionTypeEnum.DEVICE_CONTROL"
      :model-value="actionConfig.deviceControl"
      @update:model-value="(val) => (actionConfig.deviceControl = val)"
    />

    <!-- 告警执行器 -->
    <AlertAction
      v-else-if="actionConfig.type === IotRuleSceneActionTypeEnum.ALERT"
      :model-value="actionConfig.alert"
      @update:model-value="(val) => (actionConfig.alert = val)"
    />

    <!-- 数据桥接执行器 -->
    <DataBridgeAction
      v-else-if="actionConfig.type === IotRuleSceneActionTypeEnum.DATA_BRIDGE"
      :model-value="actionConfig.dataBridgeId"
      @update:model-value="(val) => (actionConfig.dataBridgeId = val)"
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import ProductTableSelect from '@/views/iot/product/product/components/ProductTableSelect.vue'
import DeviceTableSelect from '@/views/iot/device/device/components/DeviceTableSelect.vue'
import DeviceControlAction from './DeviceControlAction.vue'
import AlertAction from './AlertAction.vue'
import DataBridgeAction from './DataBridgeAction.vue'
import { ProductVO } from '@/api/iot/product/product'
import { DeviceVO } from '@/api/iot/device/device'
import { ThingModelApi } from '@/api/iot/thingmodel'
import {
  ActionAlert,
  ActionConfig,
  ActionDeviceControl,
  IotRuleSceneActionTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 场景联动之执行器组件 */
defineOptions({ name: 'ActionExecutor' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const actionConfig = useVModel(props, 'modelValue', emits) as Ref<ActionConfig>

const message = useMessage()

// 初始化执行器结构
const initActionConfig = () => {
  if (!actionConfig.value) {
    actionConfig.value = { type: IotRuleSceneActionTypeEnum.DEVICE_CONTROL } as ActionConfig
  }

  // 设备控制执行器初始化
  if (
    actionConfig.value.type === IotRuleSceneActionTypeEnum.DEVICE_CONTROL &&
    !actionConfig.value.deviceControl
  ) {
    actionConfig.value.deviceControl = {} as ActionDeviceControl
  }

  // 告警执行器初始化
  if (actionConfig.value.type === IotRuleSceneActionTypeEnum.ALERT && !actionConfig.value.alert) {
    actionConfig.value.alert = {} as ActionAlert
  }

  // 数据桥接执行器初始化
  if (
    actionConfig.value.type === IotRuleSceneActionTypeEnum.DATA_BRIDGE &&
    !actionConfig.value.dataBridgeId
  ) {
    actionConfig.value.dataBridgeId = undefined
  }
}

// 监听执行类型变化，初始化对应配置
watch(
  () => actionConfig.value.type,
  () => {
    initActionConfig()
  },
  { immediate: true }
)

// 产品和设备选择
const productTableSelectRef = ref<InstanceType<typeof ProductTableSelect>>()
const deviceTableSelectRef = ref<InstanceType<typeof DeviceTableSelect>>()
const product = ref<ProductVO>()
const deviceList = ref<DeviceVO[]>([])

/** 处理产品选择 */
const handleProductSelect = (val: ProductVO) => {
  product.value = val
  actionConfig.value.deviceControl!.productKey = val.productKey
  deviceList.value = []
  getThingModelTSL()
}

/** 处理设备选择 */
const handleDeviceSelect = (val: DeviceVO[]) => {
  deviceList.value = val
  actionConfig.value.deviceControl!.deviceNames = val.map((item) => item.deviceName)
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
</script>
