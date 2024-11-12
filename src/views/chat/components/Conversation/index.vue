<template>
  <view class="flex flex-col items-center h-full py-2 b-1 b-gray b-solid" style="width: 258px">
    <view class="flex flex-col w-full">
      <SessionItem
        v-for="(item, index) in chatStore.sessionList"
        :key="item.id" 
        :index="index"
        :conversation="item"
        @click="() => onSessionItemClick(index)"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import SessionItem from '@/views/chat/components/ConversationItem/index.vue'
import { useChatStoreWithOut } from '../../store/chatstore'
import { onMounted } from 'vue'

defineOptions({ name: 'Session' })

const chatStore = useChatStoreWithOut()
const { setCurrentConversation, setCurrentSessionIndex, getConversationList } = useChatStoreWithOut()

onMounted(() => {
  getConversationList()
  // set default conversation
  nextTick(() => {
    setCurrentConversation()
  })
})

const onSessionItemClick = (index: number) => {
  setCurrentSessionIndex(index)
  setCurrentConversation()
}
</script>
