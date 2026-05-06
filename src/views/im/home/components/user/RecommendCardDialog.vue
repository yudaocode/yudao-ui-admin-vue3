<template>
  <!--
    把他推荐给朋友（个人名片转发弹窗）
    - 顶部展示被推荐用户名片预览
    - 中间列出最近会话（私聊 + 群聊）支持多选；过滤掉「推荐给本人」的私聊会话
    - 底部可选「给朋友留言」，确定后逐个会话发送 CARD 消息（有留言再补一条 TEXT）
    TODO @AI：/Users/yunai/Downloads/iShot_2026-05-05_23.56.31.png 更完整的参考微信界面；
    TODO @AI：/Users/yunai/Downloads/iShot_2026-05-05_23.57.51.png
    TODO @AI：输入可以选择表情；
  -->
  <el-dialog v-model="visible" title="把他推荐给朋友" width="520px" :close-on-click-modal="false">
    <div class="flex flex-col gap-3">
      <!-- 名片预览：和 FriendAddDialog 的用户卡保持一致的浅色背景 -->
      <div class="flex gap-3 items-center px-3 py-2.5 rounded-md bg-[var(--el-fill-color-light)]">
        <UserAvatar
          :id="user?.id"
          :url="user?.avatar"
          :name="user?.nickname"
          :size="40"
          :clickable="false"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate text-[var(--el-text-color-primary)]">
            {{ user?.nickname }}
          </div>
          <div class="mt-0.5 text-12px text-[var(--el-text-color-secondary)]">个人名片</div>
        </div>
      </div>

      <!-- 搜索 -->
      <el-input v-model="keyword" placeholder="搜索聊天" clearable>
        <template #prefix>
          <Icon icon="ant-design:search-outlined" />
        </template>
      </el-input>

      <!-- 最近聊天列表 -->
      <div class="flex flex-col gap-1.5">
        <div class="text-13px text-[var(--el-text-color-secondary)]">最近聊天</div>
        <el-scrollbar class="h-[260px] rounded border border-[var(--el-border-color-lighter)]">
          <div
            v-for="conversation in shownConversations"
            :key="getConversationKey(conversation)"
            class="flex gap-2.5 items-center px-3 py-2 cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
            @click="handleToggle(conversation)"
          >
            <el-checkbox
              :model-value="isSelected(conversation)"
              @click.stop
              @change="handleToggle(conversation)"
            />
            <UserAvatar
              :url="conversation.avatar"
              :name="conversation.name"
              :size="32"
              :clickable="false"
            />
            <div class="flex flex-1 gap-1 items-center min-w-0">
              <span class="overflow-hidden text-sm truncate text-[var(--el-text-color-primary)]">
                {{ conversation.name }}
              </span>
              <el-tag
                v-if="conversation.type === ImConversationType.GROUP"
                size="small"
                type="primary"
                effect="plain"
                class="flex-shrink-0"
              >
                群
              </el-tag>
            </div>
          </div>
          <div
            v-if="shownConversations.length === 0"
            class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
          >
            {{ keyword ? '没有满足条件的会话' : '暂无会话' }}
          </div>
        </el-scrollbar>
      </div>

      <!-- 留言（可不填） -->
      <el-input
        v-model="leaveMessage"
        type="textarea"
        :rows="2"
        :maxlength="100"
        show-word-limit
        placeholder="给朋友留言（可不填）"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="sending"
        :disabled="selectedKeys.size === 0"
        @click="handleSend"
      >
        发送{{ selectedKeys.size > 0 ? `（${selectedKeys.size}）` : '' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useUserStore } from '@/store/modules/user'

import UserAvatar from './UserAvatar.vue'
import { useConversationStore } from '../../store/conversationStore'
import { ImConversationType, ImMessageType, ImMessageStatus } from '../../../utils/constants'
import { getConversationKey } from '../../../utils/conversation'
import {
  generateClientMessageId,
  serializeMessage,
  type CardMessage,
  type TextMessage
} from '../../../utils/message'
import { sendPrivateMessage as apiSendPrivateMessage } from '@/api/im/message/private'
import { sendGroupMessage as apiSendGroupMessage } from '@/api/im/message/group'
import type { Conversation, Message, User } from '../../types'

defineOptions({ name: 'ImRecommendCardDialog' })

const props = defineProps<{
  modelValue: boolean
  /** 被推荐的用户名片：触发方传入；为 null 时不渲染（弹窗也不应被打开） */
  user: User | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const message = useMessage()
const userStore = useUserStore()
const conversationStore = useConversationStore()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const keyword = ref('')
const leaveMessage = ref('')
const sending = ref(false)
/** 已勾选的会话 key 集合（使用 type:targetId 组合主键），勾选数据不直接绑 conversation 对象避免 store 引用副作用 */
const selectedKeys = ref<Set<string>>(new Set())

/** 每次重新打开都把选中态 / 搜索 / 留言清空，避免上次脏数据泄漏到下次 */
watch(visible, (open) => {
  if (open) {
    keyword.value = ''
    leaveMessage.value = ''
    selectedKeys.value = new Set()
  }
})

/** 候选会话：排除已删除 / 自己发给自己；私聊「推荐给本人」过滤掉避免无意义自推 */
const candidateConversations = computed(() => {
  const recommendId = props.user?.id
  return conversationStore.getSortedConversations.filter((conversation) => {
    if (
      recommendId &&
      conversation.type === ImConversationType.PRIVATE &&
      conversation.targetId === recommendId
    ) {
      return false
    }
    return true
  })
})

/** 按搜索关键字过滤展示列表（仅按 name 模糊匹配；与左侧主搜索一致） */
const shownConversations = computed(() => {
  const keywordLower = keyword.value.trim().toLowerCase()
  if (!keywordLower) {
    return candidateConversations.value
  }
  return candidateConversations.value.filter((c) =>
    (c.name || '').toLowerCase().includes(keywordLower)
  )
})

/** 是否选中：按 conversation key 查 set */
function isSelected(conversation: Conversation): boolean {
  return selectedKeys.value.has(getConversationKey(conversation))
}

/** 切换选中态：set 引用替换触发响应式 */
function handleToggle(conversation: Conversation) {
  const key = getConversationKey(conversation)
  const next = new Set(selectedKeys.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  selectedKeys.value = next
}

/** 构造名片消息 content（JSON 字符串） */
function buildCardContent(): string {
  const payload: CardMessage = {
    userId: props.user!.id!,
    nickname: props.user!.nickname || '',
    avatar: props.user!.avatar
  }
  return serializeMessage(payload)
}

/** 构造留言文本消息 content；空文本返回 null */
function buildLeaveTextContent(): string | null {
  const text = leaveMessage.value.trim()
  if (!text) {
    return null
  }
  return serializeMessage<TextMessage>({ content: text })
}

/** 构造本地乐观消息（id=0 表示尚未拿到服务端 id） */
function buildLocalMessage(opts: {
  clientMessageId: string
  content: string
  type: number
  targetId: number
}): Message {
  return {
    id: 0,
    clientMessageId: opts.clientMessageId,
    type: opts.type,
    content: opts.content,
    status: ImMessageStatus.SENDING,
    sendTime: Date.now(),
    senderId: Number(userStore.getUser?.id) || 0,
    targetId: opts.targetId,
    selfSend: true
  }
}

/** 发送一条消息到指定会话：插占位 → 调 API → ack；失败更新为 FAILED */
async function sendOneToConversation(conversation: Conversation, type: number, content: string) {
  const clientMessageId = generateClientMessageId()
  const localMessage = buildLocalMessage({
    clientMessageId,
    content,
    type,
    targetId: conversation.targetId
  })
  conversationStore.insertMessage(
    {
      type: conversation.type,
      targetId: conversation.targetId,
      name: conversation.name || String(conversation.targetId),
      avatar: conversation.avatar || ''
    },
    localMessage
  )
  try {
    if (conversation.type === ImConversationType.PRIVATE) {
      const data = await apiSendPrivateMessage({
        clientMessageId,
        receiverId: conversation.targetId,
        type,
        content
      })
      conversationStore.ackMessage(conversation.type, conversation.targetId, clientMessageId, {
        id: data.id,
        sendTime: new Date(data.sendTime).getTime(),
        status: data.status,
        content: data.content
      })
    } else {
      const data = await apiSendGroupMessage({
        clientMessageId,
        groupId: conversation.targetId,
        type,
        content
      })
      conversationStore.ackMessage(conversation.type, conversation.targetId, clientMessageId, {
        id: data.id,
        sendTime: new Date(data.sendTime).getTime(),
        status: data.status,
        receiptStatus: data.receiptStatus,
        readCount: data.readCount,
        content: data.content
      })
    }
  } catch (e) {
    console.error('[IM] 名片消息发送失败', { conversation, type }, e)
    conversationStore.ackMessage(conversation.type, conversation.targetId, clientMessageId, {
      status: ImMessageStatus.FAILED
    })
    throw e
  }
}

/** 确认发送：循环每个选中会话发名片，有留言再补一条文本；并发发完统一提示 */
async function handleSend() {
  if (!props.user?.id) {
    return
  }
  if (selectedKeys.value.size === 0) {
    return
  }
  const targets = candidateConversations.value.filter((c) =>
    selectedKeys.value.has(getConversationKey(c))
  )
  const cardContent = buildCardContent()
  const textContent = buildLeaveTextContent()
  sending.value = true
  try {
    // 全部并发发送，allSettled 保证个别失败不阻塞其它会话；最终按完成数量提示
    const tasks = targets.map(async (target) => {
      await sendOneToConversation(target, ImMessageType.CARD, cardContent)
      if (textContent) {
        await sendOneToConversation(target, ImMessageType.TEXT, textContent)
      }
    })
    // TODO @AI：不用计数啥的，就是“已转发”，不用关注效果。
    const results = await Promise.allSettled(tasks)
    const failed = results.filter((result) => result.status === 'rejected').length
    if (failed === 0) {
      message.success(targets.length > 1 ? `已分别发送给 ${targets.length} 位联系人` : '发送成功')
    } else if (failed < targets.length) {
      message.warning(`成功 ${targets.length - failed} 个，失败 ${failed} 个`)
    } else {
      message.error('发送失败')
    }
    visible.value = false
  } finally {
    sending.value = false
  }
}
</script>
