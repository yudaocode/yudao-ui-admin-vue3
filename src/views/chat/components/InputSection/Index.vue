<template>
  <view
    class="flex flex-col items-center w-full border-b-1 border-b-gray border-b-solid"
    style="height: 248px; min-height: 248px"
  >
    <view class="flex p-2 w-full" style="height: 32px">
      <Icon icon="ep:apple" color="var(--top-header-text-color)" class="custom-hover" />
      <Icon icon="ep:folder" color="var(--top-header-text-color)" class="custom-hover" />
      <Icon icon="ep:chat-line-square" color="var(--top-header-text-color)" class="custom-hover" />
    </view>
    <ElInput
      type="textarea"
      class="h-full"
      clearable
      v-model="chatStore.inputText"
      input-style="border: none !important; box-shadow: none !important"
      :autosize="{ minRows: 10, maxRows: 11 }"
      placeholder="Press Enter to send"
      @keydown.enter="onEnter"
    />
  </view>
</template>

<script lang="ts" setup>
import TextMessage from '../../model/TextMessage'
import { useChatStoreWithOut } from '../../store/chatstore'
import { CONVERSATION_TYPE } from '../../types/index.d.ts'
import { SendStatus, MessageRole, ContentType } from '../../types/index.d.ts'
import { useUserStoreWithOut } from '../../../../store/modules/user';

defineOptions({ name: 'InputSection' })

const chatStore = useChatStoreWithOut()
const onEnter = () => {
  console.log('enter pressed')
  const msg = createTextMessage(chatStore.inputText)
  chatStore.addMessageToCurrentSession(msg)
  chatStore.setInputText('')
}

const createTextMessage = (content: string): TextMessage => {

  const userStore = useUserStoreWithOut()

  // 部分信息从account信息里面获取
  const msg = new TextMessage(
    '',
    userStore.user.avatar,
    userStore.user.nickname,
    new Date().getTime(),
    false,
    content,
    MessageRole.SELF,
    SendStatus.SENDING,
    chatStore.currentSession?.id || '',
    chatStore.currentSession ? chatStore.currentSession.targetId : 0,
    chatStore.currentSession?.type || CONVERSATION_TYPE.SINGLE,
    chatStore.currentSession?.senderId || ''
  )

  return msg
}
</script>
