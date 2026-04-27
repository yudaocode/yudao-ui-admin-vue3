<template>
  <div
    class="relative flex flex-col bg-[var(--el-bg-color)] border-t border-[var(--el-border-color-lighter)]"
  >
    <!-- 顶部工具栏：表情/图片/文件/语音/历史 -->
    <div class="relative flex items-center gap-2 h-9 px-3">
      <!--
        注意：el-icon 默认 box-sizing:border-box + width:1em，所以这里显式 box-content 才能让 p-1.5
        不把 1em 的图标挤瘪；hover 态走 UnoCSS 的 hover: 前缀
      -->
      <el-tooltip content="表情" placement="top">
        <el-icon
          class="message-input__tool box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
          @click.stop="toggleEmoji"
        >
          <Sunny />
        </el-icon>
      </el-tooltip>
      <el-tooltip content="发送图片" placement="top">
        <el-icon
          class="message-input__tool box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
          @click="imageInputRef?.click()"
        >
          <Picture />
        </el-icon>
      </el-tooltip>
      <el-tooltip content="发送文件" placement="top">
        <el-icon
          class="message-input__tool box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
          @click="fileInputRef?.click()"
        >
          <Paperclip />
        </el-icon>
      </el-tooltip>
      <el-tooltip content="语音消息" placement="top">
        <el-icon
          class="message-input__tool box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
          @click="voiceVisible = true"
        >
          <Microphone />
        </el-icon>
      </el-tooltip>
      <el-tooltip content="历史消息" placement="top">
        <el-icon
          class="message-input__tool box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
          @click="$emit('openHistory')"
        >
          <Tickets />
        </el-icon>
      </el-tooltip>

      <!-- 浮层：表情面板；绝对定位到工具栏左上方 -->
      <EmojiPicker
        v-model:visible="emojiVisible"
        class="bottom-9 left-3"
        @select="insertText"
      />
    </div>

    <!-- 输入区 -->
    <el-input
      ref="inputRef"
      v-model="text"
      type="textarea"
      :rows="4"
      resize="none"
      placeholder="按 Enter 发送，Shift+Enter 换行"
      class="message-input__textarea"
      @keydown="onKeydown"
      @input="onInput"
    />

    <!-- 发送按钮 -->
    <div class="flex justify-end px-3 pt-1.5 pb-2.5">
      <el-button type="primary" :disabled="!canSend" @click="handleSend">发 送</el-button>
    </div>

    <!-- @ 选择浮层：群聊才启用 -->
    <MentionPicker
      ref="mentionRef"
      v-model:visible="mentionVisible"
      :pos="mentionPos"
      :members="groupMembers"
      :search-text="mentionSearchText"
      :owner-id="groupOwnerId"
      @select="onMentionSelect"
    />

    <!-- 语音录制对话框 -->
    <VoiceRecorder v-model="voiceVisible" @send="onVoiceSend" />

    <!-- 隐藏的文件选择器 -->
    <input ref="imageInputRef" type="file" accept="image/*" hidden @change="onImagePicked" />
    <input ref="fileInputRef" type="file" hidden @change="onFilePicked" />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { Sunny, Picture, Paperclip, Microphone, Tickets } from '@element-plus/icons-vue'
import { ElInput, ElMessage } from 'element-plus'

import { CommonStatusEnum } from '@/utils/constants'
import { updateFile } from '@/api/infra/file'
import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { useGroupStore } from '@/views/im/home/store/groupStore'
import { useMessageSender } from '@/views/im/home/composables/useMessageSender'
import { ImConversationType, ImMessageType } from '@/views/im/utils/constants'
import {
  serializeMessage,
  type ImageMessage,
  type FileMessage,
  type AudioMessage
} from '@/views/im/utils/message'

import EmojiPicker from './EmojiPicker.vue'
import MentionPicker from './MentionPicker.vue'
import VoiceRecorder from './VoiceRecorder.vue'
import type { GroupMemberLite } from '../ChatGroupMember.vue'

defineOptions({ name: 'ImMessageInput' })

defineEmits<{
  openHistory: [] // 打开历史消息抽屉（由 ChatPanel 或 MessagePage 承接）
}>()

const conversationStore = useConversationStore()
const groupStore = useGroupStore()
const { send, sendRaw } = useMessageSender()

const inputRef = useTemplateRef<InstanceType<typeof ElInput>>('inputRef')
const imageInputRef = useTemplateRef<HTMLInputElement>('imageInputRef')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const mentionRef = useTemplateRef<InstanceType<typeof MentionPicker>>('mentionRef')

// ==================== 文本 / 发送 ====================
const text = ref('')
const canSend = computed(() => !!text.value.trim() && !!conversationStore.activeConversation)

/**
 * 提交时从文本里实际存在的 @ 段重新收集 atUserIds
 * - 用户先 @ 后又把 "@张三 " 整段删掉时，旧 push 模型仍会带上张三的 id（与文本不一致）
 * - "@全体成员" 走虚拟 userId=-1，对齐 MentionPicker 里的 allTag 约定
 * - 同名成员碰撞时第一条匹配胜出（textarea 没有不可编辑 token，也只能这么做）
 */
function collectAtUserIds(): number[] {
  if (!isGroup.value) {
    return []
  }
  const userIds = new Set<number>()
  const regex = /@([^\s@]+)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text.value)) !== null) {
    const name = match[1]
    if (name === '全体成员') {
      userIds.add(-1)
      continue
    }
    const member = groupMembers.value.find((m) => m.showNickName === name)
    if (member?.userId != null) {
      userIds.add(member.userId)
    }
  }
  return Array.from(userIds)
}

async function handleSend() {
  if (!canSend.value) {
    return
  }
  const atUserIds = collectAtUserIds()
  const txt = text.value
  text.value = ''
  await send(txt, atUserIds.length > 0 ? { atUserIds } : undefined)
}

function insertText(str: string) {
  const ta = getTextarea()
  if (!ta) {
    text.value += str
    return
  }
  const start = ta.selectionStart ?? text.value.length
  const end = ta.selectionEnd ?? text.value.length
  text.value = text.value.slice(0, start) + str + text.value.slice(end)
  nextTick(() => {
    ta.focus()
    const caret = start + str.length
    ta.setSelectionRange(caret, caret)
  })
}

function getTextarea(): HTMLTextAreaElement | null {
  // ElInput 在 type=textarea 时内部是 <textarea>，需要在 DOM 上查找
  return (inputRef.value?.$el?.querySelector('textarea') as HTMLTextAreaElement) || null
}

// ==================== 表情 ====================
const emojiVisible = ref(false)
function toggleEmoji() {
  emojiVisible.value = !emojiVisible.value
}

// ==================== @ 成员选择（群聊） ====================
const isGroup = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.GROUP
)

/** 从 groupStore 读当前激活群的成员（切会话时由 ChatPanel 预拉） */
const groupMembers = computed<GroupMemberLite[]>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return []
  }
  const g = groupStore.getGroup(conversation.targetId)
  return (g?.members || []).map((m) => ({
    userId: m.userId,
    showNickName: m.displayUserName || m.nickname,
    showImage: m.avatar,
    quit: m.status === CommonStatusEnum.DISABLE
  }))
})
const groupOwnerId = computed<number | undefined>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return undefined
  }
  return groupStore.getGroup(conversation.targetId)?.ownerUserId
})

const mentionVisible = ref(false)
const mentionSearchText = ref('')
const mentionPos = ref({ x: 0, y: 0 })

/** 当前输入里 @ 符号的起始光标位置，用于选中成员后做替换 */
let atStartPos = -1

function onInput() {
  if (!isGroup.value) {
    return
  }
  const ta = getTextarea()
  if (!ta) {
    return
  }
  const caret = ta.selectionStart ?? 0
  const before = text.value.slice(0, caret)
  // 找最近的 @ 且 @ 后没有空格（允许汉字、字母、数字）
  const match = before.match(/@([^\s@]*)$/)
  if (match) {
    atStartPos = caret - match[0].length
    mentionSearchText.value = match[1]
    // 贴在输入框左上方
    const rect = ta.getBoundingClientRect()
    mentionPos.value = { x: rect.left + 20, y: rect.top - 10 }
    mentionVisible.value = true
  } else {
    mentionVisible.value = false
    atStartPos = -1
  }
}

function onMentionSelect(member: GroupMemberLite) {
  const ta = getTextarea()
  if (!ta || atStartPos < 0) {
    return
  }
  const caret = ta.selectionStart ?? atStartPos
  const insert = `@${member.showNickName} `
  text.value = text.value.slice(0, atStartPos) + insert + text.value.slice(caret)
  // userId 不再 push 到本地状态，由 collectAtUserIds 在 send 时从 text 里重新收集
  nextTick(() => {
    ta.focus()
    const newCaret = atStartPos + insert.length
    ta.setSelectionRange(newCaret, newCaret)
  })
  mentionVisible.value = false
  atStartPos = -1
}

function onKeydown(e: KeyboardEvent) {
  // @ 浮层打开时，键盘上下 + Enter 由浮层消费
  if (mentionVisible.value) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      mentionRef.value?.moveUp()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      mentionRef.value?.moveDown()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (mentionRef.value?.hasCandidates()) {
        mentionRef.value?.pickActive()
        return
      }
    }
    if (e.key === 'Escape') {
      mentionVisible.value = false
      return
    }
  }
  // 普通 Enter → 发送；Shift+Enter / Ctrl+Enter → 换行
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.isComposing) {
    e.preventDefault()
    handleSend()
  }
}

// ==================== 图片 / 文件上传 ====================
async function onImagePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  try {
    const form = new FormData()
    form.append('file', file)
    const url = (await updateFile(form)) as unknown as string
    if (!url) {
      return
    }
    await sendRaw(ImMessageType.IMAGE, serializeMessage<ImageMessage>({ url }))
  } catch (err) {
    console.error('[IM] 图片上传失败:', err)
    ElMessage.error('图片上传失败')
  }
}

async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  try {
    const form = new FormData()
    form.append('file', file)
    const url = (await updateFile(form)) as unknown as string
    if (!url) {
      return
    }
    await sendRaw(
      ImMessageType.FILE,
      serializeMessage<FileMessage>({ url, name: file.name, size: file.size })
    )
  } catch (err) {
    console.error('[IM] 文件上传失败:', err)
    ElMessage.error('文件上传失败')
  }
}

// ==================== 语音 ====================
const voiceVisible = ref(false)
async function onVoiceSend(payload: { blob: Blob; duration: number }) {
  try {
    const file = new File([payload.blob], `voice-${Date.now()}.webm`, { type: payload.blob.type })
    const form = new FormData()
    form.append('file', file)
    const url = (await updateFile(form)) as unknown as string
    if (!url) {
      return
    }
    await sendRaw(
      ImMessageType.VOICE,
      serializeMessage<AudioMessage>({ url, duration: payload.duration })
    )
  } catch (err) {
    console.error('[IM] 语音上传失败:', err)
    ElMessage.error('语音上传失败')
  }
}
</script>

<style scoped>
/* el-icon 全局规则 .el-icon{color:var(--color,inherit); font-size:inherit; width:1em; height:1em}
   会盖过 UnoCSS 原子类；用字面选择器 + !important 兜底。
   颜色取 Element Plus 主题变量，暗色自动切到浅灰 */
.message-input__tool,
.message-input__tool:deep(svg) {
  font-size: 18px !important;
  color: var(--el-text-color-regular) !important;
  fill: currentColor !important;
}
.message-input__tool:hover,
.message-input__tool:hover:deep(svg) {
  color: var(--el-color-primary) !important;
}

/* el-textarea 是 ElInput 内部的 textarea，需要 :deep() 去掉默认边框 / 圆角 */
.message-input__textarea :deep(.el-textarea__inner) {
  padding: 8px 12px;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.message-input__textarea :deep(.el-textarea__inner):focus {
  box-shadow: none;
}
</style>
