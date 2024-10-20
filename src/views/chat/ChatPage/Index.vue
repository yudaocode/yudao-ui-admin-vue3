<template>
  <view class="flex h-full flex-1">
    <ToolSection @menuSelectChange="toolMenuSelectChange" />
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
import Session from '../components/Session/Index.vue'
import Friends from '../components/Friends/Index.vue'
import ChatHeader from '../components/ChatHeader/Index.vue'
import ChatMessage from '../components/ChatMessage/Index.vue'
import InputSection from '../components/InputSection/index.vue'
import FriendDetail from '../components/FriendDetail/Index.vue'
import { MENU_LIST_ENUM } from '../types/index.d.ts'

defineOptions({ name: 'ChatPage' })

const bussinessType = ref(1)

const toolMenuSelectChange = (value) => {
  bussinessType.value = value
}
</script>
