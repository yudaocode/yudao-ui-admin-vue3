<template>
  <el-container v-if="showKeFuMessageList" class="kefu">
    <el-header class="kefu-header">
      <div class="kefu-title">{{ conversation.userNickname }}</div>
    </el-header>
    <el-main class="kefu-content overflow-visible">
      <el-scrollbar ref="scrollbarRef" always @scroll="handleScroll">
        <div v-if="refreshContent" ref="innerRef" class="w-[100%] px-10px">
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
                :class="{
                  'kefu-message': KeFuMessageContentTypeEnum.TEXT === item.contentType
                }"
              >
                <!-- 文本消息 -->
                <MessageItem :message="item">
                  <template v-if="KeFuMessageContentTypeEnum.TEXT === item.contentType">
                    <div
                      v-dompurify-html="replaceEmoji(getMessageContent(item).text || item.content)"
                      class="line-height-normal text-justify h-1/1 w-full"
                    ></div>
                  </template>
                </MessageItem>
                <!-- 图片消息 -->
                <MessageItem :message="item">
                  <el-image
                    v-if="KeFuMessageContentTypeEnum.IMAGE === item.contentType"
                    :initial-index="0"
                    :preview-src-list="[getMessageContent(item).picUrl || item.content]"
                    :src="getMessageContent(item).picUrl || item.content"
                    class="w-200px mx-10px"
                    fit="contain"
                    preview-teleported
                  />
                </MessageItem>
                <!-- 商品消息 -->
                <MessageItem :message="item">
                  <ProductItem
                    v-if="KeFuMessageContentTypeEnum.PRODUCT === item.contentType"
                    :picUrl="getMessageContent(item).picUrl"
                    :price="getMessageContent(item).price"
                    :sales-count="getMessageContent(item).salesCount"
                    :spuId="getMessageContent(item).spuId"
                    :stock="getMessageContent(item).stock"
                    :title="getMessageContent(item).spuName"
                    class="max-w-300px mx-10px"
                  />
                </MessageItem>
                <!-- 订单消息 -->
                <MessageItem :message="item">
                  <OrderItem
                    v-if="KeFuMessageContentTypeEnum.ORDER === item.contentType"
                    :message="item"
                    class="max-w-100% mx-10px"
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
    <el-footer class="kefu-footer">
      <div class="chat-tools flex items-center">
        <EmojiSelectPopover @select-emoji="handleEmojiSelect" />
        <PictureSelectUpload
          class="ml-15px mt-3px cursor-pointer"
          @send-picture="handleSendPicture"
        />
      </div>
      <el-input
        v-model="message"
        :rows="6"
        placeholder="输入消息，Enter发送，Shift+Enter换行"
        style="border-style: none"
        type="textarea"
        @keyup.enter.prevent="handleSendMessage"
      />
    </el-footer>
  </el-container>
  <el-container v-else class="kefu">
    <el-main>
      <el-empty description="请选择左侧的一个会话后开始" />
    </el-main>
  </el-container>
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
import { useMallKefuStore } from '@/store/modules/mall/kefu'

dayjs.extend(relativeTime)

defineOptions({ name: 'KeFuMessageList' })

const message = ref('') // 消息弹窗
const { replaceEmoji } = useEmoji()
const messageTool = useMessage()
const messageList = ref<KeFuMessageRespVO[]>([]) // 消息列表
const conversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
const showNewMessageTip = ref(false) // 显示有新消息提示
const queryParams = reactive({
  conversationId: 0,
  createTime: undefined
})
const total = ref(0) // 消息总条数
const refreshContent = ref(false) // 内容刷新,主要解决会话消息页面高度不一致导致的滚动功能精度失效
const kefuStore = useMallKefuStore() // 客服缓存

/** 获悉消息内容 */
const getMessageContent = computed(() => (item: any) => jsonParse(item.content))
/** 获得消息列表 */
const getMessageList = async () => {
  const res = await KeFuMessageApi.getKeFuMessageList(queryParams)
  if (isEmpty(res)) {
    // 当返回的是空列表说明没有消息或者已经查询完了历史消息
    skipGetMessageList.value = true
    return
  }
  queryParams.createTime = formatDate(res.at(-1).createTime) as any

  // 情况一：加载最新消息
  if (!queryParams.createTime) {
    messageList.value = res
  } else {
    // 情况二：加载历史消息
    for (const item of res) {
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
    queryParams.createTime = undefined
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

/** 获得新会话的消息列表, 点击切换时，读取缓存；然后异步获取新消息，merge 下； */
const getNewMessageList = async (val: KeFuConversationRespVO) => {
  // 1. 缓存当前会话消息列表
  kefuStore.saveMessageList(conversation.value.id, messageList.value)
  // 2.1 会话切换,重置相关参数
  messageList.value = kefuStore.getConversationMessageList(val.id) || []
  total.value = messageList.value.length || 0
  loadHistory.value = false
  refreshContent.value = false
  skipGetMessageList.value = false
  // 2.2 设置会话相关属性
  conversation.value = val
  queryParams.conversationId = val.id
  queryParams.createTime = undefined
  // 3. 获取消息
  await refreshMessageList()
}
defineExpose({ getNewMessageList, refreshMessageList })

const showKeFuMessageList = computed(() => !isEmpty(conversation.value)) // 是否显示聊天区域
const skipGetMessageList = ref(false) // 跳过消息获取

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
    content: JSON.stringify({ picUrl })
  }
  await sendMessage(msg)
}

/** 发送文本消息 */
const handleSendMessage = async (event: any) => {
  // shift 不发送
  if (event.shiftKey) {
    return
  }
  // 1. 校验消息是否为空
  if (isEmpty(unref(message.value)?.trim())) {
    messageTool.notifyWarning('请输入消息后再发送哦！')
    message.value = ''
    return
  }
  // 2. 组织发送消息
  const msg = {
    conversationId: conversation.value.id,
    contentType: KeFuMessageContentTypeEnum.TEXT,
    content: JSON.stringify({ text: message.value })
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
  // 更新会话缓存
  await kefuStore.updateConversation(conversation.value.id)
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
  background-color: var(--app-content-bg-color);
  position: relative;
  width: calc(100% - 300px - 260px);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px; /* 实际宽度 */
    height: 100%;
    background-color: var(--el-border-color);
    transform: scaleX(0.3); /* 缩小宽度 */
  }

  .kefu-header {
    background-color: var(--app-content-bg-color);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1px; /* 初始宽度 */
      background-color: var(--el-border-color);
      transform: scaleY(0.3); /* 缩小视觉高度 */
    }

    &-title {
      font-size: 18px;
      font-weight: bold;
    }
  }

  &-content {
    margin: 0;
    padding: 10px;
    position: relative;
    height: 100%;
    width: 100%;

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
        background-color: #fff;
        margin-left: 10px;
        margin-top: 3px;
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
        border-bottom-left-radius: 10px;
      }
    }

    .ss-row-right {
      justify-content: flex-end;

      .kefu-message {
        background-color: rgb(206, 223, 255);
        margin-right: 10px;
        margin-top: 3px;
        border-top-left-radius: 10px;
        border-bottom-right-radius: 10px;
        border-bottom-left-radius: 10px;
      }
    }

    // 消息气泡
    .kefu-message {
      color: #414141;
      font-weight: 500;
      padding: 5px 10px;
      width: auto;
      max-width: 50%;
      //text-align: left;
      //display: inline-block !important;
      //word-break: break-all;
      transition: all 0.2s;

      &:hover {
        transform: scale(1.03);
      }
    }

    .date-message,
    .system-message {
      width: fit-content;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 0 5px;
      color: #fff;
      font-size: 10px;
    }
  }

  .kefu-footer {
    position: relative;
    display: flex;
    flex-direction: column;
    height: auto;
    margin: 0;
    padding: 0;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 1px; /* 初始宽度 */
      background-color: var(--el-border-color);
      transform: scaleY(0.3); /* 缩小视觉高度 */
    }

    .chat-tools {
      width: 100%;
      height: 44px;
    }
  }

  ::v-deep(textarea) {
    resize: none;
    background-color: var(--app-content-bg-color);
  }

  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    border-radius: 0;
  }

  ::v-deep(.el-textarea__inner) {
    box-shadow: none !important;
  }
}
</style>
