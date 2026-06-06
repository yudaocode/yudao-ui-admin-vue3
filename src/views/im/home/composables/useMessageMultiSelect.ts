import { computed, reactive } from 'vue'

import type { Message } from '../types'

/**
 * 消息多选模式
 *
 * 模块级单例 reactive state；MessagePanel 子树内多处共享：
 * - MessageItem 渲染勾选 + 切换勾选
 * - MessageMultiSelectBar 底栏读选中数
 * - MessageForwardDialog 转发成功后 exit
 * - MessagePanel watch activeConversation 切会话 exit
 */
const state = reactive({
  active: false,
  /** 已选 clientMessageId 列表，按选中顺序保序 */
  selectedClientMessageIds: [] as string[]
})

/** 已选 clientMessageId 集合；MessageItem 大量 has 查询走它，避免 array.includes O(N²) */
const selectedIdSet = computed(() => new Set(state.selectedClientMessageIds))

/** 进入多选模式，可附带初始勾选项 */
function enter(initialMessage?: Message) {
  state.active = true
  state.selectedClientMessageIds = initialMessage ? [initialMessage.clientMessageId] : []
}

/** 退出多选模式 */
function exit() {
  state.active = false
  state.selectedClientMessageIds = []
}

/** 切换某条消息的选中态 */
function toggle(message: Message) {
  const ids = state.selectedClientMessageIds
  const index = ids.indexOf(message.clientMessageId)
  if (index >= 0) {
    ids.splice(index, 1)
  } else {
    ids.push(message.clientMessageId)
  }
}

export function useMessageMultiSelect() {
  return { state, selectedIdSet, enter, exit, toggle }
}
