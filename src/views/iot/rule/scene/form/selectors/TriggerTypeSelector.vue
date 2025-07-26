<!-- 触发器类型选择组件 -->
<template>
  <div class="w-full">
    <el-form-item label="触发类型" required>
      <el-select
        v-model="localValue"
        placeholder="请选择触发类型"
        @change="handleChange"
        class="w-full"
      >
        <el-option
          v-for="option in triggerTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        >
          <div class="flex items-center justify-between w-full py-4px">
            <div class="flex items-center gap-12px flex-1">
              <!-- TODO @puhui999：貌似没对齐？ -->
              <Icon :icon="option.icon" class="text-18px text-[var(--el-color-primary)] flex-shrink-0" />
              <div class="flex-1">
                <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">{{ option.label }}</div>
                <div class="text-12px text-[var(--el-text-color-secondary)] leading-relaxed">{{ option.description }}</div>
              </div>
            </div>
            <!-- TODO @puhui999：这个要不去掉？ -->
            <el-tag :type="option.tag" size="small">
              {{ option.category }}
            </el-tag>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <!-- 类型说明 -->
    <!-- TODO @puhui999：这个去掉。感觉没啥内容哈； -->
    <div v-if="selectedOption" class="mt-16px p-16px bg-[var(--el-fill-color-light)] rounded-6px border border-[var(--el-border-color-lighter)]">
      <div class="flex items-center gap-8px mb-12px">
        <Icon :icon="selectedOption.icon" class="text-20px text-[var(--el-color-primary)]" />
        <span class="text-16px font-600 text-[var(--el-text-color-primary)]">{{ selectedOption.label }}</span>
      </div>
      <div class="ml-28px">
        <p class="text-14px text-[var(--el-text-color-regular)] m-0 mb-12px leading-relaxed">{{ selectedOption.description }}</p>
        <div class="flex flex-col gap-6px">
          <div v-for="feature in selectedOption.features" :key="feature" class="flex items-center gap-6px">
            <Icon icon="ep:check" class="text-12px text-[var(--el-color-success)] flex-shrink-0" />
            <span class="text-12px text-[var(--el-text-color-secondary)]">{{ feature }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { IotRuleSceneTriggerTypeEnum } from '@/api/iot/rule/scene/scene.types'

/** 触发器类型选择组件 */
defineOptions({ name: 'TriggerTypeSelector' })

interface Props {
  modelValue: number
}

interface Emits {
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// 触发器类型选项
const triggerTypeOptions = [
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE,
    label: '设备状态变更',
    description: '当设备上线、离线状态发生变化时触发',
    icon: 'ep:connection',
    tag: 'warning',
    category: '设备状态',
    features: ['监控设备连接状态', '实时响应设备变化', '无需配置额外条件']
  },
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
    label: '设备属性上报',
    description: '当设备属性值满足指定条件时触发',
    icon: 'ep:data-line',
    tag: 'primary',
    category: '数据监控',
    features: ['监控设备属性变化', '支持多种比较条件', '可配置阈值范围']
  },
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST,
    label: '设备事件上报',
    description: '当设备上报特定事件时触发',
    icon: 'ep:bell',
    tag: 'success',
    category: '事件监控',
    features: ['监控设备事件', '支持事件参数过滤', '实时事件响应']
  },
  {
    value: IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE,
    label: '设备服务调用',
    description: '当设备服务被调用时触发',
    icon: 'ep:service',
    tag: 'info',
    category: '服务监控',
    features: ['监控服务调用', '支持参数条件', '服务执行跟踪']
  },
  {
    value: IotRuleSceneTriggerTypeEnum.TIMER,
    label: '定时触发',
    description: '按照设定的时间计划定时触发',
    icon: 'ep:timer',
    tag: 'danger',
    category: '定时任务',
    features: ['支持CRON表达式', '灵活的时间配置', '可视化时间设置']
  }
]

// 计算属性
const selectedOption = computed(() => {
  return triggerTypeOptions.find((option) => option.value === localValue.value)
})

// 事件处理
const handleChange = (value: number) => {
  emit('change', value)
}
</script>

<style scoped>
/** TODO @puhui999：unocss 哈 - 已完成转换 */
:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
