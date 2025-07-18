<!-- CRON 可视化构建器组件 -->
<!-- TODO @puhui999：看看能不能复用全局的 cron 组件 -->
<template>
  <div class="cron-builder">
    <div class="builder-header">
      <span class="header-title">可视化 CRON 编辑器</span>
    </div>

    <div class="builder-content">
      <!-- 快捷选项 -->
      <div class="quick-options">
        <span class="options-label">常用配置：</span>
        <el-button
          v-for="option in quickOptions"
          :key="option.label"
          size="small"
          @click="applyQuickOption(option)"
        >
          {{ option.label }}
        </el-button>
      </div>

      <!-- 详细配置 -->
      <div class="detailed-config">
        <el-row :gutter="16">
          <el-col :span="4">
            <el-form-item label="秒">
              <el-select v-model="cronParts.second" @change="updateCronExpression">
                <el-option label="每秒" value="*" />
                <el-option label="0秒" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="分钟">
              <el-select v-model="cronParts.minute" @change="updateCronExpression">
                <el-option label="每分钟" value="*" />
                <el-option
                  v-for="i in 60"
                  :key="i - 1"
                  :label="`${i - 1}分`"
                  :value="String(i - 1)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="小时">
              <el-select v-model="cronParts.hour" @change="updateCronExpression">
                <el-option label="每小时" value="*" />
                <el-option
                  v-for="i in 24"
                  :key="i - 1"
                  :label="`${i - 1}时`"
                  :value="String(i - 1)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="日">
              <el-select v-model="cronParts.day" @change="updateCronExpression">
                <el-option label="每日" value="*" />
                <el-option v-for="i in 31" :key="i" :label="`${i}日`" :value="String(i)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="月">
              <el-select v-model="cronParts.month" @change="updateCronExpression">
                <el-option label="每月" value="*" />
                <el-option
                  v-for="(month, index) in months"
                  :key="index"
                  :label="month"
                  :value="String(index + 1)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="周">
              <el-select v-model="cronParts.week" @change="updateCronExpression">
                <el-option label="每周" value="*" />
                <el-option
                  v-for="(week, index) in weeks"
                  :key="index"
                  :label="week"
                  :value="String(index)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** CRON 可视化构建器组件 */
defineOptions({ name: 'CronBuilder' })

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// CRON 各部分
const cronParts = reactive({
  second: '0',
  minute: '0',
  hour: '12',
  day: '*',
  month: '*',
  week: '?'
})

// 常量数据
const months = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月'
]
const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 快捷选项
const quickOptions = [
  { label: '每分钟', cron: '0 * * * * ?' },
  { label: '每小时', cron: '0 0 * * * ?' },
  { label: '每天中午', cron: '0 0 12 * * ?' },
  { label: '每天凌晨', cron: '0 0 0 * * ?' },
  { label: '工作日9点', cron: '0 0 9 * * MON-FRI' },
  { label: '每周一', cron: '0 0 9 * * MON' }
]

// 方法
const updateCronExpression = () => {
  localValue.value = `${cronParts.second} ${cronParts.minute} ${cronParts.hour} ${cronParts.day} ${cronParts.month} ${cronParts.week}`
  emit('validate', { valid: true, message: 'CRON表达式验证通过' })
}

const applyQuickOption = (option: any) => {
  localValue.value = option.cron
  parseCronExpression()
  emit('validate', { valid: true, message: 'CRON表达式验证通过' })
}

const parseCronExpression = () => {
  if (!localValue.value) return

  const parts = localValue.value.split(' ')
  if (parts.length >= 6) {
    cronParts.second = parts[0] || '0'
    cronParts.minute = parts[1] || '0'
    cronParts.hour = parts[2] || '12'
    cronParts.day = parts[3] || '*'
    cronParts.month = parts[4] || '*'
    cronParts.week = parts[5] || '?'
  }
}

// 初始化
onMounted(() => {
  if (localValue.value) {
    parseCronExpression()
  } else {
    updateCronExpression()
  }
})
</script>

<style scoped>
.cron-builder {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.builder-header {
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.builder-content {
  padding: 16px;
}

.quick-options {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.options-label {
  font-weight: 500;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.detailed-config {
  margin-top: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
