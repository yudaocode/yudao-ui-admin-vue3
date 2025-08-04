<!-- 主条件配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 主条件配置 -->
    <!-- TODO @puhui999：和“主条件”，是不是和“附加条件组”弄成一个风格，都是占一行；有个绿条； -->
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
        :model-value="modelValue"
        @update:model-value="updateCondition"
        :trigger-type="triggerType"
        @validate="handleValidate"
        @trigger-type-change="handleTriggerTypeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MainConditionInnerConfig from './MainConditionInnerConfig.vue'
import { TriggerFormData } from '@/api/iot/rule/scene/scene.types'
import { IotRuleSceneTriggerConditionTypeEnum } from '@/views/iot/utils/constants'
/** 主条件配置组件 */
defineOptions({ name: 'MainConditionConfig' })

const props = defineProps<{
  modelValue: TriggerFormData
  triggerType: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
  (e: 'trigger-type-change', type: number): void
}>()

// 事件处理
const updateCondition = (condition: TriggerFormData) => {
  emit('update:modelValue', condition)
}

const handleValidate = (result: { valid: boolean; message: string }) => {
  emit('validate', result)
}

const handleTriggerTypeChange = (type: number) => {
  emit('trigger-type-change', type)
}
</script>
