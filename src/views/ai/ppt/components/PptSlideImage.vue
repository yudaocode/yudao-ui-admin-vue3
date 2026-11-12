<!-- AI PPT：一页的图。有图显示图（重绘中叠加提示）；没图按状态显示占位 -->
<template>
  <div class="relative aspect-video w-full overflow-hidden bg-[var(--el-fill-color-light)]">
    <template v-if="slide.imageUrl">
      <el-image
        :src="slide.imageUrl"
        fit="contain"
        class="h-full w-full"
        :preview-src-list="preview && slide.imageUrl ? [slide.imageUrl] : undefined"
        preview-teleported
      />
      <div
        v-if="slideRunning"
        class="absolute inset-0 flex items-center justify-center bg-black/40 text-12px text-white"
      >
        本页重绘中…
      </div>
    </template>
    <div
      v-else
      class="h-full w-full flex items-center justify-center gap-4px text-12px text-[var(--el-text-color-secondary)]"
    >
      <Icon
        v-if="slideRunning"
        icon="ep:loading"
        class="is-loading text-[var(--el-color-primary)]"
      />
      {{ slideRunning ? '生成中…' : running ? '待生成' : '本页未生成配图' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { PptSlideVO } from '@/api/ai/ppt'
import { AiPptStatusEnum } from '@/views/ai/utils/constants'

/** AI PPT：一页的图 */
defineOptions({ name: 'AiPptSlideImage' })

const props = withDefaults(
  defineProps<{
    slide: PptSlideVO
    running?: boolean // 任务是否生成中
    preview?: boolean // 是否可点击放大
  }>(),
  { running: false, preview: false }
)

/** 本页是否在生成：任务结束后（例如超时），本页残留的生成中不再显示 */
const slideRunning = computed(
  () => props.running && props.slide.status === AiPptStatusEnum.IN_PROGRESS
)
</script>
