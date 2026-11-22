<template>
  <doc-alert title="WebSocket 实时通信" url="https://doc.iocoder.cn/websocket/" />

  <!-- 状态栏 -->
  <el-card shadow="never" class="mb-12px">
    <div class="grid grid-cols-5 gap-16px">
      <div v-for="item in statusItems" :key="item.label">
        <div class="text-12px text-[var(--el-text-color-secondary)]">{{ item.label }}</div>
        <div class="mt-8px truncate text-15px font-medium" :class="item.class">
          {{ item.value }}
        </div>
      </div>
    </div>
  </el-card>

  <el-row :gutter="12">
    <!-- 左侧：连接管理、发送消息 -->
    <el-col :span="10">
      <el-card shadow="never" class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-8px font-medium">
              <span class="h-8px w-8px rounded-full" :class="statusMeta.dot"></span>
              连接与发送（WebSocket 双向）
            </span>
            <el-tag :type="statusMeta.tag" effect="plain">{{ statusMeta.text }}</el-tag>
          </div>
        </template>
        <el-form label-width="84px" label-position="left">
          <el-form-item label="服务地址">
            <el-input :model-value="maskedServer" readonly />
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
              :disabled="status !== 'CLOSED'"
              :loading="status === 'CONNECTING'"
              @click="open"
            >
              <Icon v-if="status !== 'CONNECTING'" icon="ep:link" class="mr-5px" /> 开启连接
            </el-button>
            <el-button type="danger" plain :disabled="status === 'CLOSED'" @click="handleClose">
              <Icon icon="ep:close" class="mr-5px" /> 关闭连接
            </el-button>
          </div>
        </div>

        <el-divider content-position="left">发送消息（WebSocket 上行）</el-divider>
        <el-form label-width="84px" label-position="left">
          <el-form-item label="接收人">
            <el-select v-model="sendUserId" clearable placeholder="所有人（群发）" class="w-full">
              <el-option
                v-for="user in userList"
                :key="user.id"
                :label="user.nickname"
                :value="user.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="消息类型">
            <el-input :model-value="SEND_TYPE" readonly />
          </el-form-item>
          <el-form-item label="内容">
            <el-input
              v-model="sendText"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="请输入你要发送的消息"
            />
          </el-form-item>
        </el-form>
        <div
          class="mb-12px rounded-4px bg-[var(--el-fill-color-light)] p-10px font-mono text-12px leading-18px text-[var(--el-text-color-regular)]"
        >
          <div class="mb-4px text-[var(--el-text-color-secondary)]">上行帧预览</div>
          <div class="break-all">{{ framePreview }}</div>
        </div>
        <el-button
          type="primary"
          class="w-full"
          :disabled="!isOpen || !sendText"
          @click="handleSend"
        >
          <Icon icon="ep:promotion" class="mr-5px" /> 发送消息
        </el-button>
        <div class="mt-12px text-12px leading-20px text-[var(--el-text-color-secondary)]">
          客户端定时发送 ping，服务端回复 pong；连接异常断开时自动重连，主动关闭后不再重连。
        </div>
      </el-card>
    </el-col>

    <!-- 右侧：消息记录 -->
    <el-col :span="14">
      <el-card shadow="never" class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">消息记录</span>
            <div class="flex items-center gap-8px">
              <el-radio-group v-model="filter" size="small">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="receive">接收</el-radio-button>
                <el-radio-button value="send">发送</el-radio-button>
                <el-radio-button value="system">系统</el-radio-button>
              </el-radio-group>
              <el-button size="small" @click="messageList = []">清空</el-button>
            </div>
          </div>
        </template>
        <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
          接收 {{ countOf('receive') }} · 发送 {{ countOf('send') }} · 系统 {{ countOf('system') }}
        </div>
        <el-empty
          v-if="filteredMessages.length === 0"
          :image-size="96"
          :description="isOpen ? '已连接，等待消息' : '尚未连接，请先点击「开启连接」'"
        />
        <el-table v-else :data="filteredMessages" size="small" max-height="520">
          <el-table-column label="时间" width="90">
            <template #default="{ row }">{{ formatDate(row.time, 'HH:mm:ss') }}</template>
          </el-table-column>
          <el-table-column label="方向" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="DIRECTION_META[row.direction].tag">
                {{ DIRECTION_META[row.direction].text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" prop="type" width="170" show-overflow-tooltip />
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
import { formatDate } from '@/utils/formatTime'
import { useWebSocket } from '@vueuse/core'
import { getRefreshToken } from '@/utils/auth'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'InfraWebSocket' })

/** 上行消息类型 */
const SEND_TYPE = 'demo-message-send'

type Direction = 'receive' | 'send' | 'system'
type MessageItem = { id: string; time: number; direction: Direction; type: string; text: string }
const DIRECTION_META = {
  receive: { text: '接收', tag: 'success' as const },
  send: { text: '发送', tag: 'primary' as const },
  system: { text: '系统', tag: 'info' as const }
}

const message = useMessage() // 消息弹窗

const refreshToken = getRefreshToken() // 使用 refreshToken 的原因：WebSocket 无法方便的刷新访问令牌
const server =
  (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') + '?token=' + refreshToken // WebSocket 服务地址
/** 展示用的服务地址：令牌只保留首尾 4 位 */
const maskedServer = computed(() => {
  const token = refreshToken || ''
  const masked = token.length > 8 ? `${token.slice(0, 4)}****${token.slice(-4)}` : '****'
  return token ? server.replace(token, masked) : server
})

/** 发起 WebSocket 连接 */
const { status, data, send, close, open } = useWebSocket(server, {
  autoReconnect: true,
  heartbeat: true
})
const isOpen = computed(() => status.value === 'OPEN') // WebSocket 连接是否打开

/** 连接状态的展示：文案、标签颜色、圆点颜色、操作提示 */
const statusMeta = computed(() => {
  switch (status.value) {
    case 'OPEN':
      return {
        text: '已连接',
        tag: 'success' as const,
        dot: 'bg-[var(--el-color-success)]',
        hint: '连接已建立，可以发送消息'
      }
    case 'CONNECTING':
      return {
        text: '连接中',
        tag: 'warning' as const,
        dot: 'bg-[var(--el-color-warning)]',
        hint: '正在建立连接…'
      }
    default:
      return {
        text: '未连接',
        tag: 'info' as const,
        dot: 'bg-[var(--el-text-color-placeholder)]',
        hint: '连接未建立，开启连接后才能发送消息'
      }
  }
})

/** 连接时长、最近心跳 */
const openedAt = ref<number>() // 本次连接建立的时间
const lastPongAt = ref<number>() // 最近一次收到 pong 的时间
const now = ref(Date.now()) // 当前时间，用于计算连接时长
let timer: ReturnType<typeof setInterval> | undefined
const duration = computed(() => {
  if (!isOpen.value || !openedAt.value) {
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
    class: isOpen.value
      ? 'text-[var(--el-color-success)]'
      : status.value === 'CLOSED'
        ? 'text-[var(--el-text-color-secondary)]'
        : 'text-[var(--el-color-warning)]'
  },
  { label: '协议 / 方向', value: 'ws:// · 双向（全双工）', class: '' },
  {
    label: '心跳',
    value: `ping → pong · 最近 ${lastPongAt.value ? formatDate(new Date(lastPongAt.value), 'HH:mm:ss') : '-'}`,
    class: ''
  },
  { label: '自动重连', value: '异常断开后自动重连', class: '' },
  { label: '已连接时长', value: duration.value, class: '' }
])

/** 消息记录 */
const messageList = ref<MessageItem[]>([]) // 最新的在前
const filter = ref<'all' | Direction>('all')
const filteredMessages = computed(() =>
  filter.value === 'all'
    ? messageList.value
    : messageList.value.filter((item) => item.direction === filter.value)
)
const countOf = (direction: Direction) =>
  messageList.value.filter((item) => item.direction === direction).length
const append = (direction: Direction, type: string, text: string) => {
  messageList.value.unshift({
    id: `${Date.now()}-${Math.random()}`,
    time: Date.now(),
    direction,
    type,
    text
  })
}

/** 监听连接状态，记录系统消息 */
watch(
  status,
  (value, oldValue) => {
    if (value === 'OPEN') {
      openedAt.value = Date.now()
      append('system', 'open', '连接成功')
    } else if (value === 'CLOSED' && oldValue) {
      openedAt.value = undefined
      append('system', 'close', '连接已关闭')
    }
  },
  { immediate: true }
)

/** 监听接收到的数据 */
watchEffect(() => {
  if (!data.value) {
    return
  }
  try {
    // 1. 收到心跳
    if (data.value === 'pong') {
      lastPongAt.value = Date.now()
      return
    }

    // 2.1 解析 type 消息类型
    const jsonMessage = JSON.parse(data.value)
    const type = jsonMessage.type
    const content = JSON.parse(jsonMessage.content)
    if (!type) {
      message.error('未知的消息类型：' + data.value)
      return
    }
    // 2.2 消息类型：demo-message-receive
    if (type === 'demo-message-receive') {
      const single = content.single
      append(
        'receive',
        type,
        `【${single ? '单发' : '群发'}】用户编号(${content.fromUserId})：${content.text}`
      )
      return
    }
    // 2.3 消息类型：notice-push
    if (type === 'notice-push') {
      append('receive', type, `【系统通知】：${content.title}`)
      return
    }
    message.error('未处理消息：' + data.value)
  } catch (error) {
    message.error('处理消息发生异常：' + data.value)
    console.error(error)
  }
})

/** 发送消息 */
const sendText = ref('') // 发送内容
const sendUserId = ref<number>() // 接收人，为空时群发
const buildFrame = () =>
  JSON.stringify({
    type: SEND_TYPE,
    // 先 JSON 化 message 消息内容，再 JSON 化整个消息
    content: JSON.stringify({ text: sendText.value, toUserId: sendUserId.value ?? '' })
  })
const framePreview = computed(() => buildFrame())
const handleSend = () => {
  send(buildFrame())
  append('send', SEND_TYPE, sendText.value)
  sendText.value = ''
}

/** 主动关闭连接 */
const handleClose = () => {
  close()
  // useWebSocket 主动 close 时会先清空内部连接，onclose 不再回写状态，这里手动同步为 CLOSED，以便再次开启连接
  status.value = 'CLOSED'
}

/** 初始化 **/
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
onMounted(async () => {
  timer = setInterval(() => (now.value = Date.now()), 1000)
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
})

onUnmounted(() => clearInterval(timer))
</script>
