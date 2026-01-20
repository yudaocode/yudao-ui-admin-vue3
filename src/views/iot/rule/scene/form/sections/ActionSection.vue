<!-- 执行器配置组件 -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:setting" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">执行器配置</span>
          <el-tag size="small" type="info">{{ actions.length }} 个执行器</el-tag>
        </div>
        <div class="flex items-center gap-8px">
          <el-button type="primary" size="small" @click="addAction">
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
      <div v-else class="space-y-24px">
        <div
          v-for="(action, index) in actions"
          :key="`action-${index}`"
          class="border-2 border-blue-200 rounded-8px bg-blue-50 shadow-sm hover:shadow-md transition-shadow"
        >
          <!-- 执行器头部 - 蓝色主题 -->
          <div
            class="flex items-center justify-between p-16px bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-200 rounded-t-6px"
          >
            <div class="flex items-center gap-12px">
              <div class="flex items-center gap-8px text-16px font-600 text-blue-700">
                <div
                  class="w-24px h-24px bg-blue-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
                >
                  {{ index + 1 }}
                </div>
                <span>执行器 {{ index + 1 }}</span>
              </div>
              <el-tag :type="getActionTypeTag(action.type)" size="small" class="font-500">
                {{ getActionTypeLabel(action.type) }}
              </el-tag>
            </div>
            <div class="flex items-center gap-8px">
              <el-button
                v-if="actions.length > 1"
                type="danger"
                size="small"
                text
                @click="removeAction(index)"
                class="hover:bg-red-50"
              >
                <Icon icon="ep:delete" />
                删除
              </el-button>
            </div>
          </div>

          <!-- 执行器内容区域 -->
          <div class="p-16px space-y-16px">
            <!-- 执行类型选择 -->
            <div class="w-full">
              <el-form-item label="执行类型" required>
                <el-select
                  :model-value="action.type"
                  @update:model-value="(value) => updateActionType(index, value)"
                  @change="(value) => onActionTypeChange(action, value)"
                  placeholder="请选择执行类型"
                  class="w-full"
                >
                  <el-option
                    v-for="option in getActionTypeOptions()"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </div>

            <!-- 设备控制配置 -->
            <DeviceControlConfig
              v-if="isDeviceAction(action.type)"
              :model-value="action"
              @update:model-value="(value) => updateAction(index, value)"
            />

            <!-- 告警配置 - 只有恢复告警时才显示 -->
            <AlertConfig
              v-if="action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER"
              :model-value="action.alertConfigId"
              @update:model-value="(value) => updateActionAlertConfig(index, value)"
            />

            <!-- 触发告警提示 - 触发告警时显示 -->
            <div
              v-if="action.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER"
              class="border border-[var(--el-border-color-light)] rounded-6px p-16px bg-[var(--el-fill-color-blank)]"
            >
              <div class="flex items-center gap-8px mb-8px">
                <Icon icon="ep:warning" class="text-[var(--el-color-warning)] text-16px" />
                <span class="text-14px font-600 text-[var(--el-text-color-primary)]">触发告警</span>
                <el-tag size="small" type="warning">自动执行</el-tag>
              </div>
              <div class="text-12px text-[var(--el-text-color-secondary)] leading-relaxed">
                当触发条件满足时，系统将自动发送告警通知，可在菜单 [告警中心 -> 告警配置] 管理。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加提示 -->
      <div v-if="actions.length > 0" class="text-center py-16px">
        <el-button type="primary" plain @click="addAction">
          <Icon icon="ep:plus" />
          继续添加执行器
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import DeviceControlConfig from '../configs/DeviceControlConfig.vue'
import AlertConfig from '../configs/AlertConfig.vue'
import type { Action } from '@/api/iot/rule/scene'
import {
  getActionTypeLabel,
  getActionTypeOptions,
  IotRuleSceneActionTypeEnum
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

/** 获取执行器标签类型（用于 el-tag 的 type 属性） */
const getActionTypeTag = (type: number): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const actionTypeTags = {
    [IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET]: 'primary',
    [IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE]: 'success',
    [IotRuleSceneActionTypeEnum.ALERT_TRIGGER]: 'danger',
    [IotRuleSceneActionTypeEnum.ALERT_RECOVER]: 'warning'
  } as const
  return actionTypeTags[type] || 'info'
}

/** 判断是否为设备执行器类型 */
const isDeviceAction = (type: number): boolean => {
  const deviceActionTypes = [
    IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
  ] as number[]
  return deviceActionTypes.includes(type)
}

/** 判断是否为告警执行器类型 */
const isAlertAction = (type: number): boolean => {
  const alertActionTypes = [
    IotRuleSceneActionTypeEnum.ALERT_TRIGGER,
    IotRuleSceneActionTypeEnum.ALERT_RECOVER
  ] as number[]
  return alertActionTypes.includes(type)
}

/**
 * 创建默认的执行器数据
 * @returns 默认执行器对象
 */
const createDefaultActionData = (): Action => {
  return {
    type: IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET, // 默认为设备属性设置
    productId: undefined,
    deviceId: undefined,
    identifier: undefined, // 物模型标识符（服务调用时使用）
    params: undefined,
    alertConfigId: undefined
  }
}

/**
 * 添加执行器
 */
const addAction = () => {
  const newAction = createDefaultActionData()
  actions.value.push(newAction)
}

/**
 * 删除执行器
 * @param index 执行器索引
 */
const removeAction = (index: number) => {
  actions.value.splice(index, 1)
}

/**
 * 更新执行器类型
 * @param index 执行器索引
 * @param type 执行器类型
 */
const updateActionType = (index: number, type: number) => {
  actions.value[index].type = type
  onActionTypeChange(actions.value[index], type)
}

/**
 * 更新执行器
 * @param index 执行器索引
 * @param action 执行器对象
 */
const updateAction = (index: number, action: Action) => {
  actions.value[index] = action
}

/**
 * 更新告警配置
 * @param index 执行器索引
 * @param alertConfigId 告警配置ID
 */
const updateActionAlertConfig = (index: number, alertConfigId?: number) => {
  actions.value[index].alertConfigId = alertConfigId
}

/**
 * 监听执行器类型变化
 * @param action 执行器对象
 * @param type 执行器类型
 */
const onActionTypeChange = (action: Action, type: number) => {
  // 清理不相关的配置，确保数据结构干净
  if (isDeviceAction(type)) {
    // 设备控制类型：清理告警配置，确保设备参数存在
    action.alertConfigId = undefined
    if (!action.params) {
      action.params = ''
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
