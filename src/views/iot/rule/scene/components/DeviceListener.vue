<template>
  <div class="device-listener m-10px">
    <div class="device-listener-header h-50px flex items-center px-10px">
      <div class="flex items-center mr-60px">
        <span class="mr-10px">触发条件</span>
        <el-select v-model="triggerType" class="!w-240px" clearable placeholder="请选择触发条件">
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
      <!-- 添加规则 -->
      <el-button class="device-listener-delete" type="danger" circle :icon="Delete" size="small" />
    </div>
    <div class="device-listener-condition flex p-10px">
      <div class="flex flex-col items-center justify-center mr-10px h-a">
        <el-select v-model="messageType" class="!w-160px" clearable placeholder="">
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
          v-for="(conditionParameter, index) in conditionParameters"
          :key="index"
          :model-value="conditionParameter"
          @update:model-value="(val) => (conditionParameters[index] = val)"
          class="mb-10px last:mb-0"
        />
      </div>
      <div class="flex flex-1 flex-col items-center justify-center mr-10px h-a">
        <!-- 添加规则 -->
        <el-button type="primary" circle :icon="Plus" size="small" @click="addConditionParameter" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Plus } from '@element-plus/icons-vue'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { ref } from 'vue'
import DeviceListenerCondition from './DeviceListenerCondition.vue'
import { IotRuleSceneTriggerConditionParameter } from '@/api/iot/rule/scene/scene.types'

/** 场景联动之监听器组件 */
defineOptions({ name: 'DeviceListener' })

defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['update:modelValue'])

// 添加响应式变量
const triggerType = ref()
const messageType = ref('property')
const conditionParameters = ref<IotRuleSceneTriggerConditionParameter[]>([])
const addConditionParameter = () => {
  conditionParameters.value?.push({} as IotRuleSceneTriggerConditionParameter)
}
onMounted(() => {
  addConditionParameter()
})
</script>

<style lang="scss" scoped>
.device-listener {
  .device-listener-header {
    position: relative;
    background-color: #eff3f7;

    .device-listener-delete {
      position: absolute;
      top: auto;
      right: 33px;
      bottom: auto;
    }
  }

  .device-listener-condition {
    background-color: #dbe5f6;
  }
}
</style>
