<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="720px"
    :close-on-click-modal="false"
    class="im-forward-dialog"
    @open="resetForm"
  >
    <div class="flex h-[480px]">
      <!-- ============ 左栏：搜索 + 会话列表 ============ -->
      <div
        class="flex flex-col w-[280px] border-r border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]"
      >
        <div class="px-3 py-3 flex-shrink-0">
          <el-input v-model="keyword" placeholder="搜索" clearable size="small">
            <template #prefix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </el-input>
        </div>

        <div class="px-3 pb-1.5 text-13px text-[var(--el-text-color-secondary)] flex-shrink-0">
          最近聊天
        </div>

        <el-scrollbar class="flex-1">
          <div
            v-for="conversation in shownConversations"
            :key="getConversationKey(conversation)"
            class="flex gap-2.5 items-center px-3 py-1.5 cursor-pointer hover:bg-[var(--el-fill-color)]"
            @click="handleToggle(conversation)"
          >
            <span
              class="flex flex-shrink-0 items-center justify-center w-5 h-5 rounded-full transition-colors"
              :class="
                isSelected(conversation)
                  ? 'bg-[#07c160]'
                  : 'border border-[var(--el-border-color)] bg-[var(--el-bg-color)]'
              "
            >
              <Icon
                v-if="isSelected(conversation)"
                icon="ant-design:check-outlined"
                :size="12"
                color="#fff"
              />
            </span>
            <UserAvatar
              :url="conversation.avatar"
              :name="conversation.name"
              :size="32"
              :clickable="false"
            />
            <span
              class="flex-1 min-w-0 overflow-hidden text-sm truncate text-[var(--el-text-color-primary)]"
            >
              {{ conversation.name }}
            </span>
          </div>
          <div
            v-if="shownConversations.length === 0"
            class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
          >
            {{ keyword ? '没有满足条件的会话' : '暂无会话' }}
          </div>
        </el-scrollbar>
      </div>

      <!-- ============ 右栏：已选 + 预览卡 + 留言 + 按钮 ============ -->
      <div class="flex flex-col flex-1 min-w-0">
        <div
          class="px-4 py-3 text-13px text-[var(--el-text-color-secondary)] flex-shrink-0 border-b border-[var(--el-border-color-lighter)]"
        >
          {{ sendTitle }}
        </div>

        <!-- 已选预览：每行 头像 + 名字 + × 移除 -->
        <el-scrollbar class="flex-1">
          <div
            v-for="conversation in selectedConversations"
            :key="getConversationKey(conversation)"
            class="flex gap-2.5 items-center px-4 py-2"
          >
            <UserAvatar
              :url="conversation.avatar"
              :name="conversation.name"
              :size="28"
              :clickable="false"
            />
            <span
              class="flex-1 min-w-0 overflow-hidden text-13px truncate text-[var(--el-text-color-primary)]"
            >
              {{ conversation.name }}
            </span>
            <Icon
              icon="ant-design:close-outlined"
              :size="14"
              class="im-forward__remove flex-shrink-0 cursor-pointer"
              @click="handleToggle(conversation)"
            />
          </div>
          <div
            v-if="selectedConversations.length === 0"
            class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
          >
            从左侧选择联系人或群聊
          </div>
        </el-scrollbar>

        <!-- 待转发预览 + 留言 + 按钮 -->
        <div
          class="flex flex-col gap-3 px-4 py-3 flex-shrink-0 border-t border-[var(--el-border-color-lighter)]"
        >
          <!-- 合并模式：「[聊天记录] 标题 + 摘要列表」预览卡 -->
          <div
            v-if="state.mode === ImForwardMode.MERGE && mergePreview"
            class="flex flex-col w-full rounded-md overflow-hidden bg-[var(--el-bg-color)] border border-[var(--el-border-color-lighter)]"
          >
            <div class="px-3 py-2 text-sm font-medium text-[var(--el-text-color-primary)] truncate">
              {{ mergePreview.title }}
            </div>
            <div class="px-3 pb-2 flex flex-col gap-0.5">
              <div
                v-for="(line, idx) in mergePreview.lines"
                :key="idx"
                class="text-12px text-[var(--el-text-color-secondary)] truncate"
              >
                {{ line }}
              </div>
            </div>
            <div
              class="px-3 py-1 text-12px border-t text-[var(--el-text-color-placeholder)] border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)]"
            >
              聊天记录
            </div>
          </div>

          <!-- 单条 / 逐条模式：消息数 + 首条摘要预览 -->
          <div
            v-else-if="state.mode === ImForwardMode.SINGLE && singlePreviewLines.length > 0"
            class="flex flex-col w-full rounded-md overflow-hidden bg-[var(--el-bg-color)] border border-[var(--el-border-color-lighter)]"
          >
            <div class="flex flex-col gap-0.5 px-3 py-2">
              <div
                v-for="(line, idx) in singlePreviewLines"
                :key="idx"
                class="text-13px text-[var(--el-text-color-primary)] truncate"
              >
                {{ line }}
              </div>
            </div>
            <div
              class="px-3 py-1 text-12px border-t text-[var(--el-text-color-placeholder)] border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)]"
            >
              共 {{ state.messages.length }} 条消息
            </div>
          </div>

          <!-- 留言：右侧表情按钮触发 FacePicker(mode=emoji)，所选 emoji 拼到末尾 -->
          <div class="relative">
            <el-input v-model="leaveMessage" :maxlength="100" placeholder="给朋友留言">
              <template #suffix>
                <Icon
                  icon="ant-design:smile-outlined"
                  :size="18"
                  class="cursor-pointer text-[var(--el-text-color-secondary)] hover:text-[var(--el-color-primary)]"
                  @click.stop="emojiVisible = !emojiVisible"
                />
              </template>
            </el-input>
            <FacePicker
              v-model:visible="emojiVisible"
              mode="emoji"
              class="bottom-full right-0 mb-2"
              @select-emoji="handleEmojiSelect"
            />
          </div>

          <div class="flex gap-2 justify-end">
            <el-button @click="visible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="sending"
              :disabled="selectedKeys.length === 0"
              @click="handleSend"
            >
              {{ confirmButtonText }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import UserAvatar from '@/views/im/home/components/user/UserAvatar.vue'
import FacePicker from '../../input/FacePicker.vue'
import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { useMessageSender } from '@/views/im/home/composables/useMessageSender'
import { useMessageMultiSelect } from '@/views/im/home/composables/useMessageMultiSelect'
import {
  ImForwardMode,
  ImMessageType,
  MERGE_FORWARD_PREVIEW_LINES,
  type ImForwardModeValue
} from '@/views/im/utils/constants'
import {
  filterConversationsByKeyword,
  getConversationKey,
  summarizeMessageContent
} from '@/views/im/utils/conversation'
import {
  buildMergeMessagePayload,
  removeQuotePayload,
  serializeMessage
} from '@/views/im/utils/message'
import type { Conversation, Message } from '@/views/im/home/types'

defineOptions({ name: 'ImMessageForwardDialog' })

/** 父级 ref 调 open(opts) 触发；不再走 v-model + props */
const message = useMessage()
const conversationStore = useConversationStore()
const { sendRaw, send } = useMessageSender()
const multiSelect = useMessageMultiSelect()

const state = reactive({
  mode: ImForwardMode.SINGLE as ImForwardModeValue,
  messages: [] as Message[],
  sourceConversation: null as Conversation | null
})
const visible = ref(false)

const keyword = ref('')
const leaveMessage = ref('')
const sending = ref(false)
const selectedKeys = ref<string[]>([])
const selectedSet = computed(() => new Set(selectedKeys.value))

/** emoji picker 显隐：右侧笑脸按钮切换 */
const emojiVisible = ref(false)

/** 选中 emoji：拼到留言末尾；FacePicker 自身 emit('update:visible', false) 关闭面板 */
function handleEmojiSelect(emoji: string) {
  leaveMessage.value = `${leaveMessage.value}${emoji}`
}

defineExpose({
  /** 打开转发弹窗 */
  open(opts: {
    mode: ImForwardModeValue
    messages: Message[]
    sourceConversation: Conversation
  }) {
    state.mode = opts.mode
    state.messages = opts.messages
    state.sourceConversation = opts.sourceConversation
    visible.value = true
  }
})

/** 弹窗标题：按 mode 区分「逐条转发 / 合并转发」 */
const dialogTitle = computed(() => (state.mode === ImForwardMode.MERGE ? '合并转发' : '逐条转发'))

/** 右栏标题：选中多个时改「分别发送给」与底部按钮文案保持一致 */
const sendTitle = computed(() => (selectedKeys.value.length > 1 ? '分别发送给' : '发送给'))

/** 确认按钮文案：单选「发送」、多选「分别发送(n)」 */
const confirmButtonText = computed(() =>
  selectedKeys.value.length > 1 ? `分别发送（${selectedKeys.value.length}）` : '发送'
)

/** 弹窗打开时复位 */
function resetForm() {
  keyword.value = ''
  leaveMessage.value = ''
  selectedKeys.value = []
  emojiVisible.value = false
}

/** 候选会话：转发回原会话也允许（与微信一致：可以"转发给当前对话"） */
const candidateConversations = computed<Conversation[]>(
  () => conversationStore.getSortedConversations
)

const shownConversations = computed(() =>
  filterConversationsByKeyword(candidateConversations.value, keyword.value)
)

const selectedConversations = computed<Conversation[]>(() => {
  const keys = selectedSet.value
  return candidateConversations.value.filter((c) => keys.has(getConversationKey(c)))
})

function isSelected(conversation: Conversation): boolean {
  return selectedSet.value.has(getConversationKey(conversation))
}

function handleToggle(conversation: Conversation) {
  const key = getConversationKey(conversation)
  const index = selectedKeys.value.indexOf(key)
  if (index >= 0) {
    selectedKeys.value.splice(index, 1)
  } else {
    selectedKeys.value.push(key)
  }
}

/** 合并 payload + 序列化 content；merge 模式下一次构造，预览 / 发送共用 */
const mergeBundle = computed(() => {
  if (
    state.mode !== ImForwardMode.MERGE ||
    !state.sourceConversation ||
    state.messages.length === 0
  ) {
    return null
  }
  const payload = buildMergeMessagePayload(state.messages, state.sourceConversation)
  return { payload, content: serializeMessage(payload) }
})

/** 合并模式预览：从 messages 前 N 条派生「{昵称}：{摘要}」 */
const mergePreview = computed(() => {
  const payload = mergeBundle.value?.payload
  if (!payload) {
    return null
  }
  const lines = payload.messages
    .slice(0, MERGE_FORWARD_PREVIEW_LINES)
    .map((item) => `${item.senderNickname}：${summarizeMessageContent(item)}`)
  return { title: payload.title, lines }
})

/** 单条 / 逐条模式预览：取前 N 条 */
const singlePreviewLines = computed(() =>
  state.messages.slice(0, MERGE_FORWARD_PREVIEW_LINES).map((m) => summarizeMessageContent(m))
)

/** 待发送的逐条消息：剥离 quote 一次，发送多目标时复用 */
const cleanedSinglePayloads = computed(() =>
  state.messages.map((m) => ({ type: m.type, content: removeQuotePayload(m.content) }))
)

/**
 * 给单个目标发送转发消息：merge 一次 sendRaw、single 按时间序逐条 sendRaw
 *
 * 任一原消息失败即停止后续，返回 false 让上层跳过留言
 */
async function forwardToTarget(target: Conversation): Promise<boolean> {
  if (state.mode === ImForwardMode.MERGE) {
    const content = mergeBundle.value?.content
    if (!content) {
      return false
    }
    return sendRaw(ImMessageType.MERGE, content, { conversation: target })
  }
  for (const payload of cleanedSinglePayloads.value) {
    const ok = await sendRaw(payload.type, payload.content, { conversation: target })
    if (!ok) {
      return false
    }
  }
  return true
}

/**
 * 确认发送：单条模式逐条循环；合并模式发一条 MergeMessage
 *
 * 文案聚合：全部成功「已转发」、全部失败「转发失败：A、B」、部分失败「已转发，但 X、Y 失败」；
 * 留言只在该目标的转发消息全部成功后才追加，避免错序
 */
async function handleSend() {
  if (selectedKeys.value.length === 0) {
    return
  }
  if (state.messages.length === 0) {
    message.warning('没有可转发的消息')
    return
  }
  const targets = selectedConversations.value
  const leaveText = leaveMessage.value.trim()
  sending.value = true
  try {
    const tasks = targets.map(async (target) => {
      const forwardOk = await forwardToTarget(target)
      if (!forwardOk) {
        return { target, ok: false }
      }
      const ok = leaveText ? await send(leaveText, { conversation: target }) : true
      return { target, ok }
    })
    const results = await Promise.all(tasks)
    const failedNames = results.filter((r) => !r.ok).map((r) => r.target.name || '未命名会话')
    if (failedNames.length === 0) {
      message.success('已转发')
    } else if (failedNames.length === targets.length) {
      message.error(`转发失败：${failedNames.join('、')}`)
    } else {
      message.warning(`已转发，但 ${failedNames.join('、')} 失败`)
    }
    if (multiSelect.state.active) {
      multiSelect.exit()
    }
    visible.value = false
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
/* 双栏布局要顶到 dialog 边缘 */
.im-forward-dialog :deep(.el-dialog__body) {
  padding: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}
.im-forward-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding-bottom: 16px;
}

/* 已选行 × 移除：常驻显示，hover 转危险色 */
.im-forward__remove {
  color: var(--el-text-color-placeholder);
  transition: color 0.15s;
}
.im-forward__remove:hover {
  color: var(--el-color-danger);
}
</style>
