<template>
  <!--
    用户名片浮层
    - 仅承担"浮层定位 + 关闭逻辑（点遮罩 / Esc）"，名片视觉走 <UserInfo>，与 contact 详情共用一份组件
    - 触发：useImUiStore.openUserInfoCard(user, position)；本组件订阅 store，全局只挂一份实例
    - 关系态由 isSelf / isActiveFriend 派生 relation prop 透到 UserInfo；删除 / 加好友 / 备注落库都在 UserInfo 内闭环
  -->
  <teleport to="body">
    <div v-if="card.show" class="fixed inset-0 z-9998" @click.self="handleClose">
      <div
        class="fixed w-80 p-4 bg-[var(--el-bg-color-overlay)] rounded-md shadow-xl"
        :style="{ left: card.position.x + 'px', top: card.position.y + 'px' }"
        @click.stop
      >
        <UserInfo
          :user="user"
          :display-name="remark"
          :relation="relation"
          :preview-z-index="10000"
          :add-source="card.addSource"
          :add-source-extra="card.addSourceExtra"
          @chat="handleSendMessage"
          @deleted="handleClose"
        />
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import { getCurrentUserId } from '@/utils/auth'
import { useImUiStore } from '../../store/uiStore'
import { useConversationStore } from '../../store/conversationStore'
import { useFriendStore } from '../../store/friendStore'
import { getFriendDisplayName } from '../../../utils/user'
import { ImConversationType } from '../../../utils/constants'
import UserInfo, { type UserInfoRelation } from './UserInfo.vue'

defineOptions({ name: 'ImUserInfoCard' })

const uiStore = useImUiStore()
const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const router = useRouter()

const card = computed(() => uiStore.userInfoCard)
const user = computed(() => card.value.user)

const isSelf = computed(() => {
  const myId = getCurrentUserId()
  return !!user.value?.id && user.value.id === myId
})
const isActiveFriend = computed(() => {
  if (!user.value?.id || isSelf.value) {
    return false
  }
  return friendStore.isActiveFriend(user.value.id)
})
const relation = computed<UserInfoRelation>(() => {
  if (!user.value) {
    return 'readonly'
  }
  if (isSelf.value) {
    return 'self'
  }
  if (isActiveFriend.value) {
    return 'friend'
  }
  return 'stranger'
})

const remark = computed(() => {
  if (!isActiveFriend.value || !user.value?.id) {
    return undefined
  }
  return friendStore.getFriend(user.value.id)?.displayName || ''
})

/** 关闭名片：点击遮罩 / Esc / UserInfo 抛上来的删除成功事件 */
function handleClose() {
  uiStore.closeUserInfoCard()
}

/** 键盘事件：Esc 键关闭名片 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && card.value.show) {
    handleClose()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

/** 发消息：UserInfo 抛上来的"发消息"，由本组件接力做 openConversation + 跳消息 Tab + 关浮层 */
function handleSendMessage() {
  if (!user.value) {
    return
  }
  // 取 friendStore 里的最新备注 / 免打扰，避免新建会话用过期数据
  const friend = friendStore.getFriend(user.value.id)
  const conversationName = friend ? getFriendDisplayName(friend) : user.value.nickname || ''
  conversationStore.openConversation(
    user.value.id,
    ImConversationType.PRIVATE,
    conversationName,
    user.value.avatar || '',
    { silent: !!friend?.silent }
  )
  // 跳转会话 Tab（如果不在的话），并且不管当前路由是啥都先切到会话列表页
  if (router.currentRoute.value.name !== 'ImHomeConversation') {
    router.push({ name: 'ImHomeConversation' })
  }
  uiStore.closeUserInfoCard()
}
</script>
