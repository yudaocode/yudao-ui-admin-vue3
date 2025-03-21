<template>
  <div class="device-listener m-10px">
    <div class="device-listener-header h-50px flex items-center px-10px">
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
        <el-button type="primary">选择产品</el-button>
      </div>
      <div class="flex items-center mr-60px">
        <span class="mr-10px">设备</span>
        <el-button type="primary">选择设备</el-button>
      </div>
      <!-- 删除触发器 -->
      <div class="device-listener-delete">
        <el-tooltip content="删除触发器" placement="top">
          <slot></slot>
        </el-tooltip>
      </div>
    </div>
    <!-- 触发器条件 -->
    <div
      class="device-listener-condition flex p-10px"
      v-for="(condition, index) in triggerConfig.conditions"
      :key="index"
    >
      <div class="flex flex-col items-center justify-center mr-10px h-a">
        <el-select v-model="condition.type" class="!w-160px" clearable placeholder="">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.IOT_DEVICE_MESSAGE_TYPE_ENUM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </div>
      <div class="">
        <DeviceListenerCondition
          v-for="(parameter, index2) in condition.parameters"
          :key="index2"
          :model-value="parameter"
          @update:model-value="(val) => (condition.parameters[index2] = val)"
          class="mb-10px last:mb-0"
        >
          <el-tooltip content="删除参数" placement="top">
            <el-button
              class="device-listener-delete"
              type="danger"
              circle
              :icon="Delete"
              size="small"
              @click="removeConditionParameter(condition.parameters, index2)"
            />
          </el-tooltip>
        </DeviceListenerCondition>
      </div>
      <!-- 添加参数 -->
      <div class="flex flex-1 flex-col items-center justify-center w-60px h-a">
        <el-tooltip content="添加参数" placement="top">
          <el-button
            type="primary"
            circle
            :icon="Plus"
            size="small"
            @click="addConditionParameter(condition.parameters)"
          />
        </el-tooltip>
      </div>
      <!-- 删除条件 -->
      <div
        class="device-listener-condition flex flex-1 flex-col items-center justify-center w-a h-a"
      >
        <el-tooltip content="删除条件" placement="top">
          <el-button type="danger" :icon="Delete" size="small" @click="removeCondition(index)" />
        </el-tooltip>
      </div>
    </div>
    <el-text class="ml-10px!" type="primary" @click="addCondition">添加触发条件</el-text>
  </div>
</template>

<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import DeviceListenerCondition from './DeviceListenerCondition.vue'
import {
  IotRuleSceneTriggerConditionParameter,
  IotRuleSceneTriggerConfig
} from '@/api/iot/rule/scene/scene.types'
import { useVModel } from '@vueuse/core'

/** 场景联动之监听器组件 */
defineOptions({ name: 'DeviceListener' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const triggerConfig = useVModel(props, 'modelValue', emits) as Ref<IotRuleSceneTriggerConfig>

/** 添加触发条件 */
const addCondition = () => {
  triggerConfig.value.conditions.push({
    type: 'property',
    parameters: []
  })
}
/** 移除触发条件 */
const removeCondition = (index: number) => {
  triggerConfig.value.conditions.splice(index, 1)
}
/** 添加参数 */
const addConditionParameter = (conditionParameters: IotRuleSceneTriggerConditionParameter[]) => {
  conditionParameters.push({} as IotRuleSceneTriggerConditionParameter)
}
/** 移除参数 */
const removeConditionParameter = (
  conditionParameters: IotRuleSceneTriggerConditionParameter[],
  index: number
) => {
  conditionParameters.splice(index, 1)
}
</script>

<style lang="scss" scoped>
.device-listener {
  .device-listener-header {
    position: relative;
    background-color: #eff3f7;

    .device-listener-delete {
      position: absolute;
      top: auto;
      right: 16px;
      bottom: auto;
    }
  }

  .device-listener-condition {
    background-color: #dbe5f6;
  }
}
</style>
