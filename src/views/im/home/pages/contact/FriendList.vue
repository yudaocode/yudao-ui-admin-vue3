<template>
  <!--
    通讯录 - 好友分组
    - 自治：折叠状态 + 关键字过滤 + 字母分桶 本组件内闭环
    - 选中态由父级 activeId 透传；chat / delete 透传到父级走 store 改造
  -->
  <div>
    <!-- 折叠分组头：字号对齐微信 PC（15px），hover 浅底色反馈 -->
    <div
      class="flex gap-2 items-center px-3.5 py-2.5 text-15px text-[var(--el-text-color-primary)] cursor-pointer select-none hover:bg-[var(--el-fill-color-light)]"
      @click="expanded = !expanded"
    >
      <Icon :icon="expanded ? 'ep:caret-bottom' : 'ep:caret-right'" :size="14" />
      <span class="flex-1">好友</span>
      <span class="text-sm text-[var(--el-text-color-secondary)]">{{ filtered.length }}</span>
    </div>
    <div v-show="expanded">
      <template v-for="bucket in buckets" :key="bucket.letter">
        <!-- 字母分桶 header：浅底 + 小字号，作为好友列表内部分隔 -->
        <div
          class="pt-1 pb-0.5 px-3.5 text-12px text-[var(--el-text-color-secondary)] bg-[var(--el-fill-color-lighter)]"
        >
          {{ bucket.letter }}
        </div>
        <FriendItem
          v-for="friend in bucket.list"
          :key="friend.id"
          :friend="friend"
          :active="activeId === friend.id"
          @click="emit('select', friend)"
          @chat="emit('chat', $event)"
          @delete="emit('delete', $event)"
        />
      </template>
      <div
        v-if="filtered.length === 0"
        class="py-3 text-12px text-center text-[var(--el-text-color-disabled)]"
      >
        {{ keyword ? '没有匹配的好友' : '暂无好友' }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import FriendItem from '../../components/friend/FriendItem.vue'
import type { FriendLite } from '../../types'

defineOptions({ name: 'ImContactFriendList' })

const props = defineProps<{
  friends: FriendLite[]
  keyword: string
  activeId?: number
}>()

const emit = defineEmits<{
  select: [friend: FriendLite]
  chat: [friend: FriendLite]
  delete: [friend: FriendLite]
}>()

const expanded = ref(true)

/** 拼音首字母拼接：「lao zhang」→ "lz"，用于支持「输 lz 搜老张」 */
function pinyinInitials(pinyin?: string): string {
  if (!pinyin) {
    return ''
  }
  return pinyin
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
}

/** 关键字过滤：备注 / 昵称 / 全拼 / 首字母任一命中即可，记不住哪个就按哪个搜 */
const filtered = computed(() => {
  const keywordLower = props.keyword.trim().toLowerCase()
  return props.friends.filter((friend) => {
    if (friend.deleted) {
      return false
    }
    if (!keywordLower) {
      return true
    }
    // 全拼搜索去掉空格，让「laozhang」也能命中「lao zhang」
    const nicknamePinyin = friend.nicknamePinyin || ''
    const displayNamePinyin = friend.displayNamePinyin || ''
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

/** 桶排序键：优先备注拼音，回落昵称拼音 / 名字本身（兜底英文 / 数字场景） */
function getSortKey(friend: FriendLite): string {
  return (
    friend.displayNamePinyin ||
    friend.nicknamePinyin ||
    (friend.displayName || friend.nickname || '').toLowerCase()
  )
}

/** 取分桶字母：拼音首字母大写，非字母（如纯符号）兜底 "#" */
function getBucketLetter(friend: FriendLite): string {
  const first = getSortKey(friend).charAt(0)
  return /^[a-zA-Z]$/.test(first) ? first.toUpperCase() : '#'
}

interface FriendBucket {
  letter: string
  list: FriendLite[]
}

/** 字母分桶：A-Z 优先，"#" 兜底；桶内按拼音 / 名字自然序 */
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
</script>
