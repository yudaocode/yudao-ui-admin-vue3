<template>
  <view
    class="flex items-center w-full border-b-1 border-b-gray border-b-solid"
    style="height: 60px; min-height: 60px"
  >
    <label class="text-black text-size-xl font-medium mx-4">{{
      chatStore.currentSession?.nickname || chatStore.currentSession?.name 
    }}</label>
  </view>
</template>

<script lang="ts" setup>
import { useChatStore } from '../../store/chatstore'

defineOptions({ name: 'ChatHeader' })

const chatStore = useChatStore()
</script>
