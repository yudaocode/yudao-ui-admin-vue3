<template>
  <view class="flex h-full flex-1">
    <ToolSection @menu-select-change="toolMenuSelectChange" />
    <Session v-if="chatStore.bussinessType === MENU_LIST_ENUM.CONVERSATION" />
    <view class="flex">
      <Department v-if="chatStore.bussinessType === MENU_LIST_ENUM.FRIENDS" />
      <Friends v-if="chatStore.bussinessType === MENU_LIST_ENUM.FRIENDS" />
    </view>
    <view v-if="chatStore.bussinessType === MENU_LIST_ENUM.CONVERSATION" class="flex w-full flex-col">
      <ChatHeader />
      <ChatMessage />
      <InputSection />
    </view>
    <FriendDetail v-if="chatStore.bussinessType === MENU_LIST_ENUM.FRIENDS && useFriendStore.currentFriend" />
  </view>
</template>

<script lang="ts" setup>
/**
 * TODO: Replace me with comment, and tell the main subject of this page
 */

import ToolSection from '../components/ToolSection/Index.vue'
import Session from '../components/Conversation/index.vue'
import Friends from '../components/Friends/Index.vue'
import Department from '../components/Department/index.vue'
import ChatHeader from '../components/ChatHeader/index.vue'
import ChatMessage from '../components/ChatMessage/index.vue'
import InputSection from '../components/InputSection/index.vue'
import FriendDetail from '../components/FriendDetail/Index.vue'
import { MENU_LIST_ENUM } from '../types/types'
import { useWebSocketStore } from '../store/websocketStore'
import { useFriendStoreWithOut } from '../store/friendstore'
import { useChatStore } from '../store/chatstore'

defineOptions({ name: 'ChatPage' })

const webSocketStore = useWebSocketStore();
const useFriendStore = useFriendStoreWithOut()
const { resetFriendList } = useFriendStore
const chatStore = useChatStore()
const { setBussinessType } = useChatStore()

onMounted(() => {
  webSocketStore.connect()
})

watch(() => chatStore.bussinessType, (newVal) => {
  if (newVal !== MENU_LIST_ENUM.FRIENDS) {
    resetFriendList()
  }
})

const toolMenuSelectChange = (value) => {
  setBussinessType(value)
}
</script>
