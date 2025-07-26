<!-- 触发器预览组件 -->
<template>
  <div class="w-full">
    <div v-if="triggers.length === 0" class="text-center py-20px">
      <el-text type="info" size="small">暂无触发器配置</el-text>
    </div>
    <div v-else class="space-y-12px">
      <div
        v-for="(trigger, index) in triggers"
        :key="index"
        class="p-12px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]"
      >
        <div class="flex items-center gap-8px mb-8px">
          <Icon icon="ep:lightning" class="text-[var(--el-color-warning)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">触发器 {{ index + 1 }}</span>
          <el-tag :type="getTriggerTypeTag(trigger.type)" size="small">
            {{ getTriggerTypeName(trigger.type) }}
          </el-tag>
        </div>
        <div class="pl-24px">
          <div class="text-12px text-[var(--el-text-color-secondary)] leading-relaxed">
            {{ getTriggerSummary(trigger) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TriggerFormData, IotRuleSceneTriggerTypeEnum } from '@/api/iot/rule/scene/scene.types'

/** 触发器预览组件 */
defineOptions({ name: 'TriggerPreview' })

interface Props {
  triggers: TriggerFormData[]
}

const props = defineProps<Props>()

// 触发器类型映射
const triggerTypeNames = {
  [IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE]: '设备状态变更',
  [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST]: '属性上报',
  [IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST]: '事件上报',
  [IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE]: '服务调用',
  [IotRuleSceneTriggerTypeEnum.TIMER]: '定时触发'
}

const triggerTypeTags = {
  [IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE]: 'warning',
  [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST]: 'primary',
  [IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST]: 'success',
  [IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE]: 'info',
  [IotRuleSceneTriggerTypeEnum.TIMER]: 'danger'
}

// 工具函数
const getTriggerTypeName = (type: number) => {
  return triggerTypeNames[type] || '未知类型'
}

const getTriggerTypeTag = (type: number) => {
  return triggerTypeTags[type] || 'info'
}

const getTriggerSummary = (trigger: TriggerFormData) => {
  if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
    return `定时执行: ${trigger.cronExpression || '未配置'}`
  } else if (trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
    return `设备状态变更: 产品${trigger.productId || '未选择'} 设备${trigger.deviceId || '未选择'}`
  } else {
    const conditionCount = trigger.conditionGroups?.reduce((total, group) => total + (group.conditions?.length || 0), 0) || 0
    return `设备监控: 产品${trigger.productId || '未选择'} 设备${trigger.deviceId || '未选择'} (${conditionCount}个条件)`
  }
}
</script>


