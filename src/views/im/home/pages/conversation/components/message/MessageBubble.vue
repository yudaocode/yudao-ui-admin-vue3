<template>
  <!-- 文本 -->
  <div
    v-if="isText && textPayload"
    class="relative px-3.5 py-2.5 text-sm leading-normal break-words whitespace-pre-wrap rounded-lg"
    :class="bubbleClass('text')"
  >
    {{ textPayload.content }}
  </div>

  <!-- 图片：el-image 内置预览；上传中半透明遮罩 -->
  <div v-else-if="isImage && imagePayload" class="relative inline-block">
    <el-image
      class="max-w-[220px] rounded cursor-zoom-in"
      :src="imagePayload.thumbnailUrl || imagePayload.url"
      :preview-src-list="isUploading ? [] : [imagePayload.url]"
      :preview-teleported="true"
      fit="contain"
    />
    <div
      v-if="isUploading"
      class="absolute inset-0 flex items-center justify-center text-sm text-white bg-black bg-opacity-45 rounded pointer-events-none"
    >
      {{ uploadProgressText }}
    </div>
  </div>

  <!-- 文件：文件名 + 大小靠左、彩色大图标贴右；上传中插一条进度条 -->
  <div
    v-else-if="isFile && filePayload"
    class="relative flex gap-3 items-center min-w-[260px] max-w-[340px] px-3.5 py-3 border rounded transition-colors"
    :class="[bubbleClass('file'), isUploading ? 'cursor-default' : 'cursor-pointer']"
    @click="handleFileClick"
  >
    <div class="flex-1 min-w-0">
      <div class="overflow-hidden text-sm font-medium truncate text-[var(--el-text-color-primary)]">
        {{ filePayload.name }}
      </div>
      <div class="mt-1 text-12px text-[var(--el-text-color-secondary)]">
        {{ formatFileSize(filePayload.size) }}
      </div>
      <div v-if="isUploading" class="flex gap-2 items-center mt-1.5">
        <div class="overflow-hidden flex-1 h-1 rounded bg-[var(--el-fill-color-dark)]">
          <div
            class="h-full bg-[var(--el-color-primary)] transition-[width] duration-150"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
        <span class="text-11px text-[var(--el-text-color-secondary)] tabular-nums">
          {{ uploadProgressText }}
        </span>
      </div>
    </div>
    <Icon :icon="fileIconInfo.icon" :color="fileIconInfo.color" :size="40" class="flex-shrink-0" />
  </div>

  <!-- 语音 -->
  <div
    v-else-if="isVoice && voicePayload"
    class="relative flex gap-2 items-center min-w-[120px] px-3.5 py-2.5 rounded-lg cursor-pointer"
    :class="bubbleClass('voice')"
    @click="handleVoiceClick"
  >
    <Icon
      icon="ant-design:audio-outlined"
      :size="18"
      class="message-bubble__voice-icon"
      :class="{ 'im-voice-playing': voicePlaying }"
    />
    <span class="text-13px text-[var(--el-text-color-primary)]">
      {{ formatSeconds(voicePayload.duration) }}
    </span>
  </div>

  <!-- 视频：原生 controls 内嵌播放，poster 走后端封面；上传中半透明遮罩 -->
  <div v-else-if="isVideo && videoPayload?.url" class="relative inline-block">
    <video
      class="max-w-[280px] max-h-[320px] rounded bg-black"
      :src="videoPayload.url"
      :poster="videoPayload.coverUrl"
      :controls="!isUploading"
      preload="metadata"
    ></video>
    <div
      v-if="isUploading"
      class="absolute inset-0 flex items-center justify-center text-sm text-white bg-black bg-opacity-45 rounded pointer-events-none"
    >
      {{ uploadProgressText }}
    </div>
  </div>
  <!-- 视频但 payload 解析失败 / 没 url：降级展示 -->
  <div
    v-else-if="isVideo"
    class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--el-text-color-secondary)] bg-[var(--el-fill-color-light)]"
  >
    [视频消息]
  </div>

  <!-- 表情贴图：裸 <img> 不套气泡 -->
  <div v-else-if="isFace && facePayload" class="inline-block">
    <img
      :src="facePayload.url"
      :alt="facePayload.name || '表情'"
      :title="facePayload.name || ''"
      :width="facePayload.width"
      :height="facePayload.height"
      class="block max-w-[160px] max-h-[160px] object-contain"
      draggable="false"
    />
  </div>

  <!-- 名片 -->
  <CardBubble
    v-else-if="isCard && cardPayload"
    :card="cardPayload"
    clickable
    @click="(e: MouseEvent) => emit('click-card', cardPayload!, e)"
  />

  <!-- 合并转发气泡：title + 摘要预览 + 底部「聊天记录」标签 -->
  <div
    v-else-if="isMerge && mergePayload"
    class="flex flex-col w-[260px] rounded-md overflow-hidden cursor-pointer bg-[var(--el-bg-color)] border border-[var(--el-border-color)] hover:border-[#409eff]"
    @click="emit('open-merge', content)"
  >
    <div class="px-3 py-2 text-sm font-medium text-[var(--el-text-color-primary)] truncate">
      {{ mergePayload.title }}
    </div>
    <div class="flex flex-col gap-0.5 px-3 pb-2">
      <div
        v-for="(line, idx) in mergePreviewLines"
        :key="idx"
        class="text-12px text-[var(--el-text-color-secondary)] truncate"
      >
        {{ line }}
      </div>
    </div>
    <div
      class="px-3 py-1 text-12px border-t text-[var(--el-text-color-placeholder)] border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)]"
    >
      聊天记录
    </div>
  </div>
  <!-- 合并消息解析失败兜底 -->
  <div
    v-else-if="isMerge"
    class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--el-text-color-secondary)] bg-[var(--el-fill-color-light)]"
  >
    [聊天记录]
  </div>

  <!-- 未知类型降级 -->
  <div
    v-else
    class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--el-text-color-secondary)] bg-[var(--el-fill-color-light)]"
  >
    [不支持的消息类型]
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { formatFileSize } from '@/utils/file'
import { formatSeconds } from '@/utils/formatTime'

import { ImMessageType, MERGE_FORWARD_PREVIEW_LINES } from '@/views/im/utils/constants'
import {
  parseMessage,
  getFileIconInfo,
  type AudioMessage,
  type CardMessage,
  type FaceMessage,
  type FileMessage,
  type ImageMessage,
  type MergeMessage,
  type TextMessage,
  type VideoMessage
} from '@/views/im/utils/message'
import { summarizeMessageContent } from '@/views/im/utils/conversation'
import CardBubble from '@/views/im/home/components/card/CardBubble.vue'

defineOptions({ name: 'ImMessageBubble' })

const props = defineProps<{
  /** 消息类型，对齐 ImMessageType */
  type: number
  /** 消息 content（JSON 字符串） */
  content: string
  /** 是否自己发送，影响气泡配色（绿底 vs 灰底） */
  selfSend?: boolean
  /** 媒体上传进度（0-100）；非 null 即视为上传中，渲染遮罩 / 进度条 */
  uploadProgress?: number | null
}>()

const emit = defineEmits<{
  /** 名片点击：调用方决定弹卡片 / 跳群等行为 */
  'click-card': [card: CardMessage, e: MouseEvent]
  /** 合并消息气泡点击：调用方决定开 dialog 或栈内 push */
  'open-merge': [content: string]
}>()

/** 各 type 判定 */
const isText = computed(() => props.type === ImMessageType.TEXT)
const isImage = computed(() => props.type === ImMessageType.IMAGE)
const isFile = computed(() => props.type === ImMessageType.FILE)
const isVoice = computed(() => props.type === ImMessageType.VOICE)
const isVideo = computed(() => props.type === ImMessageType.VIDEO)
const isFace = computed(() => props.type === ImMessageType.FACE)
const isCard = computed(() => props.type === ImMessageType.CARD)
const isMerge = computed(() => props.type === ImMessageType.MERGE)

/** 媒体上传中：uploadProgress 非 null 即视为上传中 */
const isUploading = computed(() => props.uploadProgress != null)
const uploadProgress = computed(() => props.uploadProgress ?? 0)
const uploadProgressText = computed(() => `${uploadProgress.value}%`)

/** 各 payload */
const textPayload = computed(() => (isText.value ? parseMessage<TextMessage>(props.content) : null))
const imagePayload = computed(() =>
  isImage.value ? parseMessage<ImageMessage>(props.content) : null
)
const filePayload = computed(() => (isFile.value ? parseMessage<FileMessage>(props.content) : null))
const voicePayload = computed(() =>
  isVoice.value ? parseMessage<AudioMessage>(props.content) : null
)
const videoPayload = computed(() =>
  isVideo.value ? parseMessage<VideoMessage>(props.content) : null
)
const cardPayload = computed(() => (isCard.value ? parseMessage<CardMessage>(props.content) : null))
const mergePayload = computed(() =>
  isMerge.value ? parseMessage<MergeMessage>(props.content) : null
)

/** 合并消息内嵌前 N 条派生「{昵称}：{摘要}」 */
const mergePreviewLines = computed(() => {
  if (!mergePayload.value) {
    return []
  }
  return mergePayload.value.messages
    .slice(0, MERGE_FORWARD_PREVIEW_LINES)
    .map((item) => `${item.senderNickname}：${summarizeMessageContent(item)}`)
})

/** 表情 payload：非法宽高派生成 undefined，让 <img> 走 CSS max-w / max-h 兜底 */
const FACE_DIMENSION_MAX = 2048
const facePayload = computed(() => {
  if (!isFace.value) {
    return null
  }
  const raw = parseMessage<FaceMessage>(props.content)
  if (!raw) {
    return null
  }
  const sanitize = (v: number | undefined) =>
    v && v > 0 && v <= FACE_DIMENSION_MAX ? v : undefined
  return { ...raw, width: sanitize(raw.width), height: sanitize(raw.height) }
})

/** 文件图标 + 配色：按扩展名分发 */
const fileIconInfo = computed(() => getFileIconInfo(filePayload.value?.name))

/** 文本 / 文件 / 语音气泡的整体 class（含 selfSend 配色 + ::before 三角的 side class） */
function bubbleClass(variant: 'text' | 'file' | 'voice'): string[] {
  const isSelf = props.selfSend
  const side = isSelf ? 'message-bubble--self' : 'message-bubble--other'
  switch (variant) {
    case 'text':
      return [
        side,
        isSelf
          ? 'text-black bg-[#95ec69]'
          : 'text-[var(--el-text-color-primary)] bg-[var(--el-fill-color-light)]'
      ]
    case 'file':
      return [
        side,
        isSelf
          ? 'bg-[#95ec69] border-[var(--el-border-color-lighter)]'
          : 'bg-[var(--el-bg-color)] border-[var(--el-border-color-light)] hover:border-[#409eff]'
      ]
    case 'voice':
      return [side, isSelf ? 'bg-[#95ec69]' : 'bg-[var(--el-fill-color-light)]']
  }
}

/** 文件点击 → 新窗口下载；上传中跳过 */
function handleFileClick() {
  if (isUploading.value || !filePayload.value?.url) {
    return
  }
  window.open(filePayload.value.url, '_blank')
}

/** 语音点击 → 简单 Audio() toggle 播放 */
const voicePlaying = ref(false)
let currentAudio: HTMLAudioElement | null = null
function handleVoiceClick() {
  if (!voicePayload.value?.url) {
    return
  }
  if (voicePlaying.value && currentAudio) {
    currentAudio.pause()
    voicePlaying.value = false
    return
  }
  currentAudio = new Audio(voicePayload.value.url)
  voicePlaying.value = true
  currentAudio.addEventListener('ended', () => {
    voicePlaying.value = false
    currentAudio = null
  })
  currentAudio.play().catch(() => {
    voicePlaying.value = false
  })
}

onBeforeUnmount(() => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  voicePlaying.value = false
})
</script>
