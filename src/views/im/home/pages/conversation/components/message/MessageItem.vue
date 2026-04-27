<template>
  <!-- TODO @AI：自己发的消息，是不是头像在最右侧； -->
  <!-- TODO @AI：消息内容的气泡，是不是指向自己。 -->
  <!-- TODO @AI：@全部、人的消息高亮；在消息内容里 -->
  <!-- TODO @AI：文件消息，展示的不如微信的好看。可能要优化下； -->
  <!-- 时间分隔线（TIP_TIME=20）：居中灰色时间 -->
  <div
    v-if="isTipTime"
    class="flex items-center justify-center px-4 pt-2.5 pb-0.5 text-12px text-[var(--el-text-color-disabled)]"
  >
    {{ formatTipTime(message.sendTime) }}
  </div>

  <!-- 系统提示文案（TIP_TEXT=21） -->
  <div
    v-else-if="isTipText"
    class="flex items-center justify-center px-4 py-2 text-12px text-[var(--el-text-color-secondary)]"
  >
    {{ tipText }}
  </div>

  <!-- 撤回消息：整行展示灰色 tip 文案 -->
  <div
    v-else-if="isRecall"
    class="flex items-center justify-center px-4 py-2 text-12px text-[var(--el-text-color-secondary)]"
  >
    {{ recallTip }}
  </div>

  <!-- 普通消息气泡 -->
  <div
    v-else
    class="flex gap-2 items-start px-4 py-2"
    :class="{ 'flex-row-reverse': message.selfSend }"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 对方消息：头像在左，点头像弹 UserInfoCard -->
    <UserAvatar
      v-if="!message.selfSend"
      :id="message.senderId"
      :name="message.senderNickName || String(message.senderId)"
      :url="senderAvatar"
      :size="36"
    />

    <div class="flex flex-col gap-0.5 max-w-[70%]" :class="{ 'items-end': message.selfSend }">
      <!-- 群聊对方消息：气泡上方显示发送者昵称 -->
      <div
        v-if="showSenderName"
        class="mb-0.5 text-12px text-[var(--el-text-color-secondary)] leading-tight"
      >
        {{ message.senderNickName || message.senderId }}
      </div>
      <div class="flex gap-1.5 items-center" :class="{ 'flex-row-reverse': message.selfSend }">
        <!-- 消息内容：按 type 走 v-if 分支 -->
        <!-- 文本消息 -->
        <div
          v-if="isText"
          class="px-3.5 py-2.5 text-sm leading-normal break-words whitespace-pre-wrap rounded-lg"
          :class="
            message.selfSend
              ? 'text-black bg-[#95ec69]'
              : 'text-[var(--el-text-color-primary)] bg-[var(--el-fill-color-light)]'
          "
        >
          {{ textContent }}
        </div>
        <!-- 图片消息：点击大图预览，由 <el-image> 自身承接 -->
        <el-image
          v-else-if="isImage && imagePayload"
          class="max-w-[220px] rounded cursor-zoom-in"
          :src="imagePayload.thumbnailUrl || imagePayload.url"
          :preview-src-list="[imagePayload.url]"
          :preview-teleported="true"
          fit="contain"
        />
        <!-- 文件消息 -->
        <div
          v-else-if="isFile && filePayload"
          class="flex gap-2.5 items-center min-w-[220px] max-w-[320px] px-3.5 py-2.5 border rounded cursor-pointer transition-colors"
          :class="
            message.selfSend
              ? 'bg-[#95ec69] border-[var(--el-border-color-lighter)]'
              : 'bg-[var(--el-bg-color)] border-[var(--el-border-color-light)] hover:border-[#409eff]'
          "
          @click="handleFileClick"
        >
          <el-icon class="message-bubble__file-icon flex-shrink-0 !text-[32px]">
            <Document />
          </el-icon>
          <div class="flex-1 min-w-0">
            <div
              class="overflow-hidden text-sm font-medium truncate text-[var(--el-text-color-primary)]"
            >
              {{ filePayload.name }}
            </div>
            <div class="mt-0.5 text-12px text-[var(--el-text-color-secondary)]">
              {{ formatFileSize(filePayload.size) }}
            </div>
          </div>
        </div>
        <!-- 语音消息 -->
        <div
          v-else-if="isVoice && voicePayload"
          class="flex gap-2 items-center min-w-[120px] px-3.5 py-2.5 rounded-lg cursor-pointer"
          :class="message.selfSend ? 'bg-[#95ec69]' : 'bg-[var(--el-fill-color-light)]'"
          @click="handleVoiceClick"
        >
          <el-icon
            class="message-bubble__voice-icon !text-[18px]"
            :class="{ 'im-voice-playing': voicePlaying }"
          >
            <Microphone />
          </el-icon>
          <span class="text-13px text-[var(--el-text-color-primary)]">
            {{ formatSeconds(voicePayload.duration) }}
          </span>
        </div>
        <!-- 视频消息：直接用原生 <video controls> 内嵌播放，poster 取后端给的封面图；
             不接入第三方播放器、不重写 UI，保持和图片 / 文件分支一样的轻量观感 -->
        <video
          v-else-if="isVideo && videoPayload?.url"
          class="max-w-[280px] max-h-[320px] rounded bg-black"
          :src="videoPayload.url"
          :poster="videoPayload.coverUrl"
          controls
          preload="metadata"
        ></video>
        <!-- 视频消息但 payload 解析失败 / 没 url：降级展示，避免出现裸的 [视频消息] -->
        <div
          v-else-if="isVideo"
          class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--el-text-color-secondary)] bg-[var(--el-fill-color-light)]"
        >
          [视频消息]
        </div>
        <!-- 未知类型降级展示 -->
        <div
          v-else
          class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--el-text-color-secondary)] bg-[var(--el-fill-color-light)]"
        >
          [不支持的消息类型]
        </div>

        <!-- 状态区：自己消息展示发送状态 + 已读/群回执；对方消息 + @自己时展示 @徽标 -->
        <div class="flex gap-1.5 items-center text-base">
          <template v-if="message.selfSend">
            <el-icon v-if="message.status === ImMessageStatus.SENDING" class="is-loading">
              <Loading />
            </el-icon>
            <el-icon
              v-else-if="message.status === ImMessageStatus.FAILED"
              color="#f56c6c"
              class="cursor-pointer"
              title="发送失败，点击重试"
              @click="handleResend"
            >
              <WarningFilled />
            </el-icon>
            <!-- 已读态（私聊） -->
            <span
              v-else-if="privateReadLabel"
              class="text-12px whitespace-nowrap"
              :class="
                message.status === ImMessageStatus.READ
                  ? 'text-[#409eff]'
                  : 'text-[var(--el-text-color-secondary)]'
              "
            >
              {{ privateReadLabel }}
            </span>
            <!-- 群回执：点击弹 popover 展示已读 / 未读成员列表 -->
            <MessageReadStatus
              v-else-if="showGroupReadStatus"
              :message="message"
              :group-id="conversationStore.activeConversation?.targetId || 0"
              :group-members="groupMembersForReadStatus"
              class="text-12px whitespace-nowrap text-[var(--el-text-color-secondary)]"
            />
          </template>
          <!-- 群 @ 我提示 -->
          <el-tag
            v-if="!message.selfSend && isAtMe"
            type="danger"
            size="small"
            effect="plain"
            class="ml-1"
          >
            @我
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 自己消息：头像在右，点头像也能弹 UserInfoCard -->
    <UserAvatar
      v-if="message.selfSend"
      :id="userStore.getUser?.id"
      :name="userStore.getUser?.nickname"
      :url="userStore.getUser?.avatar"
      :size="36"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Loading, WarningFilled, Document, Microphone } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

import {
  ImMessageType,
  ImMessageStatus,
  ImGroupReceiptStatus,
  ImConversationType
} from '../../../../../utils/constants'
import { CommonStatusEnum } from '@/utils/constants'
import {
  parseMessage,
  buildRecallTip,
  type TextMessage,
  type ImageMessage,
  type FileMessage,
  type AudioMessage,
  type VideoMessage
} from '../../../../../utils/message'
import { formatSeconds } from '@/utils/formatTime'
import { formatFileSize } from '@/utils/file'
import { useUserStore } from '@/store/modules/user'
import { useConversationStore } from '../../../../store/conversationStore'
import { useGroupStore } from '../../../../store/groupStore'
import { useImUiStore } from '../../../../store/uiStore'
import { useMessageSender } from '../../../../composables/useMessageSender'
import type { Message } from '../../../../types'
import MessageReadStatus from './MessageReadStatus.vue'
import UserAvatar from '../../../../components/UserAvatar.vue'
import type { GroupMemberLite } from '../ChatGroupMember.vue'

defineOptions({ name: 'ImMessageItem' })

const props = defineProps<{
  message: Message
}>()

const userStore = useUserStore()
const conversationStore = useConversationStore()
const groupStore = useGroupStore()
const uiStore = useImUiStore()
const { recall, sendRaw } = useMessageSender()

/** 是否已撤回：pull / WS 两路都会调 recallMessage 把原消息更新为 type=RECALL，渲染只需识别 type */
const isRecall = computed(() => props.message.type === ImMessageType.RECALL)

/** 时间分隔线 / 系统提示文案 */
const isTipTime = computed(() => props.message.type === ImMessageType.TIP_TIME)
const isTipText = computed(() => props.message.type === ImMessageType.TIP_TEXT)

/** 是否文本消息 */
const isText = computed(() => props.message.type === ImMessageType.TEXT)
const isImage = computed(() => props.message.type === ImMessageType.IMAGE)
const isFile = computed(() => props.message.type === ImMessageType.FILE)
const isVoice = computed(() => props.message.type === ImMessageType.VOICE)
const isVideo = computed(() => props.message.type === ImMessageType.VIDEO)

/** 群聊 + 对方消息 时，在气泡上方显示发送者昵称 */
const showSenderName = computed(() => {
  if (props.message.selfSend) {
    return false
  }
  return conversationStore.activeConversation?.type === ImConversationType.GROUP
})

// 私聊的 conversation.avatar 就是对方头像（openConversation 入参约定）
const senderAvatar = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || props.message.selfSend) {
    return ''
  }
  if (conversation.type === ImConversationType.GROUP) {
    const group = groupStore.getGroup(conversation.targetId)
    return group?.members?.find((m) => m.userId === props.message.senderId)?.avatar || ''
  }
  return conversation.avatar || ''
})

/**
 * 时间分隔线文案：
 * - 今天：HH:mm
 * - 昨天：昨天 HH:mm
 * - 一周内：周X HH:mm
 * - 超过一周：MM-dd HH:mm
 */
function formatTipTime(timestamp: number): string {
  if (!timestamp) {
    return ''
  }
  const d = new Date(timestamp)
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  if (sameDay(d, now)) {
    return hm
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, yesterday)) {
    return `昨天 ${hm}`
  }
  if (now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
    const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${weeks[d.getDay()]} ${hm}`
  }
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`
}

/** 文本内容 */
const textContent = computed(() => parseMessage<TextMessage>(props.message.content)?.content ?? '')

/**
 * TIP_TEXT 文案：后端这里 content 通常是裸字符串（群解散 / 退群 / 踢人 等系统提示），
 * 老接口可能包成 {"content": "..."}；解析得到 .content 就用，否则当裸文案展示，避免出现空行
 */
const tipText = computed(() => {
  const raw = props.message.content || ''
  if (!raw) {
    return ''
  }
  const parsed = parseMessage<TextMessage>(raw)
  if (parsed && typeof parsed.content === 'string') {
    return parsed.content
  }
  return raw
})
const imagePayload = computed(() =>
  isImage.value ? parseMessage<ImageMessage>(props.message.content) : null
)
const filePayload = computed(() =>
  isFile.value ? parseMessage<FileMessage>(props.message.content) : null
)
const voicePayload = computed(() =>
  isVoice.value ? parseMessage<AudioMessage>(props.message.content) : null
)
const videoPayload = computed(() =>
  isVideo.value ? parseMessage<VideoMessage>(props.message.content) : null
)

/** 文件点击 → 新窗口下载 */
function handleFileClick() {
  if (!filePayload.value?.url) {
    return
  }
  window.open(filePayload.value.url, '_blank')
}

/** 语音点击 → 当前只做简单 Audio() 播放；真实项目可接入全局 Player */
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

// 撤回文案：统一用 buildRecallTip 生成，避免离线拉取时 content 还保留着原文而被当成提示语展示。
// recallMessage 写入的 "你撤回了一条消息" 与这里的结果一致，所以实时路径也是相同文案。
const recallTip = computed(() =>
  buildRecallTip(props.message.senderNickName, props.message.selfSend)
)

/** 私聊「已读 / 未读」态（仅对自己发送的私聊消息展示） */
const privateReadLabel = computed(() => {
  if (!props.message.selfSend) {
    return ''
  }
  if (conversationStore.activeConversation?.type !== ImConversationType.PRIVATE) {
    return ''
  }
  if (props.message.status === ImMessageStatus.READ) {
    return '已读'
  }
  if (props.message.status === ImMessageStatus.UNREAD) {
    return '未读'
  }
  return ''
})

/**是否需要显示群回执 popover：自己发的群消息且后端开启了回执（NO_RECEIPT 表示发送时未要求回执，不渲染） */
const showGroupReadStatus = computed(() => {
  if (!props.message.selfSend) {
    return false
  }
  if (conversationStore.activeConversation?.type !== ImConversationType.GROUP) {
    return false
  }
  const status = props.message.receiptStatus
  if (status === undefined || status === null) {
    return false
  }
  return status !== ImGroupReceiptStatus.NO_RECEIPT
})

// 当前群成员（供 MessageReadStatus 计算未读列表用）
const groupMembersForReadStatus = computed<GroupMemberLite[]>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return []
  }
  // TODO @AI：group；注释；
  const g = groupStore.getGroup(conversation.targetId)
  return (g?.members || []).map((m) => ({
    userId: m.userId,
    showNickName: m.displayUserName || m.nickname,
    showImage: m.avatar,
    quit: m.status === CommonStatusEnum.DISABLE
  }))
})

/** 是否 @我（群消息展示小徽标） */
const isAtMe = computed(() => {
  const myId = Number(userStore.getUser?.id) || 0
  if (!myId) {
    return false
  }
  return (props.message.atUserIds || []).includes(myId)
})

/**
 * 右键菜单项：
 * - 删除：从本地消息列表移除（不动后端）
 * - 撤回：仅自己发送、已送达（有 id）的消息
 *
 * TIP_TIME / TIP_TEXT 态不弹菜单
 */
async function handleContextMenu(e: MouseEvent) {
  if (isTipTime.value || isTipText.value) {
    return
  }

  // TODO @AI：右键菜单；注释；
  const items: Array<{ key: string; name: string; disabled?: boolean }> = [
    { key: 'DELETE', name: '删除' }
  ]
  if (props.message.selfSend && !!props.message.id && !isRecall.value) {
    items.push({ key: 'RECALL', name: '撤回' })
  }
  // TODO @AI：右键菜单；注释；
  uiStore.openContextMenu({ x: e.clientX, y: e.clientY }, items, async (item) => {
    if (item.key === 'RECALL') {
      await handleRecall()
    } else if (item.key === 'DELETE') {
      handleDelete()
    }
  })
}

// TODO @AI：注释缺少；
async function handleRecall() {
  try {
    await ElMessageBox.confirm('确定要撤回这条消息吗？', '撤回消息', { type: 'warning' })
    await recall(props.message)
  } catch {
    // 用户取消
  }
}

/**
 * 失败消息点击重试：先把 FAILED 的本地占位消息从列表里去掉，再用同样的 type + content 走一遍 sendRaw，
 * 后者会新建 clientMessageId 并重新跑乐观更新流程
 *
 * 不还原原 needReceipt：群回执是发送时的扩展选项、不会持久化到 message，强行猜测可能与原意不符；
 * 默认按"无回执"重发，绝大多数场景符合预期，要回执就重新发一次更直观
 */
async function handleResend() {
  if (props.message.status !== ImMessageStatus.FAILED) {
    return
  }
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  conversationStore.removeMessage(conversation.type, conversation.targetId, {
    id: props.message.id,
    clientMessageId: props.message.clientMessageId
  })
  await sendRaw(props.message.type, props.message.content, {
    atUserIds: props.message.atUserIds
  })
}

// TODO @AI：注释缺少；
function handleDelete() {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  conversationStore.removeMessage(conversation.type, conversation.targetId, {
    id: props.message.id,
    clientMessageId: props.message.clientMessageId
  })
}
</script>

<style scoped>
/* el-icon 在暗色模式下全局 color 被 .el-icon{color:var(--color)} 干扰；
   这里把 file / voice 图标的 fill 锁死，避免字体色跟随主题变白 */
.message-bubble__file-icon :deep(svg) {
  fill: #409eff !important;
}
.message-bubble__voice-icon :deep(svg) {
  fill: #606266 !important;
}
.message-bubble__voice-icon.im-voice-playing :deep(svg) {
  fill: #409eff !important;
}

/* 播放中的脉冲动画：keyframes 用 UnoCSS 不好写，保留 scoped */
.im-voice-playing {
  animation: im-voice-icon-pulse 0.8s infinite;
}

@keyframes im-voice-icon-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}
</style>
