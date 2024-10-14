<template>
  <doc-alert title="WebSocket 实时通信" url="https://doc.iocoder.cn/websocket/" />

  <div class="flex">
    <!-- 左侧：建立连接、发送消息 -->
    <el-card :gutter="12" class="w-1/2" shadow="always">
      <template #header>
        <div class="card-header">
          <span>连接</span>
        </div>
      </template>
      <div class="flex items-center">
        <span class="mr-4 text-lg font-medium"> 连接状态: </span>
        <el-tag :color="getTagColor">{{ status }}</el-tag>
      </div>
      <hr class="my-4" />
      <div class="flex">
        <el-input v-model="server" disabled>
          <template #prepend>服务地址</template>
        </el-input>
        <el-button :type="getIsOpen ? 'danger' : 'primary'" @click="toggleConnectStatus">
          {{ getIsOpen ? '关闭连接' : '开启连接' }}
        </el-button>
      </div>
      <p class="mt-4 text-lg font-medium">消息输入框</p>
      <hr class="my-4" />
      <el-input
        v-model="sendText"
        :autosize="{ minRows: 2, maxRows: 4 }"
        :disabled="!getIsOpen"
        clearable
        placeholder="请输入你要发送的消息"
        type="textarea"
      />
      <el-select v-model="sendUserId" class="mt-4" placeholder="请选择发送人">
        <el-option key="" label="所有人" value="" />
        <el-option
          v-for="user in userList"
          :key="user.id"
          :label="user.nickname"
          :value="user.id"
        />
      </el-select>
      <el-button :disabled="!getIsOpen" block class="ml-2 mt-4" type="primary" @click="handlerSend">
        发送
      </el-button>
    </el-card>
    <!-- 右侧：消息记录 -->
    <el-card :gutter="12" class="w-1/2" shadow="always">
      <template #header>
        <div class="card-header">
          <span>消息记录</span>
        </div>
      </template>
      <div class="max-h-80 overflow-auto">
        <ul>
          <li v-for="msg in messageReverseList" :key="msg.time" class="mt-2">
            <div class="flex items-center">
              <span class="text-primary mr-2 font-medium">收到消息:</span>
              <span>{{ formatDate(msg.time) }}</span>
            </div>
            <div>
              {{ msg.text }}
            </div>
          </li>
        </ul>
      </div>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { useWebSocket } from '@vueuse/core'
import { getRefreshToken } from '@/utils/auth'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'InfraWebSocket' })

const message = useMessage() // 消息弹窗

const server = ref(
  (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') +
    '?token=' +
    getRefreshToken() // 使用 getRefreshToken() 方法，而不使用 getAccessToken() 方法的原因：WebSocket 无法方便的刷新访问令牌
) // WebSocket 服务地址
const getIsOpen = computed(() => status.value === 'OPEN') // WebSocket 连接是否打开
const getTagColor = computed(() => (getIsOpen.value ? 'success' : 'red')) // WebSocket 连接的展示颜色

/** 发起 WebSocket 连接 */
const { status, data, send, close, open } = useWebSocket(server.value, {
  autoReconnect: true,
  heartbeat: true
})

/** 监听接收到的数据 */
const messageList = ref([] as { time: number; text: string }[]) // 消息列表
const messageReverseList = computed(() => messageList.value.slice().reverse())
watchEffect(() => {
  if (!data.value) {
    return
  }
  try {
    // 1. 收到心跳
    if (data.value === 'pong') {
      // state.recordList.push({
      //   text: '【心跳】',
      //   time: new Date().getTime()
      // })
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
      if (single) {
        messageList.value.push({
          text: `【单发】用户编号(${content.fromUserId})：${content.text}`,
          time: new Date().getTime()
        })
      } else {
        messageList.value.push({
          text: `【群发】用户编号(${content.fromUserId})：${content.text}`,
          time: new Date().getTime()
        })
      }
      return
    }
    // 2.3 消息类型：notice-push
    if (type === 'notice-push') {
      messageList.value.push({
        text: `【系统通知】：${content.title}`,
        time: new Date().getTime()
      })
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
const sendUserId = ref('') // 发送人
const handlerSend = () => {
  // 1.1 先 JSON 化 message 消息内容
  const messageContent = JSON.stringify({
    text: sendText.value,
    toUserId: sendUserId.value
  })
  // 1.2 再 JSON 化整个消息
  const jsonMessage = JSON.stringify({
    type: 'demo-message-send',
    content: messageContent
  })
  // 2. 最后发送消息
  send(jsonMessage)
  sendText.value = ''
}

/** 切换 websocket 连接状态 */
const toggleConnectStatus = () => {
  if (getIsOpen.value) {
    close()
  } else {
    open()
  }
}

/** 初始化 **/
const userList = ref<any[]>([]) // 用户列表
onMounted(async () => {
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
})
</script>
