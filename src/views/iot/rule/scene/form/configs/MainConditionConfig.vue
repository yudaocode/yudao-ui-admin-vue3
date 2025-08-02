<!-- 主条件配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 条件配置提示 -->
    <div
      v-if="!modelValue"
      class="p-16px border-2 border-dashed border-[var(--el-border-color)] rounded-8px text-center"
    >
      <div class="flex flex-col items-center gap-12px">
        <Icon icon="ep:plus" class="text-32px text-[var(--el-text-color-placeholder)]" />
        <div class="text-[var(--el-text-color-secondary)]">
          <p class="text-14px font-500 mb-4px">请配置主条件</p>
          <p class="text-12px">主条件是触发器的核心条件，必须满足才能触发场景</p>
        </div>
        <el-button type="primary" @click="addMainCondition">
          <Icon icon="ep:plus" />
          添加主条件
        </el-button>
      </div>
    </div>

    <!-- 主条件配置 -->
    <div v-else class="space-y-16px">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">主条件</span>
          <el-tag size="small" type="primary">必须满足</el-tag>
        </div>
      </div>
      <MainConditionInnerConfig
        :model-value="modelValue"
        @update:model-value="updateCondition"
        :trigger-type="triggerType"
        @validate="handleValidate"
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

defineProps<{
  modelValue?: TriggerFormData
  triggerType: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: TriggerFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}>()

// 事件处理
const addMainCondition = () => {
  const newCondition: TriggerFormData = {
    type: IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY, // 默认为设备属性
    productId: undefined,
    deviceId: undefined,
    identifier: '',
    operator: '=',
    value: ''
  }
  emit('update:modelValue', newCondition)
}

const updateCondition = (condition: TriggerFormData) => {
  emit('update:modelValue', condition)
}

const handleValidate = (result: { valid: boolean; message: string }) => {
  emit('validate', result)
}

onMounted(() => {
  addMainCondition()
})
</script>
