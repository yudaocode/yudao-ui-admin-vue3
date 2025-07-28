<!-- 场景触发器配置组件 -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px" shadow="never">
    <template #header>
      <div class="flex items-center gap-8px">
        <Icon icon="ep:lightning" class="text-[var(--el-color-primary)] text-18px" />
        <span class="text-16px font-600 text-[var(--el-text-color-primary)]">触发器配置</span>
        <el-tag size="small" type="info">场景触发器</el-tag>
      </div>
    </template>

    <div class="p-16px space-y-16px">
      <!-- 触发事件类型选择 -->
      <el-form-item label="触发事件类型" required>
        <el-select
          :model-value="trigger.type"
          @update:model-value="(value) => updateTriggerType(value)"
          @change="onTriggerTypeChange"
          placeholder="请选择触发事件类型"
          class="w-full"
        >
          <el-option
            v-for="option in triggerTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 设备触发配置 -->
      <DeviceTriggerConfig
        v-if="isDeviceTrigger(trigger.type)"
        :model-value="trigger"
        @update:model-value="updateTrigger"
      />

      <!-- 定时触发配置 -->
      <TimerTriggerConfig
        v-if="trigger.type === TriggerTypeEnum.TIMER"
        :model-value="trigger.cronExpression"
        @update:model-value="updateTriggerCronExpression"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import DeviceTriggerConfig from '../configs/DeviceTriggerConfig.vue'
import TimerTriggerConfig from '../configs/TimerTriggerConfig.vue'
import {
  TriggerFormData,
  IotRuleSceneTriggerTypeEnum as TriggerTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 触发器配置组件 */
defineOptions({ name: 'TriggerSection' })

interface Props {
  trigger: TriggerFormData
}

interface Emits {
  (e: 'update:trigger', value: TriggerFormData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const trigger = useVModel(props, 'trigger', emit)

// 触发器类型选项
const triggerTypeOptions = [
  {
    value: TriggerTypeEnum.DEVICE_STATE_UPDATE,
    label: '设备状态变更'
  },
  {
    value: TriggerTypeEnum.DEVICE_PROPERTY_POST,
    label: '设备属性上报'
  },
  {
    value: TriggerTypeEnum.DEVICE_EVENT_POST,
    label: '设备事件上报'
  },
  {
    value: TriggerTypeEnum.DEVICE_SERVICE_INVOKE,
    label: '设备服务调用'
  },
  {
    value: TriggerTypeEnum.TIMER,
    label: '定时触发'
  }
]

// 工具函数
const isDeviceTrigger = (type: number) => {
  const deviceTriggerTypes = [
    TriggerTypeEnum.DEVICE_STATE_UPDATE,
    TriggerTypeEnum.DEVICE_PROPERTY_POST,
    TriggerTypeEnum.DEVICE_EVENT_POST,
    TriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ] as number[]
  return deviceTriggerTypes.includes(type)
}

// 事件处理
const updateTriggerType = (type: number) => {
  trigger.value.type = type
  onTriggerTypeChange(type)
}

const updateTrigger = (newTrigger: TriggerFormData) => {
  trigger.value = newTrigger
}

const updateTriggerCronExpression = (cronExpression?: string) => {
  trigger.value.cronExpression = cronExpression
}

const onTriggerTypeChange = (type: number) => {
  // 清理不相关的配置
  if (type === TriggerTypeEnum.TIMER) {
    trigger.value.productId = undefined
    trigger.value.deviceId = undefined
    trigger.value.identifier = undefined
    trigger.value.operator = undefined
    trigger.value.value = undefined
    trigger.value.mainCondition = undefined
    trigger.value.conditionGroup = undefined
    if (!trigger.value.cronExpression) {
      trigger.value.cronExpression = '0 0 12 * * ?'
    }
  } else {
    trigger.value.cronExpression = undefined
    if (type === TriggerTypeEnum.DEVICE_STATE_UPDATE) {
      trigger.value.mainCondition = undefined
      trigger.value.conditionGroup = undefined
    } else {
      // 设备属性、事件、服务触发需要条件配置
      if (!trigger.value.mainCondition) {
        trigger.value.mainCondition = undefined // 等待用户配置
      }
      if (!trigger.value.conditionGroup) {
        trigger.value.conditionGroup = undefined // 可选的条件组
      }
    }
  }
}
</script>
