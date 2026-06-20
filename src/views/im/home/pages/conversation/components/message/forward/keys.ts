import type { InjectionKey } from 'vue'

import type { ImForwardModeValue } from '@/views/im/utils/constants'
import type { Conversation, Message } from '@/views/im/home/types'

/** 打开转发弹窗 */
export type OpenForwardDialog = (opts: {
  mode: ImForwardModeValue
  messages: Message[]
  sourceConversation: Conversation
}) => void

/** 打开合并消息详情弹窗 */
export type OpenMergeDetailDialog = (content: string) => void

/** 重拨 RTC 通话；点私聊 RTC_CALL_END 气泡触发 */
export type RtcRedial = (mediaType: number) => void

/** MessagePanel 通过 provide 暴露给子树 */
export const IM_FORWARD_DIALOG_KEY: InjectionKey<OpenForwardDialog> = Symbol('IM_FORWARD_DIALOG')
export const IM_MERGE_DETAIL_DIALOG_KEY: InjectionKey<OpenMergeDetailDialog> =
  Symbol('IM_MERGE_DETAIL_DIALOG')
export const IM_RTC_REDIAL_KEY: InjectionKey<RtcRedial> = Symbol('IM_RTC_REDIAL')
