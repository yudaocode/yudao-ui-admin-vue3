<template>
  <el-container class="absolute flex-1 top-0 left-0 h-full w-full">
    <!-- 左侧：对话列表 -->
    <ConversationList
      :active-id="activeConversationId?.toString() || ''"
      ref="conversationListRef"
      @on-conversation-create="handleConversationCreateSuccess"
      @on-conversation-click="handleConversationClick"
      @on-conversation-clear="handleConversationClear"
      @on-conversation-delete="handlerConversationDelete"
    />
    <!-- 右侧：对话详情 -->
    <el-container class="bg-[var(--el-bg-color)]">
      <el-header
        class="flex flex-row items-center justify-between bg-[var(--el-bg-color-page)] shadow-[0_0_0_0_var(--el-border-color-light)]"
      >
        <div class="text-18px font-bold">
          {{ activeConversation?.title ? activeConversation?.title : '对话' }}
          <span v-if="activeMessageList.length">({{ activeMessageList.length }})</span>
        </div>
        <div class="flex w-300px flex-row justify-end" v-if="activeConversation">
          <el-button type="primary" bg plain size="small" @click="openChatConversationUpdateForm">
            <span v-html="activeConversation?.modelName"></span>
            <Icon icon="ep:setting" class="ml-10px" />
          </el-button>
          <el-button size="small" class="p-10px" @click="handlerMessageClear">
            <Icon
              icon="heroicons-outline:archive-box-x-mark"
              color="var(--el-text-color-placeholder)"
            />
          </el-button>
          <el-button size="small" class="p-10px">
            <Icon icon="ep:download" color="var(--el-text-color-placeholder)" />
          </el-button>
          <el-button size="small" class="p-10px" @click="handleGoTopMessage">
            <Icon icon="ep:top" color="var(--el-text-color-placeholder)" />
          </el-button>
        </div>
      </el-header>

      <!-- main：消息列表 -->
      <el-main class="m-0 p-0 relative h-full w-full">
        <div>
          <div class="absolute top-0 bottom-0 left-0 right-0 overflow-y-hidden p-0 m-0">
            <!-- 情况一：消息加载中 -->
            <MessageLoading v-if="activeMessageListLoading" />
            <!-- 情况二：无聊天对话时 -->
            <MessageNewConversation
              v-if="!activeConversation"
              @on-new-conversation="handleConversationCreate"
            />
            <!-- 情况三：消息列表为空 -->
            <MessageListEmpty
              v-if="!activeMessageListLoading && messageList.length === 0 && activeConversation"
              @on-prompt="doSendMessage"
            />
            <!-- 情况四：消息列表不为空 -->
            <MessageList
              v-if="!activeMessageListLoading && messageList.length > 0 && activeConversation"
              ref="messageRef"
              :conversation="activeConversation"
              :list="messageList"
              @on-delete-success="handleMessageDelete"
              @on-edit="handleMessageEdit"
              @on-refresh="handleMessageRefresh"
            />
          </div>
        </div>
      </el-main>

      <!-- 底部 -->
      <el-footer class="flex flex-col !h-auto !p-0">
        <!-- TODO @芋艿：这块要想办法迁移下！ -->
        <form
          class="mt-10px mx-20px mb-20px py-9px px-10px flex flex-col h-auto rounded-10px"
          style="border: 1px solid var(--el-border-color)"
        >
          <textarea
            class="h-80px border-none box-border resize-none py-0 px-2px overflow-auto focus:outline-none"
            v-model="prompt"
            @keydown="handleSendByKeydown"
            @input="handlePromptInput"
            @compositionstart="onCompositionstart"
            @compositionend="onCompositionend"
            placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"
          >
          </textarea>
          <div class="flex justify-between pb-0 pt-5px">
            <div class="flex items-center">
              <MessageFileUpload v-model="uploadFiles" :limit="5" :max-size="10" class="mr-10px" />
              <el-switch v-model="enableContext" />
              <span class="ml-5px mr-15px text-14px text-#8f8f8f">上下文</span>
              <el-switch v-model="enableWebSearch" />
              <span class="ml-5px text-14px text-#8f8f8f">联网搜索</span>
            </div>
            <el-button
              type="primary"
              size="default"
              @click="handleSendByButton"
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

    <!-- 更新对话 Form -->
    <ConversationUpdateForm
      ref="conversationUpdateFormRef"
      @success="handleConversationUpdateSuccess"
    />
  </el-container>
</template>

<script setup lang="ts">
import { ChatMessageApi, ChatMessageVO } from '@/api/ai/chat/message'
import { ChatConversationApi, ChatConversationVO } from '@/api/ai/chat/conversation'
import ConversationList from './components/conversation/ConversationList.vue'
import ConversationUpdateForm from './components/conversation/ConversationUpdateForm.vue'
import MessageList from './components/message/MessageList.vue'
import MessageListEmpty from './components/message/MessageListEmpty.vue'
import MessageLoading from './components/message/MessageLoading.vue'
import MessageNewConversation from './components/message/MessageNewConversation.vue'
import MessageFileUpload from './components/message/MessageFileUpload.vue'

/** AI 聊天对话 列表 */
defineOptions({ name: 'AiChat' })

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗

// 聊天对话
const conversationListRef = ref()
const activeConversationId = ref<number | null>(null) // 选中的对话编号
const activeConversation = ref<ChatConversationVO | null>(null) // 选中的 Conversation
const conversationInProgress = ref(false) // 对话是否正在进行中。目前只有【发送】消息时，会更新为 true，避免切换对话、删除对话等操作

// 消息列表
const messageRef = ref()
const activeMessageList = ref<ChatMessageVO[]>([]) // 选中对话的消息列表
const activeMessageListLoading = ref<boolean>(false) // activeMessageList 是否正在加载中
const activeMessageListLoadingTimer = ref<any>() // activeMessageListLoading Timer 定时器。如果加载速度很快，就不进入加载中
// 消息滚动
const textSpeed = ref<number>(50) // Typing speed in milliseconds
const textRoleRunning = ref<boolean>(false) // Typing speed in milliseconds

// 发送消息输入框
const isComposing = ref(false) // 判断用户是否在输入
const conversationInAbortController = ref<any>() // 对话进行中 abort 控制器(控制 stream 对话)
const inputTimeout = ref<any>() // 处理输入中回车的定时器
const prompt = ref<string>() // prompt
const enableContext = ref<boolean>(true) // 是否开启上下文
const enableWebSearch = ref<boolean>(false) // 是否开启联网搜索
const uploadFiles = ref<string[]>([]) // 上传的文件 URL 列表
// 接收 Stream 消息
const receiveMessageFullText = ref('')
const receiveMessageDisplayedText = ref('')

// =========== 【聊天对话】相关 ===========

/** 获取对话信息 */
const getConversation = async (id: number | null) => {
  if (!id) {
    return
  }
  const conversation: ChatConversationVO = await ChatConversationApi.getChatConversationMy(id)
  if (!conversation) {
    return
  }
  activeConversation.value = conversation
  activeConversationId.value = conversation.id
}

/**
 * 点击某个对话
 *
 * @param conversation 选中的对话
 * @return 是否切换成功
 */
const handleConversationClick = async (conversation: ChatConversationVO) => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    message.alert('对话中，不允许切换!')
    return false
  }

  // 更新选中的对话 id
  activeConversationId.value = conversation.id
  activeConversation.value = conversation
  // 刷新 message 列表
  await getMessageList()
  // 滚动底部
  scrollToBottom(true)
  // 清空输入框
  prompt.value = ''
  // 清空文件列表
  uploadFiles.value = []
  return true
}

/** 删除某个对话*/
const handlerConversationDelete = async (delConversation: ChatConversationVO) => {
  // 删除的对话如果是当前选中的，那么就重置
  if (activeConversationId.value === delConversation.id) {
    await handleConversationClear()
  }
}
/** 清空选中的对话 */
const handleConversationClear = async () => {
  // 对话进行中，不允许切换
  if (conversationInProgress.value) {
    message.alert('对话中，不允许切换!')
    return false
  }
  activeConversationId.value = null
  activeConversation.value = null
  activeMessageList.value = []
}

/** 修改聊天对话 */
const conversationUpdateFormRef = ref()
const openChatConversationUpdateForm = async () => {
  conversationUpdateFormRef.value.open(activeConversationId.value)
}
const handleConversationUpdateSuccess = async () => {
  // 对话更新成功，刷新最新信息
  await getConversation(activeConversationId.value)
}

/** 处理聊天对话的创建成功 */
const handleConversationCreate = async () => {
  // 创建对话
  await conversationListRef.value.createConversation()
}
/** 处理聊天对话的创建成功 */
const handleConversationCreateSuccess = async () => {
  // 创建新的对话，清空输入框
  prompt.value = ''
  // 清空文件列表
  uploadFiles.value = []
}

// =========== 【消息列表】相关 ===========

/** 获取消息 message 列表 */
const getMessageList = async () => {
  try {
    if (activeConversationId.value === null) {
      return
    }
    // Timer 定时器，如果加载速度很快，就不进入加载中
    activeMessageListLoadingTimer.value = setTimeout(() => {
      activeMessageListLoading.value = true
    }, 60)

    // 获取消息列表
    activeMessageList.value = await ChatMessageApi.getChatMessageListByConversationId(
      activeConversationId.value
    )

    // 滚动到最下面
    await nextTick()
    await scrollToBottom()
  } finally {
    // time 定时器，如果加载速度很快，就不进入加载中
    if (activeMessageListLoadingTimer.value) {
      clearTimeout(activeMessageListLoadingTimer.value)
    }
    // 加载结束
    activeMessageListLoading.value = false
  }
}

/**
 * 消息列表
 *
 * 和 {@link #getMessageList()} 的差异是，把 systemMessage 考虑进去
 */
const messageList = computed(() => {
  if (activeMessageList.value.length > 0) {
    return activeMessageList.value
  }
  // 没有消息时，如果有 systemMessage 则展示它
  if (activeConversation.value?.systemMessage) {
    return [
      {
        id: 0,
        conversationId: activeConversation.value.id || 0,
        type: 'system',
        userId: '',
        roleId: '',
        model: 0,
        modelId: 0,
        content: activeConversation.value.systemMessage,
        tokens: 0,
        createTime: new Date(),
        roleAvatar: '',
        userAvatar: ''
      } as ChatMessageVO
    ]
  }
  return []
})

/** 处理删除 message 消息 */
const handleMessageDelete = () => {
  if (conversationInProgress.value) {
    message.alert('回答中，不能删除!')
    return
  }
  // 刷新 message 列表
  getMessageList()
}

/** 处理 message 清空 */
const handlerMessageClear = async () => {
  if (!activeConversationId.value) {
    return
  }
  try {
    // 确认提示
    await message.delConfirm('确认清空对话消息？')
    // 清空对话
    await ChatMessageApi.deleteByConversationId(activeConversationId.value)
    // 刷新 message 列表
    activeMessageList.value = []
  } catch {}
}

/** 回到 message 列表的顶部 */
const handleGoTopMessage = () => {
  messageRef.value.handlerGoTop()
}

// =========== 【发送消息】相关 ===========

/** 处理来自 keydown 的发送消息 */
const handleSendByKeydown = async (event) => {
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
      await doSendMessage(content)
      event.preventDefault() // 防止默认的提交行为
    }
  }
}

/** 处理来自【发送】按钮的发送消息 */
const handleSendByButton = () => {
  doSendMessage(prompt.value?.trim() as string)
}

/** 处理 prompt 输入变化 */
const handlePromptInput = (event) => {
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
// TODO @芋艿：是不是可以通过 @keydown.enter、@keydown.shift.enter 来实现，回车发送、shift+回车换行；主要看看，是不是可以简化 isComposing 相关的逻辑
const onCompositionstart = () => {
  isComposing.value = true
}
const onCompositionend = () => {
  // console.log('输入结束...')
  setTimeout(() => {
    isComposing.value = false
  }, 200)
}

/** 真正执行【发送】消息操作 */
const doSendMessage = async (content: string) => {
  // 校验
  if (content.length < 1) {
    message.error('发送失败，原因：内容为空！')
    return
  }
  if (activeConversationId.value == null) {
    message.error('还没创建对话，不能发送!')
    return
  }

  // 准备附件 URL 数组
  const attachmentUrls = [...uploadFiles.value]

  // 清空输入框和文件列表
  prompt.value = ''
  uploadFiles.value = []

  // 执行发送
  await doSendMessageStream({
    conversationId: activeConversationId.value,
    content: content,
    attachmentUrls: attachmentUrls
  } as ChatMessageVO)
}

/** 真正执行【发送】消息操作 */
const doSendMessageStream = async (userMessage: ChatMessageVO) => {
  // 创建 AbortController 实例，以便中止请求
  conversationInAbortController.value = new AbortController()
  // 标记对话进行中
  conversationInProgress.value = true
  // 设置为空
  receiveMessageFullText.value = ''

  try {
    // 1.1 先添加两个假数据，等 stream 返回再替换
    activeMessageList.value.push({
      id: -1,
      conversationId: activeConversationId.value,
      type: 'user',
      content: userMessage.content,
      attachmentUrls: userMessage.attachmentUrls || [],
      createTime: new Date()
    } as ChatMessageVO)
    activeMessageList.value.push({
      id: -2,
      conversationId: activeConversationId.value,
      type: 'assistant',
      content: '思考中...',
      reasoningContent: '',
      createTime: new Date()
    } as ChatMessageVO)
    // 1.2 滚动到最下面
    await nextTick()
    await scrollToBottom() // 底部
    // 1.3 开始滚动
    textRoll()

    // 2. 发送 event stream
    let isFirstChunk = true // 是否是第一个 chunk 消息段
    await ChatMessageApi.sendChatMessageStream(
      userMessage.conversationId,
      userMessage.content,
      conversationInAbortController.value,
      enableContext.value,
      enableWebSearch.value,
      async (res) => {
        const { code, data, msg } = JSON.parse(res.data)
        if (code !== 0) {
          message.alert(`对话异常! ${msg}`)
          // 如果未接收到消息，则进行删除
          if (receiveMessageFullText.value === '') {
            activeMessageList.value.pop()
          }
          return
        }

        // 如果内容为空，就不处理。
        if (data.receive.content === '' && !data.receive.reasoningContent) {
          return
        }

        // 首次返回需要添加一个 message 到页面，后面的都是更新
        if (isFirstChunk) {
          isFirstChunk = false
          // 弹出两个假数据
          activeMessageList.value.pop()
          activeMessageList.value.pop()
          // 更新返回的数据
          activeMessageList.value.push(data.send)
          data.send.attachmentUrls = userMessage.attachmentUrls
          activeMessageList.value.push(data.receive)
        }

        // 处理 reasoningContent
        if (data.receive.reasoningContent) {
          const lastMessage = activeMessageList.value[activeMessageList.value.length - 1]
          lastMessage.reasoningContent =
            lastMessage.reasoningContent + data.receive.reasoningContent
        }

        // 处理正常内容
        if (data.receive.content !== '') {
          receiveMessageFullText.value = receiveMessageFullText.value + data.receive.content
        }
        // 滚动到最下面
        await scrollToBottom()
      },
      (error: any) => {
        // 异常提示，并停止流
        message.alert(`对话异常！`)
        stopStream()
        // 需要抛出异常，禁止重试
        throw error
      },
      () => {
        stopStream()
      },
      userMessage.attachmentUrls
    )
  } catch {}
}

/** 停止 stream 流式调用 */
const stopStream = async () => {
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  if (conversationInAbortController.value) {
    conversationInAbortController.value.abort()
  }
  // 设置为 false
  conversationInProgress.value = false
}

/** 编辑 message：设置为 prompt，可以再次编辑 */
const handleMessageEdit = (message: ChatMessageVO) => {
  prompt.value = message.content
}

/** 刷新 message：基于指定消息，再次发起对话 */
const handleMessageRefresh = (message: ChatMessageVO) => {
  doSendMessage(message.content)
}

// ============== 【消息滚动】相关 =============

/** 滚动到 message 底部 */
const scrollToBottom = async (isIgnore?: boolean) => {
  await nextTick()
  if (messageRef.value) {
    messageRef.value.scrollToBottom(isIgnore)
  }
}

/** 自提滚动效果 */
const textRoll = async () => {
  let index = 0
  try {
    // 只能执行一次
    if (textRoleRunning.value) {
      return
    }
    // 设置状态
    textRoleRunning.value = true
    receiveMessageDisplayedText.value = ''
    const task = async () => {
      // 调整速度
      const diff =
        (receiveMessageFullText.value.length - receiveMessageDisplayedText.value.length) / 10
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

      if (index < receiveMessageFullText.value.length) {
        receiveMessageDisplayedText.value += receiveMessageFullText.value[index]
        index++

        // 更新 message
        const lastMessage = activeMessageList.value[activeMessageList.value.length - 1]
        lastMessage.content = receiveMessageDisplayedText.value
        // 滚动到住下面
        await scrollToBottom()
        // 重新设置任务
        timer = setTimeout(task, textSpeed.value)
      } else {
        // 不是对话中可以结束
        if (!conversationInProgress.value) {
          textRoleRunning.value = false
          clearTimeout(timer)
        } else {
          // 重新设置任务
          timer = setTimeout(task, textSpeed.value)
        }
      }
    }
    let timer = setTimeout(task, textSpeed.value)
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  // 如果有 conversationId 参数，则默认选中
  if (route.query.conversationId) {
    const id = route.query.conversationId as unknown as number
    activeConversationId.value = id
    await getConversation(id)
  }

  // 获取列表数据
  activeMessageListLoading.value = true
  await getMessageList()
})
</script>
