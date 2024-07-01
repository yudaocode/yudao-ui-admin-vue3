<template>
  <el-container v-if="showChatBox" class="kefu">
    <el-header>
      <div class="kefu-title">{{ keFuConversation.userNickname }}</div>
    </el-header>
    <el-main class="kefu-content">
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
        <div class="kefu-message flex items-center p-10px">
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
            ></div>
          </template>
          <template v-else>
            {{ item.content }}
          </template>
        </div>
        <el-avatar
          v-show="item.senderType === UserTypeEnum.ADMIN"
          :src="item.senderAvatar"
          alt="avatar"
        />
      </div>
    </el-main>
    <!-- TODO puhui999: 发送下次提交完善 -->
    <el-footer height="230px">
      <div class="h-[100%]">
        <div class="chat-tools">
          <Icon :size="30" class="ml-10px" icon="fa:frown-o" />
        </div>
        <el-input v-model="message" :rows="6" type="textarea" />
        <div class="h-45px flex justify-end">
          <el-button class="mt-10px" type="primary">发送</el-button>
        </div>
      </div>
    </el-footer>
  </el-container>
  <el-empty v-else description="请选择左侧的一个会话后开始" />
</template>

<script lang="ts" setup>
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { UserTypeEnum } from '@/utils/constants'
import { replaceEmoji } from '@/views/mall/promotion/kefu/components/emoji'
import { KeFuMessageContentTypeEnum } from '@/views/mall/promotion/kefu/components/constants'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'KeFuMessageBox' })
const message = ref('') // 消息
const messageList = ref<KeFuMessageRespVO[]>([]) // 消息列表
const keFuConversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
// 获得消息
const getMessageList = async (conversation: KeFuConversationRespVO) => {
  keFuConversation.value = conversation
  // const { list } = await KeFuMessageApi.getKeFuMessagePage({
  //   pageNo: 1,
  //   conversationId: conversation.id
  // })
  // TODO puhui999: 方便查看效果
  const list = [
    {
      id: 19,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 2,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[爱心][爱心][坏笑][坏笑][天使][天使]',
      readStatus: false,
      createTime: 1718616705000
    },
    {
      id: 18,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 1,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[瞌睡][瞌睡]',
      readStatus: false,
      createTime: 1718616690000
    },
    {
      id: 17,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 1,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[冷酷][冷酷]',
      readStatus: false,
      createTime: 1718616350000
    },
    {
      id: 16,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 1,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[天使]',
      readStatus: false,
      createTime: 1718615505000
    },
    {
      id: 15,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 2,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[天使]',
      readStatus: false,
      createTime: 1718615485000
    },
    {
      id: 14,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 2,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[心碎][心碎]',
      readStatus: false,
      createTime: 1718615453000
    },
    {
      id: 13,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 2,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[心碎][心碎]',
      readStatus: false,
      createTime: 1718615430000
    },
    {
      id: 12,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 1,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[心碎][心碎]',
      readStatus: false,
      createTime: 1718615425000
    },
    {
      id: 11,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 1,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[困~][困~]',
      readStatus: false,
      createTime: 1718615413000
    },
    {
      id: 10,
      conversationId: 1,
      senderId: 283,
      senderAvatar: null,
      senderType: 1,
      receiverId: null,
      receiverType: null,
      contentType: 1,
      content: '[睡着][睡着]',
      readStatus: false,
      createTime: 1718615407000
    }
  ]
  messageList.value = list
}
defineExpose({ getMessageList })
// 是否显示聊天区域
const showChatBox = computed(() => !isEmpty(keFuConversation.value))
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
