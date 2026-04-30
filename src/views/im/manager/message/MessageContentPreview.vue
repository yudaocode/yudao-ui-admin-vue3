<template>
  <!-- 文本 / 系统提示文本：直接显示纯文本 -->
  <span v-if="isText" class="whitespace-pre-wrap break-all">{{ textContent }}</span>

  <!-- 图片：缩略图 + 点击放大 -->
  <el-image
    v-else-if="isImage && imagePayload"
    class="w-60px h-60px rounded align-middle"
    :src="imagePayload.thumbnailUrl || imagePayload.url"
    :preview-src-list="[imagePayload.url]"
    :preview-teleported="true"
    fit="cover"
  />

  <!-- 文件：图标 + 名称 + 大小，单行内显示 -->
  <span v-else-if="isFile && filePayload" class="inline-flex gap-1.5 items-center">
    <Icon :icon="fileIconInfo.icon" :color="fileIconInfo.color" :size="18" />
    <span class="max-w-200px truncate">{{ filePayload.name }}</span>
    <span v-if="filePayload.size" class="text-12px text-[var(--el-text-color-secondary)]">
      {{ formatFileSize(filePayload.size) }}
    </span>
  </span>

  <!-- 语音：图标 + 时长 -->
  <span v-else-if="isVoice && voicePayload" class="inline-flex gap-1.5 items-center">
    <Icon icon="ant-design:audio-outlined" :size="16" color="#606266" />
    <span>{{ formatSeconds(voicePayload.duration ?? 0) }}</span>
  </span>

  <!-- 视频：图标 + 占位文案 + 大小 -->
  <span v-else-if="isVideo" class="inline-flex gap-1.5 items-center">
    <Icon icon="ant-design:video-camera-filled" :size="16" color="#9c27b0" />
    <span>[视频]</span>
    <span v-if="videoPayload?.size" class="text-12px text-[var(--el-text-color-secondary)]">
      {{ formatFileSize(videoPayload.size) }}
    </span>
  </span>

  <!-- 控制类消息：撤回 / 已读 / 回执 -->
  <span
    v-else-if="props.type === ImMessageType.RECALL"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    [消息已撤回]
  </span>
  <span
    v-else-if="props.type === ImMessageType.READ"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    [已读回执]
  </span>
  <span
    v-else-if="props.type === ImMessageType.RECEIPT"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    [回执]
  </span>

  <!-- 系统事件类（FRIEND_* / GROUP_*）：content 通常是结构化 JSON，回退原始预览 -->
  <span v-else class="whitespace-pre-wrap break-all">{{ fallbackText }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { formatFileSize } from '@/utils/file'
import { formatSeconds } from '@/utils/formatTime'
import { ImMessageType } from '@/views/im/utils/constants'
import {
  parseMessage,
  resolveTipText,
  type ImageMessage,
  type FileMessage,
  type AudioMessage,
  type VideoMessage
} from '@/views/im/utils/message'

defineOptions({ name: 'ImMessageContentPreview' })

const props = defineProps<{
  /** 消息类型，对应 ImMessageType */
  type?: number
  /** 消息 content（JSON 字符串或裸文本） */
  content?: string
}>()

/** 各类型判定 */
const isText = computed(
  () => props.type === ImMessageType.TEXT || props.type === ImMessageType.TIP_TEXT
)
const isImage = computed(() => props.type === ImMessageType.IMAGE)
const isFile = computed(() => props.type === ImMessageType.FILE)
const isVoice = computed(() => props.type === ImMessageType.VOICE)
const isVideo = computed(() => props.type === ImMessageType.VIDEO)

/** 文本内容：兼容 JSON 包裹和裸字符串两种形态 */
const textContent = computed(() => resolveTipText(props.content || ''))

const imagePayload = computed(() =>
  isImage.value ? parseMessage<ImageMessage>(props.content || '') : null
)
const filePayload = computed(() =>
  isFile.value ? parseMessage<FileMessage>(props.content || '') : null
)
const voicePayload = computed(() =>
  isVoice.value ? parseMessage<AudioMessage>(props.content || '') : null
)
const videoPayload = computed(() =>
  isVideo.value ? parseMessage<VideoMessage>(props.content || '') : null
)

/** 文件图标：按扩展名分配 icon + 颜色，对齐 home 端 MessageItem 的观感 */
const fileIconInfo = computed<{ icon: string; color: string }>(() => {
  const name = filePayload.value?.name || ''
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') {
    return { icon: 'ant-design:file-pdf-filled', color: '#ed5757' }
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: 'ant-design:file-word-filled', color: '#2b7cd3' }
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return { icon: 'ant-design:file-excel-filled', color: '#1f7244' }
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return { icon: 'ant-design:file-ppt-filled', color: '#d24726' }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { icon: 'ant-design:file-zip-filled', color: '#f0ad4e' }
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return { icon: 'ant-design:file-image-filled', color: '#9c27b0' }
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv'].includes(ext)) {
    return { icon: 'ant-design:video-camera-filled', color: '#9c27b0' }
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return { icon: 'ant-design:audio-filled', color: '#9c27b0' }
  }
  if (['txt', 'md', 'log', 'json', 'xml'].includes(ext)) {
    return { icon: 'ant-design:file-text-filled', color: '#909399' }
  }
  return { icon: 'ant-design:file-filled', color: '#909399' }
})

/** 系统事件 / 未知类型 fallback：取 JSON 首层 content，否则原文 */
const fallbackText = computed(() => {
  const raw = props.content || ''
  if (!raw) {
    return ''
  }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.content) {
      return String(parsed.content)
    }
  } catch {}
  return raw
})
</script>
