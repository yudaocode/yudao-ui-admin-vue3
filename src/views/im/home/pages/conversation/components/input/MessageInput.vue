<template>
  <!--
    外层底色与消息流（bg-color-page）保持一致，让"消息 → 输入"无色差过渡；
    padding 给内层白卡片呼吸空间，卡片自带边框就够区分输入区，不再需要一条 border-t
  -->
  <div class="relative bg-[var(--el-bg-color-page)] px-3 pt-2 pb-3">
    <!-- 禁言 / 封禁覆盖层：优先级 封禁 > 全群禁言 > 成员禁言 -->
    <div
      v-if="muteOverlay"
      class="absolute top-2 right-3 bottom-3 left-3 z-10 flex items-center justify-center gap-2 rounded-lg border border-solid text-sm"
      :class="
        muteOverlay.icon === 'ant-design:stop-outlined'
          ? 'text-[var(--el-color-danger-dark-2)] bg-[var(--el-color-danger-light-9)] border-[var(--el-color-danger-light-5)]'
          : 'text-[var(--el-color-warning-dark-2)] bg-[var(--el-color-warning-light-9)] border-[var(--el-color-warning-light-5)]'
      "
    >
      <Icon :icon="muteOverlay.icon" :size="18" />
      <span>{{ muteOverlay.text }}</span>
    </div>
    <!-- 内层白色圆角卡片 = editor + 工具栏；border + rounded 模拟微信「输入框」边界 -->
    <div
      class="relative flex flex-col bg-[var(--el-bg-color)] rounded-lg border border-solid border-[var(--el-border-color-lighter)]"
    >
      <!--
        输入区在上：contenteditable div（取代 textarea，对齐微信 PC：输入区在上，操作在下）
        - 让 @ 浮层能拿到真实光标 rect（textarea 拿不到）
        - 让 @ 成员以 <span data-id> token 节点存在，删 token 即删 id，避免 stale atUserIds
        - placeholder 通过 data-empty + ::before 模拟（contenteditable 没有原生 placeholder）
      -->
      <div
        ref="editorRef"
        class="message-input__editor relative min-h-[120px] max-h-[200px] overflow-y-auto py-3.5 px-4 text-sm leading-normal outline-none whitespace-pre-wrap break-words"
        contenteditable="true"
        data-placeholder="按 Enter 发送，Shift+Enter 换行"
        data-empty=""
        role="textbox"
        @keydown="onKeydown"
        @input="onInput"
        @scroll.passive="onEditorScroll"
        @paste.prevent="onPaste"
      ></div>

      <!-- 引用预览条 -->
      <ReplyPreview
        v-if="replyTarget"
        :quote="replyTarget"
        closable
        class="mx-3 mb-1.5"
        @close="clearConversationReplyDraft"
      />

      <!--
        底部工具栏：左侧操作图标 + 右侧发送按钮（对齐微信 PC：操作图标统一放底部）
        - relative 给 FacePicker 提供 absolute 锚点，picker 用 bottom-full 向上弹出
        - 图标统一 30×30 点击区（18px icon + p-1.5），gap-1 让间距贴合微信观感
        - border-t 在编辑区与工具栏之间画一条与 card 边框同色的细线
      -->
      <div
        class="relative flex items-center justify-between gap-2 px-3 py-2 border-t border-t-solid border-[var(--el-border-color-lighter)]"
      >
        <div class="flex items-center gap-1">
          <!--
            所有 icon 统一走 Iconify（ant-design outlined 系列）：
            - 视觉风格更接近微信 PC（线性、圆角，比 Element Plus 内置的更轻量）
            - 笑脸 / 图片 / 文件夹 / 麦克风 同源，避免一个走 ep 一个走 antd 视觉割裂
            - 外层 span 复用 .message-input__tool 的 padding / hover 样式，scoped CSS 的 :deep(svg) 仍能命中
          -->
          <el-tooltip content="表情" placement="top">
            <span
              class="message-input__tool inline-flex items-center justify-center box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
              @click.stop="toggleEmoji"
            >
              <Icon icon="ant-design:smile-outlined" :size="18" />
            </span>
          </el-tooltip>
          <el-tooltip content="发送图片" placement="top">
            <span
              class="message-input__tool inline-flex items-center justify-center box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
              @click="imageInputRef?.click()"
            >
              <Icon icon="ant-design:picture-outlined" :size="18" />
            </span>
          </el-tooltip>
          <el-tooltip content="发送文件" placement="top">
            <span
              class="message-input__tool inline-flex items-center justify-center box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
              @click="fileInputRef?.click()"
            >
              <Icon icon="ant-design:folder-outlined" :size="18" />
            </span>
          </el-tooltip>
          <el-tooltip content="语音消息" placement="top">
            <span
              class="message-input__tool inline-flex items-center justify-center box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
              @click.stop="openVoice"
            >
              <Icon icon="ant-design:audio-outlined" :size="18" />
            </span>
          </el-tooltip>
          <el-tooltip content="发送视频" placement="top">
            <span
              class="message-input__tool inline-flex items-center justify-center box-content p-1.5 cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color)]"
              @click="videoInputRef?.click()"
            >
              <Icon icon="ant-design:video-camera-outlined" :size="18" />
            </span>
          </el-tooltip>
        </div>

        <!-- 群聊 + 群已读开启：发送按钮 + ▼ 下拉菜单（点主按钮普通发送 / 点 ▼ 选「发送回执消息」），对齐微信 PC -->
        <el-dropdown
          v-if="isGroup && MESSAGE_GROUP_READ_ENABLED"
          split-button
          type="primary"
          :disabled="!canSend"
          @click="handleSend()"
          @command="handleSendCommand"
        >
          发 送
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="receipt">发送回执消息</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <!-- 私聊或群已读关闭：普通发送按钮（无群回执入口） -->
        <el-button v-else type="primary" :disabled="!canSend" @click="handleSend()">
          发 送
        </el-button>

        <!-- 表情面板：bottom-full 让 picker 下沿贴工具栏顶部，向上弹出（对齐工具栏左侧首图标） -->
        <FacePicker
          v-model:visible="emojiVisible"
          class="bottom-full left-3 mb-2"
          @select-emoji="insertText"
          @select-face="onSelectFace"
        />

        <!-- 语音录制面板：与表情面板同处工具栏，bottom-full 向上弹出，避免离触发的麦克风图标过远 -->
        <VoiceRecorder v-model="voiceVisible" class="bottom-full left-3 mb-2" @send="onVoiceSend" />
      </div>
    </div>

    <!-- @ 选择浮层：群聊才启用 -->
    <MentionPicker
      ref="mentionRef"
      v-model:visible="mentionVisible"
      :position="mentionPosition"
      :members="groupMembers"
      :search-text="mentionSearchText"
      :can-at-all="canAtAll"
      @select="onMentionSelect"
    />

    <!-- 隐藏的文件选择器 -->
    <input ref="imageInputRef" type="file" accept="image/*" hidden @change="onImagePicked" />
    <input ref="fileInputRef" type="file" hidden @change="onFilePicked" />
    <input ref="videoInputRef" type="file" accept="video/*" hidden @change="onVideoPicked" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import Icon from '@/components/Icon/src/Icon.vue'
import { updateFile } from '@/api/infra/file'
import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { useGroupStore } from '@/views/im/home/store/groupStore'
import { useFriendStore } from '@/views/im/home/store/friendStore'
import { getMemberDisplayName } from '@/views/im/utils/user'
import { useMessage } from '@/hooks/web/useMessage'
import { getCurrentUserId } from '@/utils/auth'
import { useMessageSender } from '@/views/im/home/composables/useMessageSender'
import {
  ensureMediaSizeWithinLimit,
  useMediaUploader
} from '@/views/im/home/composables/useMediaUploader'
import { useMuteOverlay } from '@/views/im/home/composables/useMuteOverlay'
import { isOpenableUrl } from '@/utils/url'
import { getConversationKey } from '@/views/im/utils/conversation'
import { ImConversationType, ImGroupMemberRole, ImContentType } from '@/views/im/utils/constants'
import { DANGEROUS_FILE_EXTENSIONS, MESSAGE_GROUP_READ_ENABLED } from '@/views/im/utils/config'
import {
  serializeMessage,
  type FaceMessage,
  type QuoteMessage,
  withQuotePayload
} from '@/views/im/utils/message'

import FacePicker from './FacePicker.vue'
import MentionPicker from './MentionPicker.vue'
import VoiceRecorder from './VoiceRecorder.vue'
import ReplyPreview from '../message/ReplyPreview.vue'
import type { GroupMemberLite } from '../../../../components/group/GroupMember.vue'
import type { Conversation } from '@/views/im/home/types'

defineOptions({ name: 'ImMessageInput' })

const conversationStore = useConversationStore()
const groupStore = useGroupStore()
const friendStore = useFriendStore()
const message = useMessage()
const { send, sendRaw } = useMessageSender()
const {
  uploadAndSendMedia,
  insertMediaPlaceholder,
  markMediaFailed,
  commitMediaPlaceholder,
  createUploadProgressHandler,
  verifyMediaUploadStillAllowed,
  requireMediaHandler
} = useMediaUploader()
const muteOverlay = useMuteOverlay() // 禁言 / 封禁覆盖层

const editorRef = useTemplateRef<HTMLDivElement>('editorRef')
const imageInputRef = useTemplateRef<HTMLInputElement>('imageInputRef')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const videoInputRef = useTemplateRef<HTMLInputElement>('videoInputRef')
const mentionRef = useTemplateRef<InstanceType<typeof MentionPicker>>('mentionRef')

// ==================== 文本 / 发送 ====================
const canSend = ref(false) // editor 是否有可发送内容；contenteditable 没 v-model，靠 input 事件主动同步

/** 维护 canSend + data-empty（撑起 placeholder）；不写草稿，restoreDraftToEditor 复用避免回流 */
function applyEditorUiState(editor: HTMLDivElement) {
  const raw = editor.textContent || ''
  // canSend 按 trim 后判断（空格 / 换行不算可发送内容）；禁言态直接禁用
  canSend.value = !!raw.trim() && !!conversationStore.activeConversation && !muteOverlay.value
  // data-empty 按原始内容判断：用户敲一个空格也要让 placeholder 隐藏，避免视觉叠加
  // 用属性"存在 / 缺失"而非 'true'/'false' 字符串：CSS [data-empty]::before 命中即可，
  // 比 [data-empty='true'] 直观；浏览器删空后留 <br> → :empty 不命中，所以必须 JS 维护
  if (raw) {
    delete editor.dataset.empty
  } else {
    editor.dataset.empty = ''
  }
}

/** 用户编辑入口的统一收尾：UI 状态同步 + 草稿写回 store（列表立即出 [草稿] 前缀） */
function syncEditorState() {
  const editor = editorRef.value
  if (!editor) {
    return
  }
  applyEditorUiState(editor)
  syncDraftToStore(editor)
}

/** 禁言状态变化时同步发送按钮 */
watch(muteOverlay, () => {
  const editor = editorRef.value
  if (editor) {
    applyEditorUiState(editor)
  }
})

/** 把 editor 当前内容写到会话草稿；plain 由 collectFromEditor 拿，与发送时同源避免列表与实发不一致 */
function syncDraftToStore(editor: HTMLDivElement) {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  // collectFromEditor 已 trim，plain 为空时 store 内部按 clearConversationDraft 处理
  // reply 透传当前快照：setConversationDraft 是整对象替换，不读旧 reply 会让用户每敲一个键就把引用条擦掉
  const { text } = collectFromEditor(editor)
  const existing = conversationStore.getConversationDraft(conversation)
  conversationStore.setConversationDraft(conversation, {
    html: editor.innerHTML,
    plain: text,
    reply: existing?.reply
  })
}

/** 切会话时把 store 里的草稿还原到 editor；只更 UI 不回写草稿，避免 store→editor→store 回流 */
function restoreDraftToEditor() {
  const editor = editorRef.value
  if (!editor) {
    return
  }
  const conversation = conversationStore.activeConversation
  const draft = conversation ? conversationStore.getConversationDraft(conversation) : undefined
  editor.innerHTML = draft?.html || ''
  applyEditorUiState(editor)
  // 把光标移到末尾，让用户接着输入；空内容直接 focus 即可
  if (draft?.html) {
    placeCaretAtEnd(editor)
  }
}

/** 把光标放到 contenteditable 元素的末尾——切回有草稿的会话时光标自然落在尾部，对齐微信 */
function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  if (!sel) {
    return
  }
  sel.removeAllRanges()
  sel.addRange(range)
}

/**
 * 走 DOM 把 editor 内容拼回 plain text + atUserIds
 *
 * 节点分支：
 * 1. text 节点：直接拼 textContent；过程中滤掉 ZWSP（token 首位锚点用，不进发送内容）
 * 2. br：拼 \n（Shift+Enter 走 execCommand('insertLineBreak') 产物）
 * 3. span[data-id]：拼 token 显示文本 + 把 dataset.id 收到 atUserIds（不递归 span 内部）
 * 4. div：浏览器在 contenteditable 里默认换行容器，前置 \n 后递归子节点
 * 5. 其他元素：透传，递归子节点
 *
 * atUserIds 走 Set 去重：用户 @ 张三两次时 atUserIds 只出现一次；trim 末尾空白
 */
function collectFromEditor(root: HTMLElement): { text: string; atUserIds: number[] } {
  const userIds: number[] = []
  let text = ''

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += (node.textContent || '').replace(/​/g, '')
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') {
      text += '\n'
      return
    }
    if (tag === 'span' && el.dataset.id) {
      text += el.textContent || ''
      const id = Number(el.dataset.id)
      if (!Number.isNaN(id)) {
        userIds.push(id)
      }
      return
    }
    if (tag === 'div') {
      if (text && !text.endsWith('\n')) {
        text += '\n'
      }
      el.childNodes.forEach(walk)
      return
    }
    el.childNodes.forEach(walk)
  }

  // 直接从 root.childNodes 开始，避免把 root 本身也当元素处理（虽然目前没有特殊样式，但以防未来改动）
  root.childNodes.forEach(walk)
  return {
    text: text.trim(),
    atUserIds: [...new Set(userIds)]
  }
}

/**
 * 发送：从 DOM 收 text + atUserIds → 清空编辑器 → 走 useMessageSender.send
 *
 * 1. 防御：canSend 是 false（trim 后空 / 没激活会话）或 editor 没 mount → 直接 return
 * 2. 收集：DOM walk 拿到要发送的文本 + atUserIds
 * 3. 二次防御：collectFromEditor 走 trim，可能比 syncEditorState 更严格（例如全 ZWSP），仍空就 return
 * 4. 清空 + 同步状态：先清 innerHTML 再 syncEditorState 让 placeholder / canSend 一起回归
 *    （顺序很重要：先清后 sync，否则 sync 看到旧内容会误判）
 * 5. 上送：atUserIds 非空才传，避免发空数组；quote 由 clearConversationDraft 前抓取，确保引用条立即消失
 */
async function handleSend(options?: { receipt?: boolean }) {
  const editor = editorRef.value
  if (!canSend.value || !editor || muteOverlay.value) {
    return
  }
  const { text, atUserIds } = collectFromEditor(editor)
  if (!text) {
    return
  }
  // 1. 抓 quote 后清空 editor + 当前会话草稿（包含 reply）；syncEditorState 后 plain / reply 都为空
  //    store 内部会自动清理，但显式 clearConversationDraft 能立即同步、不依赖 debounce 时序，列表上的 [草稿] 立即消失
  const replyQuote = replyTarget.value
  editor.innerHTML = ''
  if (conversationStore.activeConversation) {
    conversationStore.clearConversationDraft(conversationStore.activeConversation)
  }
  syncEditorState()
  // 2. 发送
  await send(text, {
    atUserIds: atUserIds.length > 0 ? atUserIds : undefined,
    receipt: options?.receipt,
    quote: replyQuote
  })
}

/** 发送按钮 dropdown 菜单回调：选"发送回执消息"时这一次带 receipt=true，每次独立决定 */
function handleSendCommand(command: string) {
  if (command === 'receipt') {
    handleSend({ receipt: true })
  }
}

// ==================== 选区 / 插入 ====================
/**
 * 上次落在 editor 内的 selection（焦点被表情面板等夺走时用来回到原插入点）
 *
 * 监听 document.selectionchange 比 editor.@blur 更可靠：blur 时 selection 已经移走
 */
let savedRange: Range | null = null

/**
 * 走 native execCommand，保留浏览器原生 undo 栈
 *
 * execCommand 在 lib.dom 里被标 @deprecated（IDE 显示删除线），但 'insertText' /
 * 'insertLineBreak' 没有等价的 W3C 标准替代——Range/Selection 自己拼 DOM 会让 Ctrl+Z 失效。
 * 集中到这里调用，调用点不必散落 ts-expect-error；不引入 eslint disable（项目当前
 * @typescript-eslint v7 没有 no-deprecated 规则，加了也无效，反而让 lint 报"规则不存在"）
 */
function nativeExec(command: 'insertText' | 'insertLineBreak', value?: string) {
  document.execCommand(command, false, value)
}

/**
 * document selectionchange 监听：把落在 editor 内的 selection 缓存到 savedRange，
 * insertText 在焦点被偷走后用它把光标恢复到原插入点
 */
function onSelectionChange() {
  const editor = editorRef.value
  const sel = window.getSelection()
  if (!editor || !sel || sel.rangeCount === 0) {
    return
  }
  const range = sel.getRangeAt(0)
  if (editor.contains(range.startContainer)) {
    savedRange = range.cloneRange()
  }
}

/**
 * 点击 editor / picker 外部时关掉浮层，避免输入 @keyword 后用户点别处浮层不消失
 *
 * 用 mousedown 而非 click：click 在某些浏览器里 picker 元素消失后回不到原 target，会被吞掉
 */
function onDocMousedown(e: MouseEvent) {
  if (!mentionVisible.value) {
    return
  }
  const target = e.target as Node | null
  if (!target) {
    return
  }
  if (editorRef.value?.contains(target)) {
    return
  }
  // picker 是 fixed 定位的兄弟节点，不在 editor 子树里；用类名定位
  const pickerEl = document.querySelector('.message-input__mention-picker')
  if (pickerEl?.contains(target)) {
    return
  }
  closeMention()
}

onMounted(() => {
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('mousedown', onDocMousedown)
  restoreDraftToEditor()
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('mousedown', onDocMousedown)
})

/**
 * 切会话时还原对方的草稿到 editor
 *
 * 同步关 @ / 表情 / 语音浮层并清 savedRange：
 * - mentionRange / savedRange 旧引用还指向上一会话的 DOM 节点，不清下次插 token 会落错位置
 * - 语音录制弹窗保留时，录完触发的 onVoiceSend 会读当前 activeConversation，把语音发到新会话
 */
watch(
  () =>
    conversationStore.activeConversation
      ? getConversationKey(conversationStore.activeConversation)
      : null,
  () => {
    closeMention()
    emojiVisible.value = false
    voiceVisible.value = false
    savedRange = null
    restoreDraftToEditor()
  }
)

/**
 * 把字符串插入光标处（emoji 面板等场景调用）
 *
 * 1. editor 没挂直接返回
 * 2. 焦点回到 editor + 把 savedRange 恢复成当前 selection（emoji 面板偷焦点后还能回原位）
 * 3. nativeExec 插文本，保留浏览器原生 undo 栈
 * 4. 同步 canSend / placeholder
 */
function insertText(str: string) {
  const editor = editorRef.value
  if (!editor) {
    return
  }
  editor.focus()
  if (savedRange) {
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRange)
    }
  }
  // 1. nativeExec 插文本，保留浏览器原生 undo 栈
  nativeExec('insertText', str)
  // 2. 同步 canSend / placeholder
  syncEditorState()
}

/**
 * 粘贴处理
 *
 * 1. 优先扫 clipboardData.items 找文件类型条目（截图、拖入的图片 / 文件等）
 *    - image/* → 走 IMAGE 上传发送
 *    - 其它 file → 走 FILE 上传发送
 *    - 一次粘贴只处理第一个文件，避免一次粘贴发出多条消息
 * 2. 没文件再走 plain text：剥掉外部样式 / 脚本，避免外站 inline style 污染 editor
 *    （contenteditable 默认粘贴会带 HTML，所以模板上 @paste.prevent 拦截）
 */
function onPaste(e: ClipboardEvent) {
  // 1. 优先扫 clipboardData.items 找文件类型条目（截图、拖入的图片 / 文件等）
  const items = e.clipboardData?.items
  if (items?.length) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind !== 'file') {
        continue
      }
      const file = item.getAsFile()
      if (!file) {
        continue
      }
      if (item.type.startsWith('image/')) {
        void uploadAndSendImage(file)
      } else {
        void uploadAndSendFile(file)
      }
      return
    }
  }
  // 2. 没文件再走 plain text：剥掉外部样式 / 脚本，避免外站 inline style 污染 editor
  const text = e.clipboardData?.getData('text/plain') || ''
  if (text) {
    nativeExec('insertText', text)
    // @paste.prevent 阻断了浏览器默认 input 事件，需手动同步草稿 / canSend，与 insertText() 路径一致
    syncEditorState()
  }
}

/** 编辑器内容变化的统一入口：先同步 canSend / placeholder，再判 @ 浮层是否要展开 */
function onInput() {
  syncEditorState()
  detectAtMention()
}

// ==================== 引用 / 回复 ====================

/** 当前会话的「正在回复」对象，从会话草稿派生 */
const replyTarget = computed<QuoteMessage | undefined>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return undefined
  }
  return conversationStore.getConversationDraft(conversation)?.reply
})

/** 清掉当前 reply 但保留正文草稿：点 × 关闭 / 发送即将进行时调 */
function clearConversationReplyDraft() {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  conversationStore.clearConversationReplyDraft(conversation)
}

/** 取走当前 reply 快照（抓一次清一次），媒体上传链路在动手前统一调它拿 quote */
function consumeReply(): QuoteMessage | undefined {
  const quote = replyTarget.value
  if (quote) {
    clearConversationReplyDraft()
  }
  return quote
}

// ==================== 表情 ====================
const emojiVisible = ref(false)
/** 切换表情面板；打开时互斥关掉语音面板 */
function toggleEmoji() {
  emojiVisible.value = !emojiVisible.value
  if (emojiVisible.value) {
    voiceVisible.value = false
  }
}

/** 选中表情贴图：拼 FaceMessage payload 直接走 sendRaw 发送（quote 复用当前 reply 快照） */
async function onSelectFace(face: { url: string; width: number; height: number; name?: string }) {
  if (muteOverlay.value) {
    return
  }
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  const replyQuote = consumeReply()
  const payload = withQuotePayload<FaceMessage>(
    { url: face.url, width: face.width, height: face.height, name: face.name },
    replyQuote
  )
  await sendRaw(ImContentType.FACE, serializeMessage(payload), { conversation })
}

// ==================== @ 成员选择（群聊） ====================
const isGroup = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.GROUP
)

/** 从 groupStore 读当前激活群的成员（切会话时由 MessagePanel 预拉） */
const groupMembers = computed<GroupMemberLite[]>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return []
  }
  const group = groupStore.getGroup(conversation.targetId)
  return (group?.members || []).map((member) => {
    const friend = friendStore.getFriend(member.userId)
    return {
      userId: member.userId,
      showName: getMemberDisplayName(member, friend),
      nickname: member.nickname,
      avatar: member.avatar,
      status: member.status
    }
  })
})

/** 当前用户是否能 @ 全员；群主 + 管理员都允许（对齐微信 PC：admin 也能 @ 所有人） */
const canAtAll = computed<boolean>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return false
  }
  const group = groupStore.getGroup(conversation.targetId)
  if (!group) {
    return false
  }
  const myId = getCurrentUserId()
  if (!myId) {
    return false
  }
  if (group.ownerUserId === myId) {
    return true
  }
  return group.members?.find((member) => member.userId === myId)?.role === ImGroupMemberRole.ADMIN
})

const mentionVisible = ref(false)
const mentionSearchText = ref('')
/** 浮层定位：x 是左边距；top / bottom 二选一—— bottom 锚定（picker 下沿贴 @）是默认，
 *  上方放不下时退化为 top 锚定（picker 上沿贴 @ 下方） */
const mentionPosition = ref<{ x: number; top?: number; bottom?: number }>({ x: 0, bottom: 0 })

/** MentionPicker 的容器宽度（与组件里的 w-50 对齐），用于视口右沿回弹；
 *  高度不再用常量算位置——bottom 锚定后 picker 内容多寡都不影响下沿位置，自然贴 @ */
const MENTION_WIDTH = 200
/** 上方剩余空间至少这么多才放上方，否则翻到下方（避免 picker 被视口顶 / 顶部 chat header 切掉） */
const MENTION_MIN_FIT_ABOVE = 120

/** 当前 @ 关键词在 editor 里的范围；onMentionSelect 用它定位删除 + 插入 token */
let mentionRange: Range | null = null

/** 关闭浮层 + 清掉 range，避免上次残留的 range 被下一次 onMentionSelect 误用 */
function closeMention() {
  mentionVisible.value = false
  mentionRange = null
}

/** 在光标当前文本节点里向前找 @keyword，命中则展开浮层 */
function detectAtMention() {
  if (!isGroup.value) {
    closeMention()
    return
  }
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    closeMention()
    return
  }
  const range = sel.getRangeAt(0)
  if (!range.collapsed || range.startContainer.nodeType !== Node.TEXT_NODE) {
    closeMention()
    return
  }
  const node = range.startContainer
  const offset = range.startOffset
  const before = (node.textContent || '').slice(0, offset)
  // 直接找最近的 @：不限制前置字符，对齐微信"中文紧贴 @ 也能联想"（你好@张三、，@张三 都触发）；
  // 代价是 email-like "test@example.com" 也会触发，但聊天输入里粘 email 的概率低，
  // 且用户按 Esc 即可关浮层；兜底由 [^\s@] 保证一旦输入空格 / 第二个 @ 就停下
  const match = before.match(/@([^\s@]*)$/)
  if (!match) {
    closeMention()
    return
  }
  const atOffset = offset - match[1].length - 1
  mentionRange = document.createRange()
  mentionRange.setStart(node, atOffset)
  mentionRange.setEnd(node, offset)
  mentionSearchText.value = match[1]
  // 锚定在 @ 符号本身，而非当前 caret——否则用户每多敲一个字浮层就跟着右移（"飘"）
  positionMention(node, atOffset)
  mentionVisible.value = true
}

/**
 * 浮层位置：默认 bottom 锚定（picker 下沿贴 @ 上方 8px），上方不够才翻成 top 锚定
 *
 * 1. 计算 @ 字符屏幕坐标 rect
 * 2. 横向：picker 左边对齐 @，越过视口右沿则左推；至少留 8px 留白
 * 3. 纵向：上方剩余 ≥ MENTION_MIN_FIT_ABOVE 走 bottom 锚定（不依赖 picker 实际高度，
 *    无论 1 项还是 N 项 picker 下沿都贴 @）；不够则翻到 @ 下方走 top 锚定
 */
function positionMention(node: Node, atOffset: number) {
  // 1. 计算 @ 字符屏幕坐标 rect
  const anchor = document.createRange()
  anchor.setStart(node, atOffset)
  anchor.collapse(true)
  const rect = anchor.getBoundingClientRect()
  // 2. 横向：picker 左边对齐 @，越过视口右沿则左推；至少留 8px 留白
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENTION_WIDTH - 8))
  // 3. 纵向：上方剩余 ≥ MENTION_MIN_FIT_ABOVE 走 bottom 锚定
  if (rect.top >= MENTION_MIN_FIT_ABOVE) {
    mentionPosition.value = { x: left, bottom: window.innerHeight - rect.top + 8 }
  } else {
    mentionPosition.value = { x: left, top: rect.bottom + 8 }
  }
}

/** editor 内部滚动时同步浮层位置（多行 + 触发滚动条场景） */
function onEditorScroll() {
  if (!mentionVisible.value || !mentionRange) {
    return
  }
  positionMention(mentionRange.startContainer, mentionRange.startOffset)
}

function onMentionSelect(member: GroupMemberLite) {
  const editor = editorRef.value
  if (!editor || !mentionRange) {
    return
  }
  // 删 @keyword，插入 contenteditable=false 的 token：
  // 删除时整段消除 + 不会被光标拆穿；data-id 是后续 collectFromEditor 收 atUserIds 的钩子
  // token 文本固定走真实昵称：群里所有成员看到的字面量一致，避免我侧的好友备注 / 群昵称污染发送文本
  mentionRange.deleteContents()
  const span = document.createElement('span')
  span.className = 'mention-token'
  span.dataset.id = String(member.userId)
  span.contentEditable = 'false'
  span.textContent = `@${member.nickname || member.showName}`
  mentionRange.insertNode(span)
  // token 在 editor 首位时，contenteditable=false 边缘会让光标无法挪到 token 前
  // 补一个零宽空格 ​ 当锚点；DOM walk 时会被滤掉，不进入发送内容
  const prev = span.previousSibling
  if (!prev || (prev.nodeType === Node.TEXT_NODE && !prev.textContent)) {
    span.parentNode?.insertBefore(document.createTextNode('​'), span)
  }
  // 在 token 后补一个 NBSP，让光标可以继续输入；NBSP 比普通空格更稳，避免被浏览器折叠
  const space = document.createTextNode(' ')
  span.parentNode?.insertBefore(space, span.nextSibling)
  // 光标移到 NBSP 之后
  const sel = window.getSelection()
  if (sel) {
    const newRange = document.createRange()
    newRange.setStartAfter(space)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
  }
  closeMention()
  editor.focus()
  syncEditorState()
}

/**
 * 键盘事件分发
 *
 * 1. mention 浮层打开时
 *    1.1 ↑/↓ 移动高亮
 *    1.2 Enter 有候选 → 选中；无候选 fall through 到下面的发送分支，避免按 Enter 没反应
 *    1.3 Esc 关浮层
 * 2. Shift+Enter 换行：强制走 br（浏览器默认会插 div，DOM walk 拼接更复杂）
 * 3. 普通 Enter 发送（IME composition 期间不触发，避免选词被误发）
 */
function onKeydown(e: KeyboardEvent) {
  // 1. mention 浮层打开时
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
    if (e.key === 'Enter' && !e.isComposing) {
      if (mentionRef.value?.hasCandidates()) {
        e.preventDefault()
        mentionRef.value?.pickActive()
        return
      }
    }
    if (e.key === 'Escape') {
      closeMention()
      return
    }
  }
  // 2. Shift+Enter 换行：强制走 br（浏览器默认会插 div，DOM walk 拼接更复杂）
  if (e.key === 'Enter' && e.shiftKey && !e.isComposing) {
    e.preventDefault()
    nativeExec('insertLineBreak')
    syncEditorState()
    return
  }
  // 3. 普通 Enter 发送（IME composition 期间不触发，避免选词被误发）
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.isComposing) {
    e.preventDefault()
    handleSend()
  }
}

// ==================== 图片 / 文件 / 语音 上传 ====================

/** 上传前的统一拦截：禁言态 / 无激活会话直接放弃；返回当前 conversation 与抓走的 quote */
function prepareMediaUpload(): { conversation: Conversation; quote?: QuoteMessage } | undefined {
  if (muteOverlay.value) {
    return undefined
  }
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return undefined
  }
  return { conversation, quote: consumeReply() }
}

/** 上传并发送 IMAGE 消息（占位 + 进度 + 真实 url ack 由 useMediaUploader 处理） */
async function uploadAndSendImage(file: File) {
  const context = prepareMediaUpload()
  if (!context) {
    return
  }
  await uploadAndSendMedia({
    file,
    type: ImContentType.IMAGE,
    quote: context.quote,
    conversation: context.conversation
  })
}

/** 上传并发送 FILE 消息；payload 由 mediaTypeHandlers[FILE] 自动拼 url + name + size */
async function uploadAndSendFile(file: File) {
  // 文件名取最后一个 "." 之后的部分；无后缀 / 空字符串都按"未知"放行
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (extension && DANGEROUS_FILE_EXTENSIONS.includes(extension)) {
    message.warning(`不允许发送 .${extension} 类型文件`)
    return
  }
  const context = prepareMediaUpload()
  if (!context) {
    return
  }
  await uploadAndSendMedia({
    file,
    type: ImContentType.FILE,
    quote: context.quote,
    conversation: context.conversation
  })
}

/** 图片选完即上传 + 发送 IMAGE 消息（不放入 editor，由 useMediaUploader 接管占位 / 进度 / ack） */
async function onImagePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    await uploadAndSendImage(file)
  }
}

/** 文件选完即上传 + 发送 FILE 消息（携带原始 name / size 元数据） */
async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    await uploadAndSendFile(file)
  }
}

// ==================== 语音 ====================
const voiceVisible = ref(false)
/** 打开语音录制面板；互斥关掉表情面板 */
function openVoice() {
  voiceVisible.value = true
  emojiVisible.value = false
}
/** VoiceRecorder 录完回传 blob，包成 File 后走通用 uploadAndSendMedia；duration 走 context */
async function onVoiceSend(payload: {
  blob: Blob
  duration: number
  extension: string
  mimeType: string
}) {
  const context = prepareMediaUpload()
  if (!context) {
    return
  }
  const file = new File([payload.blob], `voice-${Date.now()}.${payload.extension}`, {
    type: payload.mimeType
  })
  await uploadAndSendMedia({
    file,
    type: ImContentType.VOICE,
    quote: context.quote,
    conversation: context.conversation,
    context: { voiceDuration: payload.duration }
  })
}

// ==================== 视频 ====================
type VideoProbe = {
  duration?: number
  width?: number
  height?: number
  cover?: Blob
}

const VIDEO_COVER_MAX_DIM = 720 // 封面最长边 cap：聊天列表里的视频封面没必要原视频分辨率，4K 原尺寸 jpeg 1-3MB 太浪费

/**
 * 加载视频本地预览，一次性拿到 metadata（duration / 宽高）+ 首帧封面 blob
 *
 * 一个 video 元素串两件事是为了避免重复 decode：metadata 解完后直接 seek 首帧再截图。
 * 截图失败不抛异常，只让 cover 缺失，保证主流程仍能上传视频本体。
 *
 * finally 里显式断引用是因为：仅 revokeObjectURL 不足以让 video decoder 立即释放，
 * 部分浏览器版本上 4K 视频解码 buffer 可滞留数十 MB 几秒到十几秒，连发几条会累计放大。
 */
async function probeVideoFile(file: File): Promise<VideoProbe> {
  // 1. 准备离屏 video
  // 1.1 muted + preload=metadata：只下载文件头，不预加载整条流
  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.src = objectUrl
  try {
    // 1.2 等 metadata 加载：解出 duration / 宽高才有 seek + 截图的依据
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('video metadata load error'))
    })
    // 1.3 抽元信息：duration 偶有 NaN（极少数损坏文件），软处理为 undefined
    const meta = {
      duration: Number.isFinite(video.duration) ? Math.round(video.duration) : undefined,
      width: video.videoWidth || undefined,
      height: video.videoHeight || undefined
    }

    // 2. 截首帧封面（独立 try：失败仅降级 cover 为空，不影响 meta）
    let cover: Blob | undefined
    try {
      // 2.1 算 seek 时间：0.1s 避开常见的纯黑首帧；时长 < 0.2s 的极短视频退化为 0
      const seekTo = video.duration > 0.2 ? 0.1 : 0
      // 2.2 seek + 3s 超时：currentTime 设为当前值（譬如已经是 0 的极短视频）
      //     部分浏览器不触发 onseeked，promise 会一直 pending 卡死整条链路
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('video seek timeout')), 3000)
        video.onseeked = () => {
          clearTimeout(timer)
          resolve()
        }
        video.onerror = () => {
          clearTimeout(timer)
          reject(new Error('video seek error'))
        }
        video.currentTime = seekTo
      })
      // 2.3 离屏 canvas 等比缩放：长边 cap 720（VIDEO_COVER_MAX_DIM）
      const canvas = document.createElement('canvas')
      const ratio = Math.min(1, VIDEO_COVER_MAX_DIM / Math.max(video.videoWidth, video.videoHeight))
      canvas.width = Math.round(video.videoWidth * ratio)
      canvas.height = Math.round(video.videoHeight * ratio)
      const context = canvas.getContext('2d')
      if (context && canvas.width && canvas.height) {
        // 2.4 当前帧绘到 canvas → toBlob 拿 jpeg；0.8 质量是聊天封面常用甜点
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        cover =
          (await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8)
          )) ?? undefined
        // 2.5 提前释放 canvas backing store（4K 原尺寸 33MB），别等 GC
        canvas.width = 0
        canvas.height = 0
      }
    } catch (e) {
      console.warn('[IM] 视频封面截取失败', e)
    }
    return { ...meta, cover }
  } finally {
    // 3. 显式释放 video 资源
    // 3.1 revoke 本地 objectUrl
    URL.revokeObjectURL(objectUrl)
    // 3.2 解绑事件 + 触发 unload，让 decoder buffer 立即释放（不然可滞留数十 MB 数秒）
    video.onloadedmetadata = null
    video.onseeked = null
    video.onerror = null
    video.removeAttribute('src')
    video.load()
  }
}

/**
 * 上传并发送 VIDEO 消息
 *
 * 1. 立即占位：blob URL 既当 video src 也当 poster，浏览器会拿首帧绘制 cover；status=SENDING + 进度条
 * 2. probe 与视频上传同步起跑；封面上传等 probe 出 cover 后与视频上传竞速
 *    （probe 解码 + 封面上传通常被视频上传时长完全遮蔽，体感节省几百 ms 起步）
 * 3. 视频本体上传必须成功，拿不到 url 就把占位置 FAILED；封面是锦上添花，失败仅日志
 * 4. 视频链路耗时长，上传期间用户切会话则放弃发送（避免落到错误会话里）；切走再切回来不算变化（key 仍相等）
 */
async function uploadAndSendVideo(file: File) {
  if (!ensureMediaSizeWithinLimit(file, ImContentType.VIDEO, message.warning)) {
    return
  }
  const context = prepareMediaUpload()
  if (!context) {
    return
  }
  const { conversation } = context
  const replyQuote = context.quote
  const startKey = getConversationKey(conversation)

  // 1. 立即占位：url 走 blob 让 <video src> 拉首字节渲染；coverUrl 不设 blob
  //    （<video poster> 期待图片资源，传 video blob 在部分浏览器会退化成黑底，不是稳定行为）
  //    cover 等 probe 异步出真实 URL 后由 commit 阶段一起 patch；_localFile 留 file 供失败重试
  //    payload 拼装走 mediaTypeHandlers[VIDEO].build 与 commit 阶段共享同一份逻辑
  const videoHandler = requireMediaHandler(ImContentType.VIDEO)
  const buildPlaceholderContent = (blobUrl: string): string =>
    serializeMessage(withQuotePayload(videoHandler.build(file, blobUrl, {}), replyQuote))
  const { clientMessageId } = insertMediaPlaceholder({
    file,
    type: ImContentType.VIDEO,
    conversation,
    buildContent: buildPlaceholderContent
  })

  // 2. 三路并行起跑（probe 与两条上传无依赖，封面上传等 probe 出 cover 后立即接力）
  // 2.1 视频本体上传：async IIFE 包一层让 await 显式可见（lint 不再误判 floating promise），
  //     失败兜底为 url=undefined，由 step 3 拿不到 url 时收尾
  const videoForm = new FormData()
  videoForm.append('file', file)
  const videoUploadPromise: Promise<{ data?: string }> = (async () => {
    try {
      return (await updateFile(
        videoForm,
        createUploadProgressHandler(conversation, clientMessageId)
      )) as { data?: string }
    } catch (e) {
      console.warn('[IM] 视频本体上传失败', e)
      return { data: undefined }
    }
  })()
  // 2.2 probe 拿元信息 + 封面 blob：解码失败降级为空 probe，不阻断视频上传
  const probePromise = probeVideoFile(file).catch((e): VideoProbe => {
    console.warn('[IM] 视频元信息加载失败，降级为仅 url + size', e)
    return {}
  })
  // 2.3 封面上传：等 probe.cover 出来后接力起跑，与视频上传竞速；失败降级 coverUrl 为空
  const coverUploadPromise = probePromise.then(async (probe) => {
    if (!probe.cover) {
      return { probe, coverUrl: undefined as string | undefined }
    }
    try {
      const coverForm = new FormData()
      coverForm.append(
        'file',
        new File([probe.cover], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' })
      )
      const coverUrl = ((await updateFile(coverForm)) as { data?: string })?.data || undefined
      return { probe, coverUrl }
    } catch (e) {
      console.warn('[IM] 视频封面上传失败', e)
      return { probe, coverUrl: undefined as string | undefined }
    }
  })

  // 3. 收口校验
  // 3.1 等两条上传链路汇合
  const [videoRes, { probe, coverUrl }] = await Promise.all([
    videoUploadPromise,
    coverUploadPromise
  ])
  // 3.2 视频本体没 url：占位置 FAILED，让用户决定重试 / 删除（_localFile 在内存里）
  const url = videoRes?.data
  if (!url) {
    markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
    return
  }
  if (!isOpenableUrl(url)) {
    console.warn('[IM] 视频上传返回了不支持打开的 URL', { url })
    message.warning('上传返回的视频地址不支持打开')
    markMediaFailed(conversation.type, conversation.targetId, clientMessageId)
    return
  }
  const safeCoverUrl = coverUrl && isOpenableUrl(coverUrl) ? coverUrl : undefined
  if (coverUrl && !safeCoverUrl) {
    console.warn('[IM] 视频封面上传返回了不支持打开的 URL', { coverUrl })
  }
  // 3.3 上传后会话校验 + muteOverlay 复查（与 useMediaUploader.uploadAndSendMedia 同一道）
  if (
    !verifyMediaUploadStillAllowed(conversation, startKey, ImContentType.VIDEO, clientMessageId)
  ) {
    return
  }

  // 4. 拼真实 VideoMessage payload，patch 进占位 + 走 sendRaw 复用占位发送
  const realContent = serializeMessage(
    withQuotePayload(
      videoHandler.build(file, url, {
        videoProbe: { duration: probe.duration, width: probe.width, height: probe.height },
        videoCoverUrl: safeCoverUrl
      }),
      replyQuote
    )
  )
  await commitMediaPlaceholder({
    type: ImContentType.VIDEO,
    conversation,
    clientMessageId,
    realContent
  })
}

/** 视频选完即上传 + 发送 VIDEO 消息（不放入 editor，独立链路：probe + 双上传，最终走 commitMediaPlaceholder 收尾） */
async function onVideoPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    await uploadAndSendVideo(file)
  }
}
</script>

<style scoped>
/* el-icon 全局规则 .el-icon{color:var(--color,inherit); font-size:inherit; width:1em; height:1em} 优先级更高，
   用字面选择器 + !important 锁死；颜色取 Element Plus 主题变量，暗色自动切到浅灰 */
.message-input__tool,
.message-input__tool:deep(svg) {
  font-size: 18px !important;
  color: var(--el-text-color-regular) !important;
  fill: currentcolor !important;
}

.message-input__tool:hover,
.message-input__tool:hover:deep(svg) {
  color: var(--el-color-primary) !important;
}

/* 用 data-empty 而非 :empty：浏览器在删空后会留下 <br>，:empty 不命中；data-empty 由 syncEditorState 维护 */
.message-input__editor[data-empty]::before {
  position: absolute;
  color: var(--el-text-color-placeholder);
  pointer-events: none;
  content: attr(data-placeholder);
}

/* @ token 走主色高亮；contenteditable=false 让 backspace 整段删而不是逐字符 */
.message-input__editor :deep(.mention-token) {
  color: var(--el-color-primary);
}
</style>
