<!-- 执行器配置组件 -->
<!-- todo @puhui999：参考“触发器配置”，简化下。 -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:setting" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">执行器配置</span>
          <el-tag size="small" type="info">{{ actions.length }}/{{ maxActions }}</el-tag>
        </div>
        <div class="flex items-center gap-8px">
          <el-button
            type="primary"
            size="small"
            @click="addAction"
            :disabled="actions.length >= maxActions"
          >
            <Icon icon="ep:plus" />
            添加执行器
          </el-button>
        </div>
      </div>
    </template>

    <div class="p-0">
      <!-- 空状态 -->
      <div v-if="actions.length === 0">
        <el-empty description="暂无执行器配置">
          <el-button type="primary" @click="addAction">
            <Icon icon="ep:plus" />
            添加第一个执行器
          </el-button>
        </el-empty>
      </div>

      <!-- 执行器列表 -->
      <div v-else class="space-y-16px">
        <div
          v-for="(action, index) in actions"
          :key="`action-${index}`"
          class="p-16px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]"
        >
          <div class="flex items-center justify-between mb-16px">
            <div class="flex items-center gap-8px">
              <Icon icon="ep:setting" class="text-[var(--el-color-success)] text-16px" />
              <span>执行器 {{ index + 1 }}</span>
              <el-tag :type="getActionTypeTag(action.type)" size="small">
                {{ getActionTypeName(action.type) }}
              </el-tag>
            </div>
            <div>
              <el-button
                type="danger"
                size="small"
                text
                @click="removeAction(index)"
                v-if="actions.length > 1"
              >
                <Icon icon="ep:delete" />
                删除
              </el-button>
            </div>
          </div>

          <div class="space-y-16px">
            <!-- 执行类型选择 -->
            <ActionTypeSelector
              :model-value="action.type"
              @update:model-value="(value) => updateActionType(index, value)"
              @change="onActionTypeChange(action, $event)"
            />

            <!-- 设备控制配置 -->
            <DeviceControlConfig
              v-if="isDeviceAction(action.type)"
              :model-value="action"
              @update:model-value="(value) => updateAction(index, value)"
            />

            <!-- 告警配置 - 只有恢复告警时才显示 -->
            <AlertConfig
              v-if="action.type === ActionTypeEnum.ALERT_RECOVER"
              :model-value="action.alertConfigId"
              @update:model-value="(value) => updateActionAlertConfig(index, value)"
            />

            <!-- 触发告警提示 - 触发告警时显示 -->
            <div
              v-if="action.type === ActionTypeEnum.ALERT_TRIGGER"
              class="border border-[var(--el-border-color-light)] rounded-6px p-16px bg-[var(--el-fill-color-blank)]"
            >
              <div class="flex items-center gap-8px mb-8px">
                <Icon icon="ep:warning" class="text-[var(--el-color-warning)] text-16px" />
                <span class="text-14px font-600 text-[var(--el-text-color-primary)]">触发告警</span>
                <el-tag size="small" type="warning">自动执行</el-tag>
              </div>
              <div class="text-12px text-[var(--el-text-color-secondary)] leading-relaxed">
                当触发条件满足时，系统将自动发送告警通知，无需额外配置。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加提示 -->
      <div v-if="actions.length > 0 && actions.length < maxActions" class="text-center py-16px">
        <el-button type="primary" plain @click="addAction">
          <Icon icon="ep:plus" />
          继续添加执行器
        </el-button>
        <span class="block mt-8px text-12px text-[var(--el-text-color-secondary)]">
          最多可添加 {{ maxActions }} 个执行器
        </span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import ActionTypeSelector from '../selectors/ActionTypeSelector.vue'
import DeviceControlConfig from '../configs/DeviceControlConfig.vue'
import AlertConfig from '../configs/AlertConfig.vue'
import type { Action } from '@/api/iot/rule/scene'
import {
  IotRuleSceneActionTypeEnum as ActionTypeEnum,
  isDeviceAction,
  isAlertAction,
  getActionTypeLabel
} from '@/views/iot/utils/constants'

/** 执行器配置组件 */
defineOptions({ name: 'ActionSection' })

const props = defineProps<{
  actions: Action[]
}>()

const emit = defineEmits<{
  (e: 'update:actions', value: Action[]): void
}>()

const actions = useVModel(props, 'actions', emit)

/**
 * 创建默认的执行器数据
 */
const createDefaultActionData = (): Action => {
  return {
    type: ActionTypeEnum.DEVICE_PROPERTY_SET, // 默认为设备属性设置
    productId: undefined,
    deviceId: undefined,
    identifier: undefined, // 物模型标识符（服务调用时使用）
    params: {},
    alertConfigId: undefined
  }
}

const maxActions = 5 // 最大执行器数量

// 工具函数
const getActionTypeName = (type: number) => {
  return getActionTypeLabel(type)
}

const getActionTypeTag = (type: number) => {
  const actionTypeTags = {
    [ActionTypeEnum.DEVICE_PROPERTY_SET]: 'primary',
    [ActionTypeEnum.DEVICE_SERVICE_INVOKE]: 'success',
    [ActionTypeEnum.ALERT_TRIGGER]: 'danger',
    [ActionTypeEnum.ALERT_RECOVER]: 'warning'
  }
  return actionTypeTags[type] || 'info'
}

/** 添加执行器 */
const addAction = () => {
  if (actions.value.length >= maxActions) {
    return
  }

  const newAction = createDefaultActionData()
  actions.value.push(newAction)
}

/** 删除执行器 */
const removeAction = (index: number) => {
  actions.value.splice(index, 1)
}

/** 更新执行器类型 */
const updateActionType = (index: number, type: number) => {
  actions.value[index].type = type
  onActionTypeChange(actions.value[index], type)
}

/** 更新执行器 */
const updateAction = (index: number, action: Action) => {
  actions.value[index] = action
}

/** 更新告警配置 */
const updateActionAlertConfig = (index: number, alertConfigId?: number) => {
  actions.value[index].alertConfigId = alertConfigId
}

/** 监听执行器类型变化 */
const onActionTypeChange = (action: Action, type: number) => {
  // 清理不相关的配置，确保数据结构干净
  if (isDeviceAction(type)) {
    // 设备控制类型：清理告警配置，确保设备参数存在
    action.alertConfigId = undefined
    if (!action.params) {
      action.params = {}
    }
    // 如果从其他类型切换到设备控制类型，清空identifier（让用户重新选择）
    if (action.identifier && type !== action.type) {
      action.identifier = undefined
    }
  } else if (isAlertAction(type)) {
    action.productId = undefined
    action.deviceId = undefined
    action.identifier = undefined // 清理服务标识符
    action.params = undefined
    action.alertConfigId = undefined
  }
}
</script>
