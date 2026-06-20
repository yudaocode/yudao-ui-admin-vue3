<template>
  <!-- url 非空走原图；url 空时取前 9 个成员头像拼九宫格 dataURL，成员未在 store 缓存时走色卡兜底 -->
  <UserAvatar
    :url="finalUrl"
    :name="name"
    :size="size"
    :radius="radius"
    :clickable="clickable"
    :previewable="previewable"
    :preview-z-index="previewZIndex"
  />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

import UserAvatar from '../user/UserAvatar.vue'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { buildGroupAvatar, getCachedGroupAvatar, setCachedGroupAvatar } from '../../../utils/group'
import { getMemberDisplayName } from '../../../utils/user'
import type { GroupMember } from '../../types'

defineOptions({ name: 'ImGroupAvatar' })

const props = withDefaults(
  defineProps<{
    groupId: number // 群编号；用于查 store 拿成员头像
    url?: string // 服务端已设置的群头像 URL；非空则直接用，不拼图
    name?: string // 群名；色卡兜底文字
    size?: number // 尺寸（px），正方形
    radius?: string // 圆角，CSS 长度
    clickable?: boolean // 是否可点击（默认 false，列表里仅展示）
    previewable?: boolean // 是否点头像直接放大预览（群详情大头像位用）
    previewZIndex?: number // 预览层 z-index
  }>(),
  {
    size: 42,
    radius: '15%',
    clickable: false,
    previewable: false,
    previewZIndex: 2000
  }
)

const friendStore = useFriendStore()
const groupStore = useGroupStore()
const mergedUrl = ref('')
// 竞态保护：丢弃过期 await 结果
let mergeToken = 0

/** 按容器 size × DPR 算 canvas 实际像素，避免 2x / 3x retina 屏拼图糊；DPR 封顶 3 防止超高分辨率画布过大 */
function getTargetSize(size: number): number {
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  return Math.max(Math.round(size * dpr), 64)
}

/** store 里整群成员是否「完整加载」过；只在为 true 时才拼图，避免列表场景批量发接口 */
const loadedMembers = computed<GroupMember[] | null>(() => {
  const g = groupStore.getGroup(props.groupId)
  if (!g?.membersLoaded || !g.members) {
    return null
  }
  return g.members
})

/** 前 9 个成员的拼图入参；name 走 getMemberDisplayName 口径（好友备注 > 群昵称 > 真实昵称） */
const memberItems = computed(() => {
  const members = loadedMembers.value
  if (!members) {
    return []
  }
  return members.slice(0, 9).map((m) => ({
    avatar: m.avatar || '',
    name: getMemberDisplayName(m, friendStore.getFriend(m.userId))
  }))
})

/** 成员快照签名：拼 (avatar, name) 字段，原地修改任一字段都会让 watch 重算 */
const memberSignature = computed(() =>
  memberItems.value.map((it) => `${it.avatar}#${it.name}`).join('|')
)

/** 走 buildGroupAvatar 拼图并写回 mergedUrl；mergeToken 校验避免老 await 覆盖新结果 */
async function applyMerge(key: string, targetSize: number): Promise<void> {
  const myToken = ++mergeToken
  const cached = getCachedGroupAvatar(key)
  if (cached) {
    mergedUrl.value = cached
    return
  }
  const dataUrl = await buildGroupAvatar(memberItems.value, { targetSize })
  if (myToken !== mergeToken) {
    return
  }
  if (dataUrl) {
    setCachedGroupAvatar(key, dataUrl)
  }
  mergedUrl.value = dataUrl
}

watch(
  () => [props.url, props.groupId, props.size, memberSignature.value] as const,
  ([url, groupId, size, signature]) => {
    if (url) {
      mergedUrl.value = ''
      return
    }
    if (!signature) {
      mergeToken++
      mergedUrl.value = ''
      groupStore.loadGroupMemberList(groupId)
      return
    }
    const targetSize = getTargetSize(size)
    const key = `${groupId}:${targetSize}:${signature}`
    applyMerge(key, targetSize)
  },
  { immediate: true }
)

/** 最终展示 url：服务端 url 优先 → 拼图 → 空字符串（让 UserAvatar 走色卡） */
const finalUrl = computed(() => props.url || mergedUrl.value)
</script>
