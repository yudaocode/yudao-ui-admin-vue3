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
              @validate="(result) => handleConditionValidate(conditionIndex, result)"
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
import { useVModel } from '@vueuse/core'
import ConditionConfig from './ConditionConfig.vue'
import {
  IotRuleSceneTriggerConditionTypeEnum,
  TriggerConditionFormData
} from '@/api/iot/rule/scene/scene.types'

/** 子条件组配置组件 */
defineOptions({ name: 'SubConditionGroupConfig' })

const props = defineProps<{
  modelValue: TriggerConditionFormData[]
  triggerType: number
  maxConditions?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerConditionFormData[]): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}>()

const subGroup = useVModel(props, 'modelValue', emit)

// 配置常量
const maxConditions = computed(() => props.maxConditions || 3)

// 验证状态
const conditionValidations = ref<{ [key: number]: { valid: boolean; message: string } }>({})

// 事件处理
const addCondition = () => {
  if (!subGroup.value) {
    subGroup.value = []
  }
  if (subGroup.value.length >= maxConditions.value) {
    return
  }
  const newCondition: TriggerConditionFormData = {
    type: IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY, // 默认为设备属性
    productId: undefined,
    deviceId: undefined,
    identifier: '',
    operator: '=',
    param: ''
  }
  subGroup.value.push(newCondition)
}

const removeCondition = (index: number) => {
  if (subGroup.value) {
    subGroup.value.splice(index, 1)
    delete conditionValidations.value[index]

    // 重新索引验证结果
    const newValidations: { [key: number]: { valid: boolean; message: string } } = {}
    Object.keys(conditionValidations.value).forEach((key) => {
      const numKey = parseInt(key)
      if (numKey > index) {
        newValidations[numKey - 1] = conditionValidations.value[numKey]
      } else if (numKey < index) {
        newValidations[numKey] = conditionValidations.value[numKey]
      }
    })
    conditionValidations.value = newValidations

    updateValidationResult()
  }
}

const updateCondition = (index: number, condition: TriggerConditionFormData) => {
  if (subGroup.value) {
    subGroup.value[index] = condition
  }
}

const handleConditionValidate = (index: number, result: { valid: boolean; message: string }) => {
  conditionValidations.value[index] = result
  updateValidationResult()
}

const updateValidationResult = () => {
  if (!subGroup.value || subGroup.value.length === 0) {
    emit('validate', { valid: false, message: '子条件组至少需要一个条件' })
    return
  }

  const validations = Object.values(conditionValidations.value)
  const allValid = validations.every((v: any) => v.valid)

  if (allValid) {
    emit('validate', { valid: true, message: '子条件组配置验证通过' })
  } else {
    const errorMessages = validations.filter((v: any) => !v.valid).map((v: any) => v.message)
    emit('validate', { valid: false, message: `条件配置错误: ${errorMessages.join('; ')}` })
  }
}

// 监听变化
watch(
  () => subGroup.value,
  () => {
    updateValidationResult()
  },
  { deep: true, immediate: true }
)
</script>
