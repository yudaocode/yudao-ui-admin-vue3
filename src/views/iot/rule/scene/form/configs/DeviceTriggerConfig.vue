<!-- 设备触发配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 主条件配置 - 默认直接展示 -->
    <div class="space-y-16px">
      <MainConditionConfig
        v-model="trigger"
        :trigger-type="trigger.type"
        @trigger-type-change="handleTriggerTypeChange"
      />
    </div>

    <!-- 条件组配置 -->
    <div class="space-y-16px">
      <!-- 条件组配置 -->
      <ConditionGroupContainerConfig
        v-model="trigger.conditionGroups"
        :trigger-type="trigger.type"
        @remove="removeConditionGroup"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

import MainConditionConfig from './MainConditionConfig.vue'
import ConditionGroupContainerConfig from './ConditionGroupContainerConfig.vue'
import type { Trigger } from '@/api/iot/rule/scene'

/** 设备触发配置组件 */
defineOptions({ name: 'DeviceTriggerConfig' })

const props = defineProps<{
  modelValue: Trigger
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Trigger): void
  (e: 'validate', value: { valid: boolean; message: string }): void
  (e: 'trigger-type-change', type: number): void
}>()

const trigger = useVModel(props, 'modelValue', emit)

const handleTriggerTypeChange = (type: number) => {
  trigger.value.type = type
  emit('trigger-type-change', type)
}

const removeConditionGroup = () => {
  trigger.value.conditionGroups = undefined
}
</script>
