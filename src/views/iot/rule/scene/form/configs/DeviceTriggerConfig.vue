<!-- 设备触发配置组件 - 优化版本 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 产品和设备选择 -->
    <ProductDeviceSelector
      v-model:product-id="trigger.productId"
      v-model:device-id="trigger.deviceId"
      @change="handleDeviceChange"
    />

    <!-- 条件组配置 -->
    <div v-if="needsConditions" class="space-y-12px">
      <div class="flex items-center justify-between mb-12px">
        <div class="flex items-center gap-8px">
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">触发条件</span>
          <el-tag size="small" type="info">
            {{ trigger.conditionGroups?.length || 0 }}个条件组
          </el-tag>
          <el-tooltip
            content="条件组之间为'或'关系，满足任意一组即可触发；每个条件组内的条件为'且'关系，需要全部满足"
            placement="top"
          >
            <Icon icon="ep:question-filled" class="text-[var(--el-color-info)] cursor-help" />
          </el-tooltip>
        </div>
        <div class="flex items-center gap-8px">
          <el-button
            type="primary"
            size="small"
            @click="addConditionGroup"
            :disabled="(trigger.conditionGroups?.length || 0) >= maxConditionGroups"
          >
            <Icon icon="ep:plus" />
            添加条件组
          </el-button>
        </div>
      </div>

      <!-- 条件组列表 -->
      <div
        v-if="trigger.conditionGroups && trigger.conditionGroups.length > 0"
        class="space-y-16px"
      >
        <!-- 逻辑关系说明 -->
        <div v-if="trigger.conditionGroups.length > 1" class="flex items-center justify-center">
          <div
            class="flex items-center gap-8px px-12px py-6px bg-blue-50 border border-blue-200 rounded-full text-12px text-blue-600"
          >
            <Icon icon="ep:info-filled" />
            <span>条件组之间为"或"关系，满足任意一组即可触发</span>
          </div>
        </div>

        <div class="relative">
          <div
            v-for="(group, groupIndex) in trigger.conditionGroups"
            :key="`group-${groupIndex}`"
            class="relative"
          >
            <!-- 条件组容器 -->
            <div
              class="border-2 border-[var(--el-border-color-lighter)] rounded-8px bg-[var(--el-fill-color-blank)] shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                class="flex items-center justify-between p-16px bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-[var(--el-border-color-lighter)] rounded-t-6px"
              >
                <div class="flex items-center gap-12px">
                  <div
                    class="flex items-center gap-8px text-16px font-600 text-[var(--el-text-color-primary)]"
                  >
                    <div
                      class="w-24px h-24px bg-blue-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
                    >
                      {{ groupIndex + 1 }}
                    </div>
                    <span>条件组</span>
                  </div>
                  <el-tag size="small" type="success" class="font-500"> 组内条件为"且"关系 </el-tag>
                </div>
                <el-button
                  type="danger"
                  size="small"
                  text
                  @click="removeConditionGroup(groupIndex)"
                  v-if="trigger.conditionGroups!.length > 1"
                  class="hover:bg-red-50"
                >
                  <Icon icon="ep:delete" />
                  删除组
                </el-button>
              </div>

              <ConditionGroupConfig
                :model-value="group"
                @update:model-value="(value) => updateConditionGroup(groupIndex, value)"
                :trigger-type="trigger.type"
                :product-id="trigger.productId"
                :device-id="trigger.deviceId"
                @validate="(result) => handleGroupValidate(groupIndex, result)"
              />
            </div>

            <!-- 条件组间的"或"连接符 -->
            <div
              v-if="groupIndex < trigger.conditionGroups!.length - 1"
              class="flex items-center justify-center py-12px"
            >
              <div class="flex items-center gap-8px">
                <!-- 连接线 -->
                <div class="w-32px h-1px bg-orange-300"></div>
                <!-- 或标签 -->
                <div class="px-16px py-6px bg-orange-100 border-2 border-orange-300 rounded-full">
                  <span class="text-14px font-600 text-orange-600">或</span>
                </div>
                <!-- 连接线 -->
                <div class="w-32px h-1px bg-orange-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="py-40px text-center">
        <el-empty description="暂无触发条件">
          <template #description>
            <div class="space-y-8px">
              <p class="text-[var(--el-text-color-secondary)]">暂无触发条件</p>
              <p class="text-12px text-[var(--el-text-color-placeholder)]">
                请使用上方的"添加条件组"按钮来设置触发规则
              </p>
            </div>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import ProductDeviceSelector from '../selectors/ProductDeviceSelector.vue'
import ConditionGroupConfig from './ConditionGroupConfig.vue'
import {
  TriggerFormData,
  ConditionGroupFormData,
  IotRuleSceneTriggerTypeEnum as TriggerTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 设备触发配置组件 */
defineOptions({ name: 'DeviceTriggerConfig' })

interface Props {
  modelValue: TriggerFormData
}

interface Emits {
  (e: 'update:modelValue', value: TriggerFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const trigger = useVModel(props, 'modelValue', emit)

// 配置常量
const maxConditionGroups = 3

// 验证状态
const groupValidations = ref<{ [key: number]: { valid: boolean; message: string } }>({})
const validationMessage = ref('')
const isValid = ref(true)

// 计算属性
const needsConditions = computed(() => {
  return trigger.value.type !== TriggerTypeEnum.DEVICE_STATE_UPDATE
})

// 事件处理
const updateConditionGroup = (index: number, group: ConditionGroupFormData) => {
  if (trigger.value.conditionGroups) {
    trigger.value.conditionGroups[index] = group
  }
}

const handleDeviceChange = ({ productId, deviceId }: { productId?: number; deviceId?: number }) => {
  trigger.value.productId = productId
  trigger.value.deviceId = deviceId
  updateValidationResult()
}

const addConditionGroup = () => {
  if (!trigger.value.conditionGroups) {
    trigger.value.conditionGroups = []
  }

  if (trigger.value.conditionGroups.length >= maxConditionGroups) {
    return
  }

  const newGroup: ConditionGroupFormData = {
    conditions: [],
    logicOperator: 'AND' // 固定为AND，因为条件组内部条件间为"且"关系
  }

  trigger.value.conditionGroups.push(newGroup)
}

const removeConditionGroup = (index: number) => {
  if (trigger.value.conditionGroups) {
    trigger.value.conditionGroups.splice(index, 1)
    delete groupValidations.value[index]

    // 重新索引验证结果
    const newValidations: { [key: number]: { valid: boolean; message: string } } = {}
    Object.keys(groupValidations.value).forEach((key) => {
      const numKey = parseInt(key)
      if (numKey > index) {
        newValidations[numKey - 1] = groupValidations.value[numKey]
      } else if (numKey < index) {
        newValidations[numKey] = groupValidations.value[numKey]
      }
    })
    groupValidations.value = newValidations

    updateValidationResult()
  }
}

const handleGroupValidate = (index: number, result: { valid: boolean; message: string }) => {
  groupValidations.value[index] = result
  updateValidationResult()
}

const updateValidationResult = () => {
  // 基础验证
  if (!trigger.value.productId || !trigger.value.deviceId) {
    isValid.value = false
    validationMessage.value = '请选择产品和设备'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  // 设备状态变更不需要条件验证
  if (trigger.value.type === TriggerTypeEnum.DEVICE_STATE_UPDATE) {
    isValid.value = true
    validationMessage.value = '设备触发配置验证通过'
    emit('validate', { valid: true, message: validationMessage.value })
    return
  }

  // 条件组验证
  if (!trigger.value.conditionGroups || trigger.value.conditionGroups.length === 0) {
    isValid.value = false
    validationMessage.value = '请至少添加一个触发条件组'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  const validations = Object.values(groupValidations.value)
  const allValid = validations.every((v) => v.valid)

  if (allValid) {
    isValid.value = true
    validationMessage.value = '设备触发配置验证通过'
  } else {
    isValid.value = false
    const errorMessages = validations.filter((v) => !v.valid).map((v) => v.message)
    validationMessage.value = `条件组配置错误: ${errorMessages.join('; ')}`
  }

  emit('validate', { valid: isValid.value, message: validationMessage.value })
}

// 监听触发器类型变化
watch(
  () => trigger.value.type,
  () => {
    updateValidationResult()
  }
)

// 监听产品设备变化
watch(
  () => [trigger.value.productId, trigger.value.deviceId],
  () => {
    updateValidationResult()
  }
)
</script>
