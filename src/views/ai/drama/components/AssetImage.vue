<!-- AI 短剧：资产图片，没有图片时按状态显示占位；项目表单与短剧制作管理共用 -->
<template>
  <el-image
    v-if="url"
    :src="url"
    :preview-src-list="[url]"
    preview-teleported
    fit="cover"
    :style="{ width: size, height: size }"
    class="rounded-6px"
  />
  <div
    v-else
    :style="{ width: size, height: size }"
    class="flex flex-col items-center justify-center gap-4px rounded-6px bg-[var(--el-fill-color)] text-12px text-[var(--el-text-color-secondary)]"
  >
    <template v-if="isAiDramaRunning(status)">
      <Icon icon="ep:loading" class="is-loading" :size="18" />
      <span>生成中</span>
    </template>
    <el-tooltip
      v-else-if="status === AiDramaStatusEnum.FAIL"
      :content="errorMessage || '生成失败'"
      placement="top"
    >
      <span class="text-[var(--el-color-danger)]">生成失败</span>
    </el-tooltip>
    <template v-else>
      <Icon icon="ep:picture" :size="18" />
      <span>未出图</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { AiDramaStatusEnum, isAiDramaRunning } from '@/views/ai/utils/constants'

/** AI 短剧：资产图片 */
defineOptions({ name: 'AiDramaAssetImage' })

withDefaults(
  defineProps<{ url?: string; status?: number; errorMessage?: string; size?: string }>(),
  {
    size: '96px'
  }
)
</script>
