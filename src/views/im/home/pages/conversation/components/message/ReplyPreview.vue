<template>
  <!--
    引用预览块（对齐微信 PC）：2px 竖线作为「引用」视觉标识 + 紧凑内容预览
    - clickable=true（气泡内）：点击触发 locate emit；撤回态禁用跳转
    - closable=true（输入条）：尾部 × 关闭按钮
    - mirrored=true（自己发送的气泡）：竖线镜像到右侧，与气泡同侧
    - 内容预览（与主气泡同源，不缩写成「[文件]/[语音]」）：
      - 文本：截断后纯文字
      - 图片 / 视频：缩略图（IMAGE 用 thumbnailUrl/url，VIDEO 用 coverUrl）
      - 文件：file icon + 文件名 + 大小
      - 语音：audio icon + 时长
      - 撤回（命中本地缓存且 type === RECALL）：「原消息已撤回」斜体灰字
  -->
  <div
    class="im-reply-preview flex w-fit gap-1.5 items-center min-w-0 py-0.5 text-12px text-[var(--el-text-color-secondary)] rounded transition-colors"
    :class="[
      mirrored ? 'im-reply-preview--end pl-1 pr-2' : 'pl-2 pr-1',
      {
        'cursor-pointer hover:text-[var(--el-text-color-primary)]': clickable && !isRecalled,
        'hover:bg-[var(--el-fill-color-light)]': (clickable && !isRecalled) || closable
      }
    ]"
    @click="onClick"
  >
    <span class="flex-shrink-0">{{ senderName }}:</span>

    <!-- 撤回降级 -->
    <span v-if="isRecalled" class="italic">原消息已撤回</span>

    <!-- 文本 -->
    <span v-else-if="isText" class="im-reply-preview__text min-w-0">{{ textPreview }}</span>

    <!-- 文件：icon + 文件名 + 大小 -->
    <template v-else-if="isFile">
      <Icon
        :icon="fileIcon.icon"
        :color="fileIcon.color"
        :size="14"
        class="flex-shrink-0"
      />
      <span v-if="filePayload?.name" class="im-reply-preview__text min-w-0">
        {{ filePayload.name }}
      </span>
      <span
        v-if="filePayload?.size"
        class="flex-shrink-0 text-[var(--el-text-color-placeholder)]"
      >
        {{ formatFileSize(filePayload.size) }}
      </span>
    </template>

    <!-- 语音：audio icon + 时长 -->
    <template v-else-if="isVoice">
      <Icon icon="ant-design:audio-outlined" :size="14" class="flex-shrink-0" />
      <span v-if="voicePayload?.duration" class="flex-shrink-0">
        {{ formatSeconds(voicePayload.duration) }}
      </span>
    </template>

    <!-- 图片 / 视频缩略图 -->
    <img
      v-if="thumbnailUrl"
      :src="thumbnailUrl"
      class="flex-shrink-0 object-cover w-6 h-6 rounded"
      alt=""
    />

    <!-- 关闭按钮 -->
    <button
      v-if="closable"
      type="button"
      class="im-reply-preview__close flex-shrink-0 inline-flex items-center justify-center w-4 h-4 cursor-pointer rounded-full bg-transparent border-none text-[var(--el-text-color-secondary)] hover:bg-[var(--el-fill-color)] hover:text-[var(--el-text-color-primary)]"
      @click.stop="emit('close')"
    >
      <Icon icon="ant-design:close-outlined" :size="10" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { formatSeconds } from '@/utils/formatTime'
import { formatFileSize } from '@/utils/file'

import { useConversationStore } from '../../../../store/conversationStore'
import { getSenderDisplayName } from '@/views/im/utils/user'
import { ImMessageType } from '@/views/im/utils/constants'
import {
  parseMessage,
  getFileIconInfo,
  type AudioMessage,
  type FileMessage,
  type ImageMessage,
  type TextMessage,
  type VideoMessage,
  type QuoteMessage
} from '@/views/im/utils/message'

defineOptions({ name: 'ImReplyPreview' })

/** 文本摘要在引用块里展示的最大字符数 */
const MAX_TEXT_PREVIEW_LEN = 60

const props = withDefaults(
  defineProps<{
    quote: QuoteMessage
    /** 气泡内为 true 支持点击跳转,输入条为 false */
    clickable?: boolean
    /** 输入条为 true 显示 × 关闭按钮 */
    closable?: boolean
    /** 自己发送的气泡为 true，把竖线镜像到右侧，与气泡同侧 */
    mirrored?: boolean
  }>(),
  {
    clickable: false,
    closable: false,
    mirrored: false
  }
)

const emit = defineEmits<{
  locate: [messageId: number]
  close: []
}>()

const conversationStore = useConversationStore()

/** 在当前会话消息列表里查找原消息,仅用于实时判断是否已撤回;摘要 / 缩略图都从 quote.content 直接派生 */
const liveMessage = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || !props.quote.messageId) {
    return undefined
  }
  return conversation.messages.find((message) => message.id === props.quote.messageId)
})

/** 命中本地缓存且 type === RECALL 才判定为已撤回;不在缓存的当快照仍有效 */
const isRecalled = computed(() => liveMessage.value?.type === ImMessageType.RECALL)

/** 渲染时实时算,与气泡上方显示名走同一套规则,避免备注变更后引用块陈旧 */
const senderName = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return ''
  }
  return getSenderDisplayName(props.quote.senderId, conversation.type, conversation.targetId)
})

/** quote.content 解析一次缓存，让多个 computed 复用，长会话每条引用气泡少一次 JSON.parse */
type AnyQuotePayload = Partial<
  TextMessage & ImageMessage & FileMessage & AudioMessage & VideoMessage
>
const parsedPayload = computed(() => parseMessage<AnyQuotePayload>(props.quote.content))

const isText = computed(() => props.quote.type === ImMessageType.TEXT)
const isFile = computed(() => props.quote.type === ImMessageType.FILE)
const isVoice = computed(() => props.quote.type === ImMessageType.VOICE)

/** 文本超过 MAX_TEXT_PREVIEW_LEN 截断，长内容不撑爆引用块 */
const textPreview = computed(() => {
  const text = parsedPayload.value?.content ?? ''
  return text.length <= MAX_TEXT_PREVIEW_LEN
    ? text
    : `${text.substring(0, MAX_TEXT_PREVIEW_LEN)}…`
})

/** 文件 / 语音 payload 直接复用 parsedPayload，省一次解析 */
const filePayload = computed(() => parsedPayload.value)
const voicePayload = computed(() => parsedPayload.value)

/** 文件 icon：按扩展名挑色，跟主气泡渲染同源 */
const fileIcon = computed(() => getFileIconInfo(filePayload.value?.name))

/** 缩略图 URL：仅图片 / 视频从 quote.content 直接取，不依赖本地缓存 */
const thumbnailUrl = computed<string | undefined>(() => {
  if (isRecalled.value) {
    return undefined
  }
  const { type } = props.quote
  if (type === ImMessageType.IMAGE) {
    return parsedPayload.value?.thumbnailUrl || parsedPayload.value?.url
  }
  if (type === ImMessageType.VIDEO) {
    return parsedPayload.value?.coverUrl
  }
  return undefined
})

/** 仅 clickable 且未撤回时触发跳转 */
function onClick() {
  if (!props.clickable || isRecalled.value) {
    return
  }
  emit('locate', props.quote.messageId)
}
</script>

<style scoped>
/* 默认左侧 2px 竖线作为「引用」视觉标识；mirrored 时镜像到右侧 */
.im-reply-preview {
  border-left: 2px solid var(--el-border-color);
}
.im-reply-preview--end {
  border-left: 0;
  border-right: 2px solid var(--el-border-color);
}

/* 文字超过 2 行截断，避免长引用把输入条 / 气泡撑高；UnoCSS 的 line-clamp 工具类在本项目未启用，走 scoped CSS */
.im-reply-preview__text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
</style>
