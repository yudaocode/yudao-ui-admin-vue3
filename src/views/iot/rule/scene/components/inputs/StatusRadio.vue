<!-- 场景状态选择组件 -->
<template>
  <div class="status-radio">
    <el-radio-group 
      v-model="localValue" 
      @change="handleChange"
    >
      <el-radio :value="0" class="status-option">
        <div class="status-content">
          <div class="status-indicator enabled"></div>
          <div class="status-info">
            <div class="status-label">启用</div>
            <div class="status-desc">场景规则生效，满足条件时自动执行</div>
          </div>
        </div>
      </el-radio>
      
      <el-radio :value="1" class="status-option">
        <div class="status-content">
          <div class="status-indicator disabled"></div>
          <div class="status-info">
            <div class="status-label">禁用</div>
            <div class="status-desc">场景规则暂停，不会触发任何执行动作</div>
          </div>
        </div>
      </el-radio>
    </el-radio-group>
    
    <!-- 状态说明 -->
    <div class="status-note">
      <Icon icon="ep:info-filled" class="note-icon" />
      <span class="note-text">
        {{ localValue === 0 ? '启用状态下，规则将实时监控并执行相应动作' : '禁用状态下，规则不会执行任何操作' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 场景状态选择组件 */
defineOptions({ name: 'StatusRadio' })

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

const handleChange = (value: number) => {
  emit('change', value)
}
</script>

<style scoped>
.status-radio {
  width: 100%;
}

.status-radio :deep(.el-radio) {
  margin-bottom: 8px;
}

.status-radio :deep(.el-radio:last-child) {
  margin-bottom: 0;
}

:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

:deep(.el-radio) {
  margin-right: 0;
  width: 100%;
  height: auto;
  align-items: flex-start;
}

.status-option {
  width: 100%;
}

:deep(.el-radio__input) {
  margin-top: 12px;
  flex-shrink: 0;
}

:deep(.el-radio__label) {
  width: 100%;
  padding-left: 8px;
}

.status-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  transition: all 0.2s;
  width: calc(100% - 28px);
  margin-left: 0;
}

:deep(.el-radio.is-checked) .status-content {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.status-content:hover {
  border-color: var(--el-color-primary-light-3);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.status-indicator.enabled {
  background: var(--el-color-success);
  box-shadow: 0 0 0 2px var(--el-color-success-light-8);
}

.status-indicator.disabled {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 2px var(--el-color-danger-light-8);
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.status-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.status-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.note-icon {
  color: var(--el-color-primary);
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.note-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  flex: 1;
}
</style>
