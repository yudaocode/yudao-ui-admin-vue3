<template>
  <!--
    转发消息（逐条 / 合并）：选目标会话 + 留言后批量发送
    - dialog 壳本组件持有；选择 UI 委托 ConversationPickerPanel
    - footer slot 塞预览卡（合并 / 逐条不同视觉）+ 留言 + 提交按钮
    - 对外接口沿用：ref + open({ mode, messages, sourceConversation })
  -->
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="720px"
    :close-on-click-modal="false"
    class="im-picker-dialog"
  >
    <div class="h-[480px]">
      <ConversationPickerPanel
        v-model:selected-keys="selectedKeys"
        :conversations="candidateConversations"
        :recent-forward-conversation-keys="conversationStore.recentForwardConversationKeys"
        @remove-recent="conversationStore.removeRecentForwardConversationKey"
      >
        <template #footer>
          <div class="flex flex-col gap-3 px-4 py-3">
            <!-- 合并模式预览：「[聊天记录] 标题 + 摘要列表」预览卡 -->
            <div
              v-if="state.mode === ImForwardMode.MERGE && mergePreview"
              class="flex flex-col w-full overflow-hidden rounded-md bg-[var(--el-bg-color)] border border-[var(--el-border-color-lighter)]"
            >
              <div class="px-3 py-2 text-sm font-medium truncate text-[var(--el-text-color-primary)]">
                {{ mergePreview.title }}
              </div>
              <div class="flex flex-col px-3 pb-2 gap-0.5">
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

            <!-- 逐条模式预览：消息数 + 首条摘要 -->
            <div
              v-else-if="state.mode === ImForwardMode.SINGLE && singlePreviewLines.length > 0"
              class="flex flex-col w-full overflow-hidden rounded-md bg-[var(--el-bg-color)] border border-[var(--el-border-color-lighter)]"
            >
              <div class="flex flex-col px-3 py-2 gap-0.5">
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

            <!-- 留言（单行）：右侧表情按钮触发 FacePicker；选中 emoji 拼到末尾 -->
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
        </template>
      </ConversationPickerPanel>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import ConversationPickerPanel from '@/views/im/home/components/picker/ConversationPickerPanel.vue'
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
import { getConversationKey, summarizeMessageContent } from '@/views/im/utils/conversation'
import {
  buildMergeMessagePayload,
  removeQuotePayload,
  serializeMessage
} from '@/views/im/utils/message'
import type { Conversation, Message } from '@/views/im/home/types'

defineOptions({ name: 'ImMessageForwardDialog' })

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
const selectedKeys = ref<string[]>([])
const leaveMessage = ref('')
const sending = ref(false)
/** emoji picker 显隐：右侧笑脸按钮切换 */
const emojiVisible = ref(false)

defineExpose({
  /** 打开转发弹窗：reset → 灌参 → visible=true */
  open(opts: {
    mode: ImForwardModeValue
    messages: Message[]
    sourceConversation: Conversation
  }) {
    state.mode = opts.mode
    state.messages = opts.messages
    state.sourceConversation = opts.sourceConversation
    selectedKeys.value = []
    leaveMessage.value = ''
    emojiVisible.value = false
    visible.value = true
  }
})

/** 弹窗标题：按 mode 区分「逐条转发 / 合并转发」 */
const dialogTitle = computed(() => (state.mode === ImForwardMode.MERGE ? '合并转发' : '逐条转发'))

/** 确认按钮文案：单选「发送」、多选「分别发送(n)」 */
const confirmButtonText = computed(() =>
  selectedKeys.value.length > 1 ? `分别发送（${selectedKeys.value.length}）` : '发送'
)

/** 候选会话：从 store 拿排序后的列表（转发回原会话也允许，与微信一致） */
const candidateConversations = computed<Conversation[]>(
  () => conversationStore.getSortedConversations
)

/** 选中 emoji：拼到留言末尾；FacePicker 自身负责关闭面板 */
function handleEmojiSelect(emoji: string) {
  leaveMessage.value = `${leaveMessage.value}${emoji}`
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

/** 逐条模式预览：取前 N 条摘要 */
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
  // 反查已选 conversation 对象（按 selectedKeys 数组顺序，即点击顺序）
  const candidates = candidateConversations.value
  const byKey = new Map(candidates.map((c) => [getConversationKey(c), c]))
  const targets = selectedKeys.value
    .map((key) => byKey.get(key))
    .filter((c): c is Conversation => c != null)
  if (targets.length === 0) {
    return
  }
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
    // 命中的目标统一推到最近转发列表（部分失败也推：用户的"意图"已表达）
    conversationStore.pushRecentForwardConversationKeys(targets.map((c) => getConversationKey(c)))
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

<style scoped lang="scss">
@use '@/views/im/home/components/picker/picker-dialog' as picker;

.im-picker-dialog {
  @include picker.styles;
}
</style>

