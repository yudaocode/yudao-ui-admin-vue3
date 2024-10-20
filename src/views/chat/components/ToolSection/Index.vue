<template>
  <view class="flex flex-col items-center bg-gray h-full py-2" style="width: 80px; min-width: 80px">
    <el-avatar shape="square" />
    <icon
      icon="ep:chat-line-round"
      :size="24"
      color="white"
      class="px-4 py-4 mt-1 rounded-2"
      :class="selectItem === MENU_LIST_ENUM.CONVERSATION ? 'bg-red' : ''"
      @click="onConversatonClicked"
    />
    <icon
      icon="ep:avatar"
      :size="24"
      color="white"
      class="px-4 py-4 rounded-2 mt-2"
      :class="selectItem === MENU_LIST_ENUM.FRIENDS ? 'bg-red' : ''"
      @click="onFriendsClicked"
    />
  </view>
</template>

<script lang="ts" setup>
import { MENU_LIST_ENUM } from '../../types/index.d.ts'

defineOptions({ name: 'ToolSection' })

const selectItem = ref(1)

const emit = defineEmits(['menuSelectChange'])
watch(
  () => selectItem.value,
  (newValue) => {
    emit('menuSelectChange', newValue)
  }
)

const onConversatonClicked = () => {
  selectItem.value = MENU_LIST_ENUM.CONVERSATION
}

const onFriendsClicked = () => {
  selectItem.value = MENU_LIST_ENUM.FRIENDS
}
</script>
