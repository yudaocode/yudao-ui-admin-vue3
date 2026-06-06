<template>
  <div
    v-if="multiSelect.state.active"
    class="flex items-center justify-center gap-12 px-5 w-full h-full border-t border-t-solid bg-[var(--el-bg-color)] border-[var(--el-border-color-lighter)]"
  >
    <span
      class="absolute left-5 top-1/2 -translate-y-1/2 text-12px text-[var(--el-text-color-secondary)]"
    >
      已选 {{ selectedCount }} 条
    </span>

    <button
      class="inline-flex flex-col items-center gap-1 px-3 py-1 text-12px rounded-md border-0 bg-transparent cursor-pointer transition-colors text-[var(--el-text-color-primary)] hover:text-[var(--el-color-primary)] hover:bg-[var(--el-fill-color)] disabled:text-[var(--el-text-color-disabled)] disabled:cursor-not-allowed disabled:bg-transparent"
      :disabled="selectedCount === 0"
      @click="handleForwardOneByOne"
    >
      <Icon icon="ant-design:share-alt-outlined" :size="22" />
      <span>逐条转发</span>
    </button>

    <button
      class="inline-flex flex-col items-center gap-1 px-3 py-1 text-12px rounded-md border-0 bg-transparent cursor-pointer transition-colors text-[var(--el-text-color-primary)] hover:text-[var(--el-color-primary)] hover:bg-[var(--el-fill-color)] disabled:text-[var(--el-text-color-disabled)] disabled:cursor-not-allowed disabled:bg-transparent"
      :disabled="selectedCount === 0"
      @click="handleForwardMerged"
    >
      <Icon icon="tabler:arrow-merge" :size="22" />
      <span>合并转发</span>
    </button>

    <button
      class="inline-flex flex-col items-center gap-1 px-3 py-1 text-12px rounded-md border-0 bg-transparent cursor-pointer transition-colors text-[var(--el-text-color-primary)] hover:bg-[var(--el-fill-color)] hover:text-[var(--el-color-danger)] disabled:text-[var(--el-text-color-disabled)] disabled:cursor-not-allowed disabled:bg-transparent"
      :disabled="selectedCount === 0"
      @click="handleDelete"
    >
      <Icon icon="ant-design:delete-outlined" :size="22" />
      <span>删除</span>
    </button>

    <button
      class="absolute right-5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full border-0 bg-transparent cursor-pointer transition-colors text-[var(--el-text-color-secondary)] hover:text-[var(--el-text-color-primary)] hover:bg-[var(--el-fill-color)]"
      @click="handleCancel"
    >
      <Icon icon="ant-design:close-outlined" :size="20" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { useMessageStore } from '@/views/im/home/store/messageStore'
import { useMessageMultiSelect } from '@/views/im/home/composables/useMessageMultiSelect'
import { ImForwardMode, isNormalMessage } from '@/views/im/utils/constants'
import { getClientConversationId } from '@/views/im/utils/db'
import type { Message } from '@/views/im/home/types'
import { IM_FORWARD_DIALOG_KEY } from '../message/forward/keys'

defineOptions({ name: 'ImMessageMultiSelectBar' })

const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const message = useMessage()
const openForwardDialog = inject(IM_FORWARD_DIALOG_KEY)
const multiSelect = useMessageMultiSelect()

/** 选中条数 */
const selectedCount = computed(() => multiSelect.state.selectedClientMessageIds.length)

/** 当前会话内已选消息 */
function getSelectedMessages(): Message[] {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return []
  }
  const ids = multiSelect.selectedIdSet.value
  return messageStore
    .getMessages(getClientConversationId(conversation.type, conversation.targetId))
    .filter((message) => ids.has(message.clientMessageId) && isNormalMessage(message.type))
}

/** 逐条转发：开 ForwardDialog 单条模式 */
function handleForwardOneByOne() {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  const messages = getSelectedMessages()
  if (messages.length === 0) {
    return
  }
  openForwardDialog?.({
    mode: ImForwardMode.SINGLE,
    messages,
    sourceConversation: conversation
  })
}

/** 合并转发：开 ForwardDialog 合并模式 */
function handleForwardMerged() {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  const messages = getSelectedMessages()
  if (messages.length === 0) {
    return
  }
  openForwardDialog?.({
    mode: ImForwardMode.MERGE,
    messages,
    sourceConversation: conversation
  })
}

/** 删除：弹确认框 → 本地批量移除（不同步后端，对齐微信「删除」语义） */
async function handleDelete() {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  const messages = getSelectedMessages()
  if (messages.length === 0) {
    return
  }
  try {
    await message.delConfirm(`确认删除选中的 ${messages.length} 条消息？`, '删除消息')
  } catch {
    return
  }
  for (const m of messages) {
    messageStore.removeMessage(conversation.type, conversation.targetId, {
      id: m.id,
      clientMessageId: m.clientMessageId
    })
  }
  multiSelect.exit()
}

/** 取消多选 */
function handleCancel() {
  multiSelect.exit()
}
</script>
