<template>
  <!-- 文本：直接显示纯文本 -->
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

  <!-- 视频：封面缩略图 + 时长 + 大小；封面缺失时降级图标占位 -->
  <span v-else-if="isVideo && videoPayload" class="inline-flex gap-1.5 items-center">
    <span
      v-if="videoPayload.coverUrl"
      class="relative inline-block w-60px h-60px rounded overflow-hidden align-middle cursor-pointer"
      :title="videoPayload.url ? '点击新标签播放' : ''"
      @click="openVideo"
    >
      <img :src="videoPayload.coverUrl" class="w-full h-full object-cover" />
      <Icon
        icon="ant-design:play-circle-filled"
        :size="22"
        color="#fff"
        class="absolute inset-0 m-auto pointer-events-none"
        style="filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.6))"
      />
    </span>
    <span v-else class="inline-flex gap-1.5 items-center">
      <Icon icon="ant-design:video-camera-filled" :size="16" color="#9c27b0" />
      <span>[视频]</span>
    </span>
    <span v-if="videoPayload.duration" class="text-12px text-[var(--el-text-color-secondary)]">
      {{ formatSeconds(videoPayload.duration) }}
    </span>
    <span v-if="videoPayload.size" class="text-12px text-[var(--el-text-color-secondary)]">
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

  <!-- 群广播事件：拼装中文 tip 文案，operator 用 senderNickname，member / newOwner 退化为 用户(id) -->
  <span
    v-else-if="isGroupNotificationType"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    {{ groupNotificationText }}
  </span>

  <!-- 好友会话事件（FRIEND_ADD / FRIEND_DELETE）：固定中文文案 -->
  <span
    v-else-if="isFriendChatTipType"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    {{ friendChatTipText }}
  </span>

  <!-- 其它系统事件 / 未知类型：content 通常是结构化 JSON，回退原始预览 -->
  <span v-else class="whitespace-pre-wrap break-all">{{ fallbackText }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { formatFileSize } from '@/utils/file'
import { formatSeconds } from '@/utils/formatTime'
import {
  ImMessageType,
  isFriendChatTip,
  isGroupNotification
} from '@/views/im/utils/constants'
import {
  parseMessage,
  type ImageMessage,
  type FileMessage,
  type AudioMessage,
  type VideoMessage,
  type TextMessage
} from '@/views/im/utils/message'
import {
  resolveFriendNotificationText,
  resolveGroupNotificationText
} from '@/views/im/utils/user'

defineOptions({ name: 'ImMessageContentPreview' })

const props = defineProps<{
  /** 消息类型，对应 ImMessageType */
  type?: number
  /** 消息 content（JSON 字符串或裸文本） */
  content?: string
  /** 发送人昵称：群广播事件用作 operatorName 兜底渲染 */
  senderNickname?: string
}>()

/** 各类型判定 */
const isText = computed(() => props.type === ImMessageType.TEXT)
const isImage = computed(() => props.type === ImMessageType.IMAGE)
const isFile = computed(() => props.type === ImMessageType.FILE)
const isVoice = computed(() => props.type === ImMessageType.VOICE)
const isVideo = computed(() => props.type === ImMessageType.VIDEO)

/** 文本内容：从 TextMessage payload 取 .content */
const textContent = computed(
  () => parseMessage<TextMessage>(props.content || '')?.content ?? ''
)

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

/** 点击视频封面：在新标签打开视频 url（不在管理后台内嵌播放，避免列表里多个 video 同时占资源） */
function openVideo() {
  const url = videoPayload.value?.url
  if (url) {
    window.open(url, '_blank')
  }
}

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

/** 是否好友会话事件气泡（FRIEND_ADD / FRIEND_DELETE） */
const isFriendChatTipType = computed(() => isFriendChatTip(props.type ?? -1))

/** 好友会话事件文案：固定文案，不依赖 payload */
const friendChatTipText = computed(() => resolveFriendNotificationText({ type: props.type }))

/** 是否群广播事件 */
const isGroupNotificationType = computed(() => isGroupNotification(props.type ?? -1))

/** 群广播事件文案：复用 utils/user.resolveGroupNotificationText；admin 端 operator 用 senderNickname 直接覆盖，其它 id 退化为 用户(id) */
const groupNotificationText = computed(() =>
  resolveGroupNotificationText(
    { type: props.type, content: props.content },
    (id) => `用户(${id})`,
    props.senderNickname
  )
)
</script>
