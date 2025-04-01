<template>
  <el-container class="kefu-layout">
    <!-- 会话列表 -->
    <KeFuConversationList ref="keFuConversationRef" @change="handleChange" />
    <!-- 会话详情（选中会话的消息列表） -->
    <KeFuMessageList ref="keFuChatBoxRef" />
    <!-- 会员信息（选中会话的会员信息） -->
    <MemberInfo ref="memberInfoRef" />
  </el-container>
</template>

<script lang="ts" setup>
import { KeFuConversationList, KeFuMessageList, MemberInfo } from './components'
import { WebSocketMessageTypeConstants } from './components/tools/constants'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { getRefreshToken } from '@/utils/auth'
import { useWebSocket } from '@vueuse/core'
import { useMallKefuStore } from '@/store/modules/mall/kefu'

defineOptions({ name: 'KeFu' })

const message = useMessage() // 消息弹窗
const kefuStore = useMallKefuStore() // 客服缓存

// ======================= WebSocket start =======================
const server = ref(
  (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') +
    '?token=' +
    getRefreshToken() // 使用 getRefreshToken() 方法，而不使用 getAccessToken() 方法的原因：WebSocket 无法方便的刷新访问令牌
) // WebSocket 服务地址

/** 发起 WebSocket 连接 */
const { data, close, open } = useWebSocket(server.value, {
  autoReconnect: true,
  heartbeat: true
})

/** 监听 WebSocket 数据 */
watch(
  () => data.value,
  (newData) => {
    if (!newData) return
    try {
      // 1. 收到心跳
      if (newData === 'pong') return

      // 2.1 解析 type 消息类型
      const jsonMessage = JSON.parse(newData)
      const type = jsonMessage.type
      if (!type) {
        message.error('未知的消息类型：' + newData)
        return
      }

      // 2.2 消息类型：KEFU_MESSAGE_TYPE
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_TYPE) {
        const message = JSON.parse(jsonMessage.content)
        // 刷新会话列表
        kefuStore.updateConversation(message.conversationId)
        // 刷新消息列表
        keFuChatBoxRef.value?.refreshMessageList(message)
        return
      }

      // 2.3 消息类型：KEFU_MESSAGE_ADMIN_READ
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_ADMIN_READ) {
        // 更新会话已读
        const message = JSON.parse(jsonMessage.content)
        kefuStore.updateConversationStatus(message.conversationId)
      }
    } catch (error) {
      console.error(error)
    }
  },
  {
    immediate: false // 不立即执行
  }
)
// ======================= WebSocket end =======================

/** 加载指定会话的消息列表 */
const keFuChatBoxRef = ref<InstanceType<typeof KeFuMessageList>>()
const memberInfoRef = ref<InstanceType<typeof MemberInfo>>()
const handleChange = (conversation: KeFuConversationRespVO) => {
  keFuChatBoxRef.value?.getNewMessageList(conversation)
  memberInfoRef.value?.initHistory(conversation)
}

const keFuConversationRef = ref<InstanceType<typeof KeFuConversationList>>()
/** 初始化 */
onMounted(() => {
  /** 加载会话列表 */
  kefuStore.setConversationList().then(() => {
    keFuConversationRef.value?.calculationLastMessageTime()
  })
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
.kefu-layout {
  position: absolute;
  flex: 1;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
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
