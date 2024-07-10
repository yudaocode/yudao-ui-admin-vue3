<template>
  <el-container v-if="showChatBox" class="kefu">
    <el-header>
      <div class="kefu-title">{{ conversation.userNickname }}</div>
    </el-header>
    <el-main class="kefu-content overflow-visible">
      <!-- 加载历史消息 -->
      <div
        v-show="loadingMore"
        class="loadingMore flex justify-center items-center cursor-pointer"
        @click="handleOldMessage"
      >
        加载更多
      </div>
      <el-scrollbar ref="scrollbarRef" always height="calc(100vh - 495px)" @scroll="handleScroll">
        <div ref="innerRef" class="w-[100%] pb-3px">
          <!-- 消息列表 -->
          <div v-for="(item, index) in getMessageList0" :key="item.id" class="w-[100%]">
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
              <div
                v-if="item.contentType === KeFuMessageContentTypeEnum.SYSTEM"
                class="system-message"
              >
                {{ item.content }}
              </div>
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
                :src="conversation.userAvatar"
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
                <!-- 商品消息 -->
                <ProductMessageItem :message="item" />
                <!-- 订单消息 -->
                <OrderMessageItem :message="item" />
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
      <div
        v-show="showNewMessageTip"
        class="newMessageTip flex items-center cursor-pointer"
        @click="handleToNewMessage"
      >
        <span>有新消息</span>
        <Icon class="ml-5px" icon="ep:bottom" />
      </div>
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
import ProductMessageItem from './message/ProductMessageItem.vue'
import OrderMessageItem from './message/OrderMessageItem.vue'
import { Emoji } from './tools/emoji'
import { KeFuMessageContentTypeEnum } from './tools/constants'
import { isEmpty } from '@/utils/is'
import { UserTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/formatTime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

defineOptions({ name: 'KeFuMessageBox' })

const message = ref('') // 消息弹窗

const messageTool = useMessage()
const messageList = ref<KeFuMessageRespVO[]>([]) // 消息列表
const conversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
const showNewMessageTip = ref(false) // 显示有新消息提示
const queryParams = reactive({
  pageNo: 1,
  conversationId: 0
})
const total = ref(0) // 消息总条数

/** 获得消息列表 */
const getMessageList = async (val: KeFuConversationRespVO) => {
  conversation.value = val
  queryParams.conversationId = val.id
  const messageTotal = messageList.value.length
  if (total.value > 0 && messageTotal > 0 && messageTotal === total.value) {
    return
  }
  const res = await KeFuMessageApi.getKeFuMessagePage(queryParams)
  total.value = res.total
  for (const item of res.list) {
    if (messageList.value.some((val) => val.id === item.id)) {
      continue
    }
    messageList.value.push(item)
  }
  await scrollToBottom()
}

/** 按照时间倒序，获取消息列表 */
const getMessageList0 = computed(() => {
  messageList.value.sort((a: any, b: any) => a.createTime - b.createTime)
  return messageList.value
})

/** 刷新消息列表 */
const refreshMessageList = async () => {
  if (!conversation.value) {
    return
  }

  queryParams.pageNo = 1
  await getMessageList(conversation.value)
  if (loadHistory.value) {
    // 有下角显示有新消息提示
    showNewMessageTip.value = true
  }
}

defineExpose({ getMessageList, refreshMessageList })
const showChatBox = computed(() => !isEmpty(conversation.value)) // 是否显示聊天区域

/** 处理表情选择 */
const handleEmojiSelect = (item: Emoji) => {
  message.value += item.name
}

/** 处理图片发送 */
const handleSendPicture = async (picUrl: string) => {
  // 组织发送消息
  const msg = {
    conversationId: conversation.value.id,
    contentType: KeFuMessageContentTypeEnum.IMAGE,
    content: picUrl
  }
  await sendMessage(msg)
}

/** 发送文本消息 */
const handleSendMessage = async () => {
  // 1. 校验消息是否为空
  if (isEmpty(unref(message.value))) {
    messageTool.notifyWarning('请输入消息后再发送哦！')
    return
  }
  // 2. 组织发送消息
  const msg = {
    conversationId: conversation.value.id,
    contentType: KeFuMessageContentTypeEnum.TEXT,
    content: message.value
  }
  await sendMessage(msg)
}

/** 真正发送消息 【共用】*/
const sendMessage = async (msg: any) => {
  // 发送消息
  await KeFuMessageApi.sendKeFuMessage(msg)
  message.value = ''
  // 加载消息列表
  await getMessageList(conversation.value)
  // 滚动到最新消息处
  await scrollToBottom()
}

/** 滚动到底部 */
const innerRef = ref<HTMLDivElement>()
const scrollbarRef = ref<InstanceType<typeof ElScrollbarType>>()
const scrollToBottom = async () => {
  // 1. 首次加载时滚动到最新消息，如果加载的是历史消息则不滚动
  if (loadHistory.value) {
    return
  }
  // 2.1 滚动到最新消息，关闭新消息提示
  await nextTick()
  scrollbarRef.value!.setScrollTop(innerRef.value!.clientHeight)
  showNewMessageTip.value = false
  // 2.2 消息已读
  await KeFuMessageApi.updateKeFuMessageReadStatus(conversation.value.id)
}

/** 查看新消息 */
const handleToNewMessage = async () => {
  loadHistory.value = false
  await scrollToBottom()
}

/** 加载历史消息 */
const loadingMore = ref(false) // 滚动到顶部加载更多
const loadHistory = ref(false) // 加载历史消息
const handleScroll = async ({ scrollTop }) => {
  const messageTotal = messageList.value.length
  if (total.value > 0 && messageTotal > 0 && messageTotal === total.value) {
    return
  }
  // 距顶 20 加载下一页数据
  loadingMore.value = scrollTop < 20
}
const handleOldMessage = async () => {
  loadHistory.value = true
  // 加载消息列表
  queryParams.pageNo += 1
  await getMessageList(conversation.value)
  loadingMore.value = false
  // TODO puhui999: 等页面加载完后，获得上一页最后一条消息的位置，控制滚动到它所在位置
}

/**
 * 是否显示时间
 *
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
    position: relative;

    .loadingMore {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 50px;
      background-color: #eee;
      color: #666;
      text-align: center;
      line-height: 50px;
      transform: translateY(-100%);
      transition: transform 0.3s ease-in-out;
    }

    .newMessageTip {
      position: absolute;
      bottom: 35px;
      right: 35px;
      background-color: #fff;
      padding: 10px;
      border-radius: 30px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 阴影效果 */
    }

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
