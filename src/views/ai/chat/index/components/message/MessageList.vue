<template>
  <div ref="messageContainer" class="h-100% overflow-y-auto relative">
    <div class="chat-list" v-for="(item, index) in list" :key="index">
      <!-- 靠左 message：system、assistant 类型 -->
      <div class="left-message message-item" v-if="item.type !== 'user'">
        <div class="avatar">
          <el-avatar :src="roleAvatar" />
        </div>
        <div class="message">
          <div>
            <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
          </div>
          <div class="left-text-container" ref="markdownViewRef">
            <MarkdownView class="left-text" :content="item.content" />
          </div>
          <div class="left-btns">
            <el-button class="btn-cus" link @click="copyContent(item.content)">
              <img class="btn-image" src="@/assets/ai/copy.svg" />
            </el-button>
            <el-button v-if="item.id > 0" class="btn-cus" link @click="onDelete(item.id)">
              <img class="btn-image h-17px" src="@/assets/ai/delete.svg" />
            </el-button>
          </div>
        </div>
      </div>
      <!-- 靠右 message：user 类型 -->
      <div class="right-message message-item" v-if="item.type === 'user'">
        <div class="avatar">
          <el-avatar :src="userAvatar" />
        </div>
        <div class="message">
          <div>
            <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
          </div>
          <div class="right-text-container">
            <div class="right-text">{{ item.content }}</div>
          </div>
          <div class="right-btns">
            <el-button class="btn-cus" link @click="copyContent(item.content)">
              <img class="btn-image" src="@/assets/ai/copy.svg" />
            </el-button>
            <el-button class="btn-cus" link @click="onDelete(item.id)">
              <img class="btn-image h-17px mr-12px" src="@/assets/ai/delete.svg" />
            </el-button>
            <el-button class="btn-cus" link @click="onRefresh(item)">
              <el-icon size="17"><RefreshRight /></el-icon>
            </el-button>
            <el-button class="btn-cus" link @click="onEdit(item)">
              <el-icon size="17"><Edit /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 回到底部 -->
  <div v-if="isScrolling" class="to-bottom" @click="handleGoBottom">
    <el-button :icon="ArrowDownBold" circle />
  </div>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { formatDate } from '@/utils/formatTime'
import MarkdownView from '@/components/MarkdownView/index.vue'
import { useClipboard } from '@vueuse/core'
import { ArrowDownBold, Edit, RefreshRight } from '@element-plus/icons-vue'
import { ChatMessageApi, ChatMessageVO } from '@/api/ai/chat/message'
import { ChatConversationVO } from '@/api/ai/chat/conversation'
import { useUserStore } from '@/store/modules/user'
import userAvatarDefaultImg from '@/assets/imgs/avatar.gif'
import roleAvatarDefaultImg from '@/assets/ai/gpt.svg'

const message = useMessage() // 消息弹窗
const { copy } = useClipboard() // 初始化 copy 到粘贴板
const userStore = useUserStore()

// 判断“消息列表”滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer: any = ref(null)
const isScrolling = ref(false) //用于判断用户是否在滚动

const userAvatar = computed(() => userStore.user.avatar || userAvatarDefaultImg)
const roleAvatar = computed(() => props.conversation.roleAvatar ?? roleAvatarDefaultImg)

// 定义 props
const props = defineProps({
  conversation: {
    type: Object as PropType<ChatConversationVO>,
    required: true
  },
  list: {
    type: Array as PropType<ChatMessageVO[]>,
    required: true
  }
})

const { list } = toRefs(props) // 消息列表

const emits = defineEmits(['onDeleteSuccess', 'onRefresh', 'onEdit']) // 定义 emits

// ============ 处理对话滚动 ==============

/** 滚动到底部 */
const scrollToBottom = async (isIgnore?: boolean) => {
  // 注意要使用 nextTick 以免获取不到 dom
  await nextTick()
  if (isIgnore || !isScrolling.value) {
    messageContainer.value.scrollTop =
      messageContainer.value.scrollHeight - messageContainer.value.offsetHeight
  }
}

function handleScroll() {
  const scrollContainer = messageContainer.value
  const scrollTop = scrollContainer.scrollTop
  const scrollHeight = scrollContainer.scrollHeight
  const offsetHeight = scrollContainer.offsetHeight
  if (scrollTop + offsetHeight < scrollHeight - 100) {
    // 用户开始滚动并在最底部之上，取消保持在最底部的效果
    isScrolling.value = true
  } else {
    // 用户停止滚动并滚动到最底部，开启保持到最底部的效果
    isScrolling.value = false
  }
}

/** 回到底部 */
const handleGoBottom = async () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTop = scrollContainer.scrollHeight
}

/** 回到顶部 */
const handlerGoTop = async () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTop = 0
}

defineExpose({ scrollToBottom, handlerGoTop }) // 提供方法给 parent 调用

// ============ 处理消息操作 ==============

/** 复制 */
const copyContent = async (content) => {
  await copy(content)
  message.success('复制成功！')
}

/** 删除 */
const onDelete = async (id) => {
  // 删除 message
  await ChatMessageApi.deleteChatMessage(id)
  message.success('删除成功！')
  // 回调
  emits('onDeleteSuccess')
}

/** 刷新 */
const onRefresh = async (message: ChatMessageVO) => {
  emits('onRefresh', message)
}

/** 编辑 */
const onEdit = async (message: ChatMessageVO) => {
  emits('onEdit', message)
}

/** 初始化 */
onMounted(async () => {
  messageContainer.value.addEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.message-container {
  position: relative;
  overflow-y: scroll;
}

// 中间
.chat-list {
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  padding: 0 20px;
  .message-item {
    margin-top: 50px;
  }

  .left-message {
    display: flex;
    flex-direction: row;
  }

  .right-message {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start;
  }

  .message {
    display: flex;
    flex-direction: column;
    text-align: left;
    margin: 0 15px;

    .time {
      text-align: left;
      line-height: 30px;
    }

    .left-text-container {
      position: relative;
      display: flex;
      flex-direction: column;
      overflow-wrap: break-word;
      background-color: rgba(228, 228, 228, 0.8);
      box-shadow: 0 0 0 1px rgba(228, 228, 228, 0.8);
      border-radius: 10px;
      padding: 10px 10px 5px 10px;

      .left-text {
        color: #393939;
        font-size: 0.95rem;
      }
    }

    .right-text-container {
      display: flex;
      flex-direction: row-reverse;

      .right-text {
        font-size: 0.95rem;
        color: #fff;
        display: inline;
        background-color: #267fff;
        box-shadow: 0 0 0 1px #267fff;
        border-radius: 10px;
        padding: 10px;
        width: auto;
        overflow-wrap: break-word;
        white-space: pre-wrap;
      }
    }

    .left-btns {
      display: flex;
      flex-direction: row;
      margin-top: 8px;
    }

    .right-btns {
      display: flex;
      flex-direction: row-reverse;
      margin-top: 8px;
    }
  }

  // 复制、删除按钮
  .btn-cus {
    display: flex;
    background-color: transparent;
    align-items: center;

    .btn-image {
      height: 20px;
    }
  }

  .btn-cus:hover {
    cursor: pointer;
    background-color: #f6f6f6;
  }
}

// 回到底部
.to-bottom {
  position: absolute;
  z-index: 1000;
  bottom: 0;
  right: 50%;
}
</style>
