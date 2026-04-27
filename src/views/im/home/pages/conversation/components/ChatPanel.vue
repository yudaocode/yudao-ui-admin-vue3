<template>
  <div class="flex flex-1 flex-col min-w-0 bg-[var(--el-fill-color-light)]">
    <template v-if="conversationStore.activeConversation">
      <!-- 顶部：会话名 + 右侧功能图标 -->
      <div
        class="flex items-center justify-between h-14 px-5 bg-[var(--el-fill-color-light)] border-b border-[var(--el-border-color-light)]"
      >
        <span class="text-base font-medium text-[var(--el-text-color-primary)]">
          {{ conversationStore.activeConversation?.name || '' }}
        </span>
        <div class="flex gap-3 items-center">
          <!-- 聊天历史：从输入区底部工具栏挪到顶部右上角，对齐微信 PC（点击弹窗承接历史消息） -->
          <el-tooltip content="聊天历史" placement="bottom">
            <el-icon
              class="chat-panel__header-icon text-[20px] cursor-pointer"
              @click="historyVisible = true"
            >
              <Tickets />
            </el-icon>
          </el-tooltip>
          <!-- TODO @AI：无论是群聊还是单聊，都是 *** 三个点 -->
          <!-- 私聊：聊天信息抽屉（免打扰 / 置顶） -->
          <el-tooltip v-if="!isGroup" content="聊天信息" placement="bottom">
            <el-icon
              class="chat-panel__header-icon text-[20px] cursor-pointer"
              @click="togglePrivateSide"
            >
              <MoreFilled />
            </el-icon>
          </el-tooltip>
          <!-- 群聊：群聊信息抽屉 -->
          <el-tooltip v-if="isGroup" content="群聊信息" placement="bottom">
            <el-icon class="chat-panel__header-icon text-[20px] cursor-pointer" @click="toggleSide">
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
      </div>

      <!-- 中间：消息列表 -->
      <div
        ref="listRef"
        class="relative flex-1 py-2 overflow-y-auto bg-[var(--el-bg-color-page)]"
        @scroll="handleScroll"
      >
        <div
          v-if="messages.length === 0"
          class="flex items-center justify-center h-full text-sm text-[var(--el-text-color-secondary)]"
        >
          暂无消息
        </div>
        <!-- data-message-id 给 MessageHistory "定位到聊天位置" 用：父级通过 querySelector
             找到这层 wrapper，scrollIntoView + 加高亮 class；id=0 的本地占位消息跳过 -->
        <div
          v-for="msg in messages"
          :key="msg.id || msg.clientMessageId"
          :data-message-id="msg.id || ''"
          class="chat-panel__message-anchor"
        >
          <MessageItem :message="msg" />
        </div>

        <!-- 回到底部浮动按钮（滚动不在底部时显示） -->
        <transition name="chat-panel__jump-fade">
          <div
            v-if="showJumpToBottom"
            class="chat-panel__jump-bottom sticky bottom-3 left-1/2 inline-flex gap-1.5 items-center w-fit mx-auto px-3.5 py-1.5 text-xs text-[#409eff] bg-[var(--el-bg-color-overlay)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] cursor-pointer hover:text-white hover:bg-[#409eff]"
            @click="scrollToBottom(true)"
          >
            <el-icon class="text-sm"><ArrowDown /></el-icon>
            <span v-if="newMessageCount > 0" class="font-medium">
              {{ newMessageCount > 99 ? '99+' : newMessageCount }} 条新消息
            </span>
            <span v-else>回到底部</span>
          </div>
        </transition>
      </div>

      <!-- 底部：输入框
        :key 绑会话标识，切换 A → B 时强制重建组件 → editor / mention range / pendingAtUserIds
        全部清零，避免上一会话的草稿和 @ 被发到新会话 -->
      <!-- TODO @AI：切换时，之前的要被保留！ -->
      <!-- TODO @AI：切换时，用户如果有输入信息，需要把 lastContent 变成输入信息； -->
      <MessageInput :key="messageInputKey" />

      <!-- 右侧信息抽屉：群聊 / 私聊各自一份 -->
      <ChatGroupSide
        v-if="isGroup"
        v-model="sideVisible"
        :group="groupInfo"
        :members="groupMembers"
        :friends="groupFriends"
        @reload="reloadGroupData"
      />
      <ChatPrivateSide
        v-else
        v-model="privateSideVisible"
        :conversation="conversationStore.activeConversation"
        :friend="privateFriend"
      />

      <!-- 历史消息抽屉 -->
      <MessageHistory v-model="historyVisible" @locate="handleLocate" />
    </template>
    <div
      v-else
      class="flex items-center justify-center h-full text-sm text-[var(--el-text-color-secondary)]"
    >
      <span>选择一个会话开始聊天</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, computed } from 'vue'
import { InfoFilled, MoreFilled, ArrowDown, Tickets } from '@element-plus/icons-vue'

import { useConversationStore } from '../../../store/conversationStore'
import { useFriendStore } from '../../../store/friendStore'
import { useGroupStore } from '../../../store/groupStore'
import { ImConversationType } from '../../../../utils/constants'
import { CommonStatusEnum } from '@/utils/constants'
import MessageItem from './message/MessageItem.vue'
import MessageInput from './input/MessageInput.vue'
import MessageHistory from './message/MessageHistory.vue'
import ChatGroupSide from './ChatGroupSide.vue'
import ChatPrivateSide from './ChatPrivateSide.vue'
import type { GroupLite } from '../../group/components/GroupItem.vue'
import type { GroupMemberLite } from './ChatGroupMember.vue'
import type { FriendLite } from '../../friend/components/FriendItem.vue'

defineOptions({ name: 'ImChatPanel' })

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const listRef = ref<HTMLElement>()

const messages = computed(() => conversationStore.getActiveMessages)
const isGroup = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.GROUP
)

/**
 * MessageInput 的 :key —— 切群时强制 unmount + remount，让 editor / mention range /
 * 上一会话草稿全部归零；用 fallback 'none' 避开 activeConversation 短暂为 null 的窗口
 */
const messageInputKey = computed(() => {
  const conv = conversationStore.activeConversation
  return conv ? `${conv.type}-${conv.targetId}` : 'none'
})

/** "是否停留在底部"的阈值：距离底部 < 80px 视为底部 */
const BOTTOM_THRESHOLD = 80

/** 当前是否已不在底部（显示"回到底部"按钮） */
const showJumpToBottom = ref(false)
/** 不在底部期间累计的新消息数 */
const newMessageCount = ref(0)

// 当前激活的群详情：优先 groupStore；回落到 activeConversation 自身字段
const groupInfo = computed<
  (GroupLite & { notice?: string; remarkNickName?: string; ownerId?: number }) | undefined
>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return undefined
  }
  // TODO @AI：group
  const g = groupStore.getGroup(conversation.targetId)
  return {
    id: conversation.targetId,
    name: g?.name || conversation.name,
    showGroupName: g?.name || conversation.name,
    showImage: g?.avatar || conversation.avatar,
    notice: g?.notice,
    ownerId: g?.ownerUserId,
    memberCount: g?.memberCount
  }
})

// 群成员列表：直接取 groupStore 缓存，map 成 GroupMemberLite 给下游消费（@-mention / 邀请等）
const groupMembers = computed<GroupMemberLite[]>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return []
  }
  const group = groupStore.getGroup(conversation.targetId)
  return (group?.members || []).map((member) => ({
    userId: member.userId,
    showNickName: member.displayUserName || member.nickname,
    showImage: member.avatar,
    status: member.status
  }))
})

/** 好友列表（用于邀请对话框） */
const groupFriends = computed<FriendLite[]>(() =>
  // TODO @AI：friend
  friendStore.getActiveFriends.map((f) => ({
    id: f.friendUserId,
    nickname: f.nickname,
    avatar: f.avatar,
    deleted: f.status === CommonStatusEnum.DISABLE
  }))
)

// TODO @AI：注释格式不对。
// 切换到群会话时，自动从后端拉取 group / members / 好友（带缓存）
//
// 三件事各自 fire-and-forget + 各自 catch：之前用 Promise.all 时任意一项失败会让其它
// 已成功的结果只记一条笼统日志，丢掉具体出错点。这里拆开，谁挂谁单独记，不互相牵连
function ensureGroupData(groupId: number) {
  // TODO @AI：错误日志，应该把 groupid 带上；
  groupStore.loadGroupInfo(groupId).catch((e) => {
    console.warn('[IM ChatPanel] loadGroupInfo 失败', e)
  })
  groupStore.loadGroupMembers(groupId).catch((e) => {
    console.warn('[IM ChatPanel] loadGroupMembers 失败', e)
  })
  friendStore.loadFriends().catch((e) => {
    console.warn('[IM ChatPanel] loadFriends 失败', e)
  })
}

// TODO @AI：注释
function reloadGroupData() {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return
  }
  groupStore.loadGroupInfo(conversation.targetId)
  groupStore.loadGroupMembers(conversation.targetId, true)
}

const historyVisible = ref(false)
// TODO @AI：sideVisible 是不是可以包含 sideVisible + privateSideVisible
/** 群聊抽屉的开关：纯 ChatPanel 本地 UI 状态 */
const sideVisible = ref(false) // 群聊抽屉的开关：纯 ChatPanel 本地 UI 状态
/** 私聊抽屉的开关：纯 ChatPanel 本地 UI 状态 */
const privateSideVisible = ref(false)

// TODO @AI：注释
function toggleSide() {
  sideVisible.value = !sideVisible.value
}

// TODO @AI：注释
function togglePrivateSide() {
  privateSideVisible.value = !privateSideVisible.value
}

/** 当前私聊对应的好友（抽屉头部展示用） */
const privateFriend = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.PRIVATE) {
    return undefined
  }
  return friendStore.getFriend(conversation.targetId)
})

/** 计算距离底部的像素 */
function distanceFromBottom(): number {
  const el = listRef.value
  if (!el) {
    return 0
  }
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

// TODO @AI：注释
function handleScroll() {
  const dist = distanceFromBottom()
  const atBottom = dist <= BOTTOM_THRESHOLD
  showJumpToBottom.value = !atBottom
  if (atBottom) {
    newMessageCount.value = 0
  }
}

// TODO @AI：注释
function scrollToBottom(smooth = false) {
  nextTick(() => {
    if (!listRef.value) {
      return
    }
    listRef.value.scrollTo({
      top: listRef.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
    newMessageCount.value = 0
    showJumpToBottom.value = false
  })
}

/**
 * 定位到聊天位置：MessageHistory 行上"定位"按钮触发
 *
 * 1. 先关掉历史弹窗（避免 scroll 时遮挡 + dialog 关闭后让聊天面板拿回焦点）
 * 2. nextTick 等弹窗 leave 动画 / 列表渲染稳定后再查 DOM
 * 3. 按 data-message-id 找 wrapper，scrollIntoView({ block: center }) 让消息落到视口中部
 * 4. 加 --highlight class 短暂高亮，提示用户"就是这条"
 */
async function handleLocate(messageId: number) {
  if (!messageId) {
    return
  }
  await nextTick()
  if (!listRef.value) {
    return
  }
  const target = listRef.value.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`)
  if (!target) {
    return
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  target.classList.add('chat-panel__message-anchor--highlight')
  setTimeout(() => {
    target.classList.remove('chat-panel__message-anchor--highlight')
  }, 1600)
}

/**
 * 消息变化时：
 * - 如果当前在底部，自动跟进滚动
 * - 否则累计 newMessageCount
 */
watch(
  () => messages.value.length,
  (newLen, oldLen) => {
    const delta = (newLen || 0) - (oldLen || 0)
    if (delta <= 0) {
      return
    }
    // TODO @AI：代码块里的注释。
    const dist = distanceFromBottom()
    if (dist <= BOTTOM_THRESHOLD) {
      scrollToBottom()
    } else {
      newMessageCount.value += delta
      showJumpToBottom.value = true
    }
  }
)

// 切换会话：强制滚到底部，并清零累计；若是群会话则预拉群资料
watch(
  () => conversationStore.activeConversation?.targetId,
  (targetId) => {
    // TODO @AI：代码块里的注释。
    newMessageCount.value = 0
    showJumpToBottom.value = false
    scrollToBottom()
    if (targetId && conversationStore.activeConversation?.type === ImConversationType.GROUP) {
      ensureGroupData(targetId)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* el-icon 全局规则 .el-icon{color:var(--color,inherit)} 优先级胜过 UnoCSS，这里用 :deep + !important 兜底；
   颜色直接引用 Element Plus 主题变量，暗色模式自动切到更亮的灰 */
.chat-panel__header-icon,
.chat-panel__header-icon :deep(svg) {
  color: var(--el-text-color-regular) !important;
  fill: currentColor !important;
  transition: color 0.15s;
}
.chat-panel__header-icon:hover,
.chat-panel__header-icon:hover :deep(svg) {
  color: var(--el-color-primary) !important;
}

/* sticky + translate 居中：fit-content 宽度不会撑满，transform 做水平 -50% 偏移；
   UnoCSS 表达 transform+transition 多 value 不太方便，这里用最小的 scoped CSS 承接 */
.chat-panel__jump-bottom {
  transform: translateX(-50%);
  transition:
    opacity 0.2s,
    transform 0.2s;
}

/* MessageHistory "定位" 跳过来时短暂高亮：1.6s 后由 JS 移除 class，配合 transition 缓出黄底 */
.chat-panel__message-anchor {
  transition: background-color 0.6s ease;
}
.chat-panel__message-anchor--highlight {
  background-color: var(--el-color-warning-light-9);
}

/* 回到底部按钮的 Vue transition 钩子类名 */
.chat-panel__jump-fade-enter-active,
.chat-panel__jump-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.chat-panel__jump-fade-enter-from,
.chat-panel__jump-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
