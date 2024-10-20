<template>
  <view
    class="flex justify-center w-full border-b-1 border-b-gray border-b-solid flex-1 border-b-1 border-b-gray border-b-solid py-2"
  >
    <view class="flex mt-20" v-if="friendStore.currentFriend != null">
      <el-image
        style="width: 8rem; height: 8rem"
        class="rounded"
        :src="friendStore.currentFriend.avatar"
      />
      <view class="flex flex-col ml-2">
        <label class="font-500 text-black font-size-5">{{ friendStore.currentFriend?.name }}</label>
        <label>{{ friendStore.currentFriend?.description }}</label>
      </view>
    </view>
    <view v-else class="mt-50 flex flex-col items-center">
      <Icon icon="ep:coffee-cup" :size="64" />
      <label>空空如也</label>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useFriendStore } from '../../store/friendstore'

defineOptions({ name: 'FriendDetail' })

const friendStore = useFriendStore()
</script>
