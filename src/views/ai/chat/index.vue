<template>
  <el-container class="ai-layout">
    <!-- 左侧：会话列表 -->
    <Conversation :active-id="activeConversationId"
                  @onConversationClick="handleConversationClick"
                  @onConversationClear="handlerConversationClear"
                  @onConversationDelete="handlerConversationDelete"
    />
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

      <!-- main -->
      <el-main class="main-container">
        <div class="message-container" >
          <Message v-if="list.length > 0" ref="messageRef" :list="list" @on-delete-success="handlerMessageDelete" />
          <ChatEmpty  v-if="list.length === 0" @on-prompt="onSend"/>
        </div>
      </el-main>

      <!-- 底部 -->
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
import Conversation from './Conversation.vue'
import Message from './Message.vue'
import ChatEmpty from './ChatEmpty.vue'
import {ChatMessageApi, ChatMessageVO} from '@/api/ai/chat/message'
import {ChatConversationApi, ChatConversationVO} from '@/api/ai/chat/conversation'
import {useClipboard} from '@vueuse/core'
import ChatConversationUpdateForm from "@/views/ai/chat/components/ChatConversationUpdateForm.vue";
import {send} from "vite";

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const {copy} = useClipboard() // 初始化 copy 到粘贴板

// ref 属性定义
const activeConversationId = ref<string | null>(null) // 选中的对话编号
const activeConversation = ref<ChatConversationVO | null>(null) // 选中的 Conversation
const conversationInProgress = ref(false) // 对话进行中
const conversationInAbortController = ref<any>() // 对话进行中 abort 控制器(控制 stream 对话)
const inputTimeout = ref<any>() // 处理输入中回车的定时器
const prompt = ref<string>() // prompt

// 判断 消息列表 滚动的位置(用于判断是否需要滚动到消息最下方)
const messageRef = ref()
const isComposing = ref(false) // 判断用户是否在输入

/** chat message 列表 */
const list = ref<ChatMessageVO[]>([]) // 列表的数据

// ============ 处理对话滚动 ==============

function scrollToBottom(isIgnore?: boolean) {
  nextTick(() => {
    messageRef.value.scrollToBottom(isIgnore)
  })
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
const onSend = async (val?: string) => {
  // 判断用户是否在输入
  if (isComposing.value) {
    return
  }
  // 进行中不允许发送
  if (conversationInProgress.value) {
    return
  }
  const content = (val ? val : prompt.value?.trim()) as string
  if (content.length < 2) {
    ElMessage({
      message: '请输入内容!',
      type: 'error'
    })
    return
  }
  if (activeConversationId.value == null) {
      ElMessage({
        message: '还没创建对话，不能发送!',
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
  await scrollToBottom()
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
      async (message) => {
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
        await scrollToBottom()
      },
      (error) => {
        // 标记对话结束
        conversationInProgress.value = false
        // 结束 stream 对话
        conversationInAbortController.value.abort()
      },
      () => {
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
      // 滚动到最后
      scrollToBottom()
    })
  } finally {
  }
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
  // 滚动底部
  scrollToBottom(true)
}

/**
 * 对话 - 清理全部对话
 */
const handlerConversationClear = async ()=> {
  activeConversationId.value = null
  activeConversation.value = null
  list.value = []
}

/**
 * 对话 - 删除
 */
const handlerConversationDelete = async (delConversation: ChatConversationVO) => {
  // 删除的对话如果是当前选中的，那么久重置
  if (activeConversationId.value === delConversation.id) {
    await handlerConversationClear()
  }
}

/**
 * 对话 - 获取
 */
const getConversation = async (id: string) => {
  const conversation: ChatConversationVO = await ChatConversationApi.getChatConversationMy(id)
  return conversation
}

// ============ message ===========

const handlerMessageDelete = async () => {
  // 刷新 message
  await getMessageList()
}

/** 初始化 **/
onMounted(async () => {
  // 设置当前对话 TODO 角色仓库过来的，自带 conversationId 需要选中
  if (route.query.conversationId) {
    const id = route.query.conversationId as string
    activeConversationId.value = id
    activeConversation.value = await getConversation(id) as ChatConversationVO
  }
  // 获取列表数据
  await getMessageList()
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
