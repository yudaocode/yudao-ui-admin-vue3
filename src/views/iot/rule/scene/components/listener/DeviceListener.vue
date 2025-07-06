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
        <div v-if="isDeviceTrigger" class="flex items-center mr-60px">
          <span class="mr-10px">产品</span>
          <el-button type="primary" @click="productTableSelectRef?.open()" size="small" plain>
            {{ product ? product.name : '选择产品' }}
          </el-button>
        </div>
        <!-- TODO @puhui999：只允许选择一个，或者全部设备 -->
        <div v-if="isDeviceTrigger" class="flex items-center mr-60px">
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
      <!-- 设备触发器条件 -->
      <template v-if="isDeviceTrigger">
        <!-- 设备上下线变更 - 无需额外配置 -->
        <div
          v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE"
          class="bg-[#dbe5f6] flex items-center justify-center p-10px"
        >
          <span class="text-gray-600">设备上下线状态变更时触发，无需额外配置</span>
        </div>

        <!-- 物模型属性上报、设备事件上报、设备服务调用 - 需要配置条件 -->
        <div
          v-else
          class="bg-[#dbe5f6] flex p-10px"
          v-for="(condition, index) in triggerConfig.conditions"
          :key="index"
        >
          <div class="w-70%">
            <DeviceListenerCondition
              v-for="(parameter, index2) in condition.parameters"
              :key="index2"
              :model-value="parameter"
              :condition-type="condition.type"
              :thingModels="thingModels(condition)"
              @update:model-value="(val) => (condition.parameters[index2] = val)"
              class="mb-10px last:mb-0"
            >
              <el-tooltip content="删除参数" placement="top">
                <el-button
                  type="danger"
                  circle
                  size="small"
                  @click="removeConditionParameter(condition.parameters, index2)"
                >
                  <Icon icon="ep:delete" />
                </el-button>
              </el-tooltip>
            </DeviceListenerCondition>
          </div>
          <!-- 添加参数 -->
          <div class="flex flex-1 flex-col items-center justify-center w-60px h-a">
            <el-tooltip content="添加参数" placement="top">
              <el-button
                type="primary"
                circle
                size="small"
                @click="addConditionParameter(condition.parameters)"
              >
                <Icon icon="ep:plus" />
              </el-button>
            </el-tooltip>
          </div>
          <!-- 删除条件 -->
          <div
            class="device-listener-condition flex flex-1 flex-col items-center justify-center w-a h-a"
          >
            <el-tooltip content="删除条件" placement="top">
              <el-button type="danger" size="small" @click="removeCondition(index)">
                <Icon icon="ep:delete" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
      <!-- 定时触发 -->
      <div
        v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.TIMER"
        class="bg-[#dbe5f6] flex items-center justify-between p-10px"
      >
        <span class="w-120px">CRON 表达式</span>
        <crontab v-model="triggerConfig.cronExpression" />
      </div>
      <!-- 除了设备上下线变更，其他设备触发类型都可以设置多个触发条件 -->
      <!-- TODO @puhui999：触发有点不太对，可以在用下阿里云的呢~ -->
      <el-text
        v-if="
          isDeviceTrigger && triggerConfig.type !== IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE
        "
        class="ml-10px!"
        type="primary"
        @click="addCondition"
      >
        添加触发条件
      </el-text>
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
import DeviceListenerCondition from './DeviceListenerCondition.vue'
import ProductTableSelect from '@/views/iot/product/product/components/ProductTableSelect.vue'
import DeviceTableSelect from '@/views/iot/device/device/components/DeviceTableSelect.vue'
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { ThingModelApi } from '@/api/iot/thingmodel'
import {
  IotDeviceMessageIdentifierEnum,
  IotDeviceMessageTypeEnum,
  IotRuleSceneTriggerTypeEnum,
  TriggerCondition,
  TriggerConditionParameter,
  TriggerConfig
} from '@/api/iot/rule/scene/scene.types'
import { Crontab } from '@/components/Crontab'

/** 场景联动之监听器组件 */
defineOptions({ name: 'DeviceListener' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const triggerConfig = useVModel(props, 'modelValue', emits) as Ref<TriggerConfig>

const message = useMessage()

/** 计算属性：判断是否为设备触发类型 */
const isDeviceTrigger = computed(() => {
  return [
    IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE,
    IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
    IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST,
    IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ].includes(triggerConfig.value.type as any)
})

/** 添加触发条件 */
const addCondition = () => {
  // 根据触发类型设置默认的条件类型
  let defaultConditionType: string = IotDeviceMessageTypeEnum.PROPERTY
  switch (triggerConfig.value.type) {
    case IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST:
      defaultConditionType = IotDeviceMessageTypeEnum.PROPERTY
      break
    case IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST:
      defaultConditionType = IotDeviceMessageTypeEnum.EVENT
      break
    case IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE:
      defaultConditionType = IotDeviceMessageTypeEnum.SERVICE
      break
  }

  // 添加触发条件
  triggerConfig.value.conditions?.push({
    type: defaultConditionType,
    identifier: IotDeviceMessageIdentifierEnum.PROPERTY_SET,
    parameters: []
  })
}
/** 移除触发条件 */
const removeCondition = (index: number) => {
  triggerConfig.value.conditions?.splice(index, 1)
}

/** 添加参数 */
const addConditionParameter = (conditionParameters: TriggerConditionParameter[]) => {
  if (!product.value) {
    message.warning('请先选择一个产品')
    return
  }
  if (conditionParameters.length >= 1) {
    message.warning('只允许添加一个参数')
    return
  }
  conditionParameters.push({} as TriggerConditionParameter)
}
/** 移除参数 */
const removeConditionParameter = (
  conditionParameters: TriggerConditionParameter[],
  index: number
) => {
  conditionParameters.splice(index, 1)
}

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
  getThingModelTSL()
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
    // 使用新的API直接通过productKey获取产品信息
    const productData = await ProductApi.getProductByKey(triggerConfig.value.productKey)
    if (productData) {
      product.value = productData
      // 加载物模型数据
      await getThingModelTSL()
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
    // 使用新的API直接通过productKey和deviceNames获取设备列表
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

/** 获取产品物模型 */
const thingModelTSL = ref<any>()
const thingModels = computed(() => (condition: TriggerCondition) => {
  if (isEmpty(thingModelTSL.value)) {
    return []
  }
  switch (condition.type) {
    case IotDeviceMessageTypeEnum.PROPERTY:
      return thingModelTSL.value?.properties || []
    case IotDeviceMessageTypeEnum.SERVICE:
      return thingModelTSL.value?.services || []
    case IotDeviceMessageTypeEnum.EVENT:
      return thingModelTSL.value?.events || []
  }
  return []
})
const getThingModelTSL = async () => {
  if (!product.value) {
    return
  }
  thingModelTSL.value = await ThingModelApi.getThingModelTSLByProductId(product.value.id)
}

/** 监听触发类型变化，自动设置条件类型 */
watch(
  () => triggerConfig.value.type,
  (newType) => {
    if (!newType || newType === IotRuleSceneTriggerTypeEnum.TIMER) {
      return
    }

    // 设备上下线变更不需要条件配置
    if (newType === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
      triggerConfig.value.conditions = []
      return
    }

    // 为其他设备触发类型设置默认条件
    if (triggerConfig.value.conditions && triggerConfig.value.conditions.length > 0) {
      triggerConfig.value.conditions.forEach((condition) => {
        switch (newType) {
          case IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST:
            condition.type = IotDeviceMessageTypeEnum.PROPERTY
            break
          case IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST:
            condition.type = IotDeviceMessageTypeEnum.EVENT
            break
          case IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE:
            condition.type = IotDeviceMessageTypeEnum.SERVICE
            break
        }
      })
    }
  }
)

/** 初始化 */
onMounted(async () => {
  // 初始化产品和设备回显
  if (triggerConfig.value) {
    // 初始化conditions数组，如果不存在且不是设备上下线变更类型
    if (
      !triggerConfig.value.conditions &&
      triggerConfig.value.type !== IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE
    ) {
      triggerConfig.value.conditions = []
    }

    await initProductInfo()
    await initDeviceInfo()
  }
})
</script>
