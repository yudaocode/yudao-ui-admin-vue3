<template>
  <view
    class="flex flex-col items-center h-full py-2 b-1 b-gray b-solid"
    style="width: 248px; min-width: 248px"
  >
    <view class="flex flex-col w-full">
      <FriendItem
        v-for="(item, index) in friendStore.friendList"
        :key="item.id"
        :index="index"
        :friend="item"
        @click="() => onFriendClick(item)"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import FriendItem from '../FriendItem/Index.vue'
import { useFriendStore } from '../../store/friendstore'
import { onMounted } from 'vue'
import Friend from '../../model/Friend'

defineOptions({ name: 'Friends' })

const friendStore = useFriendStore()
onMounted(() => {
  // set default conversation
})

const onFriendClick = (friend: Friend) => {
  console.log('====>', friend)
  friendStore.setCurrentFriend(friend)
}
</script>
