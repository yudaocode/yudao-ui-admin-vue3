<!-- 配置预览组件 -->
<!-- TODO @puhui999：应该暂时不用预览哈 -->
<template>
  <div class="w-full">
    <div class="space-y-8px">
      <div class="flex items-start gap-8px">
        <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">场景名称：</span>
        <span class="text-12px text-[var(--el-text-color-primary)] flex-1">{{ formData.name || '未设置' }}</span>
      </div>
      <div class="flex items-start gap-8px">
        <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">场景状态：</span>
        <el-tag :type="formData.status === 0 ? 'success' : 'danger'" size="small">
          {{ formData.status === 0 ? '启用' : '禁用' }}
        </el-tag>
      </div>
      <div v-if="formData.description" class="flex items-start gap-8px">
        <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">场景描述：</span>
        <span class="text-12px text-[var(--el-text-color-primary)] flex-1">{{ formData.description }}</span>
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


