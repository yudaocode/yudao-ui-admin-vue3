<template>
  <!-- 消息 Tab：左侧会话列表 + 右侧聊天面板 -->
  <div class="flex flex-1 min-w-0 h-full">
    <!-- 左侧会话列表（可拖拽宽度） -->
    <ResizableAside :default-width="260" :storage-key="StorageKeys.asideWidth">
      <!-- 顶部：搜索框 + "+" 号下拉（对齐微信 PC：发起群聊 / 添加朋友） -->
      <div
        class="flex flex-shrink-0 gap-2 items-center px-4 py-2 border-b border-[var(--el-border-color-lighter)]"
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
        <ConversationItem
          v-for="conversation in filteredConversations"
          :key="`${conversation.type}-${conversation.targetId}`"
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
    <AddFriendDialog v-model="addFriendVisible" @added="handleFriendAdded" />
    <CreateGroupDialog
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
import { CommonStatusEnum } from '@/utils/constants'
import type { Friend } from '../../types'
import type { FriendLite } from '../friend/components/FriendItem.vue'
import ResizableAside from '../../components/ResizableAside.vue'
import ConversationItem from './components/conversation/ConversationItem.vue'
import MessagePanel from './components/message/MessagePanel.vue'
import AddFriendDialog from '../friend/components/AddFriendDialog.vue'
import CreateGroupDialog from '../group/components/CreateGroupDialog.vue'

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

/** CreateGroupDialog 需要全量好友列表来勾选成员，结构与 friend / group Tab 保持一致 */
const friends = computed<FriendLite[]>(() =>
  friendStore.getActiveFriends.map((friend: Friend) => ({
    id: friend.friendUserId,
    nickname: friend.nickname,
    avatar: friend.avatar,
    deleted: friend.status === CommonStatusEnum.DISABLE
  }))
)

/** 加好友成功后强制刷新好友列表，让群聊弹窗的勾选项也能看到新好友 */
async function handleFriendAdded() {
  // TODO @AI：添加完后，不要重新啥新，成本太高了。。。
  await friendStore.fetchFriends(true)
}

/** 建群成功后刷新群列表，并直接打开新群会话（自动选中并渲染到右侧 MessagePanel） */
async function handleGroupCreated(groupId: number) {
  // TODO @AI：建群成功后，是不是可以不加载 group；按道理说，新建完，直接写入 groups 里面就好了。这里只负责 get 下；
  await groupStore.fetchGroups(true)
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
