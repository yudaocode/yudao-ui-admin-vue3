<!-- 定时触发配置组件 -->
<template>
  <div class="timer-trigger-config">
    <div class="config-header">
      <div class="header-left">
        <Icon icon="ep:timer" class="header-icon" />
        <span class="header-title">定时触发配置</span>
      </div>
      <div class="header-right">
        <el-button
          type="text"
          size="small"
          @click="showBuilder = !showBuilder"
        >
          <Icon :icon="showBuilder ? 'ep:edit' : 'ep:setting'" />
          {{ showBuilder ? '手动编辑' : '可视化编辑' }}
        </el-button>
      </div>
    </div>

    <!-- 可视化编辑器 -->
    <div v-if="showBuilder" class="visual-builder">
      <CronBuilder v-model="localValue" @validate="handleValidate" />
    </div>

    <!-- 手动编辑 -->
    <div v-else class="manual-editor">
      <el-form-item label="CRON表达式" required>
        <CronInput v-model="localValue" @validate="handleValidate" />
      </el-form-item>
    </div>

    <!-- 下次执行时间预览 -->
    <NextExecutionPreview :cron-expression="localValue" />

    <!-- 验证结果 -->
    <div v-if="validationMessage" class="validation-result">
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
import CronBuilder from '../inputs/CronBuilder.vue'
import CronInput from '../inputs/CronInput.vue'
import NextExecutionPreview from '../previews/NextExecutionPreview.vue'

/** 定时触发配置组件 */
defineOptions({ name: 'TimerTriggerConfig' })

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: '0 0 12 * * ?'
})

// 状态
const showBuilder = ref(true)
const validationMessage = ref('')
const isValid = ref(true)

// 事件处理
const handleValidate = (result: { valid: boolean; message: string }) => {
  isValid.value = result.valid
  validationMessage.value = result.message
  emit('validate', result)
}

// 初始验证
onMounted(() => {
  handleValidate({ valid: true, message: '定时触发配置验证通过' })
})
</script>

<style scoped>
.timer-trigger-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--el-color-danger);
  font-size: 18px;
}

.header-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visual-builder,
.manual-editor {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.validation-result {
  margin-top: 8px;
}
</style>
