<template>
  <div class="bg-[#dbe5f6] flex p-10px">
    <div class="flex flex-col items-center justify-center mr-10px h-a">
      <el-select
        v-model="deviceControlConfig.type"
        @change="deviceControlConfig.data = {}"
        class="!w-160px"
        clearable
        placeholder=""
      >
        <el-option label="属性" :value="IotDeviceMessageTypeEnum.PROPERTY" />
        <el-option label="服务" :value="IotDeviceMessageTypeEnum.SERVICE" />
      </el-select>
    </div>
    <!-- TODO puhui999: 处理服务参数 -->
    <div class="">
      <div
        class="flex items-center justify-around mb-10px last:mb-0"
        v-for="(parameter, index) in parameters"
        :key="index"
      >
        <el-select
          v-model="parameter.identifier"
          class="!w-240px mr-10px"
          clearable
          placeholder="请选择物模型"
        >
          <el-option
            v-for="thingModel in thingModels"
            :key="thingModel.identifier"
            :label="thingModel.name"
            :value="thingModel.identifier"
          />
        </el-select>
        <!-- TODO puhui999: 输入框调整，数值型使用数字输入框校验边界，bool 值使用开关，枚举值使用下拉选择，时间值使用时间选择器 -->
        <el-input v-model="parameter.value" class="!w-240px mr-10px" placeholder="请输入值">
          <template v-if="getUnitName(parameter.identifier)" #append>
            {{ getUnitName(parameter.identifier) }}
          </template>
        </el-input>
        <el-tooltip content="删除参数" placement="top">
          <el-button type="danger" circle size="small" @click="removeParameter(index)">
            <Icon icon="ep:delete" />
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <!-- 添加参数 -->
    <div class="flex flex-1 flex-col items-center justify-center w-60px h-a">
      <el-tooltip content="添加参数" placement="top">
        <el-button type="primary" circle size="small" @click="addParameter">
          <Icon icon="ep:plus" />
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { ThingModelApi } from '@/api/iot/thingmodel'
import {
  ActionDeviceControl,
  IotDeviceMessageIdentifierEnum,
  IotDeviceMessageTypeEnum
} from '@/api/iot/rule/scene/scene.types'
import { isEmpty } from '@/utils/is'

/** 设备控制执行器组件 */
defineOptions({ name: 'DeviceControlAction' })

const props = defineProps<{
  modelValue: any
  productId?: number
}>()
const emits = defineEmits(['update:modelValue'])
const deviceControlConfig = useVModel(props, 'modelValue', emits) as Ref<ActionDeviceControl>

const message = useMessage()

/** 执行器参数 */
const parameters = ref<{ identifier: string; value: any }[]>([])
const addParameter = () => {
  if (!props.productId) {
    message.warning('请先选择一个产品')
    return
  }
  if (parameters.value.length >= thingModels.value.length) {
    message.warning(`该产品只有${thingModels.value.length}个物模型！！！`)
    return
  }
  parameters.value.push({ identifier: '', value: undefined })
}
const removeParameter = (index: number) => {
  parameters.value.splice(index, 1)
}
watch(
  () => parameters.value,
  (newVal) => {
    if (isEmpty(newVal)) {
      return
    }
    for (const parameter of newVal) {
      if (isEmpty(parameter.identifier)) {
        break
      }
      deviceControlConfig.value.data[parameter.identifier] = parameter.value
    }
    console.log(deviceControlConfig.value)
  },
  { deep: true }
)

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
  } else {
    // 参数回显
    parameters.value = Object.entries(deviceControlConfig.value.data).map(([key, value]) => ({
      identifier: key,
      value: value
    }))
  }

  // 确保data对象存在
  if (!deviceControlConfig.value.data) {
    deviceControlConfig.value.data = {}
  }
}

/** 获取产品物模型 */
const thingModelTSL = ref<any>()
const getThingModelTSL = async () => {
  if (!props.productId) {
    return
  }
  try {
    thingModelTSL.value = await ThingModelApi.getThingModelTSLByProductId(props.productId)
  } catch (error) {
    console.error('获取物模型失败', error)
  }
}
const thingModels = computed((): any[] => {
  if (isEmpty(thingModelTSL.value)) {
    return []
  }
  switch (deviceControlConfig.value.type) {
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
/** 获得属性单位 */
const getUnitName = computed(() => (identifier: string) => {
  const model = thingModels.value?.find((item: any) => item.identifier === identifier)
  // 属性
  if (model?.dataSpecs) {
    return model.dataSpecs.unitName
  }
  // TODO puhui999: 先不考虑服务和事件的情况
  // 服务和事件
  // if (model?.outputParams) {
  //   return model.dataSpecs.unitName
  // }
  return ''
})

// 监听 productId 变化
watch(
  () => props.productId,
  (newVal) => {
    if (!newVal) {
      thingModelTSL.value = undefined
      parameters.value = []
      return
    }
    getThingModelTSL()
    // 当产品ID变化时，清空原有数据
    deviceControlConfig.value.data = {}
  },
  { immediate: true }
)

// 监听消息类型变化
watch(
  () => deviceControlConfig.value.type,
  () => {
    // 切换消息类型时清空参数
    deviceControlConfig.value.data = {}
    parameters.value = []
    if (deviceControlConfig.value.type === IotDeviceMessageTypeEnum.PROPERTY) {
      deviceControlConfig.value.identifier = IotDeviceMessageIdentifierEnum.PROPERTY_SET
    } else if (deviceControlConfig.value.type === IotDeviceMessageTypeEnum.SERVICE) {
      deviceControlConfig.value.identifier = IotDeviceMessageIdentifierEnum.SERVICE_INVOKE
    }
  }
)

// 初始化
onMounted(() => {
  initDeviceControlConfig()
})
</script>
