<template>
  <el-container
    class="left-0 top-0 h-full w-full flex-1 bg-[var(--el-bg-color)]"
    :class="pageFullscreen ? 'fixed z-1000 h-100vh w-100vw' : 'absolute'"
  >
    <!-- 左侧：会话列表 -->
    <SessionList
      v-show="!collapsed"
      :agent-list="agentList"
      :agent-loading="agentLoading"
      :agent-id="activeAgentId"
      :agent="activeAgent"
      :session-list="sessionList"
      :loading="sessionLoading"
      :active-id="activeSessionId"
      :fullscreen="pageFullscreen"
      @agent-change="selectAgent"
      @create="handleNewSession"
      @select="(item) => selectSession(item.id)"
      @rename="handleSessionRename"
      @delete="handleSessionDelete"
      @toggle-fullscreen="toggleFullscreen"
    />

    <!-- 右侧：会话 -->
    <el-container class="bg-[var(--el-bg-color)]">
      <el-header
        class="flex flex-row items-center gap-10px bg-[var(--el-bg-color-page)] shadow-[0_0_0_0_var(--el-border-color-light)]"
      >
        <Icon
          :icon="collapsed ? 'ep:expand' : 'ep:fold'"
          :size="18"
          class="flex-shrink-0 cursor-pointer hover:text-[var(--el-color-primary)]"
          :title="collapsed ? '展开会话列表' : '收起会话列表'"
          @click="collapsed = !collapsed"
        />
        <div class="text-18px font-bold truncate">
          {{ activeSession?.title || (activeAgent ? '新会话' : 'Agent 会话') }}
        </div>
      </el-header>

      <!-- 消息区 -->
      <el-main class="m-0 p-0 relative h-full w-full">
        <div class="absolute top-0 bottom-0 left-0 right-0 overflow-y-hidden">
          <!-- 情况一：没有可用的 Agent -->
          <el-empty
            v-if="!agentLoading && agentList.length === 0"
            description="暂无已开启的 Agent，请先在 Agent 管理中创建并开启"
          />
          <!-- 情况二：消息加载中 -->
          <div v-else-if="messageLoading" v-loading="true" class="h-full"></div>
          <!-- 情况三：已选中会话，展示消息列表 -->
          <SessionMessageList
            v-else-if="activeSessionId && messageList.length > 0"
            ref="messageListRef"
            :list="messageList"
          />
          <!-- 情况四：新会话，展示 Agent 欢迎信息 -->
          <div
            v-else-if="activeAgent"
            class="mx-auto h-full max-w-720px flex flex-col items-center justify-center px-20px pb-15vh"
          >
            <div class="text-26px font-bold truncate">{{ activeAgent.name }}</div>
            <div
              v-if="activeAgent.introduction"
              class="mt-10px text-15px text-[var(--el-text-color-secondary)] text-center"
            >
              {{ activeAgent.introduction }}
            </div>
          </div>
        </div>
      </el-main>

      <!-- 底部：输入框 -->
      <el-footer class="flex flex-col !h-auto !p-0">
        <div
          class="mx-20px mb-20px mt-10px flex flex-col border border-[var(--el-border-color)] border-solid rounded-10px px-10px py-9px"
        >
          <el-input
            ref="promptInputRef"
            v-model="prompt"
            type="textarea"
            :rows="3"
            resize="none"
            :input-style="{ padding: '0 2px', border: 'none', boxShadow: 'none' }"
            :disabled="!activeAgentId"
            placeholder="请输入你的问题（Enter 发送，Shift+Enter 换行）"
            @keydown="handlePromptKeydown"
          />
          <div class="flex items-center justify-between pt-5px">
            <span class="text-12px text-[var(--el-text-color-secondary)]">
              Enter 发送，Shift+Enter 换行
            </span>
            <el-tooltip
              v-if="streaming"
              content="仅停止接收：服务端会继续生成，重新打开该会话即可续传查看"
              placement="top"
            >
              <el-button type="danger" @click="handleStop">停止</el-button>
            </el-tooltip>
            <el-button v-else type="primary" :disabled="!activeAgentId" @click="sendMessage">
              发送
            </el-button>
          </div>
        </div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'
import { useCache } from '@/hooks/web/useCache'
import { AgentApi, Agent } from '@/api/ai1/agent'
import { SessionApi, Session } from '@/api/ai1/session'
import { SessionMessageApi, SessionStreamHandlers } from '@/api/ai1/session/message'
import {
  Ai1SessionMessageRoleEnum,
  Ai1SessionMessageStatusEnum,
  Ai1SessionStreamEventEnum
} from '@/views/ai1/utils/constants'
import SessionList from './SessionList.vue'
import SessionMessageList from './SessionMessageList.vue'
import type { Ai1SessionMessageItem } from './types'

/** AI1 Agent 会话 */
defineOptions({ name: 'Ai1Session' })

const route = useRoute() // 路由
const { resolve } = useRouter() // 路由
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { wsCache } = useCache() // 本地缓存

const AGENT_ID_CACHE_KEY = 'AI1_SESSION_AGENT_ID' // 缓存 Key：上次选择的 Agent 编号
const MAX_RESUME_ATTEMPTS = 3 // 断线后最多自动续传的次数
const RESUME_DELAY_MS = 500 // 续传的等待基数，单位：毫秒

// ==================== 页面布局 ====================

const collapsed = ref(false) // 会话列表是否收起
const { isFullscreen, enter, exit } = useFullscreen() // 浏览器全屏
const pageFullscreen = ref(false) // 会话页是否全屏

/** 切换全屏：浏览器全屏，同时会话页铺满视口 */
const toggleFullscreen = async () => {
  if (pageFullscreen.value) {
    await exit()
    return
  }
  await enter()
  pageFullscreen.value = true
}

/** 退出浏览器全屏（含 Esc）时，会话页同步退出全屏 */
watch(isFullscreen, (value) => {
  if (!value) {
    pageFullscreen.value = false
  }
})

// ==================== Agent ====================

const agentList = ref<Agent[]>([]) // Agent 列表
const agentLoading = ref(false) // Agent 列表加载中
const activeAgentId = ref<number>() // 当前选中的 Agent 编号
const activeAgent = computed(() => agentList.value.find((item) => item.id === activeAgentId.value))

/** 加载 Agent 精简列表 */
const getAgentList = async () => {
  agentLoading.value = true
  try {
    agentList.value = await AgentApi.getAgentSimpleList()
  } finally {
    agentLoading.value = false
  }
}

/** 选中 Agent */
const selectAgent = async (agentId: number) => {
  stopStream()
  activeAgentId.value = agentId
  wsCache.set(AGENT_ID_CACHE_KEY, agentId)
  activeSessionId.value = undefined
  messageList.value = []
  await getSessionList()
}

/** 获得初始 Agent：优先路由参数，其次缓存，最后第一个 */
const resolveInitialAgentId = (): number | undefined => {
  const exists = (id?: number) => !!id && agentList.value.some((item) => item.id === id)
  const queryAgentId = Number(route.query.agentId)
  if (exists(queryAgentId)) {
    return queryAgentId
  }
  if (route.query.agentId) {
    message.warning('指定的 Agent 不存在、已关闭或已被删除')
  }
  const cacheAgentId = Number(wsCache.get(AGENT_ID_CACHE_KEY))
  if (exists(cacheAgentId)) {
    return cacheAgentId
  }
  return agentList.value[0]?.id
}

// ==================== 会话 ====================

const sessionList = ref<Session[]>([]) // 会话列表
const sessionLoading = ref(false) // 会话列表加载中
const activeSessionId = ref<number>() // 当前选中的会话编号，为空表示新会话
const activeSession = computed(() =>
  sessionList.value.find((item) => item.id === activeSessionId.value)
)

/** 加载会话列表 */
const getSessionList = async () => {
  const agentId = activeAgentId.value
  if (!agentId) {
    sessionList.value = []
    return
  }
  sessionLoading.value = true
  try {
    const list = await SessionApi.getSessionMyList(agentId)
    if (agentId === activeAgentId.value) {
      sessionList.value = list
    }
  } finally {
    sessionLoading.value = false
  }
}

/** 新会话：首次发送时才创建会话 */
const handleNewSession = () => {
  if (!activeSessionId.value) {
    message.warning('已经是新会话')
  } else {
    stopStream()
    activeSessionId.value = undefined
    messageList.value = []
  }
  nextTick(() => promptInputRef.value?.focus())
}

/** 选中会话 */
const selectSession = async (sessionId: number) => {
  if (sessionId === activeSessionId.value) {
    // 停止或断线后允许重开当前会话；接收或加载中避免重复请求
    if (
      streaming.value ||
      messageLoading.value ||
      !messageList.value.some(
        (item) =>
          item.role === Ai1SessionMessageRoleEnum.ASSISTANT &&
          item.status === Ai1SessionMessageStatusEnum.GENERATING &&
          item.interrupted
      )
    ) {
      return
    }
  }
  stopStream()
  activeSessionId.value = sessionId
  await getSessionMessageList()
}

/** 修改会话标题 */
const handleSessionRename = async (session: Session, title: string) => {
  await SessionApi.updateSessionMy({ id: session.id, title })
  session.title = title
  message.success(t('common.updateSuccess'))
}

/** 删除会话 */
const handleSessionDelete = async (session: Session) => {
  try {
    await message.delConfirm(`确认删除会话「${session.title}」？`)
    await SessionApi.deleteSessionMy(session.id)
    if (session.id === activeSessionId.value) {
      stopStream()
      activeSessionId.value = undefined
      messageList.value = []
    }
    message.success(t('common.delSuccess'))
    await getSessionList()
  } catch {}
}

// ==================== 消息 ====================

const messageList = ref<Ai1SessionMessageItem[]>([]) // 消息列表
const messageLoading = ref(false) // 消息列表加载中
const messageListRef = ref() // 消息列表 Ref

/** 加载消息列表，自动续传生成中的助手消息 */
const getSessionMessageList = async () => {
  const sessionId = activeSessionId.value
  if (!sessionId) {
    return
  }
  messageLoading.value = true
  try {
    const list = await SessionMessageApi.getSessionMessageMyList(sessionId)
    // 加载期间切换了会话，丢弃结果
    if (sessionId !== activeSessionId.value) {
      return
    }
    messageList.value = list
  } finally {
    messageLoading.value = false
  }
  scrollToBottom(true)
  // 续传生成中的助手消息
  const generatingMessage = messageList.value.find(
    (item) =>
      item.role === Ai1SessionMessageRoleEnum.ASSISTANT &&
      item.status === Ai1SessionMessageStatusEnum.GENERATING
  )
  if (generatingMessage) {
    // 后台续传，不等待流结束，避免阻塞会话切换和页面初始化
    resumeMessage(generatingMessage).catch(() => {})
  }
}

/** 滚动到底部 */
const scrollToBottom = async (force = false) => {
  await nextTick()
  messageListRef.value?.scrollToBottom(force)
}

// ==================== 发送与流式接收 ====================

const prompt = ref('') // 输入框内容
const promptInputRef = ref() // 输入框
const streaming = ref(false) // 是否正在接收流
let streamController: AbortController | undefined // SSE 中止控制器
let streamingMessage: Ai1SessionMessageItem | undefined // 当前接收的助手消息
let streamSeq = 0 // 流序号，用于丢弃过期流的事件

/** 输入框按键：Enter 发送，Shift+Enter 换行 */
const handlePromptKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
    return
  }
  event.preventDefault()
  sendMessage()
}

/** 发送消息 */
const sendMessage = async () => {
  // 1. 校验
  const content = prompt.value.trim()
  if (!content) {
    message.warning('请输入你的问题')
    return
  }
  if (streaming.value || !activeAgentId.value) {
    return
  }

  // 2. 新会话时，先创建会话
  if (!activeSessionId.value) {
    const agentId = activeAgentId.value
    streaming.value = true // 防止重复发送
    try {
      const sessionId = await SessionApi.createSessionMy(agentId)
      // 创建期间切换了 Agent，不再发送
      if (agentId !== activeAgentId.value) {
        return
      }
      activeSessionId.value = sessionId
      await getSessionList()
    } catch {
      return
    } finally {
      streaming.value = false
    }
  }
  const sessionId = activeSessionId.value!

  // 3. 追加用户消息、助手消息；编号为临时值，由 stream 事件回填
  prompt.value = ''
  const now = new Date()
  messageList.value.push({
    id: -now.getTime(),
    sessionId,
    role: Ai1SessionMessageRoleEnum.USER,
    content,
    status: Ai1SessionMessageStatusEnum.SUCCESS,
    createTime: now
  })
  messageList.value.push({
    id: -now.getTime() - 1,
    sessionId,
    role: Ai1SessionMessageRoleEnum.ASSISTANT,
    reasoning: '',
    content: '',
    status: Ai1SessionMessageStatusEnum.GENERATING,
    createTime: now
  })
  // 取回响应式对象，保证视图更新
  const assistantMessage = messageList.value[messageList.value.length - 1]
  scrollToBottom(true)

  // 4. 流式接收
  await runStream(assistantMessage, (controller, handlers) =>
    SessionMessageApi.sendSessionMessageStream(sessionId, content, controller, handlers)
  )
}

/** 续传助手消息 */
const resumeMessage = async (assistantMessage: Ai1SessionMessageItem) => {
  assistantMessage.reasoning = ''
  assistantMessage.content = ''
  assistantMessage.interrupted = false
  await runStream(assistantMessage, (controller, handlers) =>
    SessionMessageApi.resumeSessionMessageStream(
      assistantMessage.id,
      undefined,
      controller,
      handlers
    )
  )
}

/** 执行流式接收，意外断线时自动续传 */
const runStream = async (
  assistantMessage: Ai1SessionMessageItem,
  open: (controller: AbortController, handlers: SessionStreamHandlers) => Promise<void>
) => {
  const seq = ++streamSeq
  streaming.value = true
  streamingMessage = assistantMessage
  // 流状态
  const state = {
    messageId: assistantMessage.id > 0 ? assistantMessage.id : undefined,
    lastEventId: undefined as string | undefined,
    finished: false
  }
  const handlers = createStreamHandlers(assistantMessage, state, seq)
  let opener = open
  let attempts = 0
  try {
    while (true) {
      const controller = new AbortController()
      streamController = controller
      try {
        // 异常交给下方续传判断
        await opener(controller, handlers)
      } catch {}
      // 已结束或已停止
      if (state.finished || seq !== streamSeq) {
        break
      }
      // 无法续传，或已达上限
      if (!state.messageId || attempts >= MAX_RESUME_ATTEMPTS) {
        assistantMessage.interrupted = true
        message.warning('连接已中断，可稍后重新打开该会话继续查看')
        break
      }
      attempts++
      await new Promise((resolve) => setTimeout(resolve, RESUME_DELAY_MS * attempts))
      // 等待期间被停止
      if (seq !== streamSeq) {
        break
      }
      const messageId = state.messageId
      opener = (controller, handlers) =>
        SessionMessageApi.resumeSessionMessageStream(
          messageId,
          state.lastEventId,
          controller,
          handlers
        )
    }
  } finally {
    // 仍是当前流时才复位
    if (seq === streamSeq) {
      streaming.value = false
      streamController = undefined
      streamingMessage = undefined
    }
  }
  if (state.finished && seq === streamSeq) {
    await scrollToBottom()
    await getSessionList()
  }
}

/** 创建 SSE 回调 */
const createStreamHandlers = (
  assistantMessage: Ai1SessionMessageItem,
  state: { messageId?: number; lastEventId?: string; finished: boolean },
  seq: number
): SessionStreamHandlers => ({
  onEvent: (event) => {
    if (seq !== streamSeq) {
      return
    }
    // 记录事件编号，用于续传
    if (event.id) {
      state.lastEventId = event.id
    }
    switch (event.event) {
      // 助手消息编号
      case Ai1SessionStreamEventEnum.STREAM:
        state.messageId = Number(event.data)
        assistantMessage.id = state.messageId
        break
      // 思考过程增量
      case Ai1SessionStreamEventEnum.THINKING:
        assistantMessage.reasoning = (assistantMessage.reasoning || '') + event.data
        scrollToBottom()
        break
      // 回复内容增量
      case Ai1SessionStreamEventEnum.MESSAGE:
        assistantMessage.content = (assistantMessage.content || '') + event.data
        scrollToBottom()
        break
      // 终态：生成结束
      case Ai1SessionStreamEventEnum.DONE:
        state.finished = true
        assistantMessage.status = Ai1SessionMessageStatusEnum.SUCCESS
        break
      // 终态：生成失败
      case Ai1SessionStreamEventEnum.ERROR:
        state.finished = true
        assistantMessage.status = Ai1SessionMessageStatusEnum.FAILED
        assistantMessage.errorMessage = event.data ? String(event.data) : undefined
        break
      // 其它事件：忽略
    }
  },
  onError: (error) => {
    // 抛出异常，终止 fetch-event-source 的自动重试
    throw error
  },
  onClose: () => {}
})

/** 停止接收：服务端仍会继续生成 */
const stopStream = () => {
  streamSeq++
  streamController?.abort()
  streamController = undefined
  streamingMessage = undefined
  streaming.value = false
}

/** 停止 */
const handleStop = () => {
  const assistantMessage = streamingMessage
  stopStream()
  if (assistantMessage?.status === Ai1SessionMessageStatusEnum.GENERATING) {
    assistantMessage.interrupted = true
  }
}

// ==================== 初始化 ====================

let initialized = false // 是否已初始化
let handledQueryAgentId: number | undefined // 已处理过的路由 agentId

/** 初始化 */
onMounted(async () => {
  handledQueryAgentId = Number(route.query.agentId) || undefined
  await getAgentList()
  const sessionId = Number(route.query.id)
  const agentId = resolveInitialAgentId()
  if (agentId) {
    await selectAgent(agentId)
  }
  // URL 带会话编号时，回到该会话
  if (sessionId) {
    if (sessionList.value.some((item) => item.id === sessionId)) {
      await selectSession(sessionId)
    } else {
      message.warning('指定的会话不存在或已被删除')
    }
  }
  initialized = true
  syncUrl()
})

/** 再次激活：带入新的 agentId 时，切换 Agent */
onActivated(() => {
  const agentId = Number(route.query.agentId)
  if (!initialized || !agentId || agentId === handledQueryAgentId) {
    return
  }
  handledQueryAgentId = agentId
  if (agentId === activeAgentId.value) {
    return
  }
  if (agentList.value.some((item) => item.id === agentId)) {
    selectAgent(agentId)
  } else {
    // 可能是新建的 Agent，重新加载列表
    getAgentList().then(() => {
      if (agentList.value.some((item) => item.id === agentId)) {
        selectAgent(agentId)
      }
    })
  }
})

/** 同步当前 Agent、会话到 URL：只改地址栏，不触发路由跳转，避免页面重新渲染 */
const syncUrl = () => {
  const url = resolve({
    path: route.path,
    query: {
      ...(activeAgentId.value ? { agentId: String(activeAgentId.value) } : {}),
      ...(activeSessionId.value ? { id: String(activeSessionId.value) } : {})
    }
  }).href
  window.history.replaceState(window.history.state, '', url)
}
watch([activeAgentId, activeSessionId], () => {
  if (initialized) {
    syncUrl()
  }
})

/** 离开页面 */
onBeforeUnmount(() => {
  stopStream()
})
</script>
