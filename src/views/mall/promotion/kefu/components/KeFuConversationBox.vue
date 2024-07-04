<template>
  <div class="kefu">
    <div
      v-for="(item, index) in conversationList"
      :key="item.id"
      :class="{ active: index === activeConversationIndex }"
      class="kefu-conversation flex justify-between items-center"
      @click="openRightMessage(item, index)"
    >
      <div class="flex justify-center items-center w-100%">
        <el-avatar :src="item.userAvatar" alt="avatar" />
        <div class="ml-10px w-100%">
          <div class="flex justify-between items-center w-100%">
            <span>{{ item.userNickname }}</span>
            <span class="color-[#989EA6]">
              {{ formatDate(item.lastMessageTime) }}
            </span>
          </div>
          <!-- 文本消息 -->
          <template v-if="KeFuMessageContentTypeEnum.TEXT === item.lastMessageContentType">
            <div
              v-dompurify-html="replaceEmoji(item.lastMessageContent)"
              class="last-message flex items-center color-[#989EA6]"
            ></div>
          </template>
          <!-- 图片消息 -->
          <template v-if="KeFuMessageContentTypeEnum.IMAGE === item.lastMessageContentType">
            <div class="last-message flex items-center color-[#989EA6]">【图片消息】</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { KeFuConversationApi, KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { useEmoji } from './tools/emoji'
import { formatDate } from '@/utils/formatTime'
import { KeFuMessageContentTypeEnum } from './tools/constants'

defineOptions({ name: 'KeFuConversationBox' })
const { replaceEmoji } = useEmoji()
const activeConversationIndex = ref(-1) // 选中的会话
const conversationList = ref<KeFuConversationRespVO[]>([]) // 会话列表
const getConversationList = async () => {
  conversationList.value = await KeFuConversationApi.getConversationList()
}
defineExpose({ getConversationList })
const emits = defineEmits<{
  (e: 'change', v: KeFuConversationRespVO): void
}>()
// 打开右侧消息
const openRightMessage = (item: KeFuConversationRespVO, index: number) => {
  activeConversationIndex.value = index
  emits('change', item)
}
const poller = ref<any>(null) // TODO puhui999: 轮训定时器，暂时模拟 websocket
onMounted(() => {
  // TODO puhui999: 轮训相关，功能完善后移除
  if (!poller.value) {
    poller.value = setInterval(() => {
      getConversationList()
    }, 1000)
  }
})
// TODO puhui999: 轮训相关，功能完善后移除
onBeforeUnmount(() => {
  if (!poller.value) {
    return
  }
  clearInterval(poller.value)
})
</script>

<style lang="scss" scoped>
.kefu {
  &-conversation {
    height: 60px;
    padding: 10px;
    background-color: #fff;
    transition: border-left 0.05s ease-in-out; /* 设置过渡效果 */

    .last-message {
      width: 200px;
      overflow: hidden; // 隐藏超出的文本
      white-space: nowrap; // 禁止换行
      text-overflow: ellipsis; // 添加省略号
    }
  }

  .active {
    border-left: 5px #3271ff solid;
    background-color: #eff0f1;
  }
}
</style>
