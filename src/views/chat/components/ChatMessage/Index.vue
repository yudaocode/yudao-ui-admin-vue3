<template>
  <view
    class="flex flex-col items-start w-full border-b-1 border-b-gray border-b-solid flex-1 border-b-1 border-b-gray border-b-solid py-2 overflow-scroll"
  >
    <template v-for="item in chatStore.currentSession?.msgList">
      <TextMsg
        v-if="item.contentType === ContentType.TEXT"
        :key="item.clientMessageId"
        :message="item"
      />
      <ImageMsg
        v-if="item.contentType === ContentType.IMAGE"
        :key="item.clientMessageId"
        :message="item"
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
</script>
