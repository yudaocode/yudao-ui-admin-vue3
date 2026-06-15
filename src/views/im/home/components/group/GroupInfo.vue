<template>
  <!--
    群信息内容组件（与 UserInfo 对位）
    - 头像 + 群名 + 成员数 + 成员宫格 + 动作区，纯展示 + 抛事件，业务由父级承接
    - relation 走 groupStore 缓存推导：命中 = member（已加群），否则 = stranger（未加群），无 id = readonly
    - 成员宫格仅 member 时拉取（陌生群拉不到，所有信息走 props.group 卡片快照）
  -->
  <div class="flex justify-center">
    <div class="w-full max-w-[320px] flex flex-col gap-3 items-center">
      <GroupAvatar
        :group-id="group.id"
        :url="group.showImage || group.showImageThumb"
        :name="group.showGroupName || group.name"
        :size="72"
        :previewable="isMember"
      />
      <div
        class="w-full text-lg font-semibold leading-snug text-[var(--el-text-color-primary)] truncate text-center"
      >
        {{ group.showGroupName || group.name }}
      </div>
      <div v-if="memberCountText" class="text-13px text-[var(--el-text-color-secondary)]">
        {{ memberCountText }}
      </div>

      <!-- 成员宫格：仅 member 渲染（陌生群拉不到成员） -->
      <div
        v-if="isMember && members.length"
        class="flex flex-wrap gap-2 justify-center w-full pt-2"
      >
        <GroupMemberGrid
          v-for="member in members"
          :key="member.userId"
          :member="member"
          :group-name="group.name"
        />
      </div>

      <!-- 动作区：member 进入群聊 / stranger 加入群聊 / readonly 不渲染 -->
      <div v-if="isMember" class="mt-4">
        <el-button type="primary" @click="emit('chat', group)">进入群聊</el-button>
      </div>
      <div v-else-if="isStranger" class="mt-4">
        <el-button type="primary" @click="emit('apply', group)">加入群聊</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

import GroupAvatar from './GroupAvatar.vue'
import GroupMemberGrid from './GroupMemberGrid.vue'
import { getCurrentUserId } from '@/utils/auth'
import { CommonStatusEnum } from '@/utils/constants'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { getMemberDisplayName, isGroupQuit } from '../../../utils/user'
import type { Friend, GroupLite, GroupMember } from '../../types'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupInfo' })

const props = defineProps<{
  group: GroupLite
}>()

const emit = defineEmits<{
  /** member 点「进入群聊」；父级负责切会话 + 关浮层 */
  chat: [group: GroupLite]
  /** stranger 点「加入群聊」；父级负责弹申请理由 + 调 applyJoinGroup */
  apply: [group: GroupLite]
}>()

const groupStore = useGroupStore()
const friendStore = useFriendStore()

const members = ref<GroupMemberLite[]>([])

/**
 * 是否已加群：基于"自己确实在成员列表里"判断
 * - 缓存未命中：直接 false（陌生群）
 * - 命中且 members 已拉：精准查 self.userId 在不在
 * - 命中但 members 未拉：fetchGroupList 接口语义即「我加入的群」，命中视为 member（拉成员后会自动收敛）
 */
const isMember = computed(() => {
  if (!props.group?.id) {
    return false
  }
  const cached = groupStore.getGroup(props.group.id)
  if (!cached) {
    return false
  }
  // 历史退群群：直接判 false，避免成员未加载时误显示「进入群聊」
  if (isGroupQuit(cached)) {
    return false
  }
  if (cached.membersLoaded && cached.members) {
    const myId = getCurrentUserId()
    return cached.members.some((m) => m.userId === myId && m.status === CommonStatusEnum.ENABLE)
  }
  return true
})
/** 历史退群群：只读，动作区两个按钮都不渲染（既不「进入群聊」也不「加入群聊」） */
const isQuitGroup = computed(() => {
  const id = props.group?.id
  return id != null && isGroupQuit(groupStore.getGroup(id))
})
/** 是否未加群：有 id、非成员、且非历史退群群；只有真·陌生人才给「加入群聊」 */
const isStranger = computed(() => !!props.group?.id && !isMember.value && !isQuitGroup.value)

/** 成员数文案：member 优先用本地拉到的列表长度，stranger 用 props.group.memberCount 卡片快照 */
const memberCountText = computed(() => {
  const count = isMember.value
    ? props.group.memberCount || members.value.length
    : props.group.memberCount
  return count ? `${count} 位成员` : ''
})

/** member 切群 / 首挂：拉成员；竞态用 group.id 比对丢弃陈旧响应避免上一条群成员错位 */
watch(
  () => [props.group?.id, isMember.value] as const,
  async ([id, member]) => {
    members.value = []
    if (!id || !member) {
      return
    }
    const list = await groupStore.fetchGroupMemberList(id, true)
    if (props.group?.id !== id) {
      return
    }
    members.value = list.map((m) => convertGroupMemberLite(m, friendStore.getFriend(m.userId)))
  },
  { immediate: true }
)

/** 群成员 → 列表项 */
function convertGroupMemberLite(member: GroupMember, friend: Friend | undefined): GroupMemberLite {
  return {
    userId: member.userId,
    showName: getMemberDisplayName(member, friend),
    nickname: member.nickname,
    avatar: member.avatar,
    status: member.status,
    role: member.role
  }
}
</script>
