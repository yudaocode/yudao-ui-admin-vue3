<template>
  <el-container v-if="showKeFuMessageList" class="kefu">
    <el-header>
      <div class="kefu-title">{{ conversation.userNickname }}</div>
    </el-header>
    <el-main class="kefu-content overflow-visible">
      <el-scrollbar ref="scrollbarRef" always height="calc(100vh - 495px)" @scroll="handleScroll">
        <div v-if="refreshContent" ref="innerRef" class="w-[100%] pb-3px">
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
                class="w-60px h-60px"
              />
              <div
                :class="{ 'kefu-message': KeFuMessageContentTypeEnum.TEXT === item.contentType }"
                class="p-10px"
              >
                <!-- 文本消息 -->
                <MessageItem :message="item">
                  <template v-if="KeFuMessageContentTypeEnum.TEXT === item.contentType">
                    <div
                      v-dompurify-html="replaceEmoji(item.content)"
                      class="flex items-center"
                    ></div>
                  </template>
                </MessageItem>
                <!-- 图片消息 -->
                <MessageItem :message="item">
                  <el-image
                    v-if="KeFuMessageContentTypeEnum.IMAGE === item.contentType"
                    :initial-index="0"
                    :preview-src-list="[item.content]"
                    :src="item.content"
                    class="w-200px"
                    fit="contain"
                    preview-teleported
                  />
                </MessageItem>
                <!-- 商品消息 -->
                <MessageItem :message="item">
                  <ProductItem
                    v-if="KeFuMessageContentTypeEnum.PRODUCT === item.contentType"
                    :spuId="getMessageContent(item).spuId"
                    :picUrl="getMessageContent(item).picUrl"
                    :price="getMessageContent(item).price"
                    :skuText="getMessageContent(item).introduction"
                    :title="getMessageContent(item).spuName"
                    :titleWidth="400"
                    class="max-w-70%"
                    priceColor="#FF3000"
                  />
                </MessageItem>
                <!-- 订单消息 -->
                <MessageItem :message="item">
                  <OrderItem
                    v-if="KeFuMessageContentTypeEnum.ORDER === item.contentType"
                    :message="item"
                    class="max-w-100%"
                  />
                </MessageItem>
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
import ProductItem from './message/ProductItem.vue'
import OrderItem from './message/OrderItem.vue'
import { Emoji, useEmoji } from './tools/emoji'
import { KeFuMessageContentTypeEnum } from './tools/constants'
import { isEmpty } from '@/utils/is'
import { UserTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/formatTime'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { debounce } from 'lodash-es'
import { jsonParse } from '@/utils'

dayjs.extend(relativeTime)

defineOptions({ name: 'KeFuMessageList' })

const message = ref('') // 消息弹窗
const { replaceEmoji } = useEmoji()
const messageTool = useMessage()
const messageList = ref<KeFuMessageRespVO[]>([]) // 消息列表
const conversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
const showNewMessageTip = ref(false) // 显示有新消息提示
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  conversationId: 0
})
const total = ref(0) // 消息总条数
const refreshContent = ref(false) // 内容刷新,主要解决会话消息页面高度不一致导致的滚动功能精度失效

/** 获悉消息内容 */
const getMessageContent = computed(() => (item: any) => jsonParse(item.content))
/** 获得消息列表 */
const getMessageList = async () => {
  const res = await KeFuMessageApi.getKeFuMessagePage(queryParams)
  total.value = res.total
  // 情况一：加载最新消息
  if (queryParams.pageNo === 1) {
    messageList.value = res.list
  } else {
    // 情况二：加载历史消息
    for (const item of res.list) {
      pushMessage(item)
    }
  }
  refreshContent.value = true
}

/** 添加消息 */
const pushMessage = (message: any) => {
  if (messageList.value.some((val) => val.id === message.id)) {
    return
  }
  messageList.value.push(message)
}

/** 按照时间倒序，获取消息列表 */
const getMessageList0 = computed(() => {
  messageList.value.sort((a: any, b: any) => a.createTime - b.createTime)
  return messageList.value
})

/** 刷新消息列表 */
const refreshMessageList = async (message?: any) => {
  if (!conversation.value) {
    return
  }

  if (typeof message !== 'undefined') {
    // 当前查询会话与消息所属会话不一致则不做处理
    if (message.conversationId !== conversation.value.id) {
      return
    }
    pushMessage(message)
  } else {
    // TODO @puhui999：不基于 page 做。而是流式分页；通过 createTime 排序查询；
    queryParams.pageNo = 1
    await getMessageList()
  }

  if (loadHistory.value) {
    // 右下角显示有新消息提示
    showNewMessageTip.value = true
  } else {
    // 滚动到最新消息处
    await handleToNewMessage()
  }
}

/** 获得新会话的消息列表 */
// TODO @puhui999：可优化：可以考虑本地做每个会话的消息 list 缓存；然后点击切换时，读取缓存；然后异步获取新消息，merge 下；
const getNewMessageList = async (val: KeFuConversationRespVO) => {
  // 会话切换,重置相关参数
  queryParams.pageNo = 1
  messageList.value = []
  total.value = 0
  loadHistory.value = false
  refreshContent.value = false
  // 设置会话相关属性
  conversation.value = val
  queryParams.conversationId = val.id
  // 获取消息
  await refreshMessageList()
}
defineExpose({ getNewMessageList, refreshMessageList })

const showKeFuMessageList = computed(() => !isEmpty(conversation.value)) // 是否显示聊天区域
const skipGetMessageList = computed(() => {
  // 已加载到最后一页的话则不触发新的消息获取
  return total.value > 0 && Math.ceil(total.value / queryParams.pageSize) === queryParams.pageNo
}) // 跳过消息获取

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
  await refreshMessageList()
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

const loadHistory = ref(false) // 加载历史消息
/** 处理消息列表滚动事件(debounce 限流) */
const handleScroll = debounce(({ scrollTop }) => {
  if (skipGetMessageList.value) {
    return
  }
  // 触顶自动加载下一页数据
  if (Math.floor(scrollTop) === 0) {
    handleOldMessage()
  }
  const wrap = scrollbarRef.value?.wrapRef
  // 触底重置
  if (Math.abs(wrap!.scrollHeight - wrap!.clientHeight - wrap!.scrollTop) < 1) {
    loadHistory.value = false
    refreshMessageList()
  }
}, 200)
/** 加载历史消息 */
const handleOldMessage = async () => {
  // 记录已有页面高度
  const oldPageHeight = innerRef.value?.clientHeight
  if (!oldPageHeight) {
    return
  }
  loadHistory.value = true
  // 加载消息列表
  queryParams.pageNo += 1
  await getMessageList()
  // 等页面加载完后，获得上一页最后一条消息的位置，控制滚动到它所在位置
  scrollbarRef.value!.setScrollTop(innerRef.value!.clientHeight - oldPageHeight)
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

    .newMessageTip {
      position: absolute;
      bottom: 35px;
      right: 35px;
      background-color: var(--app-content-bg-color);
      padding: 10px;
      border-radius: 30px;
      font-size: 12px;
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
          border-right: 5px solid var(--app-content-bg-color);
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
          border-left: 5px solid var(--app-content-bg-color);
          border-bottom: 5px solid transparent;
          border-top: 5px solid transparent;
          border-right: 5px solid transparent;
        }
      }
    }

    // 消息气泡
    .kefu-message {
      color: #a9a9a9;
      border-radius: 5px;
      box-shadow: 3px 3px 5px rgba(220, 220, 220, 0.1);
      padding: 5px 10px;
      width: auto;
      max-width: 50%;
      text-align: left;
      display: inline-block !important;
      position: relative;
      word-break: break-all;
      background-color: var(--app-content-bg-color);
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
      //background-color: #e8e8e8;
      color: #999;
      font-size: 24rpx;
    }
  }

  .chat-tools {
    width: 100%;
    border: var(--el-border-color) solid 1px;
    border-radius: 10px;
    height: 44px;
  }

  ::v-deep(textarea) {
    resize: none;
  }
}
</style>
