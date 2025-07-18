<!-- 预览区域组件 -->
<!-- TODO @puhui999：是不是不用这个哈？ -->
<template>
  <el-card class="preview-section" shadow="never">
    <template #header>
      <div class="section-header">
        <div class="header-left">
          <Icon icon="ep:view" class="section-icon" />
          <span class="section-title">配置预览</span>
        </div>
        <div class="header-right">
          <el-button type="primary" size="small" @click="handleValidate" :loading="validating">
            <Icon icon="ep:check" />
            验证配置
          </el-button>
        </div>
      </div>
    </template>

    <div class="section-content">
      <!-- 基础信息预览 -->
      <div class="preview-group">
        <div class="group-header">
          <Icon icon="ep:info-filled" class="group-icon" />
          <span class="group-title">基础信息</span>
        </div>
        <div class="group-content">
          <ConfigPreview :form-data="formData" />
        </div>
      </div>

      <!-- 触发器预览 -->
      <div class="preview-group">
        <div class="group-header">
          <Icon icon="ep:lightning" class="group-icon" />
          <span class="group-title">触发器配置</span>
          <el-tag size="small" type="primary">{{ formData.triggers.length }}</el-tag>
        </div>
        <div class="group-content">
          <TriggerPreview :triggers="formData.triggers" />
        </div>
      </div>

      <!-- 执行器预览 -->
      <div class="preview-group">
        <div class="group-header">
          <Icon icon="ep:setting" class="group-icon" />
          <span class="group-title">执行器配置</span>
          <el-tag size="small" type="success">{{ formData.actions.length }}</el-tag>
        </div>
        <div class="group-content">
          <ActionPreview :actions="formData.actions" />
        </div>
      </div>

      <!-- 验证结果 -->
      <div class="preview-group">
        <div class="group-header">
          <Icon icon="ep:circle-check" class="group-icon" />
          <span class="group-title">验证结果</span>
        </div>
        <div class="group-content">
          <ValidationResult :validation-result="validationResult" />
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import ConfigPreview from '../previews/ConfigPreview.vue'
import TriggerPreview from '../previews/TriggerPreview.vue'
import ActionPreview from '../previews/ActionPreview.vue'
import ValidationResult from '../previews/ValidationResult.vue'
import { RuleSceneFormData } from '@/api/iot/rule/scene/scene.types'

/** 预览区域组件 */
defineOptions({ name: 'PreviewSection' })

interface Props {
  formData: RuleSceneFormData
  validationResult?: { valid: boolean; message?: string } | null
}

interface Emits {
  (e: 'validate'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const validating = ref(false)

// 事件处理
const handleValidate = async () => {
  validating.value = true
  try {
    // 延迟一下模拟验证过程
    await new Promise((resolve) => setTimeout(resolve, 500))
    emit('validate')
  } finally {
    validating.value = false
  }
}
</script>

<style scoped>
.preview-section {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-group {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.group-icon {
  color: var(--el-color-primary);
  font-size: 16px;
}

.group-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.group-content {
  padding: 16px;
}
</style>
