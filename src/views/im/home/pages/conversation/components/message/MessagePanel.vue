<template>
  <div class="flex flex-1 flex-col min-w-0 bg-[var(--el-fill-color-light)]">
    <template v-if="conversationStore.activeConversation">
      <!-- 顶部：会话名（群聊带人数）+ 右侧功能图标；border 走 scoped CSS（项目 UnoCSS 不带 border-style preflight） -->
      <div
        class="message-panel__header flex items-center justify-between h-14 px-5 bg-[var(--el-fill-color-light)]"
      >
        <span class="flex items-baseline gap-1.5 min-w-0">
          <span
            class="overflow-hidden text-base font-medium truncate text-[var(--el-text-color-primary)]"
          >
            {{ conversationStore.activeConversation?.name || '' }}
          </span>
          <span
            v-if="isGroup && headerMemberCount > 0"
            class="flex-shrink-0 text-sm text-[var(--el-text-color-secondary)]"
          >
            ({{ headerMemberCount }})
          </span>
        </span>
        <div class="flex gap-3 items-center">
          <!-- 聊天历史 -->
          <el-tooltip content="聊天历史" placement="bottom">
            <Icon
              icon="ep:chat-dot-round"
              :size="20"
              class="message-panel__header-icon cursor-pointer"
              @click="historyVisible = true"
            />
          </el-tooltip>
          <!-- 通话入口：暂未开放，先放占位图标对齐微信 PC -->
          <el-tooltip content="通话" placement="bottom">
            <Icon
              icon="ant-design:phone-outlined"
              :size="20"
              class="message-panel__header-icon cursor-pointer"
              @click="handleCall"
            />
          </el-tooltip>
          <!-- 信息抽屉入口 -->
          <el-tooltip :content="isGroup ? '群聊信息' : '聊天信息'" placement="bottom">
            <Icon
              icon="ant-design:ellipsis-outlined"
              :size="20"
              class="message-panel__header-icon cursor-pointer"
              @click="toggleSide"
            />
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
          class="message-panel__message-anchor"
        >
          <MessageItem :message="msg" />
        </div>

        <!-- 回到底部浮动按钮（滚动不在底部时显示） -->
        <transition name="message-panel__jump-fade">
          <div
            v-if="showJumpToBottom"
            class="message-panel__jump-bottom sticky bottom-3 left-1/2 inline-flex gap-1.5 items-center w-fit mx-auto px-3.5 py-1.5 text-xs text-[#409eff] bg-[var(--el-bg-color-overlay)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] cursor-pointer hover:text-white hover:bg-[#409eff]"
            @click="scrollToBottom(true)"
          >
            <Icon icon="ant-design:down-outlined" :size="14" />
            <span v-if="newMessageCount > 0" class="font-medium">
              {{ newMessageCount > 99 ? '99+' : newMessageCount }} 条新消息
            </span>
            <span v-else>回到底部</span>
          </div>
        </transition>
      </div>

      <!-- 底部：输入框 -->
      <MessageInput />

      <!-- 右侧信息抽屉：群聊 / 私聊各自一份 -->
      <ConversationGroupSide
        v-if="isGroup"
        v-model="sideVisible"
        :group="groupInfo"
        :conversation="conversationStore.activeConversation"
        :members="groupMembers"
        :friends="friends"
        @reload="reloadGroupData"
        @open-history="historyVisible = true"
      />
      <ConversationPrivateSide
        v-else
        v-model="sideVisible"
        :conversation="conversationStore.activeConversation"
        :friend="privateFriend"
        :friends="friends"
        @open-history="historyVisible = true"
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
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useConversationStore } from '../../../../store/conversationStore'
import { useFriendStore } from '../../../../store/friendStore'
import { getMemberDisplayName } from '@/views/im/utils/user'
import { useGroupStore } from '../../../../store/groupStore'
import { ImConversationType } from '@/views/im/utils/constants'
import { CommonStatusEnum } from '@/utils/constants'
import MessageItem from './MessageItem.vue'
import MessageInput from '../input/MessageInput.vue'
import MessageHistory from './MessageHistory.vue'
import ConversationGroupSide from '../conversation/ConversationGroupSide.vue'
import ConversationPrivateSide from '../conversation/ConversationPrivateSide.vue'
import type { FriendLite, GroupLite } from '../../../../types'
import type { GroupMemberLite } from '../../../../components/group/GroupMember.vue'

defineOptions({ name: 'ImMessagePanel' })

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const message = useMessage()
const listRef = ref<HTMLElement>()

const messages = computed(() => conversationStore.getActiveMessages)
const isGroup = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.GROUP
)

/**
 * 群聊 header 显示的人数：优先 groupStore.memberCount（无需等成员列表），无值再回退 members.length
 *
 * 之所以不直接用 groupMembers.value.length：成员列表是按需懒加载的，刚切到群时未加载完，
 * 而 groupInfo.memberCount 跟群信息一起来，能更早显示人数避免"先空再蹦"
 */
const headerMemberCount = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return 0
  }
  const group = groupStore.getGroup(conversation.targetId)
  return group?.memberCount ?? group?.members?.length ?? 0
})

const BOTTOM_THRESHOLD = 80 // "是否停留在底部"的阈值：距离底部 < 80px 视为底部
const showJumpToBottom = ref(false) // 当前是否已不在底部（显示"回到底部"按钮）
const newMessageCount = ref(0) // 不在底部期间累计的新消息数

/**
 * 当前激活的群详情：优先 groupStore（带详细字段），未加载完时用 activeConversation 兜底
 *
 * groupStore 是按需懒加载的，初次进群时 ensureGroupData 触发后才会有完整数据；
 * 兜底字段（name / avatar）保证 header 不会"闪空"，notice / ownerId / memberCount
 * 必须等 store 就位才有值（这些字段在 conversation 里没有）
 */
const groupInfo = computed<
  (GroupLite & { notice?: string; remarkNickName?: string; ownerId?: number }) | undefined
>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return undefined
  }
  const group = groupStore.getGroup(conversation.targetId)
  return {
    id: conversation.targetId,
    name: group?.name || conversation.name,
    showGroupName: group?.name || conversation.name,
    showImage: group?.avatar || conversation.avatar,
    notice: group?.notice,
    ownerId: group?.ownerUserId,
    memberCount: group?.memberCount
  }
})

// 群成员列表：直接取 groupStore 缓存，map 成 GroupMemberLite 给下游消费（@-mention / 邀请等）
const groupMembers = computed<GroupMemberLite[]>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return []
  }
  const group = groupStore.getGroup(conversation.targetId)
  return (group?.members || []).map((member) => {
    // 显示名走「好友备注 > 群备注 > 真实昵称」三级；头像走 nickname 保稳定
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

/** 好友列表：群侧用于"邀请入群"，私聊侧用于"+创建群"，统一从 friendStore 映射成 FriendLite 窄接口 */
const friends = computed<FriendLite[]>(() =>
  friendStore.getActiveFriends.map((friend) => ({
    id: friend.friendUserId,
    nickname: friend.nickname,
    avatar: friend.avatar,
    deleted: friend.status === CommonStatusEnum.DISABLE
  }))
)

/** 切换到群会话时同步群信息 + 成员；各自 fire-and-forget + catch，任何一项失败不牵连其它 */
async function ensureGroupData(groupId: number) {
  // 远程异步拉群信息（群名 / 公告 / 群主等元数据）
  groupStore.fetchGroupInfo(groupId).catch((error) => {
    console.warn('[IM MessagePanel] fetchGroupInfo 失败', { groupId }, error)
  })

  // 先从 IDB 同步加载群成员，让首帧立即出成员名 / 头像
  await groupStore.loadGroupMembers(groupId).catch((error) => {
    console.warn('[IM MessagePanel] loadGroupMembers 失败', { groupId }, error)
    return null
  })
  // 再从远程异步拉成员，强刷以跳过 in-memory 短路，每次进群都能拿到最新成员状态
  groupStore.fetchGroupMembers(groupId, true).catch((error) => {
    console.warn('[IM MessagePanel] fetchGroupMembers 失败', { groupId }, error)
  })
}

/** 群信息抽屉里点"刷新"：强拉一次最新群元数据 + 群成员 */
function reloadGroupData() {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return
  }
  groupStore.fetchGroupInfo(conversation.targetId)
  groupStore.fetchGroupMembers(conversation.targetId, true)
}

const historyVisible = ref(false)
const sideVisible = ref(false) // 信息抽屉开关：群聊 / 私聊共用一个 ref

/** 信息抽屉的 toggle：跟 header 上 3 点图标按钮共用 */
function toggleSide() {
  sideVisible.value = !sideVisible.value
}

/** 通话入口：功能未开放，先弹提示占位 */
function handleCall() {
  message.warning('通话功能暂未开放')
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

/**
 * 消息列表滚动事件：刷新"是否在底部"状态
 * - 在底部：隐藏"回到底部"浮窗 + 清掉"未读新消息"计数
 * - 不在底部：显示"回到底部"浮窗，新消息会累计到 newMessageCount
 */
function handleScroll() {
  const dist = distanceFromBottom()
  const atBottom = dist <= BOTTOM_THRESHOLD
  showJumpToBottom.value = !atBottom
  if (atBottom) {
    newMessageCount.value = 0
  }
}

/**
 * 滚到底部：切会话 / 收到新消息（且当前在底部）/ 用户主动点"回到底部" 都走这里
 *
 * 包 nextTick 是为了等 v-for 把新消息真正渲染进 DOM 后再算 scrollHeight，
 * 否则可能滚到的还是旧高度（差最后一条的位置）。smooth=true 走平滑动画，
 * 适合用户主动点击；初始 / 自动滚动用 auto，避免用户感知到动画拖拽
 */
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
  target.classList.add('message-panel__message-anchor--highlight')
  setTimeout(() => {
    target.classList.remove('message-panel__message-anchor--highlight')
  }, 1600)
}

/**
 * 消息数量变化时的滚动跟进策略
 * - 当前在底部 → 自动滚到新底部（用户在"实时跟读"，体验上跟微信一致）
 * - 不在底部 → 累计 newMessageCount，让 sticky 浮窗显示"X 条新消息"，让用户主动点
 */
watch(
  () => messages.value.length,
  (newLen, oldLen) => {
    // 仅处理新增（delta > 0）；删除 / 撤回让 length 减少时不动滚动状态
    const delta = (newLen || 0) - (oldLen || 0)
    if (delta <= 0) {
      return
    }
    // 用 BOTTOM_THRESHOLD（80px）做容差：用户稍微往上翻几行就视作"不在底部"，
    // 否则一直 auto-scroll 会把人正在读的内容顶走，体验糟糕
    const dist = distanceFromBottom()
    if (dist <= BOTTOM_THRESHOLD) {
      scrollToBottom()
    } else {
      newMessageCount.value += delta
      showJumpToBottom.value = true
    }
  }
)

/**
 * 切换会话：清空"在不在底部"相关状态、强制滚到底部、群会话预拉资料
 *
 * immediate:true 让首次进入页面就能正确初始化（无需等到第一次切换）
 */
watch(
  () => conversationStore.activeConversation?.targetId,
  (targetId) => {
    // 切群时上一会话的"未读累计 + 浮窗显示"必须清掉，否则会带到新会话里看起来很突兀
    newMessageCount.value = 0
    showJumpToBottom.value = false
    scrollToBottom()
    // 仅群聊预拉详情 / 成员（私聊对端在首屏 fetchFriends 时就拉了）
    if (targetId && conversationStore.activeConversation?.type === ImConversationType.GROUP) {
      ensureGroupData(targetId)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* 顶部分隔线：UnoCSS 不带 border-style preflight，class 写法只设色 / 宽不出线，走 scoped 显式 shorthand */
.message-panel__header {
  border-bottom: 1px solid var(--el-border-color-light);
}

/* el-icon 全局规则 .el-icon{color:var(--color,inherit)} 优先级胜过 UnoCSS，这里用 :deep + !important 兜底；
   颜色直接引用 Element Plus 主题变量，暗色模式自动切到更亮的灰 */
.message-panel__header-icon,
.message-panel__header-icon :deep(svg) {
  color: var(--el-text-color-regular) !important;
  fill: currentColor !important;
  transition: color 0.15s;
}
.message-panel__header-icon:hover,
.message-panel__header-icon:hover :deep(svg) {
  color: var(--el-color-primary) !important;
}

/* sticky + translate 居中：fit-content 宽度不会撑满，transform 做水平 -50% 偏移；
   UnoCSS 表达 transform+transition 多 value 不太方便，这里用最小的 scoped CSS 承接 */
.message-panel__jump-bottom {
  transform: translateX(-50%);
  transition:
    opacity 0.2s,
    transform 0.2s;
}

/* MessageHistory "定位" 跳过来时短暂高亮：1.6s 后由 JS 移除 class，配合 transition 缓出黄底 */
.message-panel__message-anchor {
  transition: background-color 0.6s ease;
}
.message-panel__message-anchor--highlight {
  background-color: var(--el-color-warning-light-9);
}

/* 回到底部按钮的 Vue transition 钩子类名 */
.message-panel__jump-fade-enter-active,
.message-panel__jump-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.message-panel__jump-fade-enter-from,
.message-panel__jump-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
