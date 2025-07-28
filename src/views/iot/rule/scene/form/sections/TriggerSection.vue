<!-- 触发器配置组件 -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:lightning" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">触发器配置</span>
          <el-tag size="small" type="info">{{ triggers.length }}个触发器</el-tag>
        </div>
        <div class="flex items-center gap-8px">
          <el-button
            type="primary"
            size="small"
            @click="addTrigger"
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
        <el-empty description="暂无触发器配置，请点击右上角添加触发器按钮开始配置" />
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
            <el-form-item label="触发类型" required>
              <el-select
                :model-value="trigger.type"
                @update:model-value="(value) => updateTriggerType(index, value)"
                @change="onTriggerTypeChange(trigger, $event)"
                placeholder="请选择触发类型"
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
              @update:model-value="(value) => updateTrigger(index, value)"
            />

            <!-- 定时触发配置 -->
            <TimerTriggerConfig
              v-if="trigger.type === TriggerTypeEnum.TIMER"
              :model-value="trigger.cronExpression"
              @update:model-value="(value) => updateTriggerCronExpression(index, value)"
            />
          </div>
        </div>
      </div>
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
  triggers: TriggerFormData[]
}

interface Emits {
  (e: 'update:triggers', value: TriggerFormData[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const triggers = useVModel(props, 'triggers', emit)

/**
 * 创建默认的触发器数据
 */
const createDefaultTriggerData = (): TriggerFormData => {
  return {
    type: TriggerTypeEnum.DEVICE_PROPERTY_POST, // 默认为设备属性上报
    productId: undefined,
    deviceId: undefined,
    identifier: undefined,
    operator: undefined,
    value: undefined,
    cronExpression: undefined,
    conditionGroups: []
  }
}





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
  const deviceTriggerTypes = [
    TriggerTypeEnum.DEVICE_STATE_UPDATE,
    TriggerTypeEnum.DEVICE_PROPERTY_POST,
    TriggerTypeEnum.DEVICE_EVENT_POST,
    TriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ] as number[]
  return deviceTriggerTypes.includes(type)
}

const getTriggerTypeName = (type: number) => {
  return triggerTypeNames[type] || '未知类型'
}

const getTriggerTypeTag = (type: number) => {
  return triggerTypeTags[type] || 'info'
}

// 事件处理
const addTrigger = () => {
  const newTrigger = createDefaultTriggerData()
  triggers.value.push(newTrigger)
}

const removeTrigger = (index: number) => {
  triggers.value.splice(index, 1)
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
</script>


