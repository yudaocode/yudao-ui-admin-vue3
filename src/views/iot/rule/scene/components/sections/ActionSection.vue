<!-- 执行器配置组件 -->
<!-- todo @puhui999：参考“触发器配置”，简化下。 -->
<template>
  <el-card class="action-section" shadow="never">
    <template #header>
      <div class="section-header">
        <div class="header-left">
          <Icon icon="ep:setting" class="section-icon" />
          <span class="section-title">执行器配置</span>
          <el-tag size="small" type="info">{{ actions.length }}/{{ maxActions }}</el-tag>
        </div>
        <div class="header-right">
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

    <div class="section-content">
      <!-- 空状态 -->
      <div v-if="actions.length === 0" class="empty-state">
        <el-empty description="暂无执行器配置">
          <el-button type="primary" @click="addAction">
            <Icon icon="ep:plus" />
            添加第一个执行器
          </el-button>
        </el-empty>
      </div>

      <!-- 执行器列表 -->
      <div v-else class="actions-list">
        <div v-for="(action, index) in actions" :key="`action-${index}`" class="action-item">
          <div class="action-header">
            <div class="action-title">
              <Icon icon="ep:setting" class="action-icon" />
              <span>执行器 {{ index + 1 }}</span>
              <el-tag :type="getActionTypeTag(action.type)" size="small">
                {{ getActionTypeName(action.type) }}
              </el-tag>
            </div>
            <div class="action-actions">
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

          <div class="action-content">
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
              @validate="(result) => handleActionValidate(index, result)"
            />

            <!-- 告警配置 -->
            <AlertConfig
              v-if="isAlertAction(action.type)"
              :model-value="action.alertConfigId"
              @update:model-value="(value) => updateActionAlertConfig(index, value)"
              @validate="(result) => handleActionValidate(index, result)"
            />
          </div>
        </div>
      </div>

      <!-- 添加提示 -->
      <div v-if="actions.length > 0 && actions.length < maxActions" class="add-more">
        <el-button type="primary" plain @click="addAction" class="add-more-btn">
          <Icon icon="ep:plus" />
          继续添加执行器
        </el-button>
        <span class="add-more-text"> 最多可添加 {{ maxActions }} 个执行器 </span>
      </div>

      <!-- 验证结果 -->
      <div v-if="validationMessage" class="validation-result">
        <el-alert
          :title="validationMessage"
          :type="isValid ? 'success' : 'error'"
          :closable="false"
          show-icon
        />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import ActionTypeSelector from '../selectors/ActionTypeSelector.vue'
import DeviceControlConfig from '../configs/DeviceControlConfig.vue'
import AlertConfig from '../configs/AlertConfig.vue'
import {
  ActionFormData,
  IotRuleSceneActionTypeEnum as ActionTypeEnum
} from '@/api/iot/rule/scene/scene.types'
import { createDefaultActionData } from '../../utils/transform'

/** 执行器配置组件 */
defineOptions({ name: 'ActionSection' })

interface Props {
  actions: ActionFormData[]
}

interface Emits {
  (e: 'update:actions', value: ActionFormData[]): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const actions = useVModel(props, 'actions', emit)

// 配置常量
const maxActions = 5

// 验证状态
const actionValidations = ref<{ [key: number]: { valid: boolean; message: string } }>({})
const validationMessage = ref('')
const isValid = ref(true)

// 执行器类型映射
const actionTypeNames = {
  [ActionTypeEnum.DEVICE_PROPERTY_SET]: '属性设置',
  [ActionTypeEnum.DEVICE_SERVICE_INVOKE]: '服务调用',
  [ActionTypeEnum.ALERT_TRIGGER]: '触发告警',
  [ActionTypeEnum.ALERT_RECOVER]: '恢复告警'
}

const actionTypeTags = {
  [ActionTypeEnum.DEVICE_PROPERTY_SET]: 'primary',
  [ActionTypeEnum.DEVICE_SERVICE_INVOKE]: 'success',
  [ActionTypeEnum.ALERT_TRIGGER]: 'danger',
  [ActionTypeEnum.ALERT_RECOVER]: 'warning'
}

// 工具函数
const isDeviceAction = (type: number) => {
  return [ActionTypeEnum.DEVICE_PROPERTY_SET, ActionTypeEnum.DEVICE_SERVICE_INVOKE].includes(type)
}

const isAlertAction = (type: number) => {
  return [ActionTypeEnum.ALERT_TRIGGER, ActionTypeEnum.ALERT_RECOVER].includes(type)
}

const getActionTypeName = (type: number) => {
  return actionTypeNames[type] || '未知类型'
}

const getActionTypeTag = (type: number) => {
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
  delete actionValidations.value[index]

  // 重新索引验证结果
  const newValidations: { [key: number]: { valid: boolean; message: string } } = {}
  Object.keys(actionValidations.value).forEach((key) => {
    const numKey = parseInt(key)
    if (numKey > index) {
      newValidations[numKey - 1] = actionValidations.value[numKey]
    } else if (numKey < index) {
      newValidations[numKey] = actionValidations.value[numKey]
    }
  })
  actionValidations.value = newValidations

  updateValidationResult()
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
  // 清理不相关的配置
  if (isDeviceAction(type)) {
    action.alertConfigId = undefined
    if (!action.params) {
      action.params = {}
    }
  } else if (isAlertAction(type)) {
    action.productId = undefined
    action.deviceId = undefined
    action.params = undefined
  }
}

const handleActionValidate = (index: number, result: { valid: boolean; message: string }) => {
  actionValidations.value[index] = result
  updateValidationResult()
}

const updateValidationResult = () => {
  const validations = Object.values(actionValidations.value)
  const allValid = validations.every((v) => v.valid)
  const hasValidations = validations.length > 0

  if (!hasValidations) {
    isValid.value = true
    validationMessage.value = ''
  } else if (allValid) {
    isValid.value = true
    validationMessage.value = '所有执行器配置验证通过'
  } else {
    isValid.value = false
    const errorMessages = validations.filter((v) => !v.valid).map((v) => v.message)
    validationMessage.value = `执行器配置错误: ${errorMessages.join('; ')}`
  }

  emit('validate', { valid: isValid.value, message: validationMessage.value })
}

// 监听执行器数量变化
watch(
  () => actions.value.length,
  () => {
    updateValidationResult()
  }
)
</script>

<style scoped>
.action-section {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-content {
  padding: 0;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.action-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.action-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  color: var(--el-color-success);
  font-size: 16px;
}

.action-content {
  padding: 16px;
}

.add-more {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.add-more-btn {
  flex-shrink: 0;
}

.add-more-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.validation-result {
  margin-top: 16px;
}
</style>
