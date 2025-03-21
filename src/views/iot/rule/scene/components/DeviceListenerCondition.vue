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
    <ConditionSelector v-model="conditionParameter.operator" class="!w-180px mr-10px" />
    <el-input v-model="conditionParameter.value" class="!w-240px mr-10px" placeholder="请输入值">
      <template #append> {{ getUnitName }} </template>
    </el-input>
    <!-- 按钮插槽 -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import ConditionSelector from './ConditionSelector.vue'
import { IotRuleSceneTriggerConditionParameter } from '@/api/iot/rule/scene/scene.types'
import { useVModel } from '@vueuse/core'

defineOptions({ name: 'DeviceListenerCondition' })
const props = defineProps<{ modelValue: any; thingModels: any }>()
const emits = defineEmits(['update:modelValue'])
const conditionParameter = useVModel(
  props,
  'modelValue',
  emits
) as Ref<IotRuleSceneTriggerConditionParameter>

/** 获得属性单位 */
const getUnitName = computed(
  () =>
    props.thingModels.find((item: any) => item.identifier === conditionParameter.value.identifier)
      ?.dataSpecs?.unitName || '单位'
)
</script>

<style scoped lang="scss"></style>
