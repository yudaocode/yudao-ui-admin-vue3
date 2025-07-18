<!-- 触发器预览组件 -->
<template>
  <div class="trigger-preview">
    <div v-if="triggers.length === 0" class="empty-preview">
      <el-text type="info" size="small">暂无触发器配置</el-text>
    </div>
    <div v-else class="trigger-list">
      <div
        v-for="(trigger, index) in triggers"
        :key="index"
        class="trigger-item"
      >
        <div class="trigger-header">
          <Icon icon="ep:lightning" class="trigger-icon" />
          <span class="trigger-title">触发器 {{ index + 1 }}</span>
          <el-tag :type="getTriggerTypeTag(trigger.type)" size="small">
            {{ getTriggerTypeName(trigger.type) }}
          </el-tag>
        </div>
        <div class="trigger-content">
          <div class="trigger-summary">
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

<style scoped>
.trigger-preview {
  width: 100%;
}

.empty-preview {
  text-align: center;
  padding: 20px 0;
}

.trigger-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trigger-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
}

.trigger-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.trigger-icon {
  color: var(--el-color-warning);
  font-size: 14px;
}

.trigger-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.trigger-content {
  padding: 8px 12px;
}

.trigger-summary {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
</style>
