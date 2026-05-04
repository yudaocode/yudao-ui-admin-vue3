<template>
  <!--
    通讯录 - 群聊详情
    - 头像 + 群名 + 成员数 + 成员宫格 + "进入群聊"，纯展示不做群管理
    - 成员列表按 group.id 懒拉，组件内部维护；切换群时清空避免上一条群成员闪现
  -->
  <div class="flex justify-center pt-12 px-6">
    <div class="w-full max-w-[320px] flex flex-col gap-3 items-center">
      <UserAvatar
        :url="group.showImage || group.showImageThumb"
        :name="group.showGroupName || group.name"
        :size="72"
        :clickable="false"
        previewable
      />
      <div
        class="text-lg font-semibold leading-snug text-[var(--el-text-color-primary)] truncate w-full text-center"
      >
        {{ group.showGroupName || group.name }}
      </div>
      <div class="text-13px text-[var(--el-text-color-secondary)]"> {{ memberCount }} 位成员 </div>
      <!-- 成员宫格：纯展示，宽度跟着 320 容器自动换行；不带"邀请 +"瓦片 -->
      <div class="flex flex-wrap gap-2 justify-center w-full pt-2">
        <!-- 注意！！！加好友话术里的群名一律用 group.name（原始名）；showGroupName 是我自定义的群备注，不能带给对端 -->
        <GroupMemberGrid
          v-for="member in members"
          :key="member.userId"
          :member="member"
          :group-name="group.name"
        />
      </div>
      <div class="mt-4">
        <el-button type="primary" @click="emit('chat', group)">进入群聊</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

import UserAvatar from '../../components/user/UserAvatar.vue'
import GroupMemberGrid from '../../components/group/GroupMemberGrid.vue'
import type { Friend, GroupLite, GroupMember } from '../../types'
import type { GroupMemberLite } from '../../components/group/GroupMember.vue'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { getMemberDisplayName } from '../../../utils/user'

defineOptions({ name: 'ImContactGroupDetail' })

const props = defineProps<{
  group: GroupLite
}>()

const emit = defineEmits<{
  chat: [group: GroupLite]
}>()

const groupStore = useGroupStore()
const friendStore = useFriendStore()

const members = ref<GroupMemberLite[]>([])

/** 群人数文案：优先后端 memberCount，其次按已拉到的列表长度兜底；都没有给 0 */
const memberCount = computed(() => props.group.memberCount || members.value.length || 0)

/** 切换群 / 首挂：拉成员；竞态用 group.id 比对丢弃陈旧响应避免上一条群成员错位 */
watch(
  () => props.group?.id,
  async (id) => {
    members.value = []
    if (!id) {
      return
    }
    const list = await groupStore.fetchGroupMembers(id)
    if (props.group?.id !== id) {
      return
    }
    members.value = list.map((member) =>
      convertGroupMemberLite(member, friendStore.getFriend(member.userId))
    )
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
