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
      <div class="flex items-center flex-wrap">
        <DeviceListenerCondition
          v-for="i in 2"
          :key="i"
          v-model="conditionParameter"
          class="mb-10px last:mb-0"
        />
      </div>
      <div class="flex flex-col items-center justify-center mr-10px h-a">
        <!-- 添加规则 -->
        <el-button type="primary" circle :icon="Plus" size="small" />
      </div>
    </div>

    <!-- 新增条件按钮 -->
    <div class="mt-4">
      <el-button type="primary"> 新增监听器 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { ref } from 'vue'
import DeviceListenerCondition from './DeviceListenerCondition.vue'

/** 场景联动之监听器组件 */
defineOptions({ name: 'DeviceListener' })

defineProps<{
  modelValue: any[]
}>()

const emit = defineEmits(['update:modelValue'])

// 添加响应式变量
const triggerType = ref()
const messageType = ref('property')
const conditionParameter = ref({})
</script>

<style lang="scss" scoped>
.device-listener {
  .device-listener-header {
    background-color: #eff3f7;
  }

  .device-listener-condition {
    background-color: #dbe5f6;
  }
}
</style>
