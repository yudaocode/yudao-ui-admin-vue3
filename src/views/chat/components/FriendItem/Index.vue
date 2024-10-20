<template>
  <view class="flex py-2 border-b-gray-3 border-b-solid items-center px-2" :class="bgColor()">
    <el-avatar shape="square" size="default" class="mr-2" :src="friend.avatar" />
    <label>{{ friend.name }}</label>
  </view>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { useFriendStore } from '../../store/friendstore'

import Friend from '../../model/Friend'

defineOptions({ name: 'FriendItem' })

const props = defineProps({
  friend: {
    type: Object as PropType<Friend>,
    default: () => {}
  }
})

const friendStore = useFriendStore()

const bgColor = () => {
  return props.friend.id === friendStore.currentFriend?.id ? 'bg-blue' : 'bg-white'
}
</script>
