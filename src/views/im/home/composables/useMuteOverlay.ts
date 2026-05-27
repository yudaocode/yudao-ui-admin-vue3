import { computed, onScopeDispose, ref, type ComputedRef } from 'vue'

import { useUserStore } from '@/store/modules/user'
import { useConversationStore } from '../store/conversationStore'
import { useGroupStore } from '../store/groupStore'
import { ImConversationType, ImGroupMemberRole } from '../../utils/constants'

export type MuteOverlayInfo = { text: string; icon: string }

/**
 * 模块级共享 now tick + 订阅计数：
 * MessageItem v-for 时每条消息都会 useMuteOverlay()，单实例自起 timer 会变成几百个 30s 定时器；
 * 改成模块级共享后所有订阅者共用一份 setInterval，订阅数清零时也清掉 timer，避免内存与时钟漂移
 */
const sharedNow = ref(Date.now())
let sharedTickTimer: number | null = null
let subscriberCount = 0

function subscribeNowTick(): void {
  subscriberCount++
  if (!sharedTickTimer) {
    sharedTickTimer = window.setInterval(() => {
      sharedNow.value = Date.now()
    }, 30_000)
  }
}

function unsubscribeNowTick(): void {
  subscriberCount--
  if (subscriberCount <= 0) {
    subscriberCount = 0
    if (sharedTickTimer) {
      window.clearInterval(sharedTickTimer)
      sharedTickTimer = null
    }
  }
}

/**
 * 当前激活会话的禁言 / 封禁状态；非群聊或无禁言时返回 null
 *
 * 优先级：封禁 > 全群禁言（群主 / 管理员豁免）> 成员禁言
 *
 * MessageInput 顶部 overlay / handleResend 重试 / uploadAndSendMedia 上传完前都共用一份，
 * 避免「输入框拦了但重试绕过」「上传期间被禁言但 sendRaw 仍发出去」之类的不一致
 */
export function useMuteOverlay(): ComputedRef<MuteOverlayInfo | null> {
  const conversationStore = useConversationStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()

  // 订阅模块级 tick；scope 销毁时反订阅，最后一个订阅者退场后 timer 也跟着清
  subscribeNowTick()
  onScopeDispose(unsubscribeNowTick)

  return computed(() => {
    const conversation = conversationStore.activeConversation
    if (!conversation || conversation.type !== ImConversationType.GROUP) {
      return null
    }
    const group = groupStore.getGroup(conversation.targetId)
    if (!group) {
      return null
    }
    const myId = Number(userStore.getUser?.id) || 0
    // 群封禁：管理后台操作，所有人不可发送
    if (group.banned) {
      return { text: '该群已被管理员封禁，无法发送消息', icon: 'ant-design:stop-outlined' }
    }
    // 全群禁言：群主走 ownerUserId 比较直接豁免；其它人需要成员列表加载完才能区分管理员 vs 普通成员
    // - 加载完 + 我是管理员 → 豁免
    // - 加载完 + 我不是管理员（含已退群）→ 拦
    // - 加载未完 → 不显示 overlay，后端兜底拒绝普通成员；避免误拦管理员
    if (group.mutedAll && myId !== group.ownerUserId && group.membersLoaded) {
      const myMember = group.members?.find((m) => m.userId === myId)
      if (myMember?.role !== ImGroupMemberRole.ADMIN) {
        return { text: '全群禁言中，暂时无法发送消息', icon: 'ant-design:audio-muted-outlined' }
      }
    }
    // 成员禁言：muteEndTime 在未来才算；用响应式 sharedNow 比对，到期后下一个 tick 就让 overlay 消失
    const myMember = group.members?.find((m) => m.userId === myId)
    if (myMember?.muteEndTime) {
      const endTime = new Date(myMember.muteEndTime)
      if (endTime.getTime() > sharedNow.value) {
        const pad = (n: number) => n.toString().padStart(2, '0')
        const timeStr =
          `${pad(endTime.getMonth() + 1)}-${pad(endTime.getDate())} ` +
          `${pad(endTime.getHours())}:${pad(endTime.getMinutes())}`
        return {
          text: `您已被禁言，解除时间：${timeStr}`,
          icon: 'ant-design:audio-muted-outlined'
        }
      }
    }
    return null
  })
}
