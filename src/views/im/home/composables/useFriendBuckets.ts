import { computed, type ComputedRef, type Ref } from 'vue'

import type { FriendLite } from '../types'

/** 字母分桶结果：letter 取 'A'-'Z' 或兜底 '#'；list 桶内按拼音 / 名字自然序 */
export interface FriendBucket {
  letter: string
  list: FriendLite[]
}

/** 取分桶 / 排序键：备注拼音优先 → 昵称拼音 → 名字本身（兜底英文 / 数字） */
function getSortKey(friend: FriendLite): string {
  return (
    friend.displayNamePinyin ||
    friend.nicknamePinyin ||
    (friend.displayName || friend.nickname || '').toLowerCase()
  )
}

/** 取分桶字母：拼音首字母大写，非字母（纯符号 / 数字 / 中文）兜底 '#' */
function getBucketLetter(friend: FriendLite): string {
  const first = getSortKey(friend).charAt(0)
  return /^[a-zA-Z]$/.test(first) ? first.toUpperCase() : '#'
}

/** 拼音首字母拼接：「lao zhang」→ 'lz'，支持「输 lz 搜老张」 */
function pinyinInitials(pinyin?: string): string {
  if (!pinyin) {
    return ''
  }
  return pinyin
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
}

/**
 * 好友列表的搜索 + 字母分桶
 *
 * - 搜索匹配：备注 / 昵称 / 全拼（去空格）/ 首字母任一命中
 * - 分桶规则：A-Z + '#' 兜底，桶内按 getSortKey 自然序
 *
 * 通讯录页 FriendList 与选择类弹窗 FriendPickerPanel 共用，避免规则各自实现走偏
 */
export function useFriendBuckets(
  friends: Ref<FriendLite[]> | ComputedRef<FriendLite[]>,
  keyword: Ref<string>
): {
  filtered: ComputedRef<FriendLite[]>
  buckets: ComputedRef<FriendBucket[]>
} {
  const filtered = computed(() => {
    const keywordLower = keyword.value.trim().toLowerCase()
    if (!keywordLower) {
      return friends.value
    }
    return friends.value.filter((friend) => {
      const nicknamePinyin = friend.nicknamePinyin || ''
      const displayNamePinyin = friend.displayNamePinyin || ''
      // 全拼搜索去掉空格，让「laozhang」也能命中「lao zhang」
      return (
        (friend.nickname || '').toLowerCase().includes(keywordLower) ||
        (friend.displayName || '').toLowerCase().includes(keywordLower) ||
        nicknamePinyin.replace(/\s/g, '').includes(keywordLower) ||
        displayNamePinyin.replace(/\s/g, '').includes(keywordLower) ||
        pinyinInitials(nicknamePinyin).includes(keywordLower) ||
        pinyinInitials(displayNamePinyin).includes(keywordLower)
      )
    })
  })

  const buckets = computed<FriendBucket[]>(() => {
    const map = new Map<string, FriendLite[]>()
    for (const friend of filtered.value) {
      const letter = getBucketLetter(friend)
      if (!map.has(letter)) {
        map.set(letter, [])
      }
      map.get(letter)!.push(friend)
    }
    const letters = Array.from(map.keys()).sort((a, b) => {
      // '#' 永远排末尾，A-Z 走 localeCompare
      if (a === '#') {
        return 1
      }
      if (b === '#') {
        return -1
      }
      return a.localeCompare(b)
    })
    return letters.map((letter) => ({
      letter,
      list: map.get(letter)!.sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)))
    }))
  })

  return { filtered, buckets }
}
