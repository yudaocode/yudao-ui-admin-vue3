<template>
  <doc-alert title="SSE 实时推送" url="https://doc.iocoder.cn/sse/" />

  <!-- 状态栏 -->
  <el-card shadow="never" class="mb-12px">
    <div class="grid grid-cols-5 gap-16px">
      <div v-for="item in statusItems" :key="item.label">
        <div class="text-12px text-[var(--el-text-color-secondary)]">{{ item.label }}</div>
        <div class="mt-8px truncate text-15px font-medium" :class="item.class">{{
          item.value
        }}</div>
      </div>
    </div>
  </el-card>

  <el-row :gutter="12">
    <!-- 左侧：连接管理、发送测试事件 -->
    <el-col :span="10">
      <el-card shadow="never" class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-8px font-medium">
              <span class="h-8px w-8px rounded-full" :class="statusMeta.dot"></span>
              连接与发送（SSE 下行 · HTTP 上行）
            </span>
            <el-tag :type="statusMeta.tag" effect="plain">{{ statusMeta.text }}</el-tag>
          </div>
        </template>
        <el-form label-width="84px" label-position="left">
          <el-form-item label="服务地址">
            <el-input :model-value="maskedServer" readonly />
          </el-form-item>
          <el-form-item label="客户端编号">
            <el-input :model-value="clientId" readonly />
          </el-form-item>
          <el-form-item label="连接编号">
            <el-input :model-value="connectionId || '连接后由服务端分配'" readonly />
          </el-form-item>
        </el-form>
        <!-- 连接操作：左侧状态说明，右侧操作按钮 -->
        <div
          class="flex items-center justify-between gap-12px rounded-4px bg-[var(--el-fill-color-light)] px-12px py-8px"
        >
          <span class="text-13px text-[var(--el-text-color-secondary)]">{{ statusMeta.hint }}</span>
          <div class="flex shrink-0">
            <el-button
              type="primary"
              :disabled="!!source"
              :loading="status === 'CONNECTING'"
              @click="connect"
            >
              <Icon v-if="status !== 'CONNECTING'" icon="ep:link" class="mr-5px" /> 开启连接
            </el-button>
            <el-button type="danger" plain :disabled="!source" @click="disconnect">
              <Icon icon="ep:close" class="mr-5px" /> 关闭连接
            </el-button>
          </div>
        </div>

        <el-divider content-position="left">发送测试事件（HTTP 上行）</el-divider>
        <el-form label-width="84px" label-position="left">
          <el-form-item label="接收人">
            <el-select v-model="toUserId" clearable placeholder="所有人（群发）" class="w-full">
              <el-option
                v-for="user in userList"
                :key="user.id"
                :label="user.nickname"
                :value="user.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="事件类型">
            <el-input :model-value="DEMO_EVENT" readonly />
          </el-form-item>
          <el-form-item label="内容">
            <el-input
              v-model="sendText"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="SSE 没有上行通道，通过 HTTP 接口发布测试事件"
            />
          </el-form-item>
        </el-form>
        <el-button
          type="primary"
          class="w-full"
          :disabled="!connected || !sendText"
          :loading="sending"
          v-hasPermi="['infra:sse:send']"
          @click="sendDemo"
        >
          <Icon icon="ep:promotion" class="mr-5px" /> 发送测试事件
        </el-button>
        <div class="mt-12px text-12px leading-20px text-[var(--el-text-color-secondary)]">
          服务端以 messageType 作为 event 名下发；心跳使用注释帧 : ping，浏览器不会触发事件； 断线后
          EventSource 按 retry 自动重连，主动关闭后不再重连。
        </div>
      </el-card>
    </el-col>

    <!-- 右侧：事件流 -->
    <el-col :span="14">
      <el-card shadow="never" class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">事件流</span>
            <div class="flex items-center gap-8px">
              <el-radio-group v-model="filter" size="small">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="business">业务</el-radio-button>
                <el-radio-button value="system">系统</el-radio-button>
              </el-radio-group>
              <el-button size="small" @click="events = []">清空</el-button>
            </div>
          </div>
        </template>
        <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
          业务事件 {{ businessCount }} · 系统事件 {{ events.length - businessCount }}
        </div>
        <el-empty
          v-if="filteredEvents.length === 0"
          :image-size="96"
          :description="connected ? '已连接，等待服务端推送事件' : '尚未连接，请先点击「开启连接」'"
        />
        <el-table v-else :data="filteredEvents" size="small" max-height="520">
          <el-table-column label="时间" prop="time" width="90" />
          <el-table-column label="事件" width="140">
            <template #default="{ row }">
              <el-tag size="small" :type="getEventTagType(row.kind)">{{ row.kind }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="eventId" prop="eventId" width="150" show-overflow-tooltip />
          <el-table-column label="内容" min-width="200">
            <template #default="{ row }">
              <span class="whitespace-pre-wrap break-all">{{ row.text }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { getRefreshToken } from '@/utils/auth'
import * as SseApi from '@/api/infra/sse'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'InfraSse' })

/** 演示事件类型 */
const DEMO_EVENT = 'demo-sse-test'
/** 需要订阅的业务事件：服务端使用 messageType 作为 SSE 的 event 名，必须按名称订阅，onmessage 收不到 */
const BUSINESS_EVENTS = [DEMO_EVENT, 'notice-push']
/** 系统事件：连接、关闭、异常 */
const SYSTEM_EVENTS = ['connected', 'close', 'error']

type SseEventItem = { id: string; kind: string; time: string; eventId: string; text: string }
type SseStatus = 'CLOSED' | 'CONNECTING' | 'OPEN' | 'RECONNECTING'

const message = useMessage() // 消息弹窗

const ssePath = ref('/infra/sse') // SSE 接口路径前缀
const heartbeatInterval = ref(25000) // 心跳间隔，单位：毫秒
const retryInterval = ref(5000) // 重连间隔，单位：毫秒

const status = ref<SseStatus>('CLOSED') // 连接状态
const connected = computed(() => status.value === 'OPEN')
const connectionId = ref('') // 服务端分配的连接编号，用于主动关闭
const openedAt = ref<number>() // 本次连接建立的时间
const reconnectCount = ref(0) // 自动重连次数
const now = ref(Date.now()) // 当前时间，用于计算连接时长
let timer: ReturnType<typeof setInterval> | undefined

/** 客户端编号：每个标签页一个，保存在 sessionStorage，同一标签页重连时服务端替换旧连接 */
const CLIENT_ID_KEY = 'yudao.sse.client-id'
const getClientId = () => {
  let id = sessionStorage.getItem(CLIENT_ID_KEY)
  if (!id || !/^[\w-]{1,64}$/.test(id)) {
    id = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    sessionStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}
const clientId = getClientId()

const refreshToken = getRefreshToken() // 与 WebSocket 一样使用 refreshToken：EventSource 无法方便的刷新访问令牌
const server = computed(
  () =>
    `${import.meta.env.VITE_BASE_URL}${ssePath.value}/connect?clientId=${clientId}&token=${encodeURIComponent(refreshToken)}`
)
/** 展示用的服务地址：令牌只保留首尾 4 位 */
const maskedServer = computed(() => {
  const token = refreshToken || ''
  const masked = token.length > 8 ? `${token.slice(0, 4)}****${token.slice(-4)}` : '****'
  return server.value.replace(encodeURIComponent(token), masked)
})

/** 连接状态的展示：文案、标签颜色、圆点颜色、操作提示 */
const statusMeta = computed(() => {
  switch (status.value) {
    case 'OPEN':
      return {
        text: '已连接',
        tag: 'success' as const,
        dot: 'bg-[var(--el-color-success)]',
        hint: '连接已建立，可以发送测试事件'
      }
    case 'CONNECTING':
      return {
        text: '连接中',
        tag: 'warning' as const,
        dot: 'bg-[var(--el-color-warning)]',
        hint: '正在建立连接…'
      }
    case 'RECONNECTING':
      return {
        text: '重连中',
        tag: 'warning' as const,
        dot: 'bg-[var(--el-color-warning)]',
        hint: '连接中断，EventSource 正在自动重连…'
      }
    default:
      return {
        text: '未连接',
        tag: 'info' as const,
        dot: 'bg-[var(--el-text-color-placeholder)]',
        hint: '连接未建立，开启连接后才能接收事件'
      }
  }
})

/** 连接时长，格式 HH:mm:ss */
const duration = computed(() => {
  if (!connected.value || !openedAt.value) {
    return '-'
  }
  const seconds = Math.max(0, Math.floor((now.value - openedAt.value) / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`
})

/** 状态栏 */
const statusItems = computed(() => [
  {
    label: '连接状态',
    value: `${statusMeta.value.text} ${status.value}`,
    class: connected.value
      ? 'text-[var(--el-color-success)]'
      : status.value === 'CLOSED'
        ? 'text-[var(--el-text-color-secondary)]'
        : 'text-[var(--el-color-warning)]'
  },
  { label: '协议 / 方向', value: 'HTTP · 服务端单向推送', class: '' },
  { label: '心跳', value: `注释帧 : ping · 每 ${heartbeatInterval.value / 1000}s`, class: '' },
  {
    label: '自动重连',
    value: `retry ${retryInterval.value / 1000}s · 已重连 ${reconnectCount.value} 次`,
    class: ''
  },
  { label: '已连接时长', value: duration.value, class: '' }
])

/** 事件流 */
const events = ref<SseEventItem[]>([]) // 最新的在前
const filter = ref<'all' | 'business' | 'system'>('all')
const businessCount = computed(
  () => events.value.filter((item) => !SYSTEM_EVENTS.includes(item.kind)).length
)
const filteredEvents = computed(() => {
  if (filter.value === 'business') {
    return events.value.filter((item) => !SYSTEM_EVENTS.includes(item.kind))
  }
  if (filter.value === 'system') {
    return events.value.filter((item) => SYSTEM_EVENTS.includes(item.kind))
  }
  return events.value
})
const append = (kind: string, text: string, eventId = '') => {
  events.value.unshift({
    id: `${Date.now()}-${Math.random()}`,
    kind,
    time: new Date().toLocaleTimeString(),
    eventId,
    text
  })
}

/** 事件标签的颜色 */
const getEventTagType = (kind: string) => {
  if (kind === 'error' || kind === 'close') {
    return 'danger'
  }
  if (kind === 'connected') {
    return 'success'
  }
  return 'primary'
}

/** 解析 JSON，失败时返回 undefined */
const parseJson = (text?: string) => {
  try {
    return text ? JSON.parse(text) : undefined
  } catch {
    return undefined
  }
}

/** 处理 connected 事件 */
const handleConnected = (event: MessageEvent) => {
  const data = parseJson(event.data) || {}
  connectionId.value = data.connectionId || ''
  append('connected', `连接成功，connectionId：${connectionId.value}`)
}

/** 处理 close 事件：reconnect=false 时（TOKEN_INVALID、REPLACED、CLIENT_CLOSE）停止重连 */
const handleClose = (event: MessageEvent) => {
  const data = parseJson(event.data) || {}
  append('close', `${data.message || data.reason}（${data.reason}）`)
  if (data.reconnect === false) {
    closeSource()
  }
}

/** 处理业务事件：data 与 WebSocket 一致，为 {type, content, eventId, timestamp} */
const receivedEventIds: string[] = [] // 最近收到的 eventId
const handleBusinessEvent = (event: MessageEvent) => {
  const data = parseJson(event.data)
  if (!data) {
    append(event.type, event.data, event.lastEventId)
    return
  }
  // 前端兜底去重：重连后服务端的连接级去重缓存会清空
  const eventId = data.eventId || event.lastEventId
  if (eventId) {
    if (receivedEventIds.includes(eventId)) {
      return
    }
    receivedEventIds.push(eventId)
    if (receivedEventIds.length > 256) {
      receivedEventIds.shift()
    }
  }
  const content = parseJson(data.content) || {}
  let text = data.content
  if (data.type === DEMO_EVENT) {
    text = `【${content.single ? '单发' : '群发'}】用户编号(${content.fromUserId})：${content.text}`
  } else if (data.type === 'notice-push') {
    text = `【系统通知】：${content.title}`
  }
  append(event.type, text, eventId)
}

/** 关闭本地的 EventSource，停止自动重连 */
const source = shallowRef<EventSource>()
const closeSource = () => {
  source.value?.close()
  source.value = undefined
  status.value = 'CLOSED'
  connectionId.value = ''
  openedAt.value = undefined
}

/** 开启连接 */
const connect = () => {
  closeSource()
  reconnectCount.value = 0
  status.value = 'CONNECTING'
  const eventSource = new EventSource(server.value)
  source.value = eventSource
  eventSource.onopen = () => {
    if (status.value === 'RECONNECTING') {
      reconnectCount.value++
    }
    status.value = 'OPEN'
    openedAt.value = Date.now()
  }
  eventSource.addEventListener('connected', (event) => handleConnected(event as MessageEvent))
  eventSource.addEventListener('close', (event) => handleClose(event as MessageEvent))
  BUSINESS_EVENTS.forEach((name) =>
    eventSource.addEventListener(name, (event) => handleBusinessEvent(event as MessageEvent))
  )
  eventSource.onmessage = handleBusinessEvent // 未指定 event 名的消息
  eventSource.onerror = () => {
    if (source.value !== eventSource) {
      return
    }
    // 非 200 响应（例如说令牌失效、SSE 未开启）时，浏览器不会再重连
    if (eventSource.readyState === EventSource.CLOSED) {
      closeSource()
      append('error', '连接失败，请检查登录状态，或确认已配置 yudao.sse.enable=true')
      return
    }
    status.value = 'RECONNECTING'
    openedAt.value = undefined
    append('error', `连接中断，EventSource 将在 ${retryInterval.value / 1000}s 后自动重连`)
  }
}

/** 关闭连接：先关闭本地连接，再通知服务端释放 */
const disconnect = async () => {
  const id = connectionId.value
  closeSource()
  if (id) {
    await SseApi.closeSseConnection(id, ssePath.value).catch(() => undefined)
  }
  append('close', '已主动关闭连接')
}

/** 发送测试事件 */
const sendText = ref('hello sse') // 发送内容
const toUserId = ref<number>() // 接收人，为空时群发
const sending = ref(false)
const sendDemo = async () => {
  sending.value = true
  try {
    const eventId = await SseApi.sendSseDemo({ text: sendText.value, toUserId: toUserId.value })
    message.success(`发送成功，事件编号：${eventId}`)
  } finally {
    sending.value = false
  }
}

/** 初始化：读取 SSE 配置、用户列表 */
const userList = ref<UserApi.UserVO[]>([])
onMounted(async () => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
  const config = await SseApi.getSseConfig()
  ssePath.value = config?.ssePath || '/infra/sse'
  heartbeatInterval.value = config?.sseHeartbeatInterval || 25000
  retryInterval.value = config?.sseRetryInterval || 5000
  userList.value = await UserApi.getSimpleUserList()
})

onUnmounted(() => {
  clearInterval(timer)
  const id = connectionId.value
  closeSource()
  if (id) {
    SseApi.closeSseConnection(id, ssePath.value).catch(() => undefined)
  }
})
</script>
