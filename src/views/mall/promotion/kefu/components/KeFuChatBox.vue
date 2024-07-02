<template>
  <el-container v-if="showChatBox" class="kefu">
    <el-header>
      <div class="kefu-title">{{ keFuConversation.userNickname }}</div>
    </el-header>
    <el-main class="kefu-content" style="overflow: visible">
      <el-scrollbar ref="scrollbarRef" always height="calc(100vh - 495px)">
        <div ref="innerRef" class="w-[100%] pb-3px">
          <div
            v-for="item in messageList"
            :key="item.id"
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
              v-show="item.senderType === UserTypeEnum.MEMBER"
              :src="keFuConversation.userAvatar"
              alt="avatar"
            />
            <div class="kefu-message p-10px">
              <!-- TODO puhui999: 消息相关等后续完成后统一抽离封装 -->
              <!-- 文本消息 -->
              <template v-if="KeFuMessageContentTypeEnum.TEXT === item.contentType">
                <div
                  v-dompurify-html="replaceEmoji(item.content)"
                  :class="[
                    item.senderType === UserTypeEnum.MEMBER
                      ? `ml-10px`
                      : item.senderType === UserTypeEnum.ADMIN
                        ? `mr-10px`
                        : ''
                  ]"
                  class="flex items-center"
                ></div>
              </template>
              <!-- 图片消息 -->
              <template v-if="KeFuMessageContentTypeEnum.IMAGE === item.contentType">
                <div
                  :class="[
                    item.senderType === UserTypeEnum.MEMBER
                      ? `ml-10px`
                      : item.senderType === UserTypeEnum.ADMIN
                        ? `mr-10px`
                        : ''
                  ]"
                  class="flex items-center"
                >
                  <el-image
                    :src="item.content"
                    fit="contain"
                    style="width: 200px; height: 200px"
                    @click="imagePreview(item.content)"
                  />
                </div>
              </template>
            </div>
            <el-avatar
              v-show="item.senderType === UserTypeEnum.ADMIN"
              :src="item.senderAvatar"
              alt="avatar"
            />
          </div>
        </div>
      </el-scrollbar>
    </el-main>
    <el-footer height="230px">
      <div class="h-[100%]">
        <div class="chat-tools">
          <EmojiSelectPopover @select-emoji="handleEmojiSelect" />
        </div>
        <el-input v-model="message" :rows="6" type="textarea" />
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
import EmojiSelectPopover from './EmojiSelectPopover.vue'
import { Emoji, replaceEmoji } from './emoji'
import { KeFuMessageContentTypeEnum } from './constants'
import { isEmpty } from '@/utils/is'
import { UserTypeEnum } from '@/utils/constants'
import { createImageViewer } from '@/components/ImageViewer'

defineOptions({ name: 'KeFuMessageBox' })
const messageTool = useMessage()
const message = ref('') // 消息
const messageList = ref<KeFuMessageRespVO[]>([]) // 消息列表
const keFuConversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
const poller = ref<any>(null) // TODO puhui999: 轮训定时器，暂时模拟 websocket
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
  // TODO puhui999: 轮训相关，功能完善后移除
  if (!poller.value) {
    poller.value = setInterval(() => {
      getMessageList(conversation)
    }, 1000)
  }
}
defineExpose({ getMessageList })
// 是否显示聊天区域
const showChatBox = computed(() => !isEmpty(keFuConversation.value))
// 处理表情选择
const handleEmojiSelect = (item: Emoji) => {
  message.value += item.name
}
// 发送消息
const handleSendMessage = async () => {
  // 1. 校验消息是否为空
  if (isEmpty(unref(message.value))) {
    messageTool.warning('请输入消息后再发送哦！')
  }
  // 2. 组织发送消息
  const msg = {
    conversationId: keFuConversation.value.id,
    contentType: KeFuMessageContentTypeEnum.TEXT,
    content: message.value
  }
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

/** 图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

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
  }

  .chat-tools {
    width: 100%;
    border: #e4e0e0 solid 1px;
    height: 44px;
    display: flex;
    align-items: center;
  }

  ::v-deep(textarea) {
    resize: none;
  }
}
</style>
