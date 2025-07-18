<!-- 触发器类型选择组件 -->
<template>
  <div class="trigger-type-selector">
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
          <div class="trigger-option">
            <div class="option-content">
              <!-- TODO @puhui999：貌似没对齐？ -->
              <Icon :icon="option.icon" class="option-icon" />
              <div class="option-info">
                <div class="option-label">{{ option.label }}</div>
                <div class="option-desc">{{ option.description }}</div>
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
    <div v-if="selectedOption" class="type-description">
      <div class="desc-header">
        <Icon :icon="selectedOption.icon" class="desc-icon" />
        <span class="desc-title">{{ selectedOption.label }}</span>
      </div>
      <div class="desc-content">
        <p class="desc-text">{{ selectedOption.description }}</p>
        <div class="desc-features">
          <div v-for="feature in selectedOption.features" :key="feature" class="feature-item">
            <Icon icon="ep:check" class="feature-icon" />
            <span class="feature-text">{{ feature }}</span>
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
/** TODO @puhui999：unocss 哈 */
.trigger-type-selector {
  width: 100%;
}

.trigger-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.option-icon {
  font-size: 18px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.option-info {
  flex: 1;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.type-description {
  margin-top: 16px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.desc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.desc-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.desc-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.desc-content {
  margin-left: 28px;
}

.desc-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.desc-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.feature-icon {
  font-size: 12px;
  color: var(--el-color-success);
  flex-shrink: 0;
}

.feature-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
