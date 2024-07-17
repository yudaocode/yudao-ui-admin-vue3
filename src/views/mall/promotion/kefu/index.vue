<template>
  <el-row :gutter="10">
    <!-- 会话列表 -->
    <el-col :span="8">
      <ContentWrap>
        <KeFuConversationList ref="keFuConversationRef" @change="handleChange" />
      </ContentWrap>
    </el-col>
    <!-- 会话详情（选中会话的消息列表） -->
    <el-col :span="16">
      <ContentWrap>
        <KeFuMessageList ref="keFuChatBoxRef" @change="getConversationList" />
      </ContentWrap>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { KeFuConversationList, KeFuMessageList } from './components'
import { WebSocketMessageTypeConstants } from './components/tools/constants'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { getAccessToken } from '@/utils/auth'
import { useWebSocket } from '@vueuse/core'

defineOptions({ name: 'KeFu' })

const message = useMessage() // 消息弹窗

// ======================= WebSocket start =======================
const server = ref(
  (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') + '?token=' + getAccessToken()
) // WebSocket 服务地址

/** 发起 WebSocket 连接 */
const { data, close, open } = useWebSocket(server.value, {
  autoReconnect: true,
  heartbeat: true
})

/** 监听 WebSocket 数据 */
watchEffect(() => {
  if (!data.value) {
    return
  }
  try {
    // 1. 收到心跳
    if (data.value === 'pong') {
      return
    }

    // 2.1 解析 type 消息类型
    const jsonMessage = JSON.parse(data.value)
    const type = jsonMessage.type
    if (!type) {
      message.error('未知的消息类型：' + data.value)
      return
    }
    // 2.2 消息类型：KEFU_MESSAGE_TYPE
    if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_TYPE) {
      // 刷新会话列表
      getConversationList()
      // 刷新消息列表
      keFuChatBoxRef.value?.refreshMessageList(JSON.parse(jsonMessage.content))
      return
    }
    // 2.3 消息类型：KEFU_MESSAGE_ADMIN_READ
    if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_ADMIN_READ) {
      // 刷新会话列表
      getConversationList()
    }
  } catch (error) {
    console.error(error)
  }
})
// ======================= WebSocket end =======================
/** 加载会话列表 */
const keFuConversationRef = ref<InstanceType<typeof KeFuConversationList>>()
const getConversationList = () => {
  keFuConversationRef.value?.getConversationList()
}

/** 加载指定会话的消息列表 */
const keFuChatBoxRef = ref<InstanceType<typeof KeFuMessageList>>()
const handleChange = (conversation: KeFuConversationRespVO) => {
  keFuChatBoxRef.value?.getNewMessageList(conversation)
}

/** 初始化 */
onMounted(() => {
  getConversationList()
  // 打开 websocket 连接
  open()
})

/** 销毁 */
onBeforeUnmount(() => {
  // 关闭 websocket 连接
  close()
})
</script>

<style lang="scss">
.kefu {
  height: calc(100vh - 165px);
  overflow: auto; /* 确保内容可滚动 */
}

/* 定义滚动条样式 */
::-webkit-scrollbar {
  width: 10px;
  height: 6px;
}

/* 定义滚动条轨道 内阴影+圆角 */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 0 rgba(240, 240, 240, 0.5);
  border-radius: 10px;
  background-color: #fff;
}

/* 定义滑块 内阴影+圆角 */
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  box-shadow: inset 0 0 0 rgba(240, 240, 240, 0.5);
  background-color: rgba(240, 240, 240, 0.5);
}
</style>
