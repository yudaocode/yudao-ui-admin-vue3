<template>
  <div class="device-action-control">
    <!-- 属性设置 -->
    <template v-if="messageType === IotDeviceMessageTypeEnum.PROPERTY">
      <div class="flex flex-wrap gap-10px">
        <div v-for="model in thingModels" :key="model.identifier" class="flex items-center mb-10px">
          <span class="mr-10px inline-block min-w-80px">{{ model.name }}</span>
          <!-- 根据属性类型渲染不同的输入控件 -->
          <PropertyValueInput
            :model-value="propertyData[model.identifier]"
            :data-specs="model.dataSpecs"
            @update:model-value="(val) => updatePropertyValue(model.identifier, val)"
          />
        </div>
      </div>
    </template>

    <!-- 服务调用 -->
    <template v-else-if="messageType === IotDeviceMessageTypeEnum.SERVICE">
      <div class="flex flex-wrap gap-10px">
        <template v-if="thingModels && thingModels.inputParams">
          <div 
            v-for="param in thingModels.inputParams" 
            :key="param.identifier" 
            class="flex items-center mb-10px"
          >
            <span class="mr-10px inline-block min-w-80px">{{ param.name }}</span>
            <!-- 根据服务输入参数类型渲染不同的输入控件 -->
            <PropertyValueInput
              :model-value="serviceData[param.identifier]"
              :data-specs="param.dataSpecs"
              @update:model-value="(val) => updateServiceValue(param.identifier, val)"
            />
          </div>
        </template>
        <div v-else class="text-gray-500">该服务没有输入参数</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import PropertyValueInput from './PropertyValueInput.vue'
import { IotDeviceMessageTypeEnum } from '@/api/iot/rule/scene/scene.types'

/** 设备控制执行器的参数配置组件 */
defineOptions({ name: 'DeviceActionControl' })

const props = defineProps<{
  modelValue: any
  thingModels: any
  messageType: string
  identifier: string
}>()

const emits = defineEmits(['update:modelValue'])
const actionData = useVModel(props, 'modelValue', emits)

// 属性数据
const propertyData = computed({
  get: () => {
    return actionData.value || {}
  },
  set: (value) => {
    actionData.value = value
  }
})

// 服务数据
const serviceData = computed({
  get: () => {
    return actionData.value || {}
  },
  set: (value) => {
    actionData.value = value
  }
})

// 更新属性值
const updatePropertyValue = (identifier: string, value: any) => {
  const newData = { ...propertyData.value }
  newData[identifier] = value
  propertyData.value = newData
}

// 更新服务参数值
const updateServiceValue = (identifier: string, value: any) => {
  const newData = { ...serviceData.value }
  newData[identifier] = value
  serviceData.value = newData
}
</script>

<style scoped lang="scss"></style> 
