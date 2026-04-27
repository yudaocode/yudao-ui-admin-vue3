<template>
  <div class="chat-panel">
    <template v-if="chatStore.activeChat">
      <ChatHeader />
      <MessageList />
      <InputBox />
    </template>
    <div v-else class="chat-panel__empty">
      <span>选择一个会话开始聊天</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useChatStore } from '../store/chatStore'
import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import InputBox from './InputBox.vue'

defineOptions({ name: 'ImChatPanel' })

const chatStore = useChatStore()
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background-color: #f5f5f5;
}

.chat-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}
</style>
