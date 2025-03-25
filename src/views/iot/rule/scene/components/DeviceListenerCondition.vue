<template>
  <div class="device-listener-condition">
    <el-select
      v-model="conditionParameter.identifier"
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
    <ConditionSelector
      v-model="conditionParameter.operator"
      :data-type="getDataType"
      class="!w-180px mr-10px"
    />
    <!-- TODO puhui999: 输入值范围校验？ -->
    <el-input
      v-if="
        conditionParameter.operator !==
        IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_NULL.value
      "
      v-model="conditionParameter.value"
      class="!w-240px mr-10px"
      placeholder="请输入值"
    >
      <template v-if="getUnitName" #append> {{ getUnitName }} </template>
    </el-input>
    <!-- 按钮插槽 -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import ConditionSelector from './ConditionSelector.vue'
import {
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  TriggerConditionParameter
} from '@/api/iot/rule/scene/scene.types'
import { useVModel } from '@vueuse/core'

defineOptions({ name: 'DeviceListenerCondition' })
const props = defineProps<{ modelValue: any; thingModels: any }>()
const emits = defineEmits(['update:modelValue'])
const conditionParameter = useVModel(props, 'modelValue', emits) as Ref<TriggerConditionParameter>

/** 获得物模型属性类型 */
const getDataType = computed(() => {
  const model = props.thingModels?.find(
    (item: any) => item.identifier === conditionParameter.value.identifier
  )
  // 属性
  if (model?.dataSpecs) {
    return model.dataSpecs.dataType
  }
  return ''
})
/** 获得属性单位 */
const getUnitName = computed(() => {
  const model = props.thingModels?.find(
    (item: any) => item.identifier === conditionParameter.value.identifier
  )
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
</script>

<style scoped lang="scss"></style>
