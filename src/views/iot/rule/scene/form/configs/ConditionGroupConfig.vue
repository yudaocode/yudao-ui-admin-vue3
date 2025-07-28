<!-- 条件组配置组件 -->
<template>
  <div class="p-16px">
    <!-- 条件组说明 -->
    <div
      v-if="group.conditions && group.conditions.length > 1"
      class="mb-12px flex items-center justify-center"
    >
      <div
        class="flex items-center gap-6px px-10px py-4px bg-green-50 border border-green-200 rounded-full text-11px text-green-600"
      >
        <Icon icon="ep:info-filled" />
        <span>组内所有条件必须同时满足（且关系）</span>
      </div>
    </div>

    <div class="space-y-12px">
      <!-- 条件列表 -->
      <div v-if="group.conditions && group.conditions.length > 0" class="space-y-12px">
        <div
          v-for="(condition, index) in group.conditions"
          :key="`condition-${index}`"
          class="p-12px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-light)] shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-12px">
            <div class="flex items-center gap-8px">
              <div class="flex items-center gap-6px">
                <div
                  class="w-18px h-18px bg-green-500 text-white rounded-full flex items-center justify-center text-10px font-bold"
                >
                  {{ index + 1 }}
                </div>
                <span class="text-14px font-500 text-[var(--el-text-color-primary)]">条件</span>
              </div>
              <el-tag size="small" type="primary">
                {{ getConditionTypeName(condition.type) }}
              </el-tag>
            </div>
            <el-button
              type="danger"
              size="small"
              text
              @click="removeCondition(index)"
              v-if="group.conditions!.length > 1"
            >
              <Icon icon="ep:delete" />
              删除
            </el-button>
          </div>

          <div class="p-12px bg-[var(--el-fill-color-blank)] rounded-4px">
            <ConditionConfig
              :model-value="condition"
              @update:model-value="(value) => updateCondition(index, value)"
              :trigger-type="triggerType"
              :product-id="productId"
              :device-id="deviceId"
              @validate="(result) => handleConditionValidate(index, result)"
            />
          </div>

          <!-- 条件间的"且"连接符 -->
          <div
            v-if="index < group.conditions!.length - 1"
            class="flex items-center justify-center py-8px"
          >
            <div class="flex items-center gap-6px">
              <!-- 连接线 -->
              <div class="w-24px h-1px bg-green-300"></div>
              <!-- 且标签 -->
              <div class="px-12px py-4px bg-green-100 border-2 border-green-300 rounded-full">
                <span class="text-12px font-600 text-green-600">且</span>
              </div>
              <!-- 连接线 -->
              <div class="w-24px h-1px bg-green-300"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="py-40px text-center">
        <el-empty description="暂无条件配置" :image-size="80">
          <template #description>
            <div class="space-y-8px">
              <p class="text-[var(--el-text-color-secondary)]">暂无条件配置</p>
              <p class="text-12px text-[var(--el-text-color-placeholder)]">
                条件组需要至少包含一个条件才能生效
              </p>
            </div>
          </template>
        </el-empty>
      </div>

      <!-- 添加条件按钮 -->
      <div
        v-if="
          group.conditions && group.conditions.length > 0 && group.conditions.length < maxConditions
        "
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
  ConditionGroupFormData,
  ConditionFormData,
  IotRuleSceneTriggerTypeEnum
} from '@/api/iot/rule/scene/scene.types'

/** 条件组配置组件 */
defineOptions({ name: 'ConditionGroupConfig' })

interface Props {
  modelValue: ConditionGroupFormData
  triggerType: number
  productId?: number
  deviceId?: number
  maxConditions?: number
}

interface Emits {
  (e: 'update:modelValue', value: ConditionGroupFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const group = useVModel(props, 'modelValue', emit)

// 配置常量
const maxConditions = computed(() => props.maxConditions || 3)

// 验证状态
const conditionValidations = ref<{ [key: number]: { valid: boolean; message: string } }>({})
const validationMessage = ref('')
const isValid = ref(true)

// 条件类型映射
const conditionTypeNames = {
  [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST]: '属性条件',
  [IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST]: '事件条件',
  [IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE]: '服务条件'
}

// 工具函数
const getConditionTypeName = (type: number) => {
  return conditionTypeNames[type] || '未知条件'
}

// 事件处理
const updateCondition = (index: number, condition: ConditionFormData) => {
  if (group.value.conditions) {
    group.value.conditions[index] = condition
  }
}

const addCondition = () => {
  if (!group.value.conditions) {
    group.value.conditions = []
  }

  if (group.value.conditions.length >= maxConditions.value) {
    return
  }

  const newCondition: ConditionFormData = {
    type: 2, // 默认为设备属性条件
    productId: props.productId || 0,
    deviceId: props.deviceId || 0,
    identifier: '',
    operator: '=',
    param: ''
  }

  group.value.conditions.push(newCondition)
}

const removeCondition = (index: number) => {
  if (group.value.conditions) {
    group.value.conditions.splice(index, 1)
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

const handleConditionValidate = (index: number, result: { valid: boolean; message: string }) => {
  conditionValidations.value[index] = result
  updateValidationResult()
}

const updateValidationResult = () => {
  if (!group.value.conditions || group.value.conditions.length === 0) {
    isValid.value = false
    validationMessage.value = '请至少添加一个条件'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  const validations = Object.values(conditionValidations.value)
  const allValid = validations.every((v) => v.valid)

  if (allValid) {
    isValid.value = true
    validationMessage.value = '条件组配置验证通过'
  } else {
    isValid.value = false
    const errorMessages = validations.filter((v) => !v.valid).map((v) => v.message)
    validationMessage.value = `条件配置错误: ${errorMessages.join('; ')}`
  }

  emit('validate', { valid: isValid.value, message: validationMessage.value })
}

// 监听条件数量变化
watch(
  () => group.value.conditions?.length,
  () => {
    updateValidationResult()
  }
)

// 初始化
onMounted(() => {
  if (!group.value.conditions || group.value.conditions.length === 0) {
    addCondition()
  }
})
</script>
