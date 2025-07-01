<template>
  <div>
    <div class="m-10px">
      <div class="relative bg-[#eff3f7] h-50px flex items-center px-10px">
        <div class="flex items-center mr-60px">
          <span class="mr-10px">触发条件</span>
          <el-select
            v-model="triggerConfig.type"
            class="!w-240px"
            clearable
            placeholder="请选择触发条件"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.IOT_RULE_SCENE_TRIGGER_TYPE_ENUM)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </div>
        <div class="flex items-center mr-60px">
          <span class="mr-10px">产品</span>
          <el-button type="primary" @click="productTableSelectRef?.open()" size="small" plain>
            {{ product ? product.name : '选择产品' }}
          </el-button>
        </div>
        <div class="flex items-center mr-60px">
          <span class="mr-10px">设备</span>
          <el-button type="primary" @click="openDeviceSelect" size="small" plain>
            {{ isEmpty(deviceList) ? '选择设备' : triggerConfig.deviceNames.join(',') }}
          </el-button>
        </div>
        <!-- 删除触发器 -->
        <div class="absolute top-auto right-16px bottom-auto">
          <el-tooltip content="删除触发器" placement="top">
            <slot></slot>
          </el-tooltip>
        </div>
      </div>

      <!-- 设备状态变更说明 -->
      <div
        v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE"
        class="bg-[#dbe5f6] flex items-center justify-center p-10px"
      >
        <el-icon class="mr-5px text-blue-500"><Icon icon="ep:info-filled" /></el-icon>
        <span class="text-gray-600">当选中的设备上线或下线时触发场景联动</span>
      </div>

      <!-- 定时触发 -->
      <div
        v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.TIMER"
        class="bg-[#dbe5f6] flex items-center justify-between p-10px"
      >
        <span class="w-120px">CRON 表达式</span>
        <crontab v-model="triggerConfig.cronExpression" />
      </div>
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
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { IotRuleSceneTriggerTypeEnum, TriggerConfig } from '@/api/iot/rule/scene/scene.types'
import { Crontab } from '@/components/Crontab'

/** 设备状态监听器组件 */
defineOptions({ name: 'DeviceStateListener' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const triggerConfig = useVModel(props, 'modelValue', emits) as Ref<TriggerConfig>

const message = useMessage()

/** 产品和设备选择引用 */
const productTableSelectRef = ref<InstanceType<typeof ProductTableSelect>>()
const deviceTableSelectRef = ref<InstanceType<typeof DeviceTableSelect>>()
const product = ref<ProductVO>()
const deviceList = ref<DeviceVO[]>([])

/** 处理产品选择 */
const handleProductSelect = (val: ProductVO) => {
  product.value = val
  triggerConfig.value.productKey = val.productKey
  deviceList.value = []
}

/** 处理设备选择 */
const handleDeviceSelect = (val: DeviceVO[]) => {
  deviceList.value = val
  triggerConfig.value.deviceNames = val.map((item) => item.deviceName)
}

/** 打开设备选择器 */
const openDeviceSelect = () => {
  if (!product.value) {
    message.warning('请先选择一个产品')
    return
  }
  deviceTableSelectRef.value?.open()
}

/**
 * 初始化产品回显信息
 */
const initProductInfo = async () => {
  if (!triggerConfig.value.productKey) {
    return
  }

  try {
    const productData = await ProductApi.getProductByKey(triggerConfig.value.productKey)
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
  if (!triggerConfig.value.productKey || !triggerConfig.value.deviceNames?.length) {
    return
  }

  try {
    const deviceData = await DeviceApi.getDevicesByProductKeyAndNames(
      triggerConfig.value.productKey,
      triggerConfig.value.deviceNames
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
  if (triggerConfig.value) {
    await initProductInfo()
    await initDeviceInfo()
  }
})
</script>
