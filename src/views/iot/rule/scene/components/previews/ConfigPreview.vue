<!-- 配置预览组件 -->
<template>
  <div class="config-preview">
    <div class="preview-items">
      <div class="preview-item">
        <span class="item-label">场景名称：</span>
        <span class="item-value">{{ formData.name || '未设置' }}</span>
      </div>
      <div class="preview-item">
        <span class="item-label">场景状态：</span>
        <el-tag :type="formData.status === 0 ? 'success' : 'danger'" size="small">
          {{ formData.status === 0 ? '启用' : '禁用' }}
        </el-tag>
      </div>
      <div v-if="formData.description" class="preview-item">
        <span class="item-label">场景描述：</span>
        <span class="item-value">{{ formData.description }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RuleSceneFormData } from '@/api/iot/rule/scene/scene.types'

/** 配置预览组件 */
defineOptions({ name: 'ConfigPreview' })

interface Props {
  formData: RuleSceneFormData
}

defineProps<Props>()
</script>

<style scoped>
.config-preview {
  width: 100%;
}

.preview-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
  flex-shrink: 0;
}

.item-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  flex: 1;
}
</style>
