<!-- 设备触发配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 产品和设备选择 -->
    <ProductDeviceSelector
      v-model:product-id="trigger.productId"
      v-model:device-id="trigger.deviceId"
      @change="handleDeviceChange"
    />

    <!-- TODO @puhui999：这里有点冗余，建议去掉 -->
    <!-- 设备状态变更提示 -->
    <div v-if="trigger.type === TriggerTypeEnum.DEVICE_STATE_UPDATE" class="mt-8px">
      <el-alert title="设备状态变更触发" type="info" :closable="false" show-icon>
        <template #default>
          <p class="m-0">当选中的设备上线或离线时将自动触发场景规则</p>
          <p class="m-0 mt-4px text-12px text-[var(--el-text-color-secondary)]">无需配置额外的触发条件</p>
        </template>
      </el-alert>
    </div>

    <!-- 条件组配置 -->
    <div v-else-if="needsConditions" class="space-y-12px">
      <div class="flex items-center justify-between mb-12px">
        <div class="flex items-center gap-8px">
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">触发条件</span>
          <!-- TODO @puhui999：去掉数量限制 -->
          <el-tag size="small" type="info">
            {{ trigger.conditionGroups?.length || 0 }}/{{ maxConditionGroups }}
          </el-tag>
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
        class="flex flex-col gap-12px"
      >
        <div
          v-for="(group, groupIndex) in trigger.conditionGroups"
          :key="`group-${groupIndex}`"
          class="border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]"
        >
          <div class="flex items-center justify-between p-12px px-16px bg-[var(--el-fill-color-light)] border-b border-[var(--el-border-color-lighter)]">
            <div class="flex items-center text-14px font-500 text-[var(--el-text-color-primary)]">
              <span>条件组 {{ groupIndex + 1 }}</span>
              <!-- TODO @puhui999：不用“且、或”哈。条件组之间，就是或；条件之间就是且 -->
              <el-select
                v-model="group.logicOperator"
                size="small"
                class="w-80px ml-12px"
              >
                <el-option label="且" value="AND" />
                <el-option label="或" value="OR" />
              </el-select>
            </div>
            <el-button
              type="danger"
              size="small"
              text
              @click="removeConditionGroup(groupIndex)"
              v-if="trigger.conditionGroups!.length > 1"
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
      </div>

      <!-- 空状态 -->
      <div v-else class="py-40px text-center">
        <el-empty description="暂无触发条件">
          <el-button type="primary" @click="addConditionGroup">
            <Icon icon="ep:plus" />
            添加第一个条件组
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 验证结果 -->
    <div v-if="validationMessage" class="mt-8px">
      <el-alert
        :title="validationMessage"
        :type="isValid ? 'success' : 'error'"
        :closable="false"
        show-icon
      />
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
    logicOperator: 'AND'
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
// TODO @puhui999：unocss - 已完成转换
</script>
