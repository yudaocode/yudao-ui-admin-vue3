<template>
  <view class="flex h-full flex-1">
    <ToolSection @menu-select-change="toolMenuSelectChange" />
    <Session v-if="bussinessType === MENU_LIST_ENUM.CONVERSATION" />
    <Friends v-if="bussinessType === MENU_LIST_ENUM.FRIENDS" />
    <view v-if="bussinessType === MENU_LIST_ENUM.CONVERSATION" class="flex w-full flex-col">
      <ChatHeader />
      <ChatMessage />
      <InputSection />
    </view>
    <FriendDetail v-if="bussinessType === MENU_LIST_ENUM.FRIENDS" />
  </view>
</template>

<script lang="ts" setup>
/**
 * TODO: Replace me with comment, and tell the main subject of this page
 */

import ToolSection from '../components/ToolSection/Index.vue'
import Session from '../components/Conversation/index.vue'
import Friends from '../components/Friends/Index.vue'
import ChatHeader from '../components/ChatHeader/index.vue'
import ChatMessage from '../components/ChatMessage/index.vue'
import InputSection from '../components/InputSection/index.vue'
import FriendDetail from '../components/FriendDetail/Index.vue'
import { MENU_LIST_ENUM } from '../types/types'
import { useWebSocketStore } from '../store/websocketStore'

defineOptions({ name: 'ChatPage' })

const bussinessType = ref(1)
const webSocketStore = useWebSocketStore();
onMounted(() => {
  webSocketStore.connect()
})

const toolMenuSelectChange = (value) => {
  bussinessType.value = value
}
</script>
