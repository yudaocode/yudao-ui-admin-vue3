<!-- 条件类型选择器组件 -->
<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    placeholder="请选择条件类型"
    class="w-full"
  >
    <el-option
      v-for="option in conditionTypeOptions"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    >
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-8px">
          <Icon :icon="option.icon" :class="option.iconClass" />
          <span>{{ option.label }}</span>
        </div>
        <el-tag :type="option.tag" size="small">{{ option.category }}</el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { IotRuleSceneTriggerConditionTypeEnum } from '@/views/iot/utils/constants'

/** 条件类型选择器组件 */
defineOptions({ name: 'ConditionTypeSelector' })

defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}>()

// 条件类型选项
const conditionTypeOptions = [
  {
    value: IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS,
    label: '设备状态',
    description: '监控设备的在线/离线状态变化',
    icon: 'ep:connection',
    iconClass: 'text-blue-500',
    tag: 'primary',
    category: '设备'
  },
  {
    value: IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY,
    label: '设备属性',
    description: '监控设备属性值的变化',
    icon: 'ep:data-analysis',
    iconClass: 'text-green-500',
    tag: 'success',
    category: '属性'
  },
  {
    value: IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME,
    label: '当前时间',
    description: '基于当前时间的条件判断',
    icon: 'ep:timer',
    iconClass: 'text-orange-500',
    tag: 'warning',
    category: '时间'
  }
]

// 事件处理
const handleChange = (value: number) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
