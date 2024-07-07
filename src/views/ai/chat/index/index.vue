<template>
  <el-container class="ai-layout">
    <!-- 左侧：对话列表 -->
    <Conversation
      :active-id="activeConversationId"
      ref="conversationRef"
      @onConversationCreate="handleConversationCreate"
      @onConversationClick="handleConversationClick"
      @onConversationClear="handlerConversationClear"
      @onConversationDelete="handlerConversationDelete"
    />
    <!-- 右侧：对话详情 -->
    <el-container class="detail-container">
      <el-header class="header">
        <div class="title">
          {{ activeConversation?.title ? activeConversation?.title : '对话' }}
          <span v-if="list.length">({{ list.length }})</span>
        </div>
        <div class="btns" v-if="activeConversation">
          <el-button type="primary" bg plain size="small" @click="openChatConversationUpdateForm">
            <span v-html="activeConversation?.modelName"></span>
            <Icon icon="ep:setting" style="margin-left: 10px" />
          </el-button>
          <el-button size="small" class="btn" @click="handlerMessageClear">
            <!-- TODO @fan：style 部分，可以考虑用 unocss 替代 -->
            <img src="@/assets/ai/clear.svg" style="height: 14px" />
          </el-button>
          <!-- TODO @fan：下面两个 icon，可以使用类似 <Icon icon="ep:question-filled" /> 替代哈 -->
          <el-button size="small" :icon="Download" class="btn" />
          <el-button size="small" :icon="Top" class="btn" @click="handlerGoTop" />
        </div>
      </el-header>

      <!-- main：消息列表 -->
      <el-main class="main-container">
        <div>
          <div class="message-container">
            <MessageLoading v-if="listLoading" />
            <MessageNewChat v-if="!activeConversation" @on-new-chat="handlerNewChat" />
            <ChatEmpty
              v-if="!listLoading && messageList.length === 0 && activeConversation"
              @on-prompt="doSend"
            />
            <Message
              v-if="!listLoading && messageList.length > 0"
              ref="messageRef"
              :conversation="activeConversation"
              :list="messageList"
              @on-delete-success="handlerMessageDelete"
              @on-edit="handlerMessageEdit"
              @on-refresh="handlerMessageRefresh"
            />
          </div>
        </div>
      </el-main>

      <!-- 底部 -->
      <el-footer class="footer-container">
        <form class="prompt-from">
          <textarea
            class="prompt-input"
            v-model="prompt"
            @keydown="onSend"
            @input="onPromptInput"
            @compositionstart="onCompositionstart"
            @compositionend="onCompositionend"
            placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"
          ></textarea>
          <div class="prompt-btns">
            <div>
              <el-switch v-model="enableContext" />
              <span style="font-size: 14px; color: #8f8f8f">上下文</span>
            </div>
            <el-button
              type="primary"
              size="default"
              @click="onSendBtn"
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
    <!-- 更新对话 Form -->
    <ChatConversationUpdateForm
      ref="chatConversationUpdateFormRef"
      @success="handlerTitleSuccess"
    />
  </el-container>
</template>

<script setup lang="ts">
// TODO @fan：是不是把 index.vue 相关的，在这里新建一个 index 目录，然后挪进去哈。因为 /ai/chat 还会有其它功能。例如说，现在的 /ai/chat/manager 管理
import Conversation from './Conversation.vue'
import Message from './Message.vue'
import ChatEmpty from './ChatEmpty.vue'
import MessageLoading from './MessageLoading.vue'
import MessageNewChat from './MessageNewChat.vue'
import { ChatMessageApi, ChatMessageVO } from '@/api/ai/chat/message'
import { ChatConversationApi, ChatConversationVO } from '@/api/ai/chat/conversation'
import ChatConversationUpdateForm from './components/ChatConversationUpdateForm.vue'
import { Download, Top } from '@element-plus/icons-vue'

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗

// ref 属性定义
const activeConversationId = ref<string | null>(null) // 选中的对话编号
const activeConversation = ref<ChatConversationVO | null>(null) // 选中的 Conversation
const conversationInProgress = ref(false) // 对话进行中
const conversationInAbortController = ref<any>() // 对话进行中 abort 控制器(控制 stream 对话)
const inputTimeout = ref<any>() // 处理输入中回车的定时器
const prompt = ref<string>() // prompt
const enableContext = ref<boolean>(true) // 是否开启上下文

// TODO @fan：这几个变量，可以注释在补下哈；另外，fullText 可以明确是生成中的消息 Text，这样更容易理解哈；
const fullText = ref('')
const displayedText = ref('')
const textSpeed = ref<number>(50) // Typing speed in milliseconds
const textRoleRunning = ref<boolean>(false) // Typing speed in milliseconds

// chat message 列表
// TODO @fan：list、listLoading、listLoadingTime 不能体现出来是消息列表，是不是可以变量再优化下
const list = ref<ChatMessageVO[]>([]) // 列表的数据
const listLoading = ref<boolean>(false) // 是否加载中
const listLoadingTime = ref<any>() // time 定时器，如果加载速度很快，就不进入加载中

// 判断 消息列表 滚动的位置(用于判断是否需要滚动到消息最下方)
const messageRef = ref()
const conversationRef = ref()
const isComposing = ref(false) // 判断用户是否在输入

// 默认 role 头像
const defaultRoleAvatar =
  'http://test.yudao.iocoder.cn/eaef5f41acb911dd718429a0702dcc3c61160d16e57ba1d543132fab58934f9f.png'

// =========== 自提滚动效果

// TODO @fan：这个方法，要不加个方法注释
const textRoll = async () => {
  let index = 0
  try {
    // 只能执行一次
    if (textRoleRunning.value) {
      return
    }
    // 设置状态
    textRoleRunning.value = true
    displayedText.value = ''
    const task = async () => {
      // 调整速度
      const diff = (fullText.value.length - displayedText.value.length) / 10
      if (diff > 5) {
        textSpeed.value = 10
      } else if (diff > 2) {
        textSpeed.value = 30
      } else if (diff > 1.5) {
        textSpeed.value = 50
      } else {
        textSpeed.value = 100
      }
      // 对话结束，就按 30 的速度
      if (!conversationInProgress.value) {
        textSpeed.value = 10
      }

      // console.log('index < fullText.value.length', index < fullText.value.length, conversationInProgress.value)

      if (index < fullText.value.length) {
        displayedText.value += fullText.value[index]
        index++

        // 更新 message
        const lastMessage = list.value[list.value.length - 1]
        lastMessage.content = displayedText.value
        // TODO @fan：ist.value？，还是 ist.value.length 哈？
        list.value[list.value - 1] = lastMessage
        // 滚动到住下面
        await scrollToBottom()
        // 重新设置任务
        timer = setTimeout(task, textSpeed.value)
      } else {
        // 不是对话中可以结束
        if (!conversationInProgress.value) {
          textRoleRunning.value = false
          clearTimeout(timer)
          console.log('字体滚动退出!')
        } else {
          // 重新设置任务
          timer = setTimeout(task, textSpeed.value)
        }
      }
    }
    let timer = setTimeout(task, textSpeed.value)
  } finally {
  }
}

// ============ 处理对话滚动 ==============

function scrollToBottom(isIgnore?: boolean) {
  // isIgnore = isIgnore !== null ? isIgnore : false
  nextTick(() => {
    if (messageRef.value) {
      messageRef.value.scrollToBottom(isIgnore)
    }
  })
}

// ============= 处理聊天输入回车发送 =============

// TODO @fan：是不是可以通过 @keydown.enter、@keydown.shift.enter 来实现，回车发送、shift+回车换行；主要看看，是不是可以简化 isComposing 相关的逻辑
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
const onSend = async (event) => {
  // 判断用户是否在输入
  if (isComposing.value) {
    return
  }
  // 进行中不允许发送
  if (conversationInProgress.value) {
    return
  }
  const content = prompt.value?.trim() as string
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // 插入换行
      prompt.value += '\r\n'
      event.preventDefault() // 防止默认的换行行为
    } else {
      // 发送消息
      await doSend(content)
      event.preventDefault() // 防止默认的提交行为
    }
  }
}

const onSendBtn = async () => {
  await doSend(prompt.value?.trim() as string)
}

const doSend = async (content: string) => {
  if (content.length < 2) {
    // TODO @fan：这个 message.error(`上传文件大小不能超过${props.fileSize}MB!`) 可以替代，这种形式
    ElMessage({
      message: '请输入内容!',
      type: 'error'
    })
    return
  }
  // TODO @fan：这个 message.error(`上传文件大小不能超过${props.fileSize}MB!`) 可以替代，这种形式
  if (activeConversationId.value == null) {
    ElMessage({
      message: '还没创建对话，不能发送!',
      type: 'error'
    })
    return
  }
  // 清空输入框
  prompt.value = ''
  // TODO @fan：idea 这里会报类型错误，是不是可以解决下哈
  const userMessage = {
    conversationId: activeConversationId.value,
    content: content
  } as ChatMessageVO
  // stream
  await doSendStream(userMessage)
}

const doSendStream = async (userMessage: ChatMessageVO) => {
  // 创建AbortController实例，以便中止请求
  conversationInAbortController.value = new AbortController()
  // 标记对话进行中
  conversationInProgress.value = true
  // 设置为空
  fullText.value = ''
  try {
    // 先添加两个假数据，等 stream 返回再替换
    list.value.push({
      id: -1,
      conversationId: activeConversationId.value,
      type: 'user',
      content: userMessage.content,
      createTime: new Date()
    } as ChatMessageVO)
    list.value.push({
      id: -2,
      conversationId: activeConversationId.value,
      type: 'system',
      content: '思考中...',
      createTime: new Date()
    } as ChatMessageVO)
    // 滚动到最下面
    // TODO @fan：可以 await nextTick()；然后同步调用 scrollToBottom()
    nextTick(async () => {
      await scrollToBottom()
    })
    // 开始滚动
    textRoll()
    // 发送 event stream
    let isFirstMessage = true // TODO @fan：isFirstChunk 会更精准
    ChatMessageApi.sendStream(
      userMessage.conversationId, // TODO 芋艿：这里可能要在优化；
      userMessage.content,
      conversationInAbortController.value,
      enableContext.value,
      async (res) => {
        console.log('res', res)
        const { code, data, msg } = JSON.parse(res.data)
        if (code !== 0) {
          message.alert(`对话异常! ${msg}`)
          return
        }

        // 如果内容为空，就不处理。
        if (data.receive.content === '') {
          return
        }
        // 首次返回需要添加一个 message 到页面，后面的都是更新
        if (isFirstMessage) {
          isFirstMessage = false
          // 弹出两个 假数据
          list.value.pop()
          list.value.pop()
          // 更新返回的数据
          list.value.push(data.send)
          list.value.push(data.receive)
        }
        // debugger
        fullText.value = fullText.value + data.receive.content
        // 滚动到最下面
        await scrollToBottom()
      },
      (error) => {
        message.alert(`对话异常! ${error}`)
        // TODO @fan：是不是可以复用 stopStream 方法
        // 标记对话结束
        conversationInProgress.value = false
        // 结束 stream 对话
        conversationInAbortController.value.abort()
      },
      () => {
        // TODO @fan：是不是可以复用 stopStream 方法
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
  console.log('stopStream...')
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  if (conversationInAbortController.value) {
    conversationInAbortController.value.abort()
  }
  // 设置为 false
  conversationInProgress.value = false
}

// ============== message 数据 =================

/** 消息列表 */
const messageList = computed(() => {
  if (list.value.length > 0) {
    return list.value
  }
  // 没有消息时，如果有 systemMessage 则展示它
  // TODO add by 芋艿：这个消息下面，不能有复制、删除按钮
  if (activeConversation.value?.systemMessage) {
    return [
      {
        id: 0,
        type: 'system',
        content: activeConversation.value.systemMessage
      }
    ]
  }
  return []
})

// TODO @fan：一般情况下，项目方法注释用 /** */，啊哈，主要保持风格统一，= = 少占点行哈，
/**
 * 获取 - message 列表
 */
const getMessageList = async () => {
  try {
    // time 定时器，如果加载速度很快，就不进入加载中
    listLoadingTime.value = setTimeout(() => {
      listLoading.value = true
    }, 60)
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
    // time 定时器，如果加载速度很快，就不进入加载中
    if (listLoadingTime.value) {
      clearTimeout(listLoadingTime.value)
    }
    // 加载结束
    listLoading.value = false
  }
}

/** 修改聊天对话 */
const chatConversationUpdateFormRef = ref()
const openChatConversationUpdateForm = async () => {
  chatConversationUpdateFormRef.value.open(activeConversationId.value)
}

/**
 * 对话 - 标题修改成功
 */
const handlerTitleSuccess = async () => {
  // TODO 需要刷新 对话列表
  await getConversation(activeConversationId.value)
}

/**
 * 对话 - 创建
 */
const handleConversationCreate = async () => {
  // 创建新的对话，清空输入框
  prompt.value = ''
}

/**
 * 对话 - 点击
 */
const handleConversationClick = async (conversation: ChatConversationVO) => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    await message.alert('对话中，不允许切换!')
    return false
  }

  // 更新选中的对话 id
  activeConversationId.value = conversation.id
  activeConversation.value = conversation
  // 处理进行中的对话
  if (conversationInProgress.value) {
    await stopStream()
  }
  // 刷新 message 列表
  await getMessageList()
  // 滚动底部
  scrollToBottom(true)
  // 清空输入框
  prompt.value = ''
  return true
}

/**
 * 对话 - 清理全部对话
 */
const handlerConversationClear = async () => {
  // TODO @fan：需要加一个 对话进行中，不允许切换
  activeConversationId.value = null
  activeConversation.value = null
  list.value = []
}

/**
 * 对话 - 删除
 */
const handlerConversationDelete = async (delConversation: ChatConversationVO) => {
  // 删除的对话如果是当前选中的，那么就重置
  if (activeConversationId.value === delConversation.id) {
    await handlerConversationClear()
  }
}

/**
 * 对话 - 获取
 */
const getConversation = async (id: string | null) => {
  if (!id) {
    return
  }
  const conversation: ChatConversationVO = await ChatConversationApi.getChatConversationMy(id)
  if (conversation) {
    activeConversation.value = conversation
    activeConversationId.value = conversation.id
  }
}

/**
 * 对话 - 新建
 */
// TODO @fan：应该是 handleXXX，handler 是名词哈
const handlerNewChat = async () => {
  // 创建对话
  await conversationRef.value.createConversation()
}

// ============ message ===========

/**
 * 删除 message
 */
const handlerMessageDelete = async () => {
  if (conversationInProgress.value) {
    message.alert('回答中，不能删除!')
    return
  }
  // 刷新 message
  await getMessageList()
}

/**
 * 编辑 message：设置为 prompt，可以再次编辑
 */
const handlerMessageEdit = async (message: ChatMessageVO) => {
  prompt.value = message.content
}

/**
 * 刷新 message：基于指定消息，再次发起对话
 */
const handlerMessageRefresh = async (message: ChatMessageVO) => {
  await doSend(message.content)
}

/**
 * 回到顶部
 */
const handlerGoTop = async () => {
  await messageRef.value.handlerGoTop()
}

/**
 * message 清除
 */
const handlerMessageClear = async () => {
  if (!activeConversationId.value) {
    return
  }
  // TODO @fan：需要 try catch 下，不然点击取消会报异常
  // 确认提示
  await message.delConfirm('确认清空对话消息？')
  // 清空对话
  await ChatMessageApi.deleteByConversationId(activeConversationId.value as string)
  // TODO @fan：是不是直接置空就好啦；
  // 刷新 message 列表
  await getMessageList()
}

/** 初始化 **/
onMounted(async () => {
  // 设置当前对话 TODO 角色仓库过来的，自带 conversationId 需要选中
  if (route.query.conversationId) {
    const id = route.query.conversationId as string
    activeConversationId.value = id
    await getConversation(id)
  }
  // 获取列表数据
  listLoading.value = true
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

    .btns {
      display: flex;
      width: 300px;
      flex-direction: row;
      justify-content: flex-end;
      //justify-content: space-between;

      .btn {
        padding: 10px;
      }
    }
  }
}

// main 容器
.main-container {
  margin: 0;
  padding: 0;
  position: relative;
  height: 100%;
  width: 100%;

  .message-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    //width: 100%;
    //height: 100%;
    overflow-y: hidden;
    padding: 0;
    margin: 0;
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
    margin: 10px 20px 20px 20px;
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
    overflow: auto;
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
