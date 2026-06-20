<template>
  <!-- 消息 Tab：左侧会话列表 + 右侧聊天面板 -->
  <div class="flex flex-1 min-w-0 h-full">
    <!-- 左侧会话列表（可拖拽宽度） -->
    <ResizableAside :default-width="260" :storage-key="StorageKeys.localStorage.asideWidth">
      <!-- 顶部：搜索框 + "+" 号下拉（对齐微信 PC：发起群聊 / 添加朋友）；h-14 与右侧 MessagePanel 头部对齐 -->
      <div
        class="flex flex-shrink-0 gap-2 items-center h-14 px-4 border-b border-b-solid border-[var(--el-border-color-lighter)]"
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
              <el-dropdown-item @click="handleOpenCreateGroup">
                <Icon icon="ant-design:message-outlined" :size="16" />
                <span>发起群聊</span>
              </el-dropdown-item>
              <el-dropdown-item @click="friendAddDialogRef?.open()">
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
            class="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors text-13px text-[var(--el-text-color-regular)] border-y border-y-solid border-[var(--el-border-color-lighter)] hover:bg-[var(--el-fill-color)]"
            @click="togglePinnedExpanded"
          >
            <span class="flex items-center gap-1.5">
              <Icon icon="ant-design:menu-outlined" :size="14" />
              {{ pinnedExpanded ? '折叠置顶聊天' : `${pinnedGroups.foldable.length} 个置顶聊天` }}
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
    <FriendAddDialog ref="friendAddDialogRef" />
    <GroupCreateDialog ref="createGroupDialogRef" @created="handleGroupCreated" />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useConversationStore } from '../../store/conversationStore'
import { useGroupStore } from '../../store/groupStore'
import { useImUiStore } from '../../store/uiStore'
import { ImConversationType } from '../../../utils/constants'
import { StorageKeys } from '../../../utils/db'
import { filterConversationsByKeyword, getConversationKey } from '../../../utils/conversation'
import { getGroupDisplayName } from '../../../utils/user'
import type { Conversation } from '../../types'
import ResizableAside from '../../components/ResizableAside.vue'
import ConversationItem from './components/conversation/ConversationItem.vue'
import MessagePanel from './components/message/MessagePanel.vue'
import FriendAddDialog from '../../components/friend/FriendAddDialog.vue'
import GroupCreateDialog from '../../components/group/GroupCreateDialog.vue'

defineOptions({ name: 'ImMessagePage' })

const conversationStore = useConversationStore()
const groupStore = useGroupStore()
const uiStore = useImUiStore()

// ==================== 会话列表 ====================

const keyword = ref('')

const sortedConversations = computed(() => conversationStore.getSortedConversationList)

/** 顶部搜索框过滤会话：只按 name 模糊匹配，避免命中 lastContent 等次要字段干扰 */
const filteredConversations = computed(() =>
  filterConversationsByKeyword(sortedConversations.value, keyword.value)
)

// ==================== 置顶相关 ====================

/** 置顶超过该数量时显示折叠入口；以下数量直接铺开（避免单条置顶就出折叠头视觉太重） */
const PINNED_FOLD_THRESHOLD = 3

/** 置顶折叠展开态：localStorage 持久化，刷新后保留用户上次的选择，对齐微信 */
const pinnedExpanded = ref(
  localStorage.getItem(StorageKeys.localStorage.conversationPinnedExpanded) === 'true'
)

/** toggle + 写盘 */
function togglePinnedExpanded() {
  pinnedExpanded.value = !pinnedExpanded.value
  localStorage.setItem(
    StorageKeys.localStorage.conversationPinnedExpanded,
    String(pinnedExpanded.value)
  )
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

/** 置顶折叠时是否上浮到折叠头之上：仅以数字徽标为准；免打扰即便有未读也只展示小红点，不参与上浮 */
function hasUnreadBadge(conversation: Conversation): boolean {
  return !conversation.silent && (conversation.unreadCount || 0) > 0
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

// ==================== 添加朋友 ====================

/** 添加朋友弹窗 ref：右上角 +-下拉「添加朋友」入口调 open() 触发 */
const friendAddDialogRef = ref<InstanceType<typeof FriendAddDialog>>()

// ==================== 建群相关 ====================

/** 发起群聊弹窗 ref：handleOpenCreateGroup 调 open() 打开 */
const createGroupDialogRef = ref<InstanceType<typeof GroupCreateDialog>>()

/** 打开发起群聊弹窗：无锁定项的全局入口 */
function handleOpenCreateGroup() {
  createGroupDialogRef.value?.open()
}

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
    getGroupDisplayName(group),
    group.avatar || '',
    { silent: !!group.silent }
  )
}

// ==================== 滚动到下一个未读 ====================
// 工具栏「消息」Tab 二次点击 → uiStore.nextUnreadJumpNonce 递增 → 本页 watch 滚动到下一条未读
// 含免打扰会话（小红点也算未读）；通过维护 lastJumpedConversationKey 让连续点击顺序穿过整个未读列表

/** 上次命中的未读会话 key；为空时从未读列表头开始 */
let lastJumpedConversationKey: string | null = null

/** 滚动到下一个未读会话（含免打扰）；目标被搜索框过滤或藏在置顶折叠区时先解除拦截再滚 */
async function jumpToNextUnread() {
  // 含免打扰的全量未读会话；空则直接返回
  const unreadList = sortedConversations.value.filter((c) => (c.unreadCount || 0) > 0)
  if (unreadList.length === 0) {
    return
  }
  // 从上次命中那条往后推一位；首次或上次目标已读完不在列表里时，refIndex=-1，从头开始
  const refIndex = lastJumpedConversationKey
    ? unreadList.findIndex((c) => getConversationKey(c) === lastJumpedConversationKey)
    : -1
  const target = unreadList[(refIndex + 1) % unreadList.length]
  const key = getConversationKey(target)
  lastJumpedConversationKey = key

  // 目标被搜索关键字过滤掉：清空 keyword 让它重新进入可见列表
  if (keyword.value && !filteredConversations.value.some((c) => getConversationKey(c) === key)) {
    keyword.value = ''
  }
  // 目标藏在置顶折叠区：临时展开；不写 localStorage，刷新后还原折叠态
  const inFoldable = pinnedGroups.value.foldable.some((c) => getConversationKey(c) === key)
  if (inFoldable && !pinnedExpanded.value) {
    pinnedExpanded.value = true
  }

  // 等 keyword / pinnedExpanded 变化反应到 DOM 后再去取目标元素
  await nextTick()
  const el = document.querySelector(`[data-conversation-key="${key}"]`) as HTMLElement | null
  if (!el) {
    return
  }
  // block: 'start' 把目标会话顶到列表可视区第一行；对齐微信"切到下一个未读=列表的第一条"
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(() => uiStore.nextUnreadJumpNonce, jumpToNextUnread)
</script>
