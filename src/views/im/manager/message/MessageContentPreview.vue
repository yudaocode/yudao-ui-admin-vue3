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
        style="filter: drop-shadow(0 0 2px rgb(0 0 0 / 60%))"
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

  <!-- 名片 -->
  <CardLineLabel v-else-if="isCard && cardPayload" :card="cardPayload" :icon-size="16" />

  <!-- 合并转发：title + 前 N 条摘要 -->
  <span v-else-if="isMerge && mergePayload" class="inline-flex flex-col gap-0.5 align-middle">
    <span class="text-13px text-[var(--el-text-color-primary)]"
      >[聊天记录] {{ mergePayload.title }}</span
    >
    <span
      v-for="(line, idx) in mergePreviewLines"
      :key="idx"
      class="text-12px truncate text-[var(--el-text-color-secondary)]"
    >
      {{ line }}
    </span>
  </span>

  <!-- 表情贴图：缩略图 + 表情名（无名字时仅 [表情]） -->
  <span v-else-if="isFace && facePayload" class="inline-flex gap-1.5 items-center">
    <img
      v-if="facePayload.url"
      :src="facePayload.url"
      :alt="facePayload.name || '表情'"
      class="w-30px h-30px rounded object-contain align-middle"
      draggable="false"
    />
    <span>{{ buildFacePreviewText(facePayload) }}</span>
  </span>

  <!-- 控制类消息：撤回 / 已读 / 回执 -->
  <span
    v-else-if="props.type === ImContentType.RECALL"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    [消息已撤回]
  </span>
  <span
    v-else-if="props.type === ImContentType.READ"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    [已读回执]
  </span>
  <span
    v-else-if="props.type === ImContentType.RECEIPT"
    class="text-12px text-[var(--el-text-color-secondary)]"
  >
    [回执]
  </span>

  <!-- 群广播事件：拼装中文 tip 文案，operator 用 senderNickname，member / newOwner 退化为 用户(id) -->
  <span v-else-if="isGroupNotificationType" class="text-12px text-[var(--el-text-color-secondary)]">
    {{ groupNotificationText }}
  </span>

  <!-- 好友会话事件（FRIEND_ADD / FRIEND_DELETE）：固定中文文案 -->
  <span v-else-if="isFriendChatTipType" class="text-12px text-[var(--el-text-color-secondary)]">
    {{ friendChatTipText }}
  </span>

  <!-- 通话事件（RTC_CALL_START / RTC_CALL_END）：中文文案 + 媒体类型 / 结束原因 / 时长 -->
  <span
    v-else-if="isRtcCallTipType"
    class="inline-flex gap-1.5 items-center text-12px text-[var(--el-text-color-secondary)]"
  >
    <Icon icon="ant-design:phone-outlined" :size="14" class="rotate-[135deg]" />
    <span>{{ rtcCallTipText }}</span>
  </span>

  <!-- 其它系统事件 / 未知类型：content 通常是结构化 JSON，回退原始预览 -->
  <span v-else class="whitespace-pre-wrap break-all">{{ fallbackText }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { formatFileSize } from '@/utils/file'
import { formatSeconds } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import {
  ImContentType,
  ImRtcCallEndReason,
  ImRtcCallMediaType,
  isFriendChatTip,
  isGroupNotification,
  isRtcCallTip
} from '@/views/im/utils/constants'
import { MESSAGE_MERGE_PREVIEW_LINES } from '@/views/im/utils/config'
import CardLineLabel from '@/views/im/home/components/card/CardLineLabel.vue'
import {
  parseMessage,
  parseRtcCallPayload,
  getFileIconInfo,
  resolveFriendNotificationText,
  resolveGroupNotificationText,
  type ImageMessage,
  type FileMessage,
  type AudioMessage,
  type VideoMessage,
  type TextMessage,
  type CardMessage,
  type FaceMessage,
  type MergeMessage
} from '@/views/im/utils/message'
import { buildFacePreviewText, summarizeMessageContent } from '@/views/im/utils/conversation'
import { openSafeUrl } from '@/utils/url'

defineOptions({ name: 'ImMessageContentPreview' })

const props = defineProps<{
  /** 内容类型，对应 ImContentType */
  type?: number
  /** 消息 content（JSON 字符串或裸文本） */
  content?: string
  /** 发送人昵称：群广播事件用作 operatorName 兜底渲染 */
  senderNickname?: string
}>()

/** 各类型判定 */
const isText = computed(() => props.type === ImContentType.TEXT)
const isImage = computed(() => props.type === ImContentType.IMAGE)
const isFile = computed(() => props.type === ImContentType.FILE)
const isVoice = computed(() => props.type === ImContentType.VOICE)
const isVideo = computed(() => props.type === ImContentType.VIDEO)
const isCard = computed(() => props.type === ImContentType.CARD)
const isFace = computed(() => props.type === ImContentType.FACE)
const isMerge = computed(() => props.type === ImContentType.MERGE)

/** 文本内容：从 TextMessage payload 取 .content */
const textContent = computed(() => parseMessage<TextMessage>(props.content || '')?.content ?? '')

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
const cardPayload = computed(() =>
  isCard.value ? parseMessage<CardMessage>(props.content || '') : null
)
const facePayload = computed(() =>
  isFace.value ? parseMessage<FaceMessage>(props.content || '') : null
)
const mergePayload = computed(() =>
  isMerge.value ? parseMessage<MergeMessage>(props.content || '') : null
)

/** 合并转发预览行：取前 N 条派生「{昵称}：{摘要}」 */
const mergePreviewLines = computed(() => {
  if (!mergePayload.value) {
    return []
  }
  return mergePayload.value.messages
    .slice(0, MESSAGE_MERGE_PREVIEW_LINES)
    .map((item) => `${item.senderNickname}：${summarizeMessageContent(item)}`)
})

/** 点击视频封面：在新标签打开视频 url（不在管理后台内嵌播放，避免列表里多个 video 同时占资源） */
function openVideo() {
  const url = videoPayload.value?.url
  if (url) {
    openSafeUrl(url)
  }
}

/** 文件图标：按扩展名分配 icon + 颜色 */
const fileIconInfo = computed(() => getFileIconInfo(filePayload.value?.name))

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

/** 群广播事件文案：admin 端 operator 用 senderNickname 直接覆盖，其它 id 退化为 用户(id) */
const groupNotificationText = computed(() =>
  resolveGroupNotificationText(
    { type: props.type, content: props.content },
    (id) => `用户(${id})`,
    props.senderNickname
  )
)

/** 是否通话事件气泡（RTC_CALL_START / RTC_CALL_END） */
const isRtcCallTipType = computed(() => isRtcCallTip(props.type ?? -1))

/** 通话事件文案：START 显示「{发起人} 发起了{媒体}通话」；END 显示「{媒体}通话已结束 [原因] [时长]」 */
const rtcCallTipText = computed(() => {
  const payload = parseRtcCallPayload(props.content)
  if (!payload) {
    return ''
  }
  const mediaLabel = payload.mediaType === ImRtcCallMediaType.VIDEO ? '视频' : '语音'
  if (props.type === ImContentType.RTC_CALL_START) {
    const inviter = payload.inviterNickname?.trim() || `用户(${payload.inviterUserId ?? ''})`
    return `${inviter} 发起了${mediaLabel}通话`
  }
  // RTC_CALL_END
  const segments = [`${mediaLabel}通话已结束`]
  // HANGUP 字典 label 是「通话结束」，会和前缀重复；跳过
  if (payload.endReason && payload.endReason !== ImRtcCallEndReason.HANGUP) {
    const reason = getDictLabel(DICT_TYPE.IM_RTC_CALL_END_REASON, payload.endReason)
    if (reason) {
      segments.push(reason)
    }
  }
  const duration = payload.durationSeconds ?? 0
  if (duration > 0) {
    segments.push(`时长 ${formatSeconds(duration)}`)
  }
  return segments.join('，')
})
</script>
