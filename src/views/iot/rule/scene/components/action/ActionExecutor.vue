<template>
  <div>
    <div class="m-10px">
      <!-- 产品设备回显区域 -->
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
        <div v-if="isDeviceAction" class="flex items-center mr-60px">
          <span class="mr-10px">产品</span>
          <el-button type="primary" @click="handleSelectProduct" size="small" plain>
            {{ product ? product.name : '选择产品' }}
          </el-button>
        </div>
        <div v-if="isDeviceAction" class="flex items-center mr-60px">
          <span class="mr-10px">设备</span>
          <el-button type="primary" @click="handleSelectDevice" size="small" plain>
            {{ isEmpty(deviceList) ? '选择设备' : deviceList.map((d) => d.deviceName).join(',') }}
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
        v-if="isDeviceAction"
        :action-type="actionConfig.type"
        :model-value="actionConfig.deviceControl"
        :product-id="product?.id"
        :product-key="product?.productKey"
        @update:model-value="(val) => (actionConfig.deviceControl = val)"
      />

      <!-- 告警执行器 -->
      <AlertAction
        v-else-if="isAlertAction"
        :action-type="actionConfig.type"
        :model-value="actionConfig.alert"
        @update:model-value="(val) => (actionConfig.alert = val)"
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
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import ProductTableSelect from '@/views/iot/product/product/components/ProductTableSelect.vue'
import DeviceTableSelect from '@/views/iot/device/device/components/DeviceTableSelect.vue'
import DeviceControlAction from './DeviceControlAction.vue'
import AlertAction from './AlertAction.vue'
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import {
  ActionAlert,
  ActionConfig,
  ActionDeviceControl,
  IotDeviceMessageIdentifierEnum,
  IotDeviceMessageTypeEnum,
  IotRuleSceneActionTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 场景联动之执行器组件 */
defineOptions({ name: 'ActionExecutor' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const actionConfig = useVModel(props, 'modelValue', emits) as Ref<ActionConfig>

const message = useMessage()

/** 计算属性：判断是否为设备相关执行类型 */
const isDeviceAction = computed(() => {
  return [
    IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
  ].includes(actionConfig.value.type as any)
})

/** 计算属性：判断是否为告警相关执行类型 */
const isAlertAction = computed(() => {
  return [
    IotRuleSceneActionTypeEnum.ALERT_TRIGGER,
    IotRuleSceneActionTypeEnum.ALERT_RECOVER
  ].includes(actionConfig.value.type as any)
})

/** 初始化执行器结构 */
const initActionConfig = () => {
  if (!actionConfig.value) {
    actionConfig.value = { type: IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET } as ActionConfig
  }

  // 设备控制执行器初始化
  if (isDeviceAction.value && !actionConfig.value.deviceControl) {
    actionConfig.value.deviceControl = {
      productKey: '',
      deviceNames: [],
      type:
        actionConfig.value.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET
          ? IotDeviceMessageTypeEnum.PROPERTY
          : IotDeviceMessageTypeEnum.SERVICE,
      identifier:
        actionConfig.value.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET
          ? IotDeviceMessageIdentifierEnum.PROPERTY_SET
          : IotDeviceMessageIdentifierEnum.SERVICE_INVOKE,
      data: {}
    } as ActionDeviceControl
  }

  // 告警执行器初始化
  if (isAlertAction.value && !actionConfig.value.alert) {
    actionConfig.value.alert = {} as ActionAlert
  }
}

/** 产品和设备选择 */
const productTableSelectRef = ref<InstanceType<typeof ProductTableSelect>>()
const deviceTableSelectRef = ref<InstanceType<typeof DeviceTableSelect>>()
const product = ref<ProductVO>()
const deviceList = ref<DeviceVO[]>([])

/** 处理选择产品 */
const handleSelectProduct = () => {
  productTableSelectRef.value?.open()
}

/** 处理选择设备 */
const handleSelectDevice = () => {
  if (!product.value) {
    message.warning('请先选择一个产品')
    return
  }
  deviceTableSelectRef.value?.open()
}

/** 处理产品选择成功 */
const handleProductSelect = (val: ProductVO) => {
  product.value = val
  if (actionConfig.value.deviceControl) {
    actionConfig.value.deviceControl.productKey = val.productKey
  }
  // 重置设备选择
  deviceList.value = []
  if (actionConfig.value.deviceControl) {
    actionConfig.value.deviceControl.deviceNames = []
  }
}

/** 处理设备选择成功 */
const handleDeviceSelect = (val: DeviceVO[]) => {
  deviceList.value = val
  if (actionConfig.value.deviceControl) {
    actionConfig.value.deviceControl.deviceNames = val.map((item) => item.deviceName)
  }
}

/** 监听执行类型变化，初始化对应配置 */
watch(
  () => actionConfig.value.type,
  () => {
    initActionConfig()
  },
  { immediate: true }
)

/** 初始化产品回显信息 */
const initProductInfo = async () => {
  if (!actionConfig.value.deviceControl?.productKey) {
    return
  }

  try {
    const productData = await ProductApi.getProductByKey(
      actionConfig.value.deviceControl.productKey
    )
    if (productData) {
      product.value = productData
    }
  } catch (error) {
    console.error('获取产品信息失败:', error)
  }
}

/**
 * 初始化设备回显信息
 */
const initDeviceInfo = async () => {
  if (
    !actionConfig.value.deviceControl?.productKey ||
    !actionConfig.value.deviceControl?.deviceNames?.length
  ) {
    return
  }

  try {
    const deviceData = await DeviceApi.getDevicesByProductKeyAndNames(
      actionConfig.value.deviceControl.productKey,
      actionConfig.value.deviceControl.deviceNames
    )
    if (deviceData && deviceData.length > 0) {
      deviceList.value = deviceData
    }
  } catch (error) {
    console.error('获取设备信息失败:', error)
  }
}

/** 初始化 */
onMounted(async () => {
  initActionConfig()

  // 初始化产品和设备回显
  if (actionConfig.value.deviceControl) {
    await initProductInfo()
    await initDeviceInfo()
  }
})
</script>
