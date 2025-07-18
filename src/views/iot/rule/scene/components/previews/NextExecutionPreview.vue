<!-- 下次执行时间预览组件 -->
<template>
  <div class="next-execution-preview">
    <div class="preview-header">
      <Icon icon="ep:timer" class="preview-icon" />
      <span class="preview-title">执行时间预览</span>
    </div>
    
    <div v-if="isValidCron" class="preview-content">
      <div class="current-expression">
        <span class="expression-label">CRON表达式：</span>
        <code class="expression-code">{{ cronExpression }}</code>
      </div>
      
      <div class="description">
        <span class="description-label">执行规律：</span>
        <span class="description-text">{{ cronDescription }}</span>
      </div>
      
      <div class="next-times">
        <span class="times-label">接下来5次执行时间：</span>
        <div class="times-list">
          <div
            v-for="(time, index) in nextExecutionTimes"
            :key="index"
            class="time-item"
          >
            <Icon icon="ep:clock" class="time-icon" />
            <span class="time-text">{{ time }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="preview-error">
      <el-alert
        title="CRON表达式无效"
        description="请检查CRON表达式格式是否正确"
        type="error"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { validateCronExpression } from '../../utils/validation'

/** 下次执行时间预览组件 */
defineOptions({ name: 'NextExecutionPreview' })

interface Props {
  cronExpression?: string
}

const props = defineProps<Props>()

// 计算属性
const isValidCron = computed(() => {
  return props.cronExpression ? validateCronExpression(props.cronExpression) : false
})

const cronDescription = computed(() => {
  if (!isValidCron.value) return ''
  
  // 简单的CRON描述生成
  const parts = props.cronExpression?.split(' ') || []
  if (parts.length < 6) return '无法解析'
  
  const [second, minute, hour, day, month, week] = parts
  
  // 生成描述
  let description = ''
  
  if (second === '0' && minute === '0' && hour === '12' && day === '*' && month === '*' && week === '?') {
    description = '每天中午12点执行'
  } else if (second === '0' && minute === '*' && hour === '*' && day === '*' && month === '*' && week === '?') {
    description = '每分钟执行一次'
  } else if (second === '0' && minute === '0' && hour === '*' && day === '*' && month === '*' && week === '?') {
    description = '每小时执行一次'
  } else {
    description = '按自定义时间规律执行'
  }
  
  return description
})

const nextExecutionTimes = computed(() => {
  if (!isValidCron.value) return []
  
  // 模拟生成下次执行时间
  const now = new Date()
  const times = []
  
  for (let i = 1; i <= 5; i++) {
    // 这里应该使用真实的CRON解析库来计算
    // 暂时生成模拟时间
    const nextTime = new Date(now.getTime() + i * 60 * 60 * 1000)
    times.push(nextTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }))
  }
  
  return times
})
</script>

<style scoped>
.next-execution-preview {
  margin-top: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.preview-icon {
  color: var(--el-color-primary);
  font-size: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.preview-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-expression {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expression-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.expression-code {
  font-family: 'Courier New', monospace;
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
}

.description {
  display: flex;
  align-items: center;
  gap: 8px;
}

.description-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.description-text {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.next-times {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.times-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.times-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  color: var(--el-color-success);
  font-size: 12px;
}

.time-text {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-family: 'Courier New', monospace;
}

.preview-error {
  padding: 16px;
}
</style>
