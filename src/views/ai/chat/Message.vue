<template>
  <div ref="messageContainer" style="height: 100%; overflow-y: auto; position: relative">
    <div class="chat-list" v-for="(item, index) in messageList" :key="index">
      <!--  靠左 message  -->
      <div class="left-message message-item" v-if="item.type !== 'user'">
        <div class="avatar">
          <el-avatar :src="item.roleAvatar" />
        </div>
        <div class="message">
          <div>
            <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
          </div>
          <div class="left-text-container" ref="markdownViewRef">
            <MarkdownView class="left-text" :content="item.content" />
          </div>
          <div class="left-btns">
            <el-button class="btn-cus" link @click="noCopy(item.content)">
              <img class="btn-image" src="@/assets/ai/copy.svg" />
            </el-button>
            <el-button class="btn-cus" link @click="onDelete(item.id)">
              <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px" />
            </el-button>
          </div>
        </div>
      </div>
      <!--  靠右 message  -->
      <div class="right-message message-item" v-if="item.type === 'user'">
        <div class="avatar">
          <el-avatar :src="item.userAvatar" />
        </div>
        <div class="message">
          <div>
            <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
          </div>
          <div class="right-text-container">
            <div class="right-text">{{ item.content }}</div>
          </div>
          <div class="right-btns">
            <el-button class="btn-cus" link @click="noCopy(item.content)">
              <img class="btn-image" src="@/assets/ai/copy.svg" />
            </el-button>
            <el-button class="btn-cus" link @click="onDelete(item.id)">
              <img
                class="btn-image"
                src="@/assets/ai/delete.svg"
                style="height: 17px; margin-right: 12px"
              />
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
import { formatDate } from '@/utils/formatTime'
import MarkdownView from '@/components/MarkdownView/index.vue'
import { ChatMessageApi, ChatMessageVO } from '@/api/ai/chat/message'
import { useClipboard } from '@vueuse/core'
import { PropType } from 'vue'
import { ArrowDownBold, Edit, RefreshRight } from '@element-plus/icons-vue'
import { ChatConversationVO } from '@/api/ai/chat/conversation'

const { copy } = useClipboard() // 初始化 copy 到粘贴板
// 判断 消息列表 滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer: any = ref(null)
const isScrolling = ref(false) //用于判断用户是否在滚动

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

const messageList = computed(() => {
  if (props.list && props.list.length > 0) {
    return props.list
  }
  if (props.conversation && props.conversation.systemMessage) {
    return [{
      id: 0,
      type: 'system',
      content: props.conversation.systemMessage
    }]
  }
  return []
})

// ============ 处理对话滚动 ==============

const scrollToBottom = async (isIgnore?: boolean) => {
  await nextTick(() => {
    // TODO @fan：中文写作习惯，中英文之间要有空格；另外，nextick 哈，idea 如果有绿色波兰线，可以关注下
    //注意要使用nexttick以免获取不到dom
    if (isIgnore || !isScrolling.value) {
      messageContainer.value.scrollTop =
        messageContainer.value.scrollHeight - messageContainer.value.offsetHeight
    }
  })
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

/**
 * 复制
 */
const noCopy = async (content) => {
  copy(content)
  ElMessage({
    message: '复制成功!',
    type: 'success'
  })
}

/**
 * 删除
 */
const onDelete = async (id) => {
  // 删除 message
  await ChatMessageApi.delete(id)
  ElMessage({
    message: '删除成功!',
    type: 'success'
  })
  // 回调
  emits('onDeleteSuccess')
}

/**
 * 刷新
 */
const onRefresh = async (message: ChatMessageVO) => {
  emits('onRefresh', message)
}

/**
 * 编辑
 */
const onEdit = async (message: ChatMessageVO) => {
  emits('onEdit', message)
}

/**
 * 回到底部
 */
const handleGoBottom = async () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTop = scrollContainer.scrollHeight
}

/**
 * 回到顶部
 */
const handlerGoTop = async () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTop = 0
}

// 监听 list
// TODO @fan：这个木有，是不是删除啦
const { list, conversationId } = toRefs(props)
watch(list, async (newValue, oldValue) => {
  console.log('watch list', list)
})

// 提供方法给 parent 调用
defineExpose({ scrollToBottom, handlerGoTop })

// 定义 emits
const emits = defineEmits(['onDeleteSuccess', 'onRefresh', 'onEdit'])

// onMounted
onMounted(async () => {
  messageContainer.value.addEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.message-container {
  position: relative;
  //top: 0;
  //bottom: 0;
  //left: 0;
  //right: 0;
  //width: 100%;
  //height: 100%;
  overflow-y: scroll;
  //padding: 0 15px;
  //z-index: -1;
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

  .avatar {
    //height: 170px;
    //width: 170px;
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
        color: #fff;
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
