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

/** 关键字过滤：兼顾备注 + 原昵称，记不住哪个就按哪个搜 */
const filtered = computed(() => {
  const keywordLower = props.keyword.trim().toLowerCase()
  return props.friends.filter((friend) => {
    if (friend.deleted) {
      return false
    }
    if (!keywordLower) {
      return true
    }
    return (
      (friend.nickname || '').toLowerCase().includes(keywordLower) ||
      (friend.displayName || '').toLowerCase().includes(keywordLower)
    )
  })
})

/**
 * 字母分桶：
 * - ASCII 字母直接取首字母大写
 * - 中文 / 其它非拉丁字符统一进 "#"（项目未引 pinyin 库，留中文按 "#" 显示，避免引入新依赖）
 * - 桶内按显示名 localeCompare 自然序
 */
interface FriendBucket {
  letter: string
  list: FriendLite[]
}

// TODO @AI：需要增加拼音返回；我们要讨论下，hutool 有拼音库；可能要引入下库；
const buckets = computed<FriendBucket[]>(() => {
  const map = new Map<string, FriendLite[]>()
  for (const friend of filtered.value) {
    const name = (friend.displayName || friend.nickname || '').trim()
    const first = name.charAt(0)
    const letter = /^[a-zA-Z]$/.test(first) ? first.toUpperCase() : '#'
    if (!map.has(letter)) {
      map.set(letter, [])
    }
    map.get(letter)!.push(friend)
  }
  // letter 排序：A-Z 在前，"#" 兜底
  const letters = Array.from(map.keys()).sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })
  return letters.map((letter) => ({
    letter,
    list: map.get(letter)!.sort((a, b) =>
      (a.displayName || a.nickname || '').localeCompare(b.displayName || b.nickname || '')
    )
  }))
})
</script>
