<template>
  <!--
    通讯录 Tab 整页（参考微信 PC 通讯录）
    - 左：搜索 + GroupList / FriendList 两个折叠分组（好友按字母分桶）
    - 右：选中项的详情，好友走共享 <UserInfo>（relation=friend），群聊走 GroupDetail
    - 本页仅做：选中分发 + 数据源转换 + 跨组件事件落 store
  -->
  <div class="flex flex-1 h-full min-w-0 bg-[var(--el-bg-color)]">
    <ResizableAside :default-width="260" :storage-key="StorageKeys.asideWidth">
      <!-- 顶部：仅搜索框 -->
      <div
        class="flex flex-shrink-0 items-center px-4 py-2 border-b border-[var(--el-border-color-lighter)]"
      >
        <el-input v-model="keyword" placeholder="搜索" clearable class="flex-1">
          <template #prefix>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </el-input>
      </div>

      <!-- 列表主体：拆 GroupList / FriendList 两个子组件，各自管理折叠 + 过滤；本页只透传选中态 -->
      <el-scrollbar class="flex-1">
        <GroupList
          :groups="groups"
          :keyword="keyword"
          :active-id="selection?.type === 'group' ? selection.group.id : undefined"
          @select="handleSelectGroup"
        />
        <FriendList
          :friends="friends"
          :keyword="keyword"
          :active-id="selection?.type === 'friend' ? selection.friend.id : undefined"
          @select="handleSelectFriend"
          @chat="handleChatFriend"
          @delete="handleDeleteFriend"
        />
      </el-scrollbar>
    </ResizableAside>

    <!-- 右侧详情区 -->
    <div class="flex-1 min-w-0">
      <!-- 空态：占位图标 + 提示文案 -->
      <div
        v-if="!selection"
        class="flex flex-col items-center justify-center h-full gap-3 text-[var(--el-text-color-secondary)]"
      >
        <Icon
          icon="ant-design:contacts-outlined"
          :size="64"
          class="text-[var(--el-text-color-placeholder)]"
        />
        <span class="text-sm">在左侧选择好友或群聊查看详情</span>
      </div>
      <!-- 好友详情 -->
      <div v-else-if="selection.type === 'friend'" class="flex justify-center pt-12 px-6">
        <div class="w-full max-w-[320px]">
          <UserInfo
            :user="friendUser"
            :display-name="selection.friend.displayName || ''"
            relation="friend"
            @chat="handleChatFriend(selection.friend)"
            @deleted="selection = null"
            @saved="onRemarkSaved"
          />
        </div>
      </div>
      <!-- 群详情 -->
      <GroupDetail
        v-else-if="selection.type === 'group'"
        :group="selection.group"
        @chat="handleChatGroup"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useRouter } from 'vue-router'

import ResizableAside from '../../components/ResizableAside.vue'
import UserInfo from '../../components/user/UserInfo.vue'
import FriendList from './FriendList.vue'
import GroupList from './GroupList.vue'
import GroupDetail from './GroupDetail.vue'
import { useConversationStore } from '../../store/conversationStore'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { getFriendDisplayName, getGroupDisplayName } from '../../../utils/user'
import type { Friend, FriendLite, Group, GroupLite, User } from '../../types'
import { ImConversationType } from '../../../utils/constants'
import { StorageKeys } from '../../../utils/storage'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'ImContactPage' })

const router = useRouter()
const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const message = useMessage()

/** 用 type 判别选中是好友还是群聊 */
type Selection = { type: 'friend'; friend: FriendLite } | { type: 'group'; group: GroupLite }

const selection = ref<Selection | null>(null)
const keyword = ref('')

const friends = computed<FriendLite[]>(() =>
  friendStore.getActiveFriends.map((friend: Friend) => ({
    id: friend.friendUserId,
    nickname: friend.nickname,
    avatar: friend.avatar,
    displayName: friend.displayName,
    deleted: friend.status === CommonStatusEnum.DISABLE
  }))
)

const groups = computed<GroupLite[]>(() =>
  groupStore.groups.map((group: Group) => ({
    id: group.id,
    name: group.name,
    // 优先用群备注 displayGroupName，没设置时回落到原群名；避免点"进入群聊"时把已同步的备注会话名刷回原名
    showGroupName: getGroupDisplayName(group),
    showImage: group.avatar,
    showImageThumb: group.avatar,
    memberCount: group.memberCount
  }))
)

const friendUser = computed<User | null>(() => {
  if (selection.value?.type !== 'friend') {
    return null
  }
  const friend = selection.value.friend
  return {
    id: friend.id,
    nickname: friend.nickname,
    avatar: friend.avatar
  }
})

onMounted(async () => {
  await Promise.all([friendStore.fetchFriends(), groupStore.fetchGroups()])
})

/** 选中好友 → 切到好友详情 */
function handleSelectFriend(friend: FriendLite) {
  selection.value = { type: 'friend', friend }
}

/** 选中群聊 → 切到群详情 */
function handleSelectGroup(group: GroupLite) {
  selection.value = { type: 'group', group }
}

/** 进入与该好友的私聊会话 */
function handleChatFriend(friend: FriendLite) {
  // 从 friendStore 同步备注 + 免打扰，避免新建会话用过期数据
  const entry = friendStore.getFriend(friend.id)
  const conversationName = entry ? getFriendDisplayName(entry) : friend.nickname
  conversationStore.openConversation(
    friend.id,
    ImConversationType.PRIVATE,
    conversationName,
    friend.avatar || '',
    { muted: !!entry?.muted }
  )
  router.push({ name: 'ImHomeConversation' })
}

/** 进入该群的群聊会话 */
function handleChatGroup(group: GroupLite) {
  const entry = groupStore.getGroup(group.id)
  conversationStore.openConversation(
    group.id,
    ImConversationType.GROUP,
    group.showGroupName || group.name || '',
    group.showImage || group.showImageThumb || '',
    { muted: !!entry?.muted }
  )
  router.push({ name: 'ImHomeConversation' })
}

/** 删除好友：二次确认 → store 落库 → 清空当前选中 */
async function handleDeleteFriend(friend: FriendLite) {
  try {
    await message.confirm(`确定删除好友「${friend.nickname}」吗？`, '删除联系人')
    // friendStore.deleteFriend 内部已经级联清理对应私聊会话
    await friendStore.deleteFriend(friend.id)
    if (selection.value?.type === 'friend' && selection.value.friend.id === friend.id) {
      selection.value = null
    }
    message.success('已删除好友')
  } catch {}
}

/** 备注已保存：UserInfo 内部已经走完 friendStore 落库 + 提示，本侧只负责同步 selection 持的旧 FriendLite 副本 */
function onRemarkSaved(displayName: string) {
  if (selection.value?.type === 'friend') {
    selection.value.friend.displayName = displayName
  }
}
</script>
