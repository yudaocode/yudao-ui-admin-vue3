<template>
  <view class="flex flex-col items-center bg-gray-2 h-full py-2" style="width: 80px; min-width: 80px">
    <el-avatar shape="square" />

    <div
class="flex flex-col items-center px-3 py-3 mt-4 rounded-2 hover:bg-white"
      :class="chatStore.bussinessType === MENU_LIST_ENUM.CONVERSATION ? 'bg-gray-3' : ''" style="width: 60px;"
      @click="onConversatonClicked">
      <icon icon="ep:chat-line-round" :size="24" color="#409EFF" />
      <span class="text-xs mt-1 text-gray-5">会 话</span>
      <span></span>
    </div>

    <div
class="flex flex-col items-center rounded-2 mt-4  p-3  hover:bg-white"
      :class="chatStore.bussinessType === MENU_LIST_ENUM.FRIENDS ? 'bg-gray-3' : ''" style="width: 60px;" @click="onFriendsClicked">
      <icon icon="ep:avatar" :size="24" color="#409EFF" />
      <span class="text-xs mt-1 text-gray-5">联系人</span>
    </div>

  </view>
</template>

<script lang="ts" setup>
import { useChatStore } from '../../store/chatstore';
import { MENU_LIST_ENUM } from '../../types/types'

defineOptions({ name: 'ToolSection' })

const selectItem = ref(1)
const chatStore = useChatStore()
const { setBussinessType } = useChatStore()

const emit = defineEmits(['menuSelectChange'])
watch(
  () => selectItem.value,
  (newValue) => {
    emit('menuSelectChange', newValue)
  }
)

const onConversatonClicked = () => {
  setBussinessType(MENU_LIST_ENUM.CONVERSATION)
}

const onFriendsClicked = () => {
    setBussinessType(MENU_LIST_ENUM.FRIENDS)
}
</script>
