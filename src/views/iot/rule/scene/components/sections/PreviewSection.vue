<!-- 预览区域组件 -->
<!-- TODO @puhui999：是不是不用这个哈？ -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:view" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">配置预览</span>
        </div>
        <div class="flex items-center gap-8px">
          <el-button type="primary" size="small" @click="handleValidate" :loading="validating">
            <Icon icon="ep:check" />
            验证配置
          </el-button>
        </div>
      </div>
    </template>

    <div class="p-0">
      <!-- 基础信息预览 -->
      <div class="mb-20px">
        <div class="flex items-center gap-8px mb-12px">
          <Icon icon="ep:info-filled" class="text-[var(--el-color-info)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">基础信息</span>
        </div>
        <div class="p-12px bg-[var(--el-fill-color-light)] rounded-6px">
          <ConfigPreview :form-data="formData" />
        </div>
      </div>

      <!-- 触发器预览 -->
      <div class="mb-20px">
        <div class="flex items-center gap-8px mb-12px">
          <Icon icon="ep:lightning" class="text-[var(--el-color-warning)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">触发器配置</span>
          <el-tag size="small" type="primary">{{ formData.triggers.length }}</el-tag>
        </div>
        <div class="p-12px bg-[var(--el-fill-color-light)] rounded-6px">
          <TriggerPreview :triggers="formData.triggers" />
        </div>
      </div>

      <!-- 执行器预览 -->
      <div class="mb-20px">
        <div class="flex items-center gap-8px mb-12px">
          <Icon icon="ep:setting" class="text-[var(--el-color-success)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">执行器配置</span>
          <el-tag size="small" type="success">{{ formData.actions.length }}</el-tag>
        </div>
        <div class="p-12px bg-[var(--el-fill-color-light)] rounded-6px">
          <ActionPreview :actions="formData.actions" />
        </div>
      </div>

      <!-- 验证结果 -->
      <div class="mb-20px">
        <div class="flex items-center gap-8px mb-12px">
          <Icon icon="ep:circle-check" class="text-[var(--el-color-primary)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">验证结果</span>
        </div>
        <div class="p-12px bg-[var(--el-fill-color-light)] rounded-6px">
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


