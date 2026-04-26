<template>
  <!-- 消息 Tab：左侧会话列表 + 右侧聊天面板 -->
  <div class="flex flex-1 min-w-0 h-full">
    <!-- 左侧会话列表（可拖拽宽度） -->
    <ResizableAside :default-width="260" :storage-key="StorageKeys.asideWidth('message')">
      <!-- TODO @AI：对齐微信的交互：1）搜索框；2）+ 号：发起群聊、添加好友 -->
      <div
        class="flex flex-shrink-0 items-center h-14 px-4 text-base font-medium text-[var(--el-text-color-primary)] border-b border-[var(--el-border-color-light)]"
      >
        消息
      </div>
      <div class="flex-1 overflow-y-auto">
        <ConversationItem
          v-for="conversation in sortedConversations"
          :key="`${conversation.type}-${conversation.targetId}`"
          :conversation="conversation"
        />
        <div
          v-if="sortedConversations.length === 0"
          class="flex items-center justify-center py-10 text-sm text-[var(--el-text-color-secondary)]"
        >
          暂无会话
        </div>
      </div>
    </ResizableAside>

    <!-- 右侧聊天面板 -->
    <ChatPanel />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { useConversationStore } from '../../store/conversationStore'
import { StorageKeys } from '../../../utils/storage'
import ResizableAside from '../../components/ResizableAside.vue'
import ConversationItem from './components/conversation/ConversationItem.vue'
import ChatPanel from './components/ChatPanel.vue'

defineOptions({ name: 'ImMessagePage' })

const conversationStore = useConversationStore()
const sortedConversations = computed(() => conversationStore.getSortedConversations)
</script>
