<!-- 设备触发配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 主条件配置 - 默认直接展示 -->
    <div class="space-y-16px">
      <!-- 主条件配置 -->
      <div class="flex flex-col gap-16px">
        <!-- 主条件配置 -->
        <div class="space-y-16px">
          <!-- 主条件头部 - 与附加条件组保持一致的绿色风格 -->
          <div
            class="flex items-center justify-between p-16px bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-8px"
          >
            <div class="flex items-center gap-12px">
              <div class="flex items-center gap-8px text-16px font-600 text-green-700">
                <div
                  class="w-24px h-24px bg-green-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
                >
                  主
                </div>
                <span>主条件</span>
              </div>
              <el-tag size="small" type="success">必须满足</el-tag>
            </div>
          </div>

          <!-- 主条件内容配置 -->
          <MainConditionInnerConfig
            :model-value="trigger"
            @update:model-value="updateCondition"
            :trigger-type="trigger.type"
            @validate="handleValidate"
            @trigger-type-change="handleTriggerTypeChange"
          />
        </div>
      </div>
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

import MainConditionInnerConfig from './MainConditionInnerConfig.vue'
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

// 事件处理
const updateCondition = (condition: Trigger) => {
  trigger.value = condition
}

const handleValidate = (result: { valid: boolean; message: string }) => {
  emit('validate', result)
}

const handleTriggerTypeChange = (type: number) => {
  trigger.value.type = type
  emit('trigger-type-change', type)
}

const removeConditionGroup = () => {
  trigger.value.conditionGroups = undefined
}
</script>
