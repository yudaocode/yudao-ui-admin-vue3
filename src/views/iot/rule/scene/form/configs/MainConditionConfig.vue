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
    <div
      v-else
      class="border border-[var(--el-border-color-lighter)] rounded-8px bg-[var(--el-fill-color-blank)] shadow-sm"
    >
      <div
        class="flex items-center justify-between p-16px bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-[var(--el-border-color-lighter)] rounded-t-6px"
      >
        <div class="flex items-center gap-12px">
          <div
            class="flex items-center gap-8px text-16px font-600 text-[var(--el-text-color-primary)]"
          >
            <div
              class="w-24px h-24px bg-blue-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
            >
              主
            </div>
            <span>主条件</span>
          </div>
          <el-tag size="small" type="primary" class="font-500">必须满足</el-tag>
        </div>
        <el-button
          type="danger"
          size="small"
          text
          @click="removeMainCondition"
          class="hover:bg-red-50"
        >
          <Icon icon="ep:delete" />
          删除
        </el-button>
      </div>

      <div class="p-16px">
        <ConditionConfig
          :model-value="modelValue"
          @update:model-value="updateCondition"
          :trigger-type="triggerType"
          @validate="handleValidate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ConditionConfig from './ConditionConfig.vue'
import {
  ConditionFormData,
  IotRuleSceneTriggerConditionTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 主条件配置组件 */
defineOptions({ name: 'MainConditionConfig' })

interface Props {
  modelValue?: ConditionFormData
  triggerType: number
}

interface Emits {
  (e: 'update:modelValue', value?: ConditionFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 事件处理
const addMainCondition = () => {
  const newCondition: ConditionFormData = {
    type: IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY, // 默认为设备属性
    productId: undefined,
    deviceId: undefined,
    identifier: '',
    operator: '=',
    param: ''
  }
  emit('update:modelValue', newCondition)
}

const removeMainCondition = () => {
  emit('update:modelValue', undefined)
}

const updateCondition = (condition: ConditionFormData) => {
  emit('update:modelValue', condition)
}

const handleValidate = (result: { valid: boolean; message: string }) => {
  emit('validate', result)
}
</script>
