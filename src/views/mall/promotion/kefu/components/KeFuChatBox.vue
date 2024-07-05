<template>
  <el-container v-if="showChatBox" class="kefu">
    <el-header>
      <div class="kefu-title">{{ keFuConversation.userNickname }}</div>
    </el-header>
    <el-main class="kefu-content" style="overflow: visible">
      <el-scrollbar ref="scrollbarRef" always height="calc(100vh - 495px)">
        <div ref="innerRef" class="w-[100%] pb-3px">
          <div v-for="(item, index) in messageList" :key="item.id" class="w-[100%]">
            <div class="flex justify-center items-center mb-20px">
              <!-- 日期 -->
              <div
                v-if="
                  item.contentType !== KeFuMessageContentTypeEnum.SYSTEM && showTime(item, index)
                "
                class="date-message"
              >
                {{ formatDate(item.createTime) }}
              </div>
              <!-- 系统消息 -->
              <view
                v-if="item.contentType === KeFuMessageContentTypeEnum.SYSTEM"
                class="system-message"
              >
                {{ item.content }}
              </view>
            </div>
            <div
              :class="[
                item.senderType === UserTypeEnum.MEMBER
                  ? `ss-row-left`
                  : item.senderType === UserTypeEnum.ADMIN
                    ? `ss-row-right`
                    : ''
              ]"
              class="flex mb-20px w-[100%]"
            >
              <el-avatar
                v-if="item.senderType === UserTypeEnum.MEMBER"
                :src="keFuConversation.userAvatar"
                alt="avatar"
              />
              <div
                :class="{ 'kefu-message': KeFuMessageContentTypeEnum.TEXT === item.contentType }"
                class="p-10px"
              >
                <!-- 文本消息 -->
                <TextMessageItem :message="item" />
                <!-- 图片消息 -->
                <ImageMessageItem :message="item" />
              </div>
              <el-avatar
                v-if="item.senderType === UserTypeEnum.ADMIN"
                :src="item.senderAvatar"
                alt="avatar"
              />
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-main>
    <el-footer height="230px">
      <div class="h-[100%]">
        <div class="chat-tools flex items-center">
          <EmojiSelectPopover @select-emoji="handleEmojiSelect" />
          <PictureSelectUpload
            class="ml-15px mt-3px cursor-pointer"
            @send-picture="handleSendPicture"
          />
        </div>
        <el-input v-model="message" :rows="6" style="border-style: none" type="textarea" />
        <div class="h-45px flex justify-end">
          <el-button class="mt-10px" type="primary" @click="handleSendMessage">发送</el-button>
        </div>
      </div>
    </el-footer>
  </el-container>
  <el-empty v-else description="请选择左侧的一个会话后开始" />
</template>

<script lang="ts" setup>
import { ElScrollbar as ElScrollbarType } from 'element-plus'
import { KeFuMessageApi, KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import EmojiSelectPopover from './tools/EmojiSelectPopover.vue'
import PictureSelectUpload from './tools/PictureSelectUpload.vue'
import TextMessageItem from './message/TextMessageItem.vue'
import ImageMessageItem from './message/ImageMessageItem.vue'
import { Emoji } from './tools/emoji'
import { KeFuMessageContentTypeEnum } from './tools/constants'
import { isEmpty } from '@/utils/is'
import { UserTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/formatTime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

defineOptions({ name: 'KeFuMessageBox' })
const messageTool = useMessage()
const message = ref('') // 消息
const messageList = ref<KeFuMessageRespVO[]>([]) // 消息列表
const keFuConversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
// 获得消息 TODO puhui999:  先不考虑下拉加载历史消息
const getMessageList = async (conversation: KeFuConversationRespVO) => {
  keFuConversation.value = conversation
  const { list } = await KeFuMessageApi.getKeFuMessagePage({
    pageNo: 1,
    conversationId: conversation.id
  })
  messageList.value = list.reverse()
  // TODO puhui999: 首次加载时滚动到最新消息，如果加载的是历史消息则不滚动
  await scrollToBottom()
}
// 刷新消息列表
const refreshMessageList = () => {
  if (!keFuConversation.value) {
    return
  }
  getMessageList(keFuConversation.value)
}
defineExpose({ getMessageList, refreshMessageList })
// 是否显示聊天区域
const showChatBox = computed(() => !isEmpty(keFuConversation.value))
// 处理表情选择
const handleEmojiSelect = (item: Emoji) => {
  message.value += item.name
}
// 处理图片发送
const handleSendPicture = async (picUrl: string) => {
  // 组织发送消息
  const msg = {
    conversationId: keFuConversation.value.id,
    contentType: KeFuMessageContentTypeEnum.IMAGE,
    content: picUrl
  }
  await sendMessage(msg)
}
// 发送消息
const handleSendMessage = async () => {
  // 1. 校验消息是否为空
  if (isEmpty(unref(message.value))) {
    messageTool.warning('请输入消息后再发送哦！')
    return
  }
  // 2. 组织发送消息
  const msg = {
    conversationId: keFuConversation.value.id,
    contentType: KeFuMessageContentTypeEnum.TEXT,
    content: message.value
  }
  await sendMessage(msg)
}

// 发送消息 【共用】
const sendMessage = async (msg: any) => {
  await KeFuMessageApi.sendKeFuMessage(msg)
  message.value = ''
  // 3. 加载消息列表
  await getMessageList(keFuConversation.value)
  // 滚动到最新消息处
  await scrollToBottom()
}

const innerRef = ref<HTMLDivElement>()
const scrollbarRef = ref<InstanceType<typeof ElScrollbarType>>()
// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  scrollbarRef.value!.setScrollTop(innerRef.value!.clientHeight)
}
/**
 * 是否显示时间
 * @param {*} item - 数据
 * @param {*} index - 索引
 */
const showTime = computed(() => (item: KeFuMessageRespVO, index: number) => {
  if (unref(messageList.value)[index + 1]) {
    let dateString = dayjs(unref(messageList.value)[index + 1].createTime).fromNow()
    return dateString !== dayjs(unref(item).createTime).fromNow()
  }
  return false
})
</script>

<style lang="scss" scoped>
.kefu {
  &-title {
    border-bottom: #e4e0e0 solid 1px;
    height: 60px;
    line-height: 60px;
  }

  &-content {
    .ss-row-left {
      justify-content: flex-start;

      .kefu-message {
        margin-left: 20px;
        position: relative;

        &::before {
          content: '';
          width: 10px;
          height: 10px;
          left: -19px;
          top: calc(50% - 10px);
          position: absolute;
          border-left: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-top: 5px solid transparent;
          border-right: 5px solid #ffffff;
        }
      }
    }

    .ss-row-right {
      justify-content: flex-end;

      .kefu-message {
        margin-right: 20px;
        position: relative;

        &::after {
          content: '';
          width: 10px;
          height: 10px;
          right: -19px;
          top: calc(50% - 10px);
          position: absolute;
          border-left: 5px solid #ffffff;
          border-bottom: 5px solid transparent;
          border-top: 5px solid transparent;
          border-right: 5px solid transparent;
        }
      }
    }

    // 消息气泡
    .kefu-message {
      color: #333;
      border-radius: 5px;
      box-shadow: 3px 5px 15px rgba(0, 0, 0, 0.2);
      padding: 5px 10px;
      width: auto;
      max-width: 50%;
      text-align: left;
      display: inline-block !important;
      position: relative;
      word-break: break-all;
      background-color: #ffffff;
      transition: all 0.2s;

      &:hover {
        transform: scale(1.03);
      }
    }

    .date-message,
    .system-message {
      width: fit-content;
      border-radius: 12rpx;
      padding: 8rpx 16rpx;
      margin-bottom: 16rpx;
      background-color: #e8e8e8;
      color: #999;
      font-size: 24rpx;
    }
  }

  .chat-tools {
    width: 100%;
    border: #e4e0e0 solid 1px;
    border-radius: 10px;
    height: 44px;
  }

  ::v-deep(textarea) {
    resize: none;
  }
}
</style>
