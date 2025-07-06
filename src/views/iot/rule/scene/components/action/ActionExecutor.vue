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
        <!-- TODO @puhui999：单选设备 -->
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
      <!-- TODO @puhui999：服务调用时，选择好某个物模型，剩余直接填写一个 JSON 哈；不用逐个添加~可以试试【设备详情-设备调试】那，有服务调用的模拟 -->
      <DeviceControlAction
        v-if="isDeviceAction"
        :action-type="actionConfig.type"
        :model-value="actionConfig.deviceControl"
        :product-id="product?.id"
        :product-key="product?.productKey"
        @update:model-value="(val) => (actionConfig.deviceControl = val)"
      />

      <!-- 告警执行器 -->
      <div v-else-if="isAlertAction">
        <!-- 告警触发 - 无需额外配置 -->
        <div
          v-if="actionConfig.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER"
          class="bg-[#dbe5f6] flex items-center justify-center p-10px"
        >
          <el-icon class="mr-5px text-blue-500"><Icon icon="ep:info-filled" /></el-icon>
          <span class="text-gray-600">触发告警通知，系统将自动发送告警信息</span>
        </div>

        <!-- 告警恢复 - 需要选择告警配置 -->
        <div v-else-if="actionConfig.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER">
          <div class="bg-[#dbe5f6] flex items-center justify-center p-10px mb-10px">
            <el-icon class="mr-5px text-blue-500"><Icon icon="ep:info-filled" /></el-icon>
            <!-- TODO @puhui999：这种类型的提示，感觉放在 SELECT 那，后面有个所有的提示，会不会更好呀；因为可以少占用行呢； -->
            <span class="text-gray-600">恢复指定的告警配置状态</span>
          </div>
          <div class="p-10px">
            <el-form-item label="选择告警配置" required label-width="110">
              <el-select
                v-model="actionConfig.alertConfigId"
                class="!w-240px"
                clearable
                placeholder="请选择要恢复的告警配置"
                :loading="alertConfigLoading"
              >
                <el-option
                  v-for="config in alertConfigList"
                  :key="config.id"
                  :label="config.name"
                  :value="config.id"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>
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
import DeviceControlAction from './DeviceControlAction.vue'
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { AlertConfigApi, AlertConfig } from '@/api/iot/alert/config'
import {
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
  if (isAlertAction.value) {
    if (actionConfig.value.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER) {
      // 告警触发 - 无需额外配置
      actionConfig.value.alertConfigId = undefined
    } else if (actionConfig.value.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER) {
      // 告警恢复 - 需要选择告警配置
      if (!actionConfig.value.alertConfigId) {
        actionConfig.value.alertConfigId = undefined
      }
    }
  }
}

/** 产品和设备选择 */
const productTableSelectRef = ref<InstanceType<typeof ProductTableSelect>>()
const deviceTableSelectRef = ref<InstanceType<typeof DeviceTableSelect>>()
const product = ref<ProductVO>()
const deviceList = ref<DeviceVO[]>([])

/** 告警配置相关 */
const alertConfigList = ref<AlertConfig[]>([])
const alertConfigLoading = ref(false)

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

/** 获取告警配置列表 */
const getAlertConfigList = async () => {
  try {
    alertConfigLoading.value = true
    alertConfigList.value = await AlertConfigApi.getSimpleAlertConfigList()
  } catch (error) {
    console.error('获取告警配置列表失败:', error)
  } finally {
    alertConfigLoading.value = false
  }
}

/** 监听执行类型变化，初始化对应配置 */
watch(
  () => actionConfig.value.type,
  (newType) => {
    initActionConfig()
    // 如果是告警恢复类型，需要加载告警配置列表
    if (newType === IotRuleSceneActionTypeEnum.ALERT_RECOVER) {
      getAlertConfigList()
    }
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
