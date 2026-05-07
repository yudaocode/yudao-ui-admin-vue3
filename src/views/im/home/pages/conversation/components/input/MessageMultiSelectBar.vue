<template>
  <div
    v-if="multiSelect.state.active"
    class="im-multi-select-bar flex items-center justify-center gap-12 px-5 w-full h-full border-t bg-[var(--el-bg-color)] border-[var(--el-border-color-lighter)]"
  >
    <span
      class="absolute left-5 top-1/2 -translate-y-1/2 text-12px text-[var(--el-text-color-secondary)]"
    >
      已选 {{ selectedCount }} 条
    </span>

    <button
      class="im-multi-select-bar__action"
      :disabled="selectedCount === 0"
      @click="handleForwardOneByOne"
    >
      <Icon icon="ant-design:share-alt-outlined" :size="22" />
      <span>逐条转发</span>
    </button>

    <button
      class="im-multi-select-bar__action"
      :disabled="selectedCount === 0"
      @click="handleForwardMerged"
    >
      <Icon icon="tabler:arrow-merge" :size="22" />
      <span>合并转发</span>
    </button>

    <button
      class="im-multi-select-bar__action im-multi-select-bar__action--danger"
      :disabled="selectedCount === 0"
      @click="handleDelete"
    >
      <Icon icon="ant-design:delete-outlined" :size="22" />
      <span>删除</span>
    </button>

    <button
      class="im-multi-select-bar__close absolute right-5 top-1/2 -translate-y-1/2"
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
import { useMessageMultiSelect } from '@/views/im/home/composables/useMessageMultiSelect'
import { ImForwardMode } from '@/views/im/utils/constants'
import type { Message } from '@/views/im/home/types'
import { IM_FORWARD_DIALOG_KEY } from '../message/forward/keys'

defineOptions({ name: 'ImMessageMultiSelectBar' })

const conversationStore = useConversationStore()
const message = useMessage()
const openForwardDialog = inject(IM_FORWARD_DIALOG_KEY)
const multiSelect = useMessageMultiSelect()

/** 选中条数 */
const selectedCount = computed(() => multiSelect.state.selectedClientMessageIds.length)

/** 当前会话内已选消息；conversation.messages 已按 sendTime 升序，filter 保序无需再 sort */
function getSelectedMessages(): Message[] {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return []
  }
  const ids = multiSelect.selectedIdSet.value
  return conversation.messages.filter((m) => ids.has(m.clientMessageId))
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
    conversationStore.removeMessage(conversation.type, conversation.targetId, {
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

<style scoped>
.im-multi-select-bar__action {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.im-multi-select-bar__action:hover:not(:disabled) {
  color: var(--el-color-primary);
  background: var(--el-fill-color);
}

.im-multi-select-bar__action:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

.im-multi-select-bar__action--danger:hover:not(:disabled) {
  color: var(--el-color-danger);
}

.im-multi-select-bar__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.im-multi-select-bar__close:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
}
</style>
