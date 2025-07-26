<!-- 执行器预览组件 -->
<template>
  <div class="w-full">
    <div v-if="actions.length === 0" class="text-center py-20px">
      <el-text type="info" size="small">暂无执行器配置</el-text>
    </div>
    <div v-else class="space-y-12px">
      <div
        v-for="(action, index) in actions"
        :key="index"
        class="p-12px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]"
      >
        <div class="flex items-center gap-8px mb-8px">
          <Icon icon="ep:setting" class="text-[var(--el-color-success)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">执行器 {{ index + 1 }}</span>
          <el-tag :type="getActionTypeTag(action.type)" size="small">
            {{ getActionTypeName(action.type) }}
          </el-tag>
        </div>
        <div class="pl-24px">
          <div class="text-12px text-[var(--el-text-color-secondary)] leading-relaxed">
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


