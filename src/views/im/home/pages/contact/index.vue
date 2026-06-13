<template>
  <!--
    通讯录 Tab 整页（参考微信 PC 通讯录）
    - 左：搜索 + GroupList / FriendList 两个折叠分组（好友按字母分桶）
    - 右：选中项的详情，好友走共享 <UserInfo>（relation=friend），群聊走 GroupDetail
    - 本页仅做：选中分发 + 数据源转换 + 跨组件事件落 store
  -->
  <div class="flex flex-1 h-full min-w-0 bg-[var(--el-bg-color)]">
    <ResizableAside :default-width="260" :storage-key="StorageKeys.localStorage.asideWidth">
      <!-- 顶部：仅搜索框；h-14 与消息 Tab 顶部对齐，避免切换时搜索框上下抖动 -->
      <div
        class="flex flex-shrink-0 items-center h-14 px-4 border-b border-b-solid border-[var(--el-border-color-lighter)]"
      >
        <el-input v-model="keyword" placeholder="搜索" clearable class="flex-1">
          <template #prefix>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </el-input>
      </div>

      <!-- 列表主体：拆 FriendRequestList / GroupList / FriendList 三个子组件，各自管理折叠 + 过滤；本页只透传选中态 -->
      <el-scrollbar class="flex-1">
        <FriendRequestList
          :requests="friendRequests"
          :active-id="selection?.type === 'request' ? selection.request.id : undefined"
          @select="handleSelectRequest"
        />
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
      <!-- 新的朋友 - 申请详情 -->
      <FriendRequestDetail
        v-else-if="selection.type === 'request'"
        :request="currentRequest"
        @chat="handleChatPeer"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useRouter } from 'vue-router'

import ResizableAside from '../../components/ResizableAside.vue'
import UserInfo from '../../components/user/UserInfo.vue'
import FriendList from './FriendList.vue'
import FriendRequestList from './FriendRequestList.vue'
import FriendRequestDetail from './FriendRequestDetail.vue'
import GroupList from './GroupList.vue'
import GroupDetail from './GroupDetail.vue'
import { useConversationStore } from '../../store/conversationStore'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { getFriendDisplayName, getGroupDisplayName, isGroupQuit } from '../../../utils/user'
import type { FriendLite, FriendRequest, Group, GroupLite, User } from '../../types'
import { ImConversationType } from '../../../utils/constants'
import { StorageKeys } from '../../../utils/db'

defineOptions({ name: 'ImContactPage' })

const router = useRouter()
const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const message = useMessage()

/** 用 type 判别选中是好友 / 群聊 / 好友申请 */
type Selection =
  | { type: 'friend'; friend: FriendLite }
  | { type: 'group'; group: GroupLite }
  | { type: 'request'; request: FriendRequest }

const selection = ref<Selection | null>(null)
const keyword = ref('')

/** 选中申请详情：详情用 store 里的最新副本（同意 / 拒绝后状态会变） */
const currentRequest = computed<FriendRequest>(() => {
  const req = selection.value?.type === 'request' ? selection.value.request : null
  if (!req) {
    return {} as FriendRequest
  }
  return friendStore.getFriendRequest(req.id) || req
})

/** 我相关的申请列表（用 friendStore 里的实时副本，便于通知到达后自动刷新） */
const friendRequests = computed<FriendRequest[]>(() => friendStore.friendRequests)

/** 好友列表的展示快照：附带后端算好的拼音，给 FriendList 做字母分桶 / 拼音搜索 */
const friends = computed<FriendLite[]>(() => friendStore.getActiveFriendLiteList)

const groups = computed<GroupLite[]>(() =>
  // 通讯录只展示当前仍在群的；已退群历史群只留在 store 里供消息展示群名 / 头像，不进通讯录
  groupStore.groups
    .filter((group: Group) => !isGroupQuit(group))
    .map((group: Group) => ({
      id: group.id,
      name: group.name,
      showGroupName: getGroupDisplayName(group), // 优先用群备注 groupRemark，没设置时回落到原群名；避免点"进入群聊"时把已同步的备注会话名刷回原名
      showImage: group.avatar,
      showImageThumb: group.avatar,
      memberCount: group.memberCount
    }))
)

/**
 * store 列表变化时同步 selection 持的对象副本：对端推送 / 跨端动作改 store 后，右侧详情能跟上：
 * - 命中则替换为最新引用，资料 / 备注 / 申请状态变更立刻反映
 * - 找不到（删除 / 拒绝 / 已通过等让记录消失）则置 null 收起详情
 */
watch(
  friends,
  (list) => {
    const selected = selection.value
    if (selected?.type !== 'friend') {
      return
    }
    const fresh = list.find((friend) => friend.id === selected.friend.id)
    if (!fresh) {
      selection.value = null
    } else if (fresh !== selected.friend) {
      selection.value = { type: 'friend', friend: fresh }
    }
  },
  { deep: true }
)
watch(
  groups,
  (list) => {
    const selected = selection.value
    if (selected?.type !== 'group') {
      return
    }
    const fresh = list.find((group) => group.id === selected.group.id)
    if (!fresh) {
      selection.value = null
    } else if (fresh !== selected.group) {
      selection.value = { type: 'group', group: fresh }
    }
  },
  { deep: true }
)
watch(
  friendRequests,
  (list) => {
    const selected = selection.value
    if (selected?.type !== 'request') {
      return
    }
    const fresh = list.find((request) => request.id === selected.request.id)
    if (!fresh) {
      selection.value = null
    } else if (fresh !== selected.request) {
      selection.value = { type: 'request', request: fresh }
    }
  },
  { deep: true }
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
  await Promise.all([
    friendStore.fetchFriendList(),
    friendStore.fetchFriendRequestList(),
    groupStore.fetchGroupList()
  ])
})

/** 选中好友 → 切到好友详情 */
function handleSelectFriend(friend: FriendLite) {
  selection.value = { type: 'friend', friend }
}

/** 选中群聊 → 切到群详情 */
function handleSelectGroup(group: GroupLite) {
  selection.value = { type: 'group', group }
}

/** 选中好友申请 → 切到「新的朋友」详情 */
function handleSelectRequest(request: FriendRequest) {
  selection.value = { type: 'request', request }
}

/** 申请详情里点「发消息」：直接进与对端的私聊会话 */
function handleChatPeer(peerUserId: number) {
  const friend = friendStore.getFriend(peerUserId)
  const conversationName = friend ? getFriendDisplayName(friend) : String(peerUserId)
  conversationStore.openConversation(
    peerUserId,
    ImConversationType.PRIVATE,
    conversationName,
    friend?.avatar || '',
    { silent: !!friend?.silent }
  )
  router.push({ name: 'ImHomeConversation' })
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
    { silent: !!entry?.silent }
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
    { silent: !!entry?.silent }
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
