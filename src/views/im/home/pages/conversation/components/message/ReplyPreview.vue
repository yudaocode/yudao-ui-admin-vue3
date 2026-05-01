<template>
  <!--
    引用消息预览块，对齐微信 PC：浅灰底块 + 大 padding + 文本可换行（line-clamp 2 行）
    - clickable=true（气泡内）：点击触发 locate emit；撤回态禁用跳转
    - closable=true（输入条）：显示右上 × 圆形按钮，hover 时显示圆形底
    - 撤回降级：命中本地缓存且 type === RECALL 时显示「原消息已撤回」斜体灰字
    - 富预览：type 为 IMAGE / VIDEO 时直接从 quote.content 取缩略图，不依赖本地缓存
  -->
  <div
    class="im-reply-preview flex gap-2 items-start min-w-0 px-3 py-2 rounded text-13px bg-[var(--el-fill-color-light)]"
    :class="{
      'cursor-pointer hover:bg-[var(--el-fill-color)]': clickable && !isRecalled
    }"
    @click="onClick"
  >
    <img
      v-if="thumbnailUrl"
      :src="thumbnailUrl"
      class="flex-shrink-0 object-cover w-8 h-8 rounded"
      alt=""
    />
    <div
      class="im-reply-preview__text flex-1 min-w-0 leading-relaxed text-[var(--el-text-color-secondary)]"
      :class="{ italic: isRecalled }"
    >
      <span>{{ senderName }}:</span>
      <span class="ml-1">{{ snippetText }}</span>
    </div>
    <button
      v-if="closable"
      type="button"
      class="im-reply-preview__close flex-shrink-0 inline-flex items-center justify-center w-5 h-5 mt-0.5 cursor-pointer rounded-full bg-transparent border-none text-[var(--el-text-color-secondary)] transition-colors hover:bg-[var(--el-fill-color-darker)] hover:text-[var(--el-text-color-primary)]"
      @click.stop="emit('close')"
    >
      <Icon icon="ant-design:close-outlined" :size="12" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'

import { useConversationStore } from '../../../../store/conversationStore'
import { getSenderDisplayName } from '../../../../../utils/user'
import { ImMessageType } from '../../../../../utils/constants'
import {
  parseMessage,
  type AudioMessage,
  type FileMessage,
  type ImageMessage,
  type TextMessage,
  type VideoMessage,
  type QuoteMessage
} from '../../../../../utils/message'

defineOptions({ name: 'ImReplyPreview' })

/** 文本摘要在引用块里展示的最大字符数;后端 quote.content 已截断到 1000,这里再压一次给单行预览 */
const MAX_TEXT_PREVIEW_LEN = 60

const props = withDefaults(
  defineProps<{
    quote: QuoteMessage
    /** 气泡内为 true 支持点击跳转,输入条为 false */
    clickable?: boolean
    /** 输入条为 true 显示 × 关闭按钮 */
    closable?: boolean
  }>(),
  {
    clickable: false,
    closable: false
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

/** quote.content 解析一次缓存，让 snippetText / thumbnailUrl 复用，长会话每条引用气泡少一次 JSON.parse */
type AnyQuotePayload = Partial<TextMessage & ImageMessage & FileMessage & AudioMessage & VideoMessage>
const parsedPayload = computed(() => parseMessage<AnyQuotePayload>(props.quote.content))

/** 摘要文案：已撤回降级，否则按 type 从 quote.content 派生（文本截断 / 非文本走类型 tag） */
const snippetText = computed(() => {
  if (isRecalled.value) {
    return '原消息已撤回'
  }
  const { type } = props.quote
  if (type === ImMessageType.TEXT) {
    const text = parsedPayload.value?.content ?? ''
    return text.length <= MAX_TEXT_PREVIEW_LEN ? text : `${text.substring(0, MAX_TEXT_PREVIEW_LEN)}…`
  }
  if (type === ImMessageType.IMAGE) {
    return '[图片]'
  }
  if (type === ImMessageType.FILE) {
    const name = parsedPayload.value?.name
    return name ? `[文件 ${name}]` : '[文件]'
  }
  if (type === ImMessageType.VOICE) {
    const duration = parsedPayload.value?.duration
    return duration ? `[语音 ${duration}″]` : '[语音]'
  }
  if (type === ImMessageType.VIDEO) {
    return '[视频]'
  }
  return ''
})

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
/* 文字超过 2 行截断,避免长引用把输入条 / 气泡撑高;UnoCSS 的 line-clamp 工具类在本项目未启用,走 scoped CSS */
.im-reply-preview__text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
</style>
