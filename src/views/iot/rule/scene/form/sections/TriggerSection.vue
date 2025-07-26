<!-- 触发器配置组件 -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:lightning" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">触发器配置</span>
          <!-- TODO @puhui999：是不是去掉 maxTriggers；计数 -->
          <el-tag size="small" type="info">{{ triggers.length }}/{{ maxTriggers }}</el-tag>
        </div>
        <div class="flex items-center gap-8px">
          <el-button
            type="primary"
            size="small"
            @click="addTrigger"
            :disabled="triggers.length >= maxTriggers"
          >
            <Icon icon="ep:plus" />
            添加触发器
          </el-button>
        </div>
      </div>
    </template>

    <div class="p-0">
      <!-- 空状态 -->
      <div v-if="triggers.length === 0">
        <el-empty description="暂无触发器配置">
          <!-- TODO @puhui999：这个要不要去掉哈；入口统一点 -->
          <el-button type="primary" @click="addTrigger">
            <Icon icon="ep:plus" />
            添加第一个触发器
          </el-button>
        </el-empty>
      </div>

      <!-- 触发器列表 -->
      <div v-else class="space-y-16px">
        <div v-for="(trigger, index) in triggers" :key="`trigger-${index}`" class="p-16px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]">
          <div class="flex items-center justify-between mb-16px">
            <div class="flex items-center gap-8px">
              <Icon icon="ep:lightning" class="text-[var(--el-color-warning)] text-16px" />
              <span>触发器 {{ index + 1 }}</span>
              <el-tag :type="getTriggerTypeTag(trigger.type)" size="small">
                {{ getTriggerTypeName(trigger.type) }}
              </el-tag>
            </div>
            <div>
              <el-button
                type="danger"
                size="small"
                text
                @click="removeTrigger(index)"
                v-if="triggers.length > 1"
              >
                <Icon icon="ep:delete" />
                删除
              </el-button>
            </div>
          </div>

          <div class="space-y-16px">
            <!-- 触发类型选择 -->
            <TriggerTypeSelector
              :model-value="trigger.type"
              @update:model-value="(value) => updateTriggerType(index, value)"
              @change="onTriggerTypeChange(trigger, $event)"
            />

            <!-- 设备触发配置 -->
            <DeviceTriggerConfig
              v-if="isDeviceTrigger(trigger.type)"
              :model-value="trigger"
              @update:model-value="(value) => updateTrigger(index, value)"
              @validate="(result) => handleTriggerValidate(index, result)"
            />

            <!-- 定时触发配置 -->
            <TimerTriggerConfig
              v-if="trigger.type === TriggerTypeEnum.TIMER"
              :model-value="trigger.cronExpression"
              @update:model-value="(value) => updateTriggerCronExpression(index, value)"
              @validate="(result) => handleTriggerValidate(index, result)"
            />
          </div>
        </div>
      </div>

      <!-- 添加提示 -->
      <!-- TODO @puhui999：这个要不要去掉哈；入口统一点 -->
      <div v-if="triggers.length > 0 && triggers.length < maxTriggers" class="text-center py-16px">
        <el-button type="primary" plain @click="addTrigger">
          <Icon icon="ep:plus" />
          继续添加触发器
        </el-button>
        <span class="block mt-8px text-12px text-[var(--el-text-color-secondary)]"> 最多可添加 {{ maxTriggers }} 个触发器 </span>
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
import TriggerTypeSelector from '../selectors/TriggerTypeSelector.vue'
import DeviceTriggerConfig from '../configs/DeviceTriggerConfig.vue'
import TimerTriggerConfig from '../configs/TimerTriggerConfig.vue'
import {
  TriggerFormData,
  IotRuleSceneTriggerTypeEnum as TriggerTypeEnum
} from '@/api/iot/rule/scene/scene.types'
import { createDefaultTriggerData } from '../../utils/transform'

/** 触发器配置组件 */
defineOptions({ name: 'TriggerSection' })

interface Props {
  triggers: TriggerFormData[]
}

interface Emits {
  (e: 'update:triggers', value: TriggerFormData[]): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const triggers = useVModel(props, 'triggers', emit)

// 配置常量
const maxTriggers = 5

// 验证状态
const triggerValidations = ref<{ [key: number]: { valid: boolean; message: string } }>({})
const validationMessage = ref('')
const isValid = ref(true)

// 触发器类型映射
const triggerTypeNames = {
  [TriggerTypeEnum.DEVICE_STATE_UPDATE]: '设备状态变更',
  [TriggerTypeEnum.DEVICE_PROPERTY_POST]: '属性上报',
  [TriggerTypeEnum.DEVICE_EVENT_POST]: '事件上报',
  [TriggerTypeEnum.DEVICE_SERVICE_INVOKE]: '服务调用',
  [TriggerTypeEnum.TIMER]: '定时触发'
}

const triggerTypeTags = {
  [TriggerTypeEnum.DEVICE_STATE_UPDATE]: 'warning',
  [TriggerTypeEnum.DEVICE_PROPERTY_POST]: 'primary',
  [TriggerTypeEnum.DEVICE_EVENT_POST]: 'success',
  [TriggerTypeEnum.DEVICE_SERVICE_INVOKE]: 'info',
  [TriggerTypeEnum.TIMER]: 'danger'
}

// 工具函数
const isDeviceTrigger = (type: number) => {
  return [
    TriggerTypeEnum.DEVICE_STATE_UPDATE,
    TriggerTypeEnum.DEVICE_PROPERTY_POST,
    TriggerTypeEnum.DEVICE_EVENT_POST,
    TriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ].includes(type)
}

const getTriggerTypeName = (type: number) => {
  return triggerTypeNames[type] || '未知类型'
}

const getTriggerTypeTag = (type: number) => {
  return triggerTypeTags[type] || 'info'
}

// 事件处理
const addTrigger = () => {
  if (triggers.value.length >= maxTriggers) {
    return
  }

  const newTrigger = createDefaultTriggerData()
  triggers.value.push(newTrigger)
}

const removeTrigger = (index: number) => {
  triggers.value.splice(index, 1)
  delete triggerValidations.value[index]

  // 重新索引验证结果
  const newValidations: { [key: number]: { valid: boolean; message: string } } = {}
  Object.keys(triggerValidations.value).forEach((key) => {
    const numKey = parseInt(key)
    if (numKey > index) {
      newValidations[numKey - 1] = triggerValidations.value[numKey]
    } else if (numKey < index) {
      newValidations[numKey] = triggerValidations.value[numKey]
    }
  })
  triggerValidations.value = newValidations

  updateValidationResult()
}

const updateTriggerType = (index: number, type: number) => {
  triggers.value[index].type = type
  onTriggerTypeChange(triggers.value[index], type)
}

const updateTrigger = (index: number, trigger: TriggerFormData) => {
  triggers.value[index] = trigger
}

const updateTriggerCronExpression = (index: number, cronExpression?: string) => {
  triggers.value[index].cronExpression = cronExpression
}

const onTriggerTypeChange = (trigger: TriggerFormData, type: number) => {
  // 清理不相关的配置
  if (type === TriggerTypeEnum.TIMER) {
    trigger.productId = undefined
    trigger.deviceId = undefined
    trigger.identifier = undefined
    trigger.operator = undefined
    trigger.value = undefined
    trigger.conditionGroups = undefined
    if (!trigger.cronExpression) {
      trigger.cronExpression = '0 0 12 * * ?'
    }
  } else {
    trigger.cronExpression = undefined
    if (type === TriggerTypeEnum.DEVICE_STATE_UPDATE) {
      trigger.conditionGroups = undefined
    } else if (!trigger.conditionGroups) {
      trigger.conditionGroups = []
    }
  }
}

const handleTriggerValidate = (index: number, result: { valid: boolean; message: string }) => {
  triggerValidations.value[index] = result
  updateValidationResult()
}

const updateValidationResult = () => {
  const validations = Object.values(triggerValidations.value)
  const allValid = validations.every((v) => v.valid)
  const hasValidations = validations.length > 0

  if (!hasValidations) {
    isValid.value = true
    validationMessage.value = ''
  } else if (allValid) {
    isValid.value = true
    validationMessage.value = '所有触发器配置验证通过'
  } else {
    isValid.value = false
    const errorMessages = validations.filter((v) => !v.valid).map((v) => v.message)
    validationMessage.value = `触发器配置错误: ${errorMessages.join('; ')}`
  }

  emit('validate', { valid: isValid.value, message: validationMessage.value })
}

// 监听触发器数量变化
watch(
  () => triggers.value.length,
  () => {
    updateValidationResult()
  }
)
</script>


