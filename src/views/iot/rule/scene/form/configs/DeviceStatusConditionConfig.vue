<!-- 设备状态条件配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <div
      class="flex items-center gap-8px p-12px px-16px bg-blue-50 rounded-6px border border-blue-200"
    >
      <Icon icon="ep:connection" class="text-blue-500 text-18px" />
      <span class="text-14px font-500 text-blue-700">设备状态条件配置</span>
    </div>

    <!-- 产品设备选择 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="产品" required>
          <ProductSelector
            :model-value="condition.productId"
            @update:model-value="(value) => updateConditionField('productId', value)"
            @change="handleProductChange"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="设备" required>
          <DeviceSelector
            :model-value="condition.deviceId"
            @update:model-value="(value) => updateConditionField('deviceId', value)"
            :product-id="condition.productId"
            @change="handleDeviceChange"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 状态和操作符选择 -->
    <el-row :gutter="16">
      <!-- 状态选择 -->
      <el-col :span="12">
        <el-form-item label="设备状态" required>
          <el-select
            :model-value="condition.param"
            @update:model-value="(value) => updateConditionField('param', value)"
            placeholder="请选择设备状态"
            class="w-full"
          >
            <el-option
              v-for="option in deviceStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div class="flex items-center gap-8px">
                <Icon :icon="option.icon" :class="option.iconClass" />
                <span>{{ option.label }}</span>
                <el-tag :type="option.tag" size="small">{{ option.description }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>

      <!-- 操作符选择 -->
      <el-col :span="12">
        <el-form-item label="操作符" required>
          <el-select
            :model-value="condition.operator"
            @update:model-value="(value) => updateConditionField('operator', value)"
            placeholder="请选择操作符"
            class="w-full"
          >
            <el-option
              v-for="option in statusOperatorOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div class="flex items-center justify-between w-full">
                <span>{{ option.label }}</span>
                <span class="text-12px text-[var(--el-text-color-secondary)]">{{
                  option.description
                }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 条件预览 -->
    <div
      v-if="conditionPreview"
      class="p-12px bg-[var(--el-fill-color-light)] rounded-6px border border-[var(--el-border-color-lighter)]"
    >
      <div class="flex items-center gap-8px mb-8px">
        <Icon icon="ep:view" class="text-[var(--el-color-info)] text-16px" />
        <span class="text-14px font-500 text-[var(--el-text-color-primary)]">条件预览</span>
      </div>
      <div class="pl-24px">
        <code
          class="text-12px text-[var(--el-color-primary)] bg-[var(--el-fill-color-blank)] p-8px rounded-4px font-mono"
          >{{ conditionPreview }}</code
        >
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
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import { ConditionFormData } from '@/api/iot/rule/scene/scene.types'

/** 设备状态条件配置组件 */
defineOptions({ name: 'DeviceStatusConditionConfig' })

interface Props {
  modelValue: ConditionFormData
}

interface Emits {
  (e: 'update:modelValue', value: ConditionFormData): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const condition = useVModel(props, 'modelValue', emit)

// 设备状态选项
const deviceStatusOptions = [
  {
    value: 'online',
    label: '在线',
    description: '设备已连接',
    icon: 'ep:circle-check',
    iconClass: 'text-green-500',
    tag: 'success'
  },
  {
    value: 'offline',
    label: '离线',
    description: '设备已断开',
    icon: 'ep:circle-close',
    iconClass: 'text-red-500',
    tag: 'danger'
  }
]

// 状态操作符选项
const statusOperatorOptions = [
  {
    value: '=',
    label: '等于',
    description: '状态完全匹配时触发'
  },
  {
    value: '!=',
    label: '不等于',
    description: '状态不匹配时触发'
  }
]

// 状态
const validationMessage = ref('')
const isValid = ref(true)

// 计算属性
const conditionPreview = computed(() => {
  if (!condition.value.param || !condition.value.operator) {
    return ''
  }

  const statusLabel =
    deviceStatusOptions.find((opt) => opt.value === condition.value.param)?.label ||
    condition.value.param
  const operatorLabel =
    statusOperatorOptions.find((opt) => opt.value === condition.value.operator)?.label ||
    condition.value.operator

  return `设备状态 ${operatorLabel} ${statusLabel}`
})

// 事件处理
const updateConditionField = (field: keyof ConditionFormData, value: any) => {
  condition.value[field] = value
  updateValidationResult()
}

const handleProductChange = (productId: number) => {
  // 产品变化时清空设备
  condition.value.deviceId = undefined
  updateValidationResult()
}

const handleDeviceChange = (deviceId: number) => {
  // 设备变化时可以进行其他处理
  updateValidationResult()
}

const updateValidationResult = () => {
  if (!condition.value.productId) {
    isValid.value = false
    validationMessage.value = '请选择产品'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  if (!condition.value.deviceId) {
    isValid.value = false
    validationMessage.value = '请选择设备'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  if (!condition.value.param) {
    isValid.value = false
    validationMessage.value = '请选择设备状态'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  if (!condition.value.operator) {
    isValid.value = false
    validationMessage.value = '请选择操作符'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  isValid.value = true
  validationMessage.value = '设备状态条件配置验证通过'
  emit('validate', { valid: true, message: validationMessage.value })
}

// 监听变化
watch(
  () => [
    condition.value.productId,
    condition.value.deviceId,
    condition.value.param,
    condition.value.operator
  ],
  () => {
    updateValidationResult()
  },
  { immediate: true }
)
</script>
