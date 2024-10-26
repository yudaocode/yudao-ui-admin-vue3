<template>
  <view class="flex py-2 border-b-gray-3 border-b-solid items-center px-2" :class="bgColor()">
    <el-avatar shape="square" size="default" class="mr-2" :src="props.conversation.avatar" />

    <view class="flex flex-col flex-1 tems-end h-full">
      <label class="text-black-c text-size-sm font-medium text-ellipsis text-nowrap" :class="namefontColor()">{{
        props.conversation.nickname || '' }}</label>
      <label class="text-gray-f text-size-sm text-ellipsis text-nowrap mr-1" :class="timefontColor()">{{ lastMessage
        }}</label>
    </view>
    <view class="flex items-end h-full flex-col">
      <label class="text-gray-f text-size-xs text-nowrap" :class="timefontColor()">{{
        formatPast(new Date(props.conversation.updateTime), 'YYYY/MM/DD')
        }}</label>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { ContentType, ConversationModelType } from '../../types/index.d.ts'
import { formatPast } from '@/utils/formatTime'
import { useChatStore } from '../../store/chatstore'
import TextMessage from '../../model/TextMessage';

defineOptions({ name: 'SessionItem' })

const props = defineProps({
  conversation: {
    type: Object as PropType<ConversationModelType>,
    default: () => { }
  },
  index: Number
})

const chatStore = useChatStore()

const bgColor = () => {
  return props.index === chatStore.currentSessionIndex ? 'bg-blue' : 'bg-white'
}

const namefontColor = () => {
  return props.index === chatStore.currentSessionIndex ? 'text-white' : 'nameColor'
}
const timefontColor = () => {
  return props.index === chatStore.currentSessionIndex ? 'text-white' : 'timeColor'
}


/**
 * TODO: 修改为后端计算，否则在没有打开聊天窗口的时候，没有数据。
 */
const lastMessage = computed(() => {

  if (props.conversation.msgList.length === 0) {
    return props.conversation.lastMessageDescription
  }
  
  const lastIndex = props.conversation.msgList.length - 1
  const lastMessage = props.conversation.msgList[lastIndex]

  if (!lastMessage) {
    return ''
  }

  if (lastMessage.contentType === ContentType.TEXT) {
    return (lastMessage as TextMessage).content
  } else if (lastMessage.contentType === ContentType.IMAGE) {
    return '[图片]'
  } else {
    return '[其他]'
  }
})
</script>

<style lang="scss" scoped>
.timeColor {
  color: #999;
}

.nameColor {
  color: black;
}
</style>
