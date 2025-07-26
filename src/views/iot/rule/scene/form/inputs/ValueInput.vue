<!-- 值输入组件 -->
<!-- TODO @yunai：这个需要在看看。。。 -->
<template>
  <div class="value-input">
    <!-- 布尔值选择 -->
    <el-select
      v-if="propertyType === 'bool'"
      v-model="localValue"
      placeholder="请选择布尔值"
      @change="handleChange"
      class="w-full"
    >
      <el-option label="真 (true)" value="true" />
      <el-option label="假 (false)" value="false" />
    </el-select>

    <!-- 枚举值选择 -->
    <el-select
      v-else-if="propertyType === 'enum' && enumOptions.length > 0"
      v-model="localValue"
      placeholder="请选择枚举值"
      @change="handleChange"
      class="w-full"
    >
      <el-option
        v-for="option in enumOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <!-- 范围输入 (between 操作符) -->
    <div v-else-if="operator === 'between'" class="range-input">
      <el-input
        v-model="rangeStart"
        :type="getInputType()"
        placeholder="最小值"
        @input="handleRangeChange"
        class="range-start"
      />
      <span class="range-separator">至</span>
      <el-input
        v-model="rangeEnd"
        :type="getInputType()"
        placeholder="最大值"
        @input="handleRangeChange"
        class="range-end"
      />
    </div>

    <!-- 列表输入 (in 操作符) -->
    <div v-else-if="operator === 'in'" class="list-input">
      <el-input
        v-model="localValue"
        placeholder="请输入值列表，用逗号分隔"
        @input="handleChange"
        class="w-full"
      >
        <template #suffix>
          <el-tooltip content="多个值用逗号分隔，如：1,2,3" placement="top">
            <Icon icon="ep:question-filled" class="input-tip" />
          </el-tooltip>
        </template>
      </el-input>
      <div v-if="listPreview.length > 0" class="list-preview">
        <span class="preview-label">解析结果：</span>
        <el-tag v-for="(item, index) in listPreview" :key="index" size="small" class="preview-tag">
          {{ item }}
        </el-tag>
      </div>
    </div>

    <!-- 日期时间输入 -->
    <el-date-picker
      v-else-if="propertyType === 'date'"
      v-model="dateValue"
      type="datetime"
      placeholder="请选择日期时间"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
      @change="handleDateChange"
      class="w-full"
    />

    <!-- 数字输入 -->
    <el-input-number
      v-else-if="isNumericType()"
      v-model="numberValue"
      :precision="getPrecision()"
      :step="getStep()"
      :min="getMin()"
      :max="getMax()"
      placeholder="请输入数值"
      @change="handleNumberChange"
      class="w-full"
    />

    <!-- 文本输入 -->
    <el-input
      v-else
      v-model="localValue"
      :type="getInputType()"
      :placeholder="getPlaceholder()"
      @input="handleChange"
      class="w-full"
    >
      <template #suffix>
        <el-tooltip
          v-if="propertyConfig?.unit"
          :content="`单位：${propertyConfig.unit}`"
          placement="top"
        >
          <span class="input-unit">{{ propertyConfig.unit }}</span>
        </el-tooltip>
      </template>
    </el-input>

    <!-- 验证提示 -->
    <div v-if="validationMessage" class="validation-message">
      <el-text :type="isValid ? 'success' : 'danger'" size="small">
        <Icon :icon="isValid ? 'ep:check' : 'ep:warning-filled'" />
        {{ validationMessage }}
      </el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 值输入组件 */
defineOptions({ name: 'ValueInput' })

interface Props {
  modelValue?: string
  propertyType?: string
  operator?: string
  propertyConfig?: any
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: ''
})

// 状态
const rangeStart = ref('')
const rangeEnd = ref('')
const dateValue = ref('')
const numberValue = ref<number>()
const validationMessage = ref('')
const isValid = ref(true)

// 计算属性
const enumOptions = computed(() => {
  if (props.propertyConfig?.enum) {
    return props.propertyConfig.enum.map((item: any) => ({
      label: item.name || item.label || item.value,
      value: item.value
    }))
  }
  return []
})

const listPreview = computed(() => {
  if (props.operator === 'in' && localValue.value) {
    return localValue.value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item)
  }
  return []
})

// 工具函数
const isNumericType = () => {
  return ['int', 'float', 'double'].includes(props.propertyType || '')
}

const getInputType = () => {
  switch (props.propertyType) {
    case 'int':
    case 'float':
    case 'double':
      return 'number'
    default:
      return 'text'
  }
}

const getPlaceholder = () => {
  const typeMap = {
    string: '请输入字符串',
    int: '请输入整数',
    float: '请输入浮点数',
    double: '请输入双精度数',
    struct: '请输入JSON格式数据',
    array: '请输入数组格式数据'
  }
  return typeMap[props.propertyType || ''] || '请输入值'
}

const getPrecision = () => {
  return props.propertyType === 'int' ? 0 : 2
}

const getStep = () => {
  return props.propertyType === 'int' ? 1 : 0.1
}

const getMin = () => {
  return props.propertyConfig?.min || undefined
}

const getMax = () => {
  return props.propertyConfig?.max || undefined
}

// 事件处理
const handleChange = () => {
  validateValue()
}

const handleRangeChange = () => {
  if (rangeStart.value && rangeEnd.value) {
    localValue.value = `${rangeStart.value},${rangeEnd.value}`
  } else {
    localValue.value = ''
  }
  validateValue()
}

const handleDateChange = (value: string) => {
  localValue.value = value || ''
  validateValue()
}

const handleNumberChange = (value: number | undefined) => {
  localValue.value = value?.toString() || ''
  validateValue()
}

// 验证函数
const validateValue = () => {
  if (!localValue.value) {
    isValid.value = false
    validationMessage.value = '请输入值'
    emit('validate', { valid: false, message: validationMessage.value })
    return
  }

  // 数字类型验证
  if (isNumericType()) {
    const num = parseFloat(localValue.value)
    if (isNaN(num)) {
      isValid.value = false
      validationMessage.value = '请输入有效的数字'
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }

    // 范围验证
    const min = getMin()
    const max = getMax()
    if (min !== undefined && num < min) {
      isValid.value = false
      validationMessage.value = `值不能小于 ${min}`
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }
    if (max !== undefined && num > max) {
      isValid.value = false
      validationMessage.value = `值不能大于 ${max}`
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }
  }

  // 范围输入验证
  if (props.operator === 'between') {
    const parts = localValue.value.split(',')
    if (parts.length !== 2) {
      isValid.value = false
      validationMessage.value = '范围格式错误'
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }

    const start = parseFloat(parts[0])
    const end = parseFloat(parts[1])
    if (isNaN(start) || isNaN(end)) {
      isValid.value = false
      validationMessage.value = '范围值必须是数字'
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }

    if (start >= end) {
      isValid.value = false
      validationMessage.value = '起始值必须小于结束值'
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }
  }

  // 列表输入验证
  if (props.operator === 'in') {
    if (listPreview.value.length === 0) {
      isValid.value = false
      validationMessage.value = '请输入至少一个值'
      emit('validate', { valid: false, message: validationMessage.value })
      return
    }
  }

  // 验证通过
  isValid.value = true
  validationMessage.value = '输入值验证通过'
  emit('validate', { valid: true, message: validationMessage.value })
}

// 监听值变化
watch(
  () => localValue.value,
  () => {
    validateValue()
  }
)

// 监听操作符变化
watch(
  () => props.operator,
  () => {
    localValue.value = ''
    rangeStart.value = ''
    rangeEnd.value = ''
    dateValue.value = ''
    numberValue.value = undefined
  }
)

// 初始化
onMounted(() => {
  if (localValue.value) {
    validateValue()
  }
})
</script>

<style scoped>
.value-input {
  width: 100%;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-start,
.range-end {
  flex: 1;
}

.range-separator {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.list-input {
  width: 100%;
}

.input-tip {
  color: var(--el-text-color-placeholder);
  cursor: help;
}

.input-unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 0 4px;
}

.list-preview {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.preview-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.preview-tag {
  margin: 0;
}

.validation-message {
  margin-top: 4px;
}
</style>
