import { defineStore, acceptHMRUpdate } from 'pinia'
import { debounce } from 'lodash-es'

import { store } from '@/store'

import { getCurrentUserId, imStorage, setQuietly, StorageKeys } from '../../utils/storage'
import { getConversationKey } from '../../utils/conversation'
import type { QuoteMessage } from '../../utils/message'

/**
 * 草稿快照
 * - html：editor 是 contenteditable，含 @-token / <br>，回填编辑器用整段 innerHTML 才能还原
 * - plain：纯文本预览，给会话列表 [草稿] 文案展示用，避免列表渲染时再 strip HTML
 * - reply：当前会话的「正在引用」对象,跟随草稿走;切会话保留,发送后清空
 */
export interface DraftSnapshot {
  html: string
  plain: string
  reply?: QuoteMessage
}

/** 草稿持久化整桶结构：Record<会话 key, 快照>；草稿量级小（每会话至多几百字节），整桶整写够用 */
type DraftBucket = Record<string, DraftSnapshot>

/** 写盘 debounce：用户连续敲键盘时合并写入，避免高频 IDB 写放大 */
const PERSIST_DEBOUNCE_MS = 500

/** 合并连续输入的 IDB 写；setQuietly 内部 toRaw 拆 reactive proxy，避免 structuredClone 抛错 */
const persistBucket = debounce((userId: number, bucket: DraftBucket) => {
  setQuietly(StorageKeys.drafts(userId), bucket, '[IM draftStore] persist 失败')
}, PERSIST_DEBOUNCE_MS)

export const useDraftStore = defineStore('imDraft', {
  state: () => ({
    /** 内存草稿表：key = getConversationKey */
    drafts: {} as DraftBucket
  }),
  actions: {
    /**
     * 启动时从 IDB 加载已有草稿；失败仅打日志（草稿丢失可以接受，不阻断 IM 初始化）
     *
     * 进入即清空内存：账号切换 / 重进 IM 时 store 实例可能保留上一次的 drafts，
     * 同 targetId 的不同账号会话会串显示 [草稿]
     */
    async loadDrafts(): Promise<void> {
      this.drafts = {}
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      try {
        const bucket = await imStorage.getItem<DraftBucket>(StorageKeys.drafts(userId))
        if (bucket && typeof bucket === 'object') {
          this.drafts = bucket
        }
      } catch (e) {
        console.warn('[IM draftStore] loadDrafts 失败', e)
      }
    },

    /** 取草稿；返回 undefined 表示该会话无草稿 */
    getDraft(conversation: { type: number; targetId: number }): DraftSnapshot | undefined {
      return this.drafts[getConversationKey(conversation)]
    },

    /**
     * 写草稿 + debounce 落盘
     *
     * plain 空且 reply 也空才按 clear 处理：用户只点了回复未输入正文时，切会话回来引用条仍要在
     */
    setDraft(
      conversation: { type: number; targetId: number },
      snapshot: DraftSnapshot
    ): void {
      if (!snapshot.plain.trim() && !snapshot.reply) {
        this.clearDraft(conversation)
        return
      }
      this.drafts[getConversationKey(conversation)] = snapshot
      this.schedulePersist()
    },

    /** 清草稿：发送成功 / 编辑器清空 / 会话被软删除时调用 */
    clearDraft(conversation: { type: number; targetId: number }): void {
      const key = getConversationKey(conversation)
      if (!(key in this.drafts)) {
        return
      }
      delete this.drafts[key]
      this.schedulePersist()
    },

    /** 进入回复模式:把 quote 写到当前草稿,正文 html / plain 保留 */
    setReply(
      conversation: { type: number; targetId: number },
      quote: QuoteMessage
    ): void {
      const existing = this.getDraft(conversation)
      this.setDraft(conversation, {
        html: existing?.html ?? '',
        plain: existing?.plain ?? '',
        reply: quote
      })
    },

    /** 退出回复模式：仅清掉 reply，正文草稿保留；无 reply 时直接返回 */
    clearReply(conversation: { type: number; targetId: number }): void {
      const existing = this.getDraft(conversation)
      if (!existing?.reply) {
        return
      }
      this.setDraft(conversation, { ...existing, reply: undefined })
    },

    /** 调度 debounce 写盘；未登录时直接跳过（无主 key 不写） */
    schedulePersist(): void {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      persistBucket(userId, this.drafts)
    },

    /** 立即落盘待写的草稿；beforeunload 时调，避免最后一次输入卡在 debounce 队列里丢失 */
    flushPersist(): void {
      persistBucket.flush()
    },

    /** 清空草稿内存 */
    // TODO @AI：写草稿，是不是融合到 conversationStore 里。
    clear(): void {
      persistBucket.cancel()
      this.drafts = {}
    }
  }
})

export const useDraftStoreWithOut = () => {
  return useDraftStore(store)
}

// dev: 让 Pinia 的 actions / state 改动支持 HMR，避免每次改 store 都得硬刷
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDraftStore, import.meta.hot))
}
