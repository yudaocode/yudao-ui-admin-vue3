<template>
  <div class="p-16px">
    <!-- 空状态 -->
    <div v-if="!subGroup || subGroup.length === 0" class="text-center py-24px">
      <div class="flex flex-col items-center gap-12px">
        <Icon icon="ep:plus" class="text-32px text-[var(--el-text-color-placeholder)]" />
        <div class="text-[var(--el-text-color-secondary)]">
          <p class="text-14px font-500 mb-4px">暂无条件</p>
          <p class="text-12px">点击下方按钮添加第一个条件</p>
        </div>
        <el-button type="primary" @click="addCondition">
          <Icon icon="ep:plus" />
          添加条件
        </el-button>
      </div>
    </div>

    <!-- 条件列表 -->
    <div v-else class="space-y-16px">
      <div
        v-for="(condition, conditionIndex) in subGroup"
        :key="`condition-${conditionIndex}`"
        class="relative"
      >
        <!-- 条件配置 -->
        <div
          class="border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)] shadow-sm"
        >
          <div
            class="flex items-center justify-between p-12px bg-[var(--el-fill-color-light)] border-b border-[var(--el-border-color-lighter)] rounded-t-4px"
          >
            <div class="flex items-center gap-8px">
              <div
                class="w-20px h-20px bg-blue-500 text-white rounded-full flex items-center justify-center text-10px font-bold"
              >
                {{ conditionIndex + 1 }}
              </div>
              <span class="text-12px font-500 text-[var(--el-text-color-primary)]"
                >条件 {{ conditionIndex + 1 }}</span
              >
            </div>
            <el-button
              type="danger"
              size="small"
              text
              @click="removeCondition(conditionIndex)"
              v-if="subGroup!.length > 1"
              class="hover:bg-red-50"
            >
              <Icon icon="ep:delete" />
            </el-button>
          </div>

          <div class="p-12px">
            <ConditionConfig
              :model-value="condition"
              @update:model-value="(value) => updateCondition(conditionIndex, value)"
              :trigger-type="triggerType"
            />
          </div>
        </div>
      </div>

      <!-- 添加条件按钮 -->
      <div
        v-if="subGroup && subGroup.length > 0 && subGroup.length < maxConditions"
        class="text-center py-16px"
      >
        <el-button type="primary" plain @click="addCondition">
          <Icon icon="ep:plus" />
          继续添加条件
        </el-button>
        <span class="block mt-8px text-12px text-[var(--el-text-color-secondary)]">
          最多可添加 {{ maxConditions }} 个条件
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import { useVModel } from '@vueuse/core'
import ConditionConfig from './ConditionConfig.vue'
import type { TriggerCondition } from '@/api/iot/rule/scene'
import {
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum
} from '@/views/iot/utils/constants'

/** 子条件组配置组件 */
defineOptions({ name: 'SubConditionGroupConfig' })

const props = defineProps<{
  modelValue: TriggerCondition[]
  triggerType: number
  maxConditions?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerCondition[]): void
}>()

const subGroup = useVModel(props, 'modelValue', emit)

const maxConditions = computed(() => props.maxConditions || 3) // 最大条件数量

/** 添加条件 */
const addCondition = async () => {
  // 确保 subGroup.value 是一个数组
  if (!subGroup.value) {
    subGroup.value = []
  }

  // 检查是否达到最大条件数量限制
  if (subGroup.value?.length >= maxConditions.value) {
    return
  }

  const newCondition: TriggerCondition = {
    type: IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY, // 默认为设备属性
    productId: undefined,
    deviceId: undefined,
    identifier: '',
    operator: IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value, // 使用枚举默认值
    param: ''
  }

  // 使用 nextTick 确保响应式更新完成后再添加新条件
  await nextTick()
  if (subGroup.value) {
    subGroup.value.push(newCondition)
  }
}

/**
 * 移除条件
 * @param index 条件索引
 */
const removeCondition = (index: number) => {
  if (subGroup.value) {
    subGroup.value.splice(index, 1)
  }
}

/**
 * 更新条件
 * @param index 条件索引
 * @param condition 条件对象
 */
const updateCondition = (index: number, condition: TriggerCondition) => {
  if (subGroup.value) {
    subGroup.value[index] = condition
  }
}
</script>
