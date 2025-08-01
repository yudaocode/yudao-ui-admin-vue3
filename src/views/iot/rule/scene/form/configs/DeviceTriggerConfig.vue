<!-- 设备触发配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 主条件配置 - 默认直接展示 -->
    <div class="space-y-16px">
      <MainConditionConfig
        v-model="trigger"
        :trigger-type="trigger.type"
        @validate="handleMainConditionValidate"
      />
    </div>

    <!-- 条件组配置 -->
    <div class="space-y-16px">
      <!-- 条件组配置 -->
      <ConditionGroupContainerConfig
        v-model="trigger.conditionGroups"
        :trigger-type="trigger.type"
        @validate="handleConditionGroupValidate"
        @remove="removeConditionGroup"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

import MainConditionConfig from './MainConditionConfig.vue'
import ConditionGroupContainerConfig from './ConditionGroupContainerConfig.vue'
import { TriggerFormData } from '@/api/iot/rule/scene/scene.types'
import { IotRuleSceneTriggerTypeEnum as TriggerTypeEnum } from '@/views/iot/utils/constants'

/** 设备触发配置组件 */
defineOptions({ name: 'DeviceTriggerConfig' })

const props = defineProps<{
  modelValue: TriggerFormData
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerFormData): void
  (e: 'validate', value: { valid: boolean; message: string }): void
}>()

const trigger = useVModel(props, 'modelValue', emit)

// 验证状态
const mainConditionValidation = ref<{ valid: boolean; message: string }>({
  valid: true,
  message: ''
})
const validationMessage = ref('')
const isValid = ref(true)

// 初始化主条件
const initMainCondition = () => {
  // TODO @puhui999: 等到编辑回显时联调
  // if (!trigger.value.mainCondition) {
  //   trigger.value = {
  //     type: trigger.value.type, // 使用触发事件类型作为条件类型
  //     productId: undefined,
  //     deviceId: undefined,
  //     identifier: '',
  //     operator: '=',
  //     param: ''
  //   }
  // }
}

// 监听触发器类型变化，自动初始化主条件
watch(
  () => trigger.value.type,
  () => {
    initMainCondition()
  },
  { immediate: true }
)

const handleMainConditionValidate = (result: { valid: boolean; message: string }) => {
  mainConditionValidation.value = result
  updateValidationResult()
}

const addConditionGroup = () => {
  if (!trigger.value.conditionGroups) {
    trigger.value.conditionGroups = []
  }
  trigger.value.conditionGroups.push([])
}

// 事件处理
const handleConditionGroupValidate = () => {
  updateValidationResult()
}

const removeConditionGroup = () => {
  trigger.value.conditionGroups = undefined
}

const updateValidationResult = () => {
  // 主条件验证
  if (!mainConditionValidation.value.valid) {
    isValid.value = false
    validationMessage.value = mainConditionValidation.value.message
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

  // 主条件验证
  if (!trigger.value.value) {
    isValid.value = false
    validationMessage.value = '请配置主条件'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  // 主条件详细验证
  if (!mainConditionValidation.value.valid) {
    isValid.value = false
    validationMessage.value = `主条件配置错误: ${mainConditionValidation.value.message}`
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  isValid.value = true
  validationMessage.value = '设备触发配置验证通过'
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
