<template>
  <!-- 消息 Tab：左侧会话列表 + 右侧聊天面板 -->
  <div class="flex flex-1 min-w-0 h-full">
    <!-- 左侧会话列表（可拖拽宽度） -->
    <ResizableAside :default-width="260" :storage-key="StorageKeys.asideWidth">
      <!-- 顶部：搜索框 + "+" 号下拉（对齐微信 PC：发起群聊 / 添加朋友）；h-14 与右侧 MessagePanel 头部对齐 -->
      <div
        class="flex flex-shrink-0 gap-2 items-center h-14 px-4 border-b border-[var(--el-border-color-lighter)]"
      >
        <el-input v-model="keyword" placeholder="搜索" clearable class="flex-1">
          <template #prefix>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </el-input>
        <el-dropdown trigger="click" placement="bottom">
          <el-button size="small" circle>
            <Icon icon="ant-design:plus-outlined" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="createGroupVisible = true">
                <Icon icon="ant-design:message-outlined" :size="16" />
                <span>发起群聊</span>
              </el-dropdown-item>
              <el-dropdown-item @click="addFriendVisible = true">
                <Icon icon="ant-design:user-add-outlined" :size="16" />
                <span>添加朋友</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 会话列表主体 -->
      <div class="flex-1 overflow-y-auto">
        <!-- 置顶会话：数量 < 阈值或搜索中直接铺开；否则进入分组模式（独立浅底 + 可选折叠头） -->
        <template v-if="!showPinnedSection">
          <ConversationItem
            v-for="conversation in pinnedConversations"
            :key="getConversationKey(conversation)"
            :conversation="conversation"
          />
        </template>
        <div v-else class="bg-[var(--el-fill-color-light)]">
          <ConversationItem
            v-for="conversation in renderedPinnedConversations"
            :key="getConversationKey(conversation)"
            :conversation="conversation"
          />

          <!-- 折叠头：放在置顶区底部对齐 WeChat mac；展开 / 折叠态共用，仅在还有"可折叠"内容、或当前已展开时出现 -->
          <div
            v-if="pinnedGroups.foldable.length > 0 || pinnedExpanded"
            class="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors text-13px text-[var(--el-text-color-regular)] border-y border-[var(--el-border-color-lighter)] hover:bg-[var(--el-fill-color)]"
            @click="togglePinnedExpanded"
          >
            <span class="flex items-center gap-1.5">
              <Icon icon="ant-design:menu-outlined" :size="14" />
              {{
                pinnedExpanded
                  ? '折叠置顶聊天'
                  : `${pinnedGroups.foldable.length} 个置顶聊天`
              }}
            </span>
            <Icon
              :icon="pinnedExpanded ? 'ant-design:up-outlined' : 'ant-design:down-outlined'"
              :size="11"
              class="text-[var(--el-text-color-placeholder)]"
            />
          </div>
        </div>

        <!-- 普通会话 -->
        <ConversationItem
          v-for="conversation in normalConversations"
          :key="getConversationKey(conversation)"
          :conversation="conversation"
        />

        <div
          v-if="filteredConversations.length === 0"
          class="flex items-center justify-center py-10 text-sm text-[var(--el-text-color-secondary)]"
        >
          {{ keyword ? '没有满足条件的会话' : '暂无会话' }}
        </div>
      </div>
    </ResizableAside>

    <!-- 右侧聊天面板 -->
    <MessagePanel />

    <!-- 添加朋友 / 发起群聊弹窗 -->
    <FriendAddDialog v-model="addFriendVisible" />
    <GroupCreateDialog
      v-model="createGroupVisible"
      :friends="friends"
      @created="handleGroupCreated"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useConversationStore } from '../../store/conversationStore'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { StorageKeys } from '../../../utils/storage'
import { ImConversationType } from '../../../utils/constants'
import { getConversationKey } from '../../../utils/conversation'
import { CommonStatusEnum } from '@/utils/constants'
import type { Conversation, Friend, FriendLite } from '../../types'
import ResizableAside from '../../components/ResizableAside.vue'
import ConversationItem from './components/conversation/ConversationItem.vue'
import MessagePanel from './components/message/MessagePanel.vue'
import FriendAddDialog from '../../components/friend/FriendAddDialog.vue'
import GroupCreateDialog from '../../components/group/GroupCreateDialog.vue'

defineOptions({ name: 'ImMessagePage' })

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()

const keyword = ref('')
const addFriendVisible = ref(false)
const createGroupVisible = ref(false)

const sortedConversations = computed(() => conversationStore.getSortedConversations)

/** 顶部搜索框过滤会话：只按 name 模糊匹配，避免命中 lastContent 等次要字段干扰 */
const filteredConversations = computed(() => {
  const keywordLower = keyword.value.trim().toLowerCase()
  if (!keywordLower) {
    return sortedConversations.value
  }
  return sortedConversations.value.filter((c) =>
    (c.name || '').toLowerCase().includes(keywordLower)
  )
})

// ==================== 置顶相关 ====================

/** 置顶超过该数量时显示折叠入口；以下数量直接铺开（避免单条置顶就出折叠头视觉太重） */
const PINNED_FOLD_THRESHOLD = 3

/** 置顶折叠展开态：localStorage 持久化，刷新后保留用户上次的选择，对齐微信 */
const pinnedExpanded = ref(
  localStorage.getItem(StorageKeys.conversationPinnedExpanded) === 'true'
)

/** toggle + 写盘 */
function togglePinnedExpanded() {
  pinnedExpanded.value = !pinnedExpanded.value
  localStorage.setItem(StorageKeys.conversationPinnedExpanded, String(pinnedExpanded.value))
}

/** 置顶会话：单独切片，给折叠头计数 + 折叠区渲染用 */
const pinnedConversations = computed(() => filteredConversations.value.filter((c) => c.top))

/** 非置顶会话：折叠态下始终铺开在折叠头之下 */
const normalConversations = computed(() => filteredConversations.value.filter((c) => !c.top))

/**
 * 置顶分两堆：visible（折叠头之上 = 未读 + 当前激活）/ foldable（折叠头之下）；一次 partition 完成
 *
 * 当前激活会话也"钉"在 visible：避免点开未读置顶 → 立刻被读 → 列表一闪重排回折叠的体验
 */
const pinnedGroups = computed(() => {
  const visible: Conversation[] = []
  const foldable: Conversation[] = []
  for (const conversation of pinnedConversations.value) {
    if (isActiveConversation(conversation) || hasUnreadBadge(conversation)) {
      visible.push(conversation)
    } else {
      foldable.push(conversation)
    }
  }
  return { visible, foldable }
})

/** 折叠时只渲 visible（未读 / 激活穿透）；展开时渲全部 —— 展开后不分组，避免点击折叠区跨组上跳 */
const renderedPinnedConversations = computed(() =>
  pinnedExpanded.value ? pinnedConversations.value : pinnedGroups.value.visible
)

/** 与会话项右上角红点的可见条件保持一致：免打扰不亮，无未读不亮 */
function hasUnreadBadge(conversation: Conversation): boolean {
  return !conversation.muted && (conversation.unreadCount || 0) > 0
}

/** 是否为当前激活会话 */
function isActiveConversation(conversation: Conversation): boolean {
  const active = conversationStore.activeConversation
  return !!active && getConversationKey(active) === getConversationKey(conversation)
}

/**
 * 是否进入"分组模式"（独立浅底 + 可能有折叠头）：搜索时不分组（用户在找人，别再让折叠挡住）；
 * 置顶数 < 阈值也不分组，避免单条置顶就出折叠头视觉太重
 */
const showPinnedSection = computed(
  () => !keyword.value.trim() && pinnedConversations.value.length >= PINNED_FOLD_THRESHOLD
)

// ==================== 建群相关 ====================

/** GroupCreateDialog 需要全量好友列表来勾选成员，结构与通讯录里好友/群分组保持一致 */
const friends = computed<FriendLite[]>(() =>
  friendStore.getActiveFriends.map((friend: Friend) => ({
    id: friend.friendUserId,
    nickname: friend.nickname,
    avatar: friend.avatar,
    deleted: friend.status === CommonStatusEnum.DISABLE
  }))
)

/** 处理建群成功 */
function handleGroupCreated(groupId: number) {
  // GroupCreateDialog 已经 upsertGroup 把新群写进 store，这里只 get + 打开会话
  const group = groupStore.getGroup(groupId)
  if (!group) {
    return
  }
  conversationStore.openConversation(
    groupId,
    ImConversationType.GROUP,
    group.name,
    group.avatar || '',
    { muted: !!group.muted }
  )
}
</script>
