<template>
  <div class="device-listener-condition">
    <el-select
      v-model="conditionParameter.identifier"
      class="!w-240px mr-10px"
      clearable
      placeholder="请选择物模型"
    >
      <el-option
        v-for="dict in getStrDictOptions(DICT_TYPE.IOT_DEVICE_MESSAGE_TYPE_ENUM)"
        :key="dict.value"
        :label="dict.label"
        :value="dict.value"
      />
    </el-select>
    <ConditionSelector v-model="conditionParameter.operator" class="!w-180px mr-10px" />
    <el-input v-model="conditionParameter.value" class="!w-240px mr-10px" placeholder="请输入值">
      <template #append> 单位 </template>
    </el-input>
    <!-- 按钮插槽 -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import ConditionSelector from './ConditionSelector.vue'
import { IotRuleSceneTriggerConditionParameter } from '@/api/iot/rule/scene/scene.types'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { useVModel } from '@vueuse/core'

defineOptions({ name: 'DeviceListenerCondition' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const conditionParameter = useVModel(
  props,
  'modelValue',
  emits
) as Ref<IotRuleSceneTriggerConditionParameter>
</script>

<style scoped lang="scss"></style>
