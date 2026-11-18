<!-- AI 短剧：成片条，默认收起；展开后左侧播放成片（待重新合成时为上次成片），右侧为合成设置 -->
<template>
  <ContentWrap>
    <div class="flex flex-wrap items-center gap-8px">
      <span class="text-16px font-500">{{ previous ? '上次成片' : '成片' }}</span>
      <el-tooltip
        v-if="stale"
        :content="project.composeStaleReason || '合成使用的镜头已变化'"
        placement="top"
      >
        <el-tag type="warning">待重新合成</el-tag>
      </el-tooltip>
      <dict-tag
        v-else-if="project.composeStatus"
        :type="DICT_TYPE.AI_DRAMA_STATUS"
        :value="project.composeStatus"
      />
      <el-progress
        v-if="isAiDramaRunning(project.composeStatus)"
        :percentage="project.composeProgress || 0"
        class="!w-160px"
      />
      <span class="text-12px text-[var(--el-text-color-secondary)]">{{ summary }}</span>
      <div class="flex-1"></div>
      <el-tag v-if="hasFile && project.publicStatus" type="success">已公开</el-tag>
      <el-button v-if="hasFile" link type="primary" @click="handleDownload">下载</el-button>
      <el-button v-if="!expanded" type="primary" :disabled="successCount < 2" @click="toggle">
        {{ project.composeStatus ? '重新合成' : '合成成片' }}
      </el-button>
      <el-button link type="primary" @click="toggle">
        {{ expanded ? '收起' : '展开' }}
        <Icon :icon="expanded ? 'ep:arrow-up' : 'ep:arrow-down'" class="ml-2px" />
      </el-button>
    </div>
    <div
      v-if="project.composeStatus === AiDramaStatusEnum.FAIL"
      class="mt-6px break-all text-12px text-[var(--el-color-danger)]"
    >
      {{ project.composeErrorMessage || '合成失败' }}
    </div>
    <div
      v-if="!expanded && successCount < 2"
      class="mt-6px text-12px text-[var(--el-text-color-secondary)]"
    >
      至少需要 2 个视频已完成的镜头才能合成
    </div>
    <el-row v-if="expanded" :gutter="16" class="mt-12px">
      <el-col :span="10">
        <video
          v-if="hasFile"
          :key="project.composeFileUrl"
          :src="project.composeFileUrl"
          controls
          preload="metadata"
          class="max-h-360px w-full rounded-6px bg-black"
        ></video>
        <el-empty v-else description="还没有成片" :image-size="60" />
      </el-col>
      <el-col :span="14">
        <ComposePanel
          ref="panelRef"
          :detail="detail"
          :hint="stale ? '合成输入已变更' : ''"
          @success="emit('refresh')"
          @refresh="emit('refresh')"
        />
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { AiDramaStatusEnum, isAiDramaRunning } from '@/views/ai/utils/constants'
import { formatDramaDuration } from '@/views/ai/utils/drama'
import ComposePanel from './ComposePanel.vue'

/** AI 短剧：成片条 */
defineOptions({ name: 'AiDramaComposeBar' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: [] }>()

const expanded = ref(false)
const panelRef = ref()

const project = computed(() => props.detail.project)
/** 有成片文件：重新合成中、合成失败、待重新合成时，上次的成片仍可播放、下载 */
const hasFile = computed(() => !!project.value.composeFileUrl)
/** 待重新合成：上次合成成功后，实际合成输入已变化 */
const stale = computed(
  () => project.value.composeStatus === AiDramaStatusEnum.SUCCESS && !!project.value.composeStale
)
/** 展示的是上次成片：待重新合成，或重新合成中、失败时仍保留的旧文件 */
const previous = computed(
  () => hasFile.value && (stale.value || project.value.composeStatus !== AiDramaStatusEnum.SUCCESS)
)
const successCount = computed(
  () =>
    props.detail.storyboards.filter(
      (item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl
    ).length
)
/** 摘要：时长 · 画幅 · 镜头数 · 完成时间；没有成片时为合成条件 */
const summary = computed(() => {
  if (!hasFile.value) {
    return `视频已完成 ${successCount.value} / ${props.detail.storyboards.length} 镜`
  }
  return [
    project.value.composeDuration ? formatDramaDuration(project.value.composeDuration) : '',
    project.value.composeAspectRatio,
    project.value.composeStoryboardCount ? `${project.value.composeStoryboardCount} 镜` : '',
    project.value.composeFinishTime ? formatDate(project.value.composeFinishTime, 'MM-DD HH:mm') : ''
  ]
    .filter(Boolean)
    .join(' · ')
})

/** 展开、收起：展开时按当前镜头重置合成设置 */
const toggle = async () => {
  expanded.value = !expanded.value
  if (expanded.value) {
    await nextTick()
    panelRef.value?.reset()
  }
}

/** 下载成片 */
const handleDownload = () => {
  window.open(project.value.composeFileUrl, '_blank')
}
</script>
