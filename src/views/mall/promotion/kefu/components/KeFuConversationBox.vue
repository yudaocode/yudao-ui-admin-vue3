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
          <div
            v-dompurify-html="replaceEmoji(item.lastMessageContent)"
            class="last-message flex items-center color-[#989EA6]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { KeFuConversationApi, KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { replaceEmoji } from '@/views/mall/promotion/kefu/components/emoji'
import { formatDate, getNowDateTime } from '@/utils/formatTime'

defineOptions({ name: 'KeFuConversationBox' })
const activeConversationIndex = ref(-1) // 选中的会话
const conversationList = ref<KeFuConversationRespVO[]>([]) // 会话列表
const getConversationList = async () => {
  conversationList.value = await KeFuConversationApi.getConversationList()
  // 测试数据
  for (let i = 0; i < 5; i++) {
    conversationList.value.push({
      id: 1,
      userId: 283,
      userAvatar:
        'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKMezSxtOImrC9lbhwHiazYwck3xwrEcO7VJfG6WQo260whaeVNoByE5RreiaGsGfOMlIiaDhSaA991w/132',
      userNickname: '辉辉鸭' + i,
      lastMessageTime: getNowDateTime(),
      lastMessageContent:
        '[爱心][爱心]你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇你好哇',
      lastMessageContentType: 1,
      adminPinned: false,
      userDeleted: false,
      adminDeleted: false,
      adminUnreadMessageCount: 19
    })
  }
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
