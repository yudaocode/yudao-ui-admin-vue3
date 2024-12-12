<template>
  <view
    class="flex flex-col items-center w-full border-b-1 border-b-gray border-b-solid flex-1 border-b-1 border-b-gray border-b-solid py-2"
  >
    <view class="flex mt-20" v-if="friendStore.currentFriend != null">
      <el-image
        style="width: 8rem; height: 8rem"
        class="rounded"
        :src="friendStore.currentFriend.avatar"
      />
      <view class="flex flex-col ml-4 mt-10">
        <label class="font-500 text-black font-size-5">{{ friendStore.currentFriend?.name || '无名' }}</label>
        <label class="mt-2 text-size-sm">{{ friendStore.currentFriend?.description || '--人生若只如初见' }}</label>
      </view>
    </view>
    <view v-else class="mt-50 flex flex-col items-center">
      <Icon icon="ep:coffee-cup" :size="64" />
      <label>空空如也</label>
    </view>
    <el-button type="primary" class="mt-10" v-if="friendStore.currentFriend != null" @click="onSend"> 发送消息</el-button>

  </view>
</template>

<script lang="ts" setup>
import { useChatStore } from '../../store/chatstore';
import { useFriendStore } from '../../store/friendstore'
import { CONVERSATION_TYPE } from '../../types/types';

defineOptions({ name: 'FriendDetail' })

const friendStore = useFriendStore()
const chatStore = useChatStore()

const onSend = () => {
  const avatar = friendStore.currentFriend?.avatar || ''
  const nickname = friendStore.currentFriend?.name || ''
  chatStore.createConversation(friendStore.currentFriend?.id, CONVERSATION_TYPE.SINGLE, avatar, nickname)
}

</script>
