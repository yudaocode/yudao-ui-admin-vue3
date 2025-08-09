<!-- 当前时间条件配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <el-row :gutter="16">
      <!-- 时间操作符选择 -->
      <el-col :span="8">
        <el-form-item label="时间条件" required>
          <el-select
            :model-value="condition.operator"
            @update:model-value="(value) => updateConditionField('operator', value)"
            placeholder="请选择时间条件"
            class="w-full"
          >
            <el-option
              v-for="option in timeOperatorOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-8px">
                  <Icon :icon="option.icon" :class="option.iconClass" />
                  <span>{{ option.label }}</span>
                </div>
                <el-tag :type="option.tag as any" size="small">{{ option.category }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>

      <!-- 时间值输入 -->
      <el-col :span="8">
        <el-form-item label="时间值" required>
          <el-time-picker
            v-if="needsTimeInput"
            :model-value="timeValue"
            @update:model-value="handleTimeValueChange"
            placeholder="请选择时间"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            class="w-full"
          />
          <el-date-picker
            v-else-if="needsDateInput"
            :model-value="timeValue"
            @update:model-value="handleTimeValueChange"
            type="datetime"
            placeholder="请选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
          <div v-else class="text-[var(--el-text-color-placeholder)] text-14px">
            无需设置时间值
          </div>
        </el-form-item>
      </el-col>

      <!-- 第二个时间值（范围条件） -->
      <el-col :span="8" v-if="needsSecondTimeInput">
        <el-form-item label="结束时间" required>
          <el-time-picker
            v-if="needsTimeInput"
            :model-value="timeValue2"
            @update:model-value="handleTimeValue2Change"
            placeholder="请选择结束时间"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            class="w-full"
          />
          <el-date-picker
            v-else
            :model-value="timeValue2"
            @update:model-value="handleTimeValue2Change"
            type="datetime"
            placeholder="请选择结束日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { IotRuleSceneTriggerTimeOperatorEnum } from '@/views/iot/utils/constants'
import type { TriggerCondition } from '@/api/iot/rule/scene'

/** 当前时间条件配置组件 */
defineOptions({ name: 'CurrentTimeConditionConfig' })

const props = defineProps<{
  modelValue: TriggerCondition
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerCondition): void
}>()

const condition = useVModel(props, 'modelValue', emit)

// 时间操作符选项
const timeOperatorOptions = [
  {
    value: IotRuleSceneTriggerTimeOperatorEnum.BEFORE_TIME.value,
    label: IotRuleSceneTriggerTimeOperatorEnum.BEFORE_TIME.name,
    icon: 'ep:arrow-left',
    iconClass: 'text-blue-500',
    tag: 'primary',
    category: '时间点'
  },
  {
    value: IotRuleSceneTriggerTimeOperatorEnum.AFTER_TIME.value,
    label: IotRuleSceneTriggerTimeOperatorEnum.AFTER_TIME.name,
    icon: 'ep:arrow-right',
    iconClass: 'text-green-500',
    tag: 'success',
    category: '时间点'
  },
  {
    value: IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value,
    label: IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.name,
    icon: 'ep:sort',
    iconClass: 'text-orange-500',
    tag: 'warning',
    category: '时间段'
  },
  {
    value: IotRuleSceneTriggerTimeOperatorEnum.AT_TIME.value,
    label: IotRuleSceneTriggerTimeOperatorEnum.AT_TIME.name,
    icon: 'ep:position',
    iconClass: 'text-purple-500',
    tag: 'info',
    category: '时间点'
  },
  {
    value: IotRuleSceneTriggerTimeOperatorEnum.TODAY.value,
    label: IotRuleSceneTriggerTimeOperatorEnum.TODAY.name,
    icon: 'ep:calendar',
    iconClass: 'text-red-500',
    tag: 'danger',
    category: '日期'
  }
]

// 计算属性：是否需要时间输入
const needsTimeInput = computed(() => {
  const timeOnlyOperators = [
    IotRuleSceneTriggerTimeOperatorEnum.BEFORE_TIME.value,
    IotRuleSceneTriggerTimeOperatorEnum.AFTER_TIME.value,
    IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value,
    IotRuleSceneTriggerTimeOperatorEnum.AT_TIME.value
  ]
  return timeOnlyOperators.includes(condition.value.operator as any)
})

// 计算属性：是否需要日期输入
const needsDateInput = computed(() => {
  return false // 暂时不支持日期输入，只支持时间
})

// 计算属性：是否需要第二个时间输入
const needsSecondTimeInput = computed(() => {
  return condition.value.operator === IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value
})

// 计算属性：从 param 中解析时间值
const timeValue = computed(() => {
  if (!condition.value.param) return ''
  const params = condition.value.param.split(',')
  return params[0] || ''
})

// 计算属性：从 param 中解析第二个时间值
const timeValue2 = computed(() => {
  if (!condition.value.param) return ''
  const params = condition.value.param.split(',')
  return params[1] || ''
})

/**
 * 更新条件字段
 * @param field 字段名
 * @param value 字段值
 */
const updateConditionField = (field: any, value: any) => {
  condition.value[field] = value
}

/**
 * 处理第一个时间值变化
 * @param value 时间值
 */
const handleTimeValueChange = (value: string) => {
  const currentParams = condition.value.param ? condition.value.param.split(',') : []
  currentParams[0] = value || ''

  // 如果是范围条件，保留第二个值；否则只保留第一个值
  if (needsSecondTimeInput.value) {
    condition.value.param = currentParams.slice(0, 2).join(',')
  } else {
    condition.value.param = currentParams[0]
  }
}

/**
 * 处理第二个时间值变化
 * @param value 时间值
 */
const handleTimeValue2Change = (value: string) => {
  const currentParams = condition.value.param ? condition.value.param.split(',') : ['']
  currentParams[1] = value || ''
  condition.value.param = currentParams.slice(0, 2).join(',')
}

/** 监听操作符变化，清理不相关的时间值 */
watch(
  () => condition.value.operator,
  (newOperator) => {
    if (newOperator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
      // 今日条件不需要时间参数
      condition.value.param = ''
    } else if (!needsSecondTimeInput.value) {
      // 非范围条件只保留第一个时间值
      const currentParams = condition.value.param ? condition.value.param.split(',') : []
      condition.value.param = currentParams[0] || ''
    }
  }
)
</script>
