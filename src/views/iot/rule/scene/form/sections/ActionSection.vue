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

            <!-- 告警配置 -->
            <AlertConfig
              v-if="isAlertAction(action.type)"
              :model-value="action.alertConfigId"
              @update:model-value="(value) => updateActionAlertConfig(index, value)"
            />
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
import { ActionFormData } from '@/api/iot/rule/scene/scene.types'
import {
  IotRuleSceneActionTypeEnum as ActionTypeEnum,
  isDeviceAction,
  isAlertAction,
  getActionTypeLabel
} from '@/views/iot/utils/constants'

/** 执行器配置组件 */
defineOptions({ name: 'ActionSection' })

interface Props {
  actions: ActionFormData[]
}

interface Emits {
  (e: 'update:actions', value: ActionFormData[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const actions = useVModel(props, 'actions', emit)

/**
 * 创建默认的执行器数据
 */
const createDefaultActionData = (): ActionFormData => {
  return {
    type: ActionTypeEnum.DEVICE_PROPERTY_SET, // 默认为设备属性设置
    productId: undefined,
    deviceId: undefined,
    params: {},
    alertConfigId: undefined
  }
}

// 配置常量
const maxActions = 5

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

// 事件处理
const addAction = () => {
  if (actions.value.length >= maxActions) {
    return
  }

  const newAction = createDefaultActionData()
  actions.value.push(newAction)
}

const removeAction = (index: number) => {
  actions.value.splice(index, 1)
}

const updateActionType = (index: number, type: number) => {
  actions.value[index].type = type
  onActionTypeChange(actions.value[index], type)
}

const updateAction = (index: number, action: ActionFormData) => {
  actions.value[index] = action
}

const updateActionAlertConfig = (index: number, alertConfigId?: number) => {
  actions.value[index].alertConfigId = alertConfigId
}

const onActionTypeChange = (action: ActionFormData, type: number) => {
  // 清理不相关的配置，确保数据结构干净
  if (isDeviceAction(type)) {
    // 设备控制类型：清理告警配置，确保设备参数存在
    action.alertConfigId = undefined
    if (!action.params) {
      action.params = {}
    }
  } else if (isAlertAction(type)) {
    // 告警类型：清理设备配置
    action.productId = undefined
    action.deviceId = undefined
    action.params = undefined
  }

  // 触发重新校验
  nextTick(() => {
    // 这里可以添加校验逻辑
  })
}
</script>
