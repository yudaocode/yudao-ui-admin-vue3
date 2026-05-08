import type { FriendLite } from '../home/types'

/** 默认群名生成：所选好友前 4 个名字拼接，超过补「等 N 人」；为空兜底「群聊」 */
export function buildDefaultGroupName(members: FriendLite[]): string {
  if (members.length === 0) {
    return '群聊'
  }
  const names = members.slice(0, 4).map((m) => m.displayName || m.nickname || '')
  const head = names.filter(Boolean).join('、')
  if (members.length > 4) {
    return `${head}等${members.length}人`
  }
  return head || '群聊'
}
