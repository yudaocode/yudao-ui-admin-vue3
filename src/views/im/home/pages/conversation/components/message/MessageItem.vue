<template>
  <!--
    布局约定：DOM 顺序永远是「头像在前 / 气泡在后」，对方消息走默认 row（头像顶左），自己消息靠外层 flex-row-reverse 翻视觉（头像顶右、气泡在头像左侧），跟微信对齐
  -->
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

  <!-- 群广播事件（1501-1520 / 1530）：跟 TIP_TEXT 同样的居中灰色样式，文案按 type 拼装 -->
  <div
    v-else-if="isGroupNotificationMessage"
    class="flex items-center justify-center px-4 py-2 text-12px text-[var(--el-text-color-secondary)]"
  >
    {{ groupNotificationText }}
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
    <!-- 头像：DOM 顺序固定为「头像在前 / 气泡在后」，selfSend 走 flex-row-reverse 翻视觉；
         点头像弹 UserInfoCard 由 UserAvatar 内部承接 -->
    <UserAvatar
      :id="message.selfSend ? userStore.getUser?.id : message.senderId"
      :name="senderRealNickname"
      :url="message.selfSend ? userStore.getUser?.avatar : senderAvatar"
      :size="36"
    />

    <div class="flex flex-col gap-0.5 max-w-[70%]" :class="{ 'items-end': message.selfSend }">
      <!-- 群聊对方消息：气泡上方显示发送者昵称 -->
      <div
        v-if="showSenderName"
        class="mb-0.5 text-12px text-[var(--el-text-color-secondary)] leading-tight"
      >
        {{ senderDisplayName }}
      </div>
      <div class="flex gap-1.5 items-center" :class="{ 'flex-row-reverse': message.selfSend }">
        <!-- 消息内容：按 type 走 v-if 分支 -->
        <!-- 文本消息 -->
        <div
          v-if="isText"
          class="relative px-3.5 py-2.5 text-sm leading-normal break-words whitespace-pre-wrap rounded-lg"
          :class="[
            message.selfSend ? 'message-bubble--self' : 'message-bubble--other',
            message.selfSend
              ? 'text-black bg-[#95ec69]'
              : 'text-[var(--el-text-color-primary)] bg-[var(--el-fill-color-light)]'
          ]"
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
        <!-- 文件消息：对齐微信观感 —— 文件名 + 大小靠左、按扩展名分配的大彩色图标贴右 -->
        <div
          v-else-if="isFile && filePayload"
          class="relative flex gap-3 items-center min-w-[260px] max-w-[340px] px-3.5 py-3 border rounded cursor-pointer transition-colors"
          :class="[
            message.selfSend ? 'message-bubble--self' : 'message-bubble--other',
            message.selfSend
              ? 'bg-[#95ec69] border-[var(--el-border-color-lighter)]'
              : 'bg-[var(--el-bg-color)] border-[var(--el-border-color-light)] hover:border-[#409eff]'
          ]"
          @click="handleFileClick"
        >
          <div class="flex-1 min-w-0">
            <div
              class="overflow-hidden text-sm font-medium truncate text-[var(--el-text-color-primary)]"
            >
              {{ filePayload.name }}
            </div>
            <div class="mt-1 text-12px text-[var(--el-text-color-secondary)]">
              {{ formatFileSize(filePayload.size) }}
            </div>
          </div>
          <Icon
            :icon="fileIconInfo.icon"
            :color="fileIconInfo.color"
            :size="40"
            class="flex-shrink-0"
          />
        </div>
        <!-- 语音消息 -->
        <div
          v-else-if="isVoice && voicePayload"
          class="relative flex gap-2 items-center min-w-[120px] px-3.5 py-2.5 rounded-lg cursor-pointer"
          :class="[
            message.selfSend ? 'message-bubble--self' : 'message-bubble--other',
            message.selfSend ? 'bg-[#95ec69]' : 'bg-[var(--el-fill-color-light)]'
          ]"
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
            <Icon
              v-if="message.status === ImMessageStatus.SENDING"
              icon="ant-design:loading-outlined"
              class="im-loading-spin"
            />
            <Icon
              v-else-if="message.status === ImMessageStatus.FAILED"
              icon="ant-design:warning-filled"
              color="#f56c6c"
              class="cursor-pointer"
              title="发送失败，点击重试"
              @click="handleResend"
            />
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
      <!-- 引用块：气泡下方与气泡同侧；selfSend 时竖线镜像到右侧 -->
      <ReplyPreview
        v-if="quote"
        :quote="quote"
        clickable
        :mirrored="message.selfSend"
        class="max-w-[280px]"
        @locate="emit('locate', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import {
  ImMessageType,
  ImMessageStatus,
  ImGroupReceiptStatus,
  ImConversationType,
  isGroupNotification
} from '../../../../../utils/constants'
import {
  buildQuoteFromMessage,
  getQuoteFromMessage,
  parseMessage,
  resolveTipText,
  getFileIconInfo,
  type TextMessage,
  type ImageMessage,
  type FileMessage,
  type AudioMessage,
  type VideoMessage
} from '../../../../../utils/message'
import { buildRecallTip } from '../../../../../utils/conversation'
import { formatSeconds } from '@/utils/formatTime'
import { formatFileSize } from '@/utils/file'
import { useUserStore } from '@/store/modules/user'
import { useConversationStore } from '../../../../store/conversationStore'
import { useGroupStore } from '../../../../store/groupStore'
import { useFriendStore } from '../../../../store/friendStore'
import { useDraftStore } from '../../../../store/draftStore'
import {
  getMemberDisplayName,
  getSenderDisplayName,
  getSenderRealNickname,
  resolveGroupNotificationText
} from '../../../../../utils/user'
import { useImUiStore } from '../../../../store/uiStore'
import { useMessageSender } from '../../../../composables/useMessageSender'
import type { Message } from '../../../../types'
import MessageReadStatus from './MessageReadStatus.vue'
import ReplyPreview from './ReplyPreview.vue'
import UserAvatar from '../../../../components/user/UserAvatar.vue'
import type { GroupMemberLite } from '../../../../components/group/GroupMember.vue'

defineOptions({ name: 'ImMessageItem' })

const props = defineProps<{
  message: Message
}>()

const emit = defineEmits<{
  /** 引用块点击 → MessagePanel 滚定位 + 高亮 */
  locate: [messageId: number]
}>()

const userStore = useUserStore()
const conversationStore = useConversationStore()
const groupStore = useGroupStore()
const friendStore = useFriendStore()
const draftStore = useDraftStore()
const uiStore = useImUiStore()
const { recall, sendRaw } = useMessageSender()
// 仅用 confirm，避免 message 跟 props.message 同名冲突（vue/no-dupe-keys）
const { confirm: confirmDialog } = useMessage()

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

/** 引用对象：气泡内嵌入展示；非引用消息返回 null，模板 v-if 不渲染 */
const quote = computed(() => getQuoteFromMessage(props.message.content))

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
    return group?.members?.find((member) => member.userId === props.message.senderId)?.avatar || ''
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
  const messageDate = new Date(timestamp)
  const now = new Date()
  const pad = (value: number) => value.toString().padStart(2, '0')
  const hourMinute = `${pad(messageDate.getHours())}:${pad(messageDate.getMinutes())}`
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  if (sameDay(messageDate, now)) {
    return hourMinute
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(messageDate, yesterday)) {
    return `昨天 ${hourMinute}`
  }
  if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${weekNames[messageDate.getDay()]} ${hourMinute}`
  }
  return `${pad(messageDate.getMonth() + 1)}-${pad(messageDate.getDate())} ${hourMinute}`
}

/** 文本内容 */
const textContent = computed(() => parseMessage<TextMessage>(props.message.content)?.content ?? '')

/** TIP_TEXT 文案：与 conversationStore.resolveLastContent / MessageHistory.renderContent 共用 helper，避免兼容性逻辑分裂 */
const tipText = computed(() => resolveTipText(props.message.content))

/** 群广播事件（1501-1520 / 1530） */
const isGroupNotificationMessage = computed(() => isGroupNotification(props.message.type))
const groupNotificationText = computed(() => resolveGroupNotificationText(props.message))
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

/** 文件类型图标 + 配色：按扩展名分发，跟 ReplyPreview 共用 getFileIconInfo */
const fileIconInfo = computed(() => getFileIconInfo(filePayload.value?.name))

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

// 撤回文案：buildRecallTip 实时算 sender 名（按 conversation 上下文走 WeChat 优先级）
const recallTip = computed(() => {
  const conversation = conversationStore.activeConversation
  return buildRecallTip(
    props.message.senderId,
    props.message.selfSend,
    conversation?.type ?? 0,
    conversation?.targetId ?? 0
  )
})

/** 头像色卡 fallback 文本：永远是真实昵称，不掺备注 */
const senderRealNickname = computed(() => {
  const conversation = conversationStore.activeConversation
  return getSenderRealNickname(
    props.message.senderId,
    conversation?.type ?? 0,
    conversation?.targetId ?? 0
  )
})

/** 气泡上方发送人显示名（仅群聊对方消息显示）：好友备注 > 群备注 > 真实昵称 */
const senderDisplayName = computed(() => {
  const conversation = conversationStore.activeConversation
  return getSenderDisplayName(
    props.message.senderId,
    conversation?.type ?? 0,
    conversation?.targetId ?? 0
  )
})

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

/** 当前群成员（供 MessageReadStatus 计算未读名单；未加载完时兜底空数组不渲染） */
const groupMembersForReadStatus = computed<GroupMemberLite[]>(() => {
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

/** 是否 @我（群消息展示小徽标） */
const isAtMe = computed(() => {
  const myId = Number(userStore.getUser?.id) || 0
  if (!myId) {
    return false
  }
  return (props.message.atUserIds || []).includes(myId)
})

/** 右键菜单 key 常量；push 端和分发端从同一处取，typo 编译期就能抓 */
const MENU_KEYS = {
  REPLY: 'REPLY',
  RECALL: 'RECALL',
  DELETE: 'DELETE'
} as const
type MenuKey = (typeof MENU_KEYS)[keyof typeof MENU_KEYS]

/** 撤回时间窗：自己发送的消息超过这个时长就不能再撤回，菜单回退为「删除」（对齐微信 2 分钟） */
const RECALL_WINDOW_MS = 2 * 60 * 1000

/**
 * 右键菜单项：
 * - 引用：已落库（id≠0）+ 未撤回的消息可引用，引用块写入 draftStore.reply
 * - 撤回 / 删除：互斥；自己发送 + 已落库 + 未撤回 + 2 分钟内显示「撤回」（推服务器），其它显示「删除」（仅本地清）
 *
 * TIP_TIME / TIP_TEXT 态不弹菜单
 */
async function handleContextMenu(e: MouseEvent) {
  if (isTipTime.value || isTipText.value) {
    return
  }

  const items: Array<{
    key: MenuKey
    name: string
    disabled?: boolean
    divided?: boolean
    danger?: boolean
    icon?: string
  }> = []
  // 「引用」：已落库（id≠0）+ 未撤回；本地占位消息（id=0）不允许引用，避免引用一条还没拿到 id 的消息
  if (!!props.message.id && !isRecall.value) {
    items.push({
      key: MENU_KEYS.REPLY,
      name: '引用',
      icon: 'bxs:quote-alt-left'
    })
  }
  // 「撤回 / 删除」二选一：
  // - 自己发送 + 已落库（id≠0）+ 未撤回 + 在撤回窗口内 → 撤回（推服务器把消息态置 RECALL）
  // - 其它（对方消息 / 已撤回 / 超出撤回窗口）→ 删除（仅本地清，不动后端）
  // divided 把这一项和上面的「引用」隔开，danger 显红对齐微信
  const canRecall =
    props.message.selfSend &&
    !!props.message.id &&
    !isRecall.value &&
    Date.now() - props.message.sendTime <= RECALL_WINDOW_MS
  if (canRecall) {
    items.push({
      key: MENU_KEYS.RECALL,
      name: '撤回',
      icon: 'ant-design:undo-outlined',
      divided: true,
      danger: true
    })
  } else {
    items.push({
      key: MENU_KEYS.DELETE,
      name: '删除',
      icon: 'ant-design:delete-outlined',
      divided: true,
      danger: true
    })
  }

  // 把菜单渲染交给全局 uiStore（单例，避免每条消息都挂一份菜单 DOM）；callback 按 key 分发
  uiStore.openContextMenu({ x: e.clientX, y: e.clientY }, items, async (item) => {
    if (item.key === MENU_KEYS.REPLY) {
      handleReply()
    } else if (item.key === MENU_KEYS.RECALL) {
      await handleRecall()
    } else if (item.key === MENU_KEYS.DELETE) {
      handleDelete()
    }
  })
}

/** 进入引用模式：把当前消息构造成 QuoteMessage 写入 draftStore，MessageInput 顶部引用条响应式出现 */
function handleReply() {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  draftStore.setReply(conversation, buildQuoteFromMessage(props.message))
}

/**
 * 撤回消息：弹确认框 → 调 useMessageSender.recall → 后端通过 WS RECALL 事件推回，
 * websocketStore 把对应 message 的 type 改成 RECALL，UI 自动切到"XX 撤回了一条消息"
 *
 * 不做乐观撤回：失败 / 超时 / 后端拒绝时本端状态可能与服务端漂移，统一让 WS 回推最稳
 */
async function handleRecall() {
  try {
    await confirmDialog('确定要撤回这条消息吗？', '撤回消息')
    await recall(props.message)
  } catch {}
}

/**
 * 失败消息点击重试：先把 FAILED 的本地占位消息从列表里去掉，再用同样的 type + content 走一遍 sendRaw，
 * 后者会新建 clientMessageId 并重新跑乐观更新流程
 *
 * 不还原原 receipt：群回执是发送时的扩展选项、不会持久化到 message，强行猜测可能与原意不符；
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

/**
 * 删除消息：本地软删，仅从 conversationStore.messages 移除，不调后端
 * 区别于"撤回"：服务端没动，多端登录时其它客户端 / 群里其他人依然能看到这条
 */
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
/* 气泡尾巴：小三角伪元素，指向对应头像（对方在左、自己在右），对齐微信观感
   - 用 border 4 边色画三角：透明 3 边 + 实色 1 边，省一张图片
   - 颜色对应气泡背景，留 1px 视觉吃进去；UnoCSS 写不顺手，索性用 scoped CSS */
.message-bubble--other::before,
.message-bubble--self::before {
  content: '';
  position: absolute;
  top: 12px;
  width: 0;
  height: 0;
  border-style: solid;
}
.message-bubble--other::before {
  left: -5px;
  border-width: 5px 6px 5px 0;
  border-color: transparent var(--el-fill-color-light) transparent transparent;
}
.message-bubble--self::before {
  right: -5px;
  border-width: 5px 0 5px 6px;
  border-color: transparent transparent transparent #95ec69;
}

/* el-icon 在暗色模式下全局 color 被 .el-icon{color:var(--color)} 干扰；
   这里把 voice 图标的 fill 锁死，避免字体色跟随主题变白；
   file 图标已迁到 Iconify 按扩展名走彩色，不在这里强制 */
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

/* SENDING 状态的转圈动画：el-icon 自带 .is-loading 旋转，迁到 Iconify 后丢了，自己补一份 */
.im-loading-spin {
  animation: im-loading-spin 1s linear infinite;
}
@keyframes im-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
