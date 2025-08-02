<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px mb-10px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:lightning" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">触发器配置</span>
          <el-tag size="small" type="info">{{ triggers.length }} 个触发器</el-tag>
        </div>
        <el-button type="primary" size="small" @click="addTrigger">
          <Icon icon="ep:plus" />
          添加触发器
        </el-button>
      </div>
    </template>

    <div class="p-16px space-y-24px">
      <!-- 触发器列表 -->
      <!-- TODO 每个触发器，有个外框，会不会好点？ -->
      <div v-if="triggers.length > 0" class="space-y-24px">
        <div
          v-for="(triggerItem, index) in triggers"
          :key="`trigger-${index}`"
          class="border border-[var(--el-border-color-light)] rounded-8px p-16px relative"
        >
          <!-- 触发器头部 -->
          <div class="flex items-center justify-between mb-16px">
            <div class="flex items-center gap-8px">
              <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
                触发器 {{ index + 1 }}
              </span>
              <el-tag size="small" :type="getTriggerTagType(triggerItem.type)">
                {{ getTriggerTypeLabel(triggerItem.type) }}
              </el-tag>
            </div>
            <div class="flex items-center gap-8px">
              <el-button
                v-if="triggers.length > 1"
                type="danger"
                size="small"
                text
                @click="removeTrigger(index)"
              >
                <Icon icon="ep:delete" />
                删除
              </el-button>
            </div>
          </div>

          <!-- 触发事件类型选择 -->
          <el-form-item label="触发事件类型" required>
            <el-select
              :model-value="triggerItem.type"
              @update:model-value="(value) => updateTriggerType(index, value)"
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
            v-if="isDeviceTrigger(triggerItem.type)"
            :model-value="triggerItem"
            :index="index"
            @update:model-value="(value) => updateTriggerDeviceConfig(index, value)"
          />

          <!-- 定时触发配置 -->
          <TimerTriggerConfig
            v-else-if="triggerItem.type === TriggerTypeEnum.TIMER"
            :model-value="triggerItem.cronExpression"
            @update:model-value="(value) => updateTriggerCronConfig(index, value)"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="py-40px text-center">
        <el-empty description="暂无触发器">
          <template #description>
            <div class="space-y-8px">
              <p class="text-[var(--el-text-color-secondary)]">暂无触发器配置</p>
              <p class="text-12px text-[var(--el-text-color-placeholder)]">
                请使用上方的"添加触发器"按钮来设置触发规则
              </p>
            </div>
          </template>
        </el-empty>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import DeviceTriggerConfig from '../configs/DeviceTriggerConfig.vue'
import TimerTriggerConfig from '../configs/TimerTriggerConfig.vue'
import { TriggerFormData } from '@/api/iot/rule/scene/scene.types'
import {
  getTriggerTypeOptions,
  IotRuleSceneTriggerTypeEnum as TriggerTypeEnum,
  IotRuleSceneTriggerTypeEnum,
  isDeviceTrigger
} from '@/views/iot/utils/constants'

/** 触发器配置组件 */
defineOptions({ name: 'TriggerSection' })

const props = defineProps<{
  triggers: TriggerFormData[]
}>()

const emit = defineEmits<{
  (e: 'update:triggers', value: TriggerFormData[]): void
}>()

const triggers = useVModel(props, 'triggers', emit)

// 触发器类型选项（从 constants 中获取）
const triggerTypeOptions = getTriggerTypeOptions()

// 工具函数
const getTriggerTypeLabel = (type: number): string => {
  const option = triggerTypeOptions.find((opt) => opt.value === type)
  return option?.label || '未知类型'
}

const getTriggerTagType = (type: number): string => {
  if (type === IotRuleSceneTriggerTypeEnum.TIMER) {
    return 'warning'
  }
  return isDeviceTrigger(type) ? 'success' : 'info'
}

// 事件处理函数
const addTrigger = () => {
  const newTrigger: TriggerFormData = {
    type: TriggerTypeEnum.DEVICE_STATE_UPDATE,
    productId: undefined,
    deviceId: undefined,
    identifier: undefined,
    operator: undefined,
    value: undefined,
    cronExpression: undefined,
    conditionGroups: [] // 空的条件组数组
  }
  triggers.value.push(newTrigger)
}

const removeTrigger = (index: number) => {
  if (triggers.value.length > 1) {
    triggers.value.splice(index, 1)
  }
}

const updateTriggerType = (index: number, type: number) => {
  triggers.value[index].type = type
  onTriggerTypeChange(index, type)
}

const updateTriggerDeviceConfig = (index: number, newTrigger: TriggerFormData) => {
  triggers.value[index] = newTrigger
}

const updateTriggerCronConfig = (index: number, cronExpression?: string) => {
  triggers.value[index].cronExpression = cronExpression
}

const onTriggerTypeChange = (index: number, _: number) => {
  const triggerItem = triggers.value[index]
  triggerItem.productId = undefined
  triggerItem.deviceId = undefined
  triggerItem.identifier = undefined
  triggerItem.operator = undefined
  triggerItem.value = undefined
  triggerItem.cronExpression = undefined
  triggerItem.conditionGroups = []
}

// 初始化：确保至少有一个触发器
onMounted(() => {
  if (triggers.value.length === 0) {
    addTrigger()
  }
})
</script>
