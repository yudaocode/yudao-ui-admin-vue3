<template>
  <div class="flex items-center w-1/1">
    <!-- 选择服务 -->
    <el-select
      v-if="
        [IotDeviceMessageTypeEnum.SERVICE, IotDeviceMessageTypeEnum.EVENT].includes(conditionType)
      "
      v-model="conditionParameter.identifier0"
      class="!w-150px mr-10px"
      clearable
      placeholder="请选择服务"
    >
      <el-option
        v-for="thingModel in thingModels"
        :key="thingModel.identifier"
        :label="thingModel.name"
        :value="thingModel.identifier"
      />
    </el-select>
    <el-select
      v-model="conditionParameter.identifier"
      class="!w-150px mr-10px"
      clearable
      placeholder="请选择物模型"
    >
      <el-option
        v-for="thingModel in getThingModels"
        :key="thingModel.identifier"
        :label="thingModel.name"
        :value="thingModel.identifier"
      />
    </el-select>
    <ConditionSelector
      v-model="conditionParameter.operator"
      :data-type="model?.dataType"
      class="!w-150px mr-10px"
    />
    <ThingModelParamInput
      v-if="
        conditionParameter.operator !==
        IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_NULL.value
      "
      class="!w-200px mr-10px"
      v-model="conditionParameter.value"
      :thing-model="model"
    />
    <!-- 按钮插槽 -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import ConditionSelector from './ConditionSelector.vue'
import {
  IotDeviceMessageTypeEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  TriggerConditionParameter
} from '@/api/iot/rule/scene/scene.types'
import { useVModel } from '@vueuse/core'
import ThingModelParamInput from '@/views/iot/rule/scene/components/ThingModelParamInput.vue'

/** 设备触发条件 */
defineOptions({ name: 'DeviceListenerCondition' })
const props = defineProps<{ modelValue: any; conditionType: any; thingModels: any }>()
const emits = defineEmits(['update:modelValue'])
const conditionParameter = useVModel(props, 'modelValue', emits) as Ref<TriggerConditionParameter>

/** 属性就是 thingModels，服务和事件取对应的 outputParams */
const getThingModels = computed(() => {
  switch (props.conditionType) {
    case IotDeviceMessageTypeEnum.PROPERTY:
      return props.thingModels || []
    case IotDeviceMessageTypeEnum.SERVICE:
    case IotDeviceMessageTypeEnum.EVENT:
      return (
        props.thingModels.find(
          (item: any) => item.identifier === conditionParameter.value.identifier0
        )?.outputParams || []
      )
  }
})

/** 获得物模型属性、类型 */
const model = computed(() =>
  getThingModels.value.find((item: any) => item.identifier === conditionParameter.value.identifier)
)
</script>
