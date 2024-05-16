<template>
  <el-container class="ai-layout">
    <!-- 左侧：会话列表 -->
    <Conversation @onConversationClick="handleConversationClick"
                  @onConversationClear="handlerConversationClear" />
    <!-- 右侧：会话详情 -->
    <el-container class="detail-container">
      <!-- 右顶部 TODO 芋艿：右对齐 -->
      <el-header class="header">
        <div class="title">
          {{ activeConversation?.title }}
        </div>
        <div>
          <!-- TODO @fan：样式改下；这里我已经改成点击后，弹出了 -->
          <el-button type="primary" @click="openChatConversationUpdateForm">
            <span v-html="activeConversation?.modelName"></span>
            <Icon icon="ep:setting" style="margin-left: 10px"/>
          </el-button>
          <el-button>
            <Icon icon="ep:user"/>
          </el-button>
          <el-button>
            <Icon icon="ep:download"/>
          </el-button>
          <el-button>
            <Icon icon="ep:arrow-up"/>
          </el-button>
        </div>
      </el-header>

      <!--  main    -->
      <el-main class="main-container">
        <div class="message-container" ref="messageContainer">
          <div class="chat-list" v-for="(item, index) in list" :key="index">
            <!--  靠左 message  -->
            <!-- TODO 芋艿：类型判断 -->
            <div class="left-message message-item" v-if="item.type === 'system'">
              <div class="avatar">
                <el-avatar
                  src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
                />
              </div>
              <div class="message">
                <div>
                  <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
                </div>
                <div class="left-text-container" ref="markdownViewRef">
                  <MarkdownView class="left-text" :content="item.content" />
                </div>
                <div class="left-btns">
                  <div class="btn-cus" @click="noCopy(item.content)">
                    <img class="btn-image" src="../../../assets/ai/copy.svg"/>
                    <el-text class="btn-cus-text">复制</el-text>
                  </div>
                  <div class="btn-cus" style="margin-left: 20px" @click="onDelete(item.id)">
                    <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px"/>
                    <el-text class="btn-cus-text">删除</el-text>
                  </div>
                </div>
              </div>
            </div>
            <!--  靠右 message  -->
            <div class="right-message message-item" v-if="item.type === 'user'">
              <div class="avatar">
                <el-avatar
                  src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
                />
              </div>
              <div class="message">
                <div>
                  <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
                </div>
                <div class="right-text-container">
                  <div class="right-text">{{ item.content }}</div>
                </div>
                <div class="right-btns">
                  <div class="btn-cus" @click="noCopy(item.content)">
                    <img class="btn-image" src="@/assets/ai/copy.svg"/>
                    <el-text class="btn-cus-text">复制</el-text>
                  </div>
                  <div class="btn-cus" style="margin-left: 20px" @click="onDelete(item.id)">
                    <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px"/>
                    <el-text class="btn-cus-text">删除</el-text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-main>
      <el-footer class="footer-container">
        <form @submit.prevent="onSend" class="prompt-from">
          <textarea
            class="prompt-input"
            v-model="prompt"
            @keyup.enter="onSend"
            @input="onPromptInput"
            @compositionstart="onCompositionstart"
            @compositionend="onCompositionend"
            placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"
          ></textarea>
          <div class="prompt-btns">
            <el-switch/>
            <el-button
              type="primary"
              size="default"
              @click="onSend()"
              :loading="conversationInProgress"
              v-if="conversationInProgress == false"
            >
              {{ conversationInProgress ? '进行中' : '发送' }}
            </el-button>
            <el-button
              type="danger"
              size="default"
              @click="stopStream()"
              v-if="conversationInProgress == true"
            >
              停止
            </el-button>
          </div>
        </form>
      </el-footer>
    </el-container>

    <!--  ========= 额外组件 ==========  -->
    <!-- 更新对话 form -->
    <ChatConversationUpdateForm
      ref="chatConversationUpdateFormRef"
      @success="handlerTitleSuccess"
    />
  </el-container>
</template>

<script setup lang="ts">
import MarkdownView from '@/components/MarkdownView/index.vue'
import Conversation from './Conversation.vue'
import {ChatMessageApi, ChatMessageVO} from '@/api/ai/chat/message'
import {ChatConversationVO} from '@/api/ai/chat/conversation'
import {formatDate} from '@/utils/formatTime'
import {useClipboard} from '@vueuse/core'
import ChatConversationUpdateForm from "@/views/ai/chat/components/ChatConversationUpdateForm.vue";

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const {copy} = useClipboard() // 初始化 copy 到粘贴板

// ref 属性定义
const activeConversationId = ref<number | null>(null) // 选中的对话编号
const activeConversation = ref<ChatConversationVO | null>(null) // 选中的 Conversation
const conversationInProgress = ref(false) // 对话进行中
const conversationInAbortController = ref<any>() // 对话进行中 abort 控制器(控制 stream 对话)
const inputTimeout = ref<any>() // 处理输入中回车的定时器
const prompt = ref<string>() // prompt

// 判断 消息列表 滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer: any = ref(null)
const isScrolling = ref(false) //用于判断用户是否在滚动
const isComposing = ref(false) // 判断用户是否在输入

/** chat message 列表 */
const list = ref<ChatMessageVO[]>([]) // 列表的数据

// ============ 处理对话滚动 ==============

function scrollToBottom() {
  nextTick(() => {
    //注意要使用nexttick以免获取不到dom
    console.log('isScrolling.value', isScrolling.value)
    if (!isScrolling.value) {
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
  if ((scrollTop + offsetHeight) < (scrollHeight - 50)) {
    // 用户开始滚动并在最底部之上，取消保持在最底部的效果
    isScrolling.value = true
  } else {
    // 用户停止滚动并滚动到最底部，开启保持到最底部的效果
    isScrolling.value = false
  }
}

// ============= 处理聊天输入回车发送 =============

const onCompositionstart = () => {
  isComposing.value = true
}

const onCompositionend = () => {
  // console.log('输入结束...')
  setTimeout(() => {
    isComposing.value = false
  }, 200)
}

const onPromptInput = (event) => {
  // 非输入法 输入设置为 true
  if (!isComposing.value) {
    // 回车 event data 是 null
    if (event.data == null) {
      return
    }
    isComposing.value = true
  }
  // 清理定时器
  if (inputTimeout.value) {
    clearTimeout(inputTimeout.value)
  }
  // 重置定时器
  inputTimeout.value = setTimeout(() => {
    isComposing.value = false
  }, 400)
}

// ============== 对话消息相关 =================

/**
 * 发送消息
 */
const onSend = async () => {
  // 判断用户是否在输入
  if (isComposing.value) {
    return
  }
  // 进行中不允许发送
  if (conversationInProgress.value) {
    return
  }
  const content = prompt.value?.trim() + ''
  if (content.length < 2) {
    ElMessage({
      message: '请输入内容!',
      type: 'error'
    })
    return
  }
  // TODO 芋艿：这块交互要在优化；应该是先插入到 UI 界面，里面会有当前的消息，和正在思考中；之后发起请求；
  // 清空输入框
  prompt.value = ''
  const userMessage = {
    conversationId: activeConversationId.value,
    content: content
  } as ChatMessageVO
  // list.value.push(userMessage)
  // 滚动到住下面
  scrollToBottom()
  // stream
  await doSendStream(userMessage)
}

const doSendStream = async (userMessage: ChatMessageVO) => {
  // 创建AbortController实例，以便中止请求
  conversationInAbortController.value = new AbortController()
  // 标记对话进行中
  conversationInProgress.value = true
  try {
    // 发送 event stream
    let isFirstMessage = true
    let content = ''
    ChatMessageApi.sendStream(
      userMessage.conversationId, // TODO 芋艿：这里可能要在优化；
      userMessage.content,
      conversationInAbortController.value,
      (message) => {
        console.log('message', message)
        const data = JSON.parse(message.data) // TODO 芋艿：类型处理；
        // debugger
        // 如果没有内容结束链接
        if (data.receive.content === '') {
          // 标记对话结束
          conversationInProgress.value = false
          // 结束 stream 对话
          conversationInAbortController.value.abort()
        }
        // 首次返回需要添加一个 message 到页面，后面的都是更新
        if (isFirstMessage) {
          isFirstMessage = false
          // debugger
          list.value.push(data.send)
          list.value.push(data.receive)
        } else {
          // debugger
          content = content + data.receive.content
          const lastMessage = list.value[list.value.length - 1]
          lastMessage.content = content
          list.value[list.value - 1] = lastMessage
        }
        // 滚动到最下面
        scrollToBottom()
      },
      (error) => {
        console.log('error', error)
        // 标记对话结束
        conversationInProgress.value = false
        // 结束 stream 对话
        conversationInAbortController.value.abort()
      },
      () => {
        console.log('close')
        // 标记对话结束
        conversationInProgress.value = false
        // 结束 stream 对话
        conversationInAbortController.value.abort()
      }
    )
  } finally {
  }
}

const stopStream = async () => {
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  if (conversationInAbortController.value) {
    conversationInAbortController.value.abort()
  }
  // 设置为 false
  conversationInProgress.value = false
}

// ============== message 数据 =================

/**
 * 获取 - message 列表
 */
const getMessageList = async () => {
  try {
    if (activeConversationId.value === null) {
      return
    }
    // 获取列表数据
    list.value = await ChatMessageApi.messageList(activeConversationId.value)
    // 滚动到最下面
    await nextTick(() => {
      scrollToBottom()
    })
  } finally {
  }
}

function noCopy(content) {
  copy(content)
  ElMessage({
    message: '复制成功!',
    type: 'success'
  })
}

const onDelete = async (id) => {
  // 删除 message
  await ChatMessageApi.delete(id)
  ElMessage({
    message: '删除成功!',
    type: 'success'
  })
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  await stopStream()
  // 重新获取 message 列表
  await getMessageList()
}


/** 修改聊天会话 */
const chatConversationUpdateFormRef = ref()
const openChatConversationUpdateForm = async () => {
  chatConversationUpdateFormRef.value.open(activeConversationId.value)
}


/**
 * 对话 - 标题修改成功
 */
const handlerTitleSuccess = async () => {
  // TODO 需要刷新 对话列表
}

/**
 * 对话 - 点击
 */
const handleConversationClick = async (conversation: ChatConversationVO) => {
  // 更新选中的对话 id
  activeConversationId.value = conversation.id
  activeConversation.value = conversation
  // 刷新 message 列表
  await getMessageList()
}

/**
 * 对话 - 清理全部对话
 */
const handlerConversationClear = async ()=> {
  activeConversationId.value = null
  activeConversation.value = null
  list.value = []
}

/** 初始化 **/
onMounted(async () => {
  // 设置当前对话 TODO 角色仓库过来的，自带 conversationId 需要选中
  // if (route.query.conversationId) {
  //   conversationId.value = route.query.conversationId as number
  // }
  // 获得聊天会话列表
  // await getChatConversationList()
  // 获取对话信息
  // await getConversation(conversationId.value)
  // 获取列表数据
  await getMessageList()
  // scrollToBottom();
  // await nextTick
  // 监听滚动事件，判断用户滚动状态
  messageContainer.value.addEventListener('scroll', handleScroll)
  // 添加 copy 监听
  messageContainer.value.addEventListener('click', (e: any) => {
    console.log(e)
    if (e.target.id === 'copy') {
      copy(e.target?.dataset?.copy)
      ElMessage({
        message: '复制成功!',
        type: 'success'
      })
    }
  })
})
</script>

<style lang="scss" scoped>
.ai-layout {
  // TODO @范 这里height不能 100% 先这样临时处理
  position: absolute;
  flex: 1;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  //padding: 15px 15px;
}

.conversation-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 10px;
  padding-top: 10px;

  .btn-new-conversation {
    padding: 18px 0;
  }

  .search-input {
    margin-top: 20px;
  }

  .conversation-list {
    margin-top: 20px;

    .conversation {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      flex: 1;
      padding: 0 5px;
      margin-top: 10px;
      cursor: pointer;
      border-radius: 5px;
      align-items: center;
      line-height: 30px;

      &.active {
        background-color: #e6e6e6;

        .button {
          display: inline-block;
        }
      }

      .title-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .title {
        padding: 5px 10px;
        max-width: 220px;
        font-size: 14px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .avatar {
        width: 28px;
        height: 28px;
        display: flex;
        flex-direction: row;
        justify-items: center;
      }

      // 对话编辑、删除
      .button-wrapper {
        right: 2px;
        display: flex;
        flex-direction: row;
        justify-items: center;
        color: #606266;

        .el-icon {
          margin-right: 5px;
        }
      }
    }
  }

  // 角色仓库、清空未设置对话
  .tool-box {
    line-height: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--el-text-color);

    > div {
      display: flex;
      align-items: center;
      color: #606266;
      padding: 0;
      margin: 0;
      cursor: pointer;

      > span {
        margin-left: 5px;
      }
    }
  }
}

// 头部
.detail-container {
  background: #ffffff;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: #fbfbfb;
    box-shadow: 0 0 0 0 #dcdfe6;

    .title {
      font-size: 18px;
      font-weight: bold;
    }
  }
}

// main 容器
.main-container {
  margin: 0;
  padding: 0;
  position: relative;
}

.message-container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  //width: 100%;
  //height: 100%;
  overflow-y: scroll;
  padding: 0 15px;
}

// 中间
.chat-list {
  display: flex;
  flex-direction: column;
  overflow-y: hidden;

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
      }
    }

    .left-btns,
    .right-btns {
      display: flex;
      flex-direction: row;
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
      margin-right: 5px;
    }

    .btn-cus-text {
      color: #757575;
    }
  }

  .btn-cus:hover {
    cursor: pointer;
  }

  .btn-cus:focus {
    background-color: #8c939d;
  }
}

// 底部
.footer-container {
  display: flex;
  flex-direction: column;
  height: auto;
  margin: 0;
  padding: 0;

  .prompt-from {
    display: flex;
    flex-direction: column;
    height: auto;
    border: 1px solid #e3e3e3;
    border-radius: 10px;
    margin: 20px 20px;
    padding: 9px 10px;
  }

  .prompt-input {
    height: 80px;
    //box-shadow: none;
    border: none;
    box-sizing: border-box;
    resize: none;
    padding: 0px 2px;
    //padding: 5px 5px;

    overflow: hidden;
  }

  .prompt-input:focus {
    outline: none;
  }

  .prompt-btns {
    display: flex;
    justify-content: space-between;
    padding-bottom: 0px;
    padding-top: 5px;
  }
}
</style>
