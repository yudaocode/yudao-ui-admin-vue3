<template>
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
      <div
        v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.DEVICE"
        class="flex items-center mr-60px"
      >
        <span class="mr-10px">产品</span>
        <el-button type="primary" @click="productTableSelectRef?.open()" size="small" plain>
          {{ product ? product.name : '选择产品' }}
        </el-button>
      </div>
      <div
        v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.DEVICE"
        class="flex items-center mr-60px"
      >
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
    <template v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.DEVICE">
      <div
        class="bg-[#dbe5f6] flex p-10px"
        v-for="(condition, index) in triggerConfig.conditions"
        :key="index"
      >
        <div class="flex flex-col items-center justify-center mr-10px h-a">
          <el-select
            v-model="condition.type"
            @change="condition.parameters = []"
            class="!w-160px"
            clearable
            placeholder=""
          >
            <el-option label="属性" :value="IotDeviceMessageTypeEnum.PROPERTY" />
            <el-option label="服务" :value="IotDeviceMessageTypeEnum.SERVICE" />
            <el-option label="事件" :value="IotDeviceMessageTypeEnum.EVENT" />
          </el-select>
        </div>
        <div class="">
          <DeviceListenerCondition
            v-for="(parameter, index2) in condition.parameters"
            :key="index2"
            :model-value="parameter"
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
    <!-- 设备触发才可以设置多个触发条件 -->
    <el-text
      v-if="triggerConfig.type === IotRuleSceneTriggerTypeEnum.DEVICE"
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
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import DeviceListenerCondition from './DeviceListenerCondition.vue'
import ProductTableSelect from '@/views/iot/product/product/components/ProductTableSelect.vue'
import DeviceTableSelect from '@/views/iot/device/device/components/DeviceTableSelect.vue'
import { ProductVO } from '@/api/iot/product/product'
import { DeviceVO } from '@/api/iot/device/device'
import { ThingModelApi } from '@/api/iot/thingmodel'
import {
  IotDeviceMessageIdentifierEnum,
  IotDeviceMessageTypeEnum,
  IotRuleSceneTriggerTypeEnum,
  TriggerCondition,
  TriggerConditionParameter,
  TriggerConfig
} from '@/api/iot/rule/scene/scene.types'

/** 场景联动之监听器组件 */
defineOptions({ name: 'DeviceListener' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const triggerConfig = useVModel(props, 'modelValue', emits) as Ref<TriggerConfig>

const message = useMessage()

/** 添加触发条件 */
const addCondition = () => {
  triggerConfig.value.conditions?.push({
    type: IotDeviceMessageTypeEnum.PROPERTY,
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
  conditionParameters.push({} as TriggerConditionParameter)
}
/** 移除参数 */
const removeConditionParameter = (
  conditionParameters: TriggerConditionParameter[],
  index: number
) => {
  conditionParameters.splice(index, 1)
}

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

/** 获取产品物模型 */
const thingModelTSL = ref<any>()
const thingModels = computed(() => (condition: TriggerCondition) => {
  switch (condition.type) {
    case IotDeviceMessageTypeEnum.PROPERTY:
      return thingModelTSL.value.properties
    // TODO puhui999: 服务和事件后续考虑
    case IotDeviceMessageTypeEnum.SERVICE:
      return thingModelTSL.value.services
    case IotDeviceMessageTypeEnum.EVENT:
      return thingModelTSL.value.events
  }
  return []
})
const getThingModelTSL = async () => {
  if (!product.value) {
    return
  }
  thingModelTSL.value = await ThingModelApi.getThingModelTSLByProductId(product.value.id)
}
</script>
