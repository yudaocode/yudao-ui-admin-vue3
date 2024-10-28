<template>
  <view
    class="flex flex-col items-start w-full border-b-1 border-b-gray border-b-solid flex-1 border-b-1 border-b-gray border-b-solid py-2 overflow-scroll"
    ref="listBoxRef"
  >
    <template v-for="item in chatStore.currentSession?.msgList">
      <TextMsg
        v-if="item.contentType === ContentType.TEXT"
        :key="item.clientMessageId"
        :message="item"
        class="py-1"
      />
      <ImageMsg
        v-if="item.contentType === ContentType.IMAGE"
        :key="item.clientMessageId"
        :message="item"
        class="py-1"
      />
    </template>
  </view>
</template>

<script lang="ts" setup>
import { useChatStore } from '../../store/chatstore'
import TextMsg from '@/views/chat/components/Message/TextMsg.vue'
import ImageMsg from '@/views/chat/components/Message/ImageMsg.vue'
import { ContentType } from '../../types/index.d.ts'

defineOptions({ name: 'ChatMessage' })

const chatStore = useChatStore()
const listBoxRef = ref<HTMLElement | null>(null)

// TODO @dylan：msg 尽量使用 message 哈。非必要不缩写
const msgListLength = computed(() => {
  return chatStore.currentSession ? chatStore.currentSession.msgList.length : 0
})

const scrollToBottom = () => {
  nextTick(() => {
    if (listBoxRef.value) {
      console.log('scrollToBottom')
      listBoxRef.value.scrollTop = listBoxRef.value.scrollHeight
    }
  })
}

watch(msgListLength, (newLength, oldLength) => {
  if (newLength > oldLength) {
    scrollToBottom()
  }
})

watch(
  () => chatStore.currentSessionIndex,
  () => {
    scrollToBottom()
  }
)
</script>
