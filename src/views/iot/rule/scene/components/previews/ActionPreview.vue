<!-- 执行器预览组件 -->
<template>
  <div class="action-preview">
    <div v-if="actions.length === 0" class="empty-preview">
      <el-text type="info" size="small">暂无执行器配置</el-text>
    </div>
    <div v-else class="action-list">
      <div
        v-for="(action, index) in actions"
        :key="index"
        class="action-item"
      >
        <div class="action-header">
          <Icon icon="ep:setting" class="action-icon" />
          <span class="action-title">执行器 {{ index + 1 }}</span>
          <el-tag :type="getActionTypeTag(action.type)" size="small">
            {{ getActionTypeName(action.type) }}
          </el-tag>
        </div>
        <div class="action-content">
          <div class="action-summary">
            {{ getActionSummary(action) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ActionFormData, IotRuleSceneActionTypeEnum } from '@/api/iot/rule/scene/scene.types'

/** 执行器预览组件 */
defineOptions({ name: 'ActionPreview' })

interface Props {
  actions: ActionFormData[]
}

const props = defineProps<Props>()

// 执行器类型映射
const actionTypeNames = {
  [IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET]: '属性设置',
  [IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE]: '服务调用',
  [IotRuleSceneActionTypeEnum.ALERT_TRIGGER]: '触发告警',
  [IotRuleSceneActionTypeEnum.ALERT_RECOVER]: '恢复告警'
}

const actionTypeTags = {
  [IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET]: 'primary',
  [IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE]: 'success',
  [IotRuleSceneActionTypeEnum.ALERT_TRIGGER]: 'danger',
  [IotRuleSceneActionTypeEnum.ALERT_RECOVER]: 'warning'
}

// 工具函数
const getActionTypeName = (type: number) => {
  return actionTypeNames[type] || '未知类型'
}

const getActionTypeTag = (type: number) => {
  return actionTypeTags[type] || 'info'
}

const getActionSummary = (action: ActionFormData) => {
  if (action.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER || action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER) {
    return `告警配置: ${action.alertConfigId ? `配置ID ${action.alertConfigId}` : '未选择'}`
  } else {
    const paramsCount = action.params ? Object.keys(action.params).length : 0
    return `设备控制: 产品${action.productId || '未选择'} 设备${action.deviceId || '未选择'} (${paramsCount}个参数)`
  }
}
</script>

<style scoped>
.action-preview {
  width: 100%;
}

.empty-preview {
  text-align: center;
  padding: 20px 0;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
}

.action-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.action-icon {
  color: var(--el-color-success);
  font-size: 14px;
}

.action-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.action-content {
  padding: 8px 12px;
}

.action-summary {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
</style>
