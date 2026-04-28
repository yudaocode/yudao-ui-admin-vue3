<template>
  <!--
    用户名片
    由 Index.vue 挂载，通过 useImUiStore.openUserInfoCard(user, position) 触发点遮罩 / 按 Esc 关闭
  -->
  <teleport to="body">
    <div v-if="card.show" class="fixed inset-0 z-9998" @click.self="handleClose">
      <div
        class="fixed w-80 p-4 bg-[var(--el-bg-color-overlay)] rounded-md shadow-xl"
        :style="{ left: card.position.x + 'px', top: card.position.y + 'px' }"
        @click.stop
      >
        <div class="flex items-center gap-3">
          <UserAvatar
            :url="user?.avatar"
            :name="user?.nickname"
            :size="60"
            :clickable="false"
            previewable
            :preview-z-index="10000"
          />
          <div class="flex-1 min-w-0">
            <div class="text-16px font-semibold text-[var(--el-text-color-primary)]">
              {{ user?.nickname || '-' }}
            </div>
            <div class="mt-1 text-13px break-all text-[var(--el-text-color-regular)]">
              <span class="text-[var(--el-text-color-secondary)]">部门：</span>
              <span>{{ user?.deptName || '-' }}</span>
            </div>
            <div class="mt-1 text-13px break-all text-[var(--el-text-color-regular)]">
              <span class="text-[var(--el-text-color-secondary)]">性别：</span>
              <span>{{ sexLabel }}</span>
            </div>
          </div>
        </div>

        <el-divider class="!my-3.5" />

        <div class="flex gap-2 justify-center">
          <el-button v-if="isSelf" type="primary" disabled>不能和自己聊天</el-button>
          <el-button v-else-if="isFriend" type="primary" @click="handleSendMessage"
            >发消息</el-button
          >
          <el-button v-else type="primary" @click="handleAddFriend">加为好友</el-button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from '@/hooks/web/useMessage'

import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { getSimpleUser } from '@/api/system/user'
import { useUserStore } from '@/store/modules/user'
import { useImUiStore } from '../store/uiStore'
import { useConversationStore } from '../store/conversationStore'
import { useFriendStore } from '../store/friendStore'
import { ImConversationType } from '../../utils/constants'
import type { UserInfo } from '../types'
import UserAvatar from './UserAvatar.vue'

defineOptions({ name: 'ImUserInfoCard' })

const uiStore = useImUiStore()
const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const userStore = useUserStore()
const router = useRouter()
const message = useMessage()

const card = computed(() => uiStore.userInfoCard)
const user = computed(() => card.value.user)

const sexLabel = computed(() => {
  if (user.value?.sex == null) {
    return '-'
  }
  return getDictLabel(DICT_TYPE.SYSTEM_USER_SEX, user.value.sex) || '-'
})

const isSelf = computed(() => {
  const myId = Number(userStore.getUser?.id) || 0
  return !!user.value?.id && user.value.id === myId
})

const isFriend = computed(() => {
  if (!user.value?.id || isSelf.value) {
    return false
  }
  return friendStore.isFriend(user.value.id)
})

/** 名片打开时拉一次完整信息（部门 / 性别），覆盖调用方传入的最小集 */
watch(
  () => card.value.show,
  async (show) => {
    if (!show) {
      return
    }
    const id = user.value?.id
    if (!id) {
      return
    }
    try {
      const data = (await getSimpleUser(id)) as UserInfo
      // 二次校验：用户切换或卡片已关闭则丢弃响应
      if (data && card.value.show && card.value.user?.id === id) {
        Object.assign(card.value.user, data)
      }
    } catch (e) {
      console.warn('[IM] 拉取用户名片信息失败', e)
    }
  }
)

/** 关闭名片：点击遮罩或按 Esc 都会触发，直接调用 uiStore 关掉就行 */
function handleClose() {
  uiStore.closeUserInfoCard()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && card.value.show) {
    handleClose()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

/** 发消息：打开私聊会话，跳转到聊天 tab */
function handleSendMessage() {
  if (!user.value) {
    return
  }
  // 同步 friendStore 里的 muted，避免新建的私聊会话丢失"消息免打扰"状态（与 FriendPage.onChat 行为一致）
  const friendEntry = friendStore.getFriend(user.value.id)
  conversationStore.openConversation(
    user.value.id,
    ImConversationType.PRIVATE,
    user.value.nickname || '',
    user.value.avatar || '',
    { muted: !!friendEntry?.muted }
  )
  // 跳转到聊天 tab（如果已经在了就算了）
  if (router.currentRoute.value.name !== 'ImHomeConversation') {
    router.push({ name: 'ImHomeConversation' })
  }
  uiStore.closeUserInfoCard()
}

/** 加为好友：直接加，成功后名片会自动切换到「发消息」按钮 */
async function handleAddFriend() {
  if (!user.value?.id) {
    return
  }
  try {
    await friendStore.addFriend(user.value.id, {
      nickname: user.value.nickname,
      avatar: user.value.avatar
    })
    message.success('已添加好友')
  } catch (e: any) {
    console.error(
      '[IM] 添加好友失败',
      { userId: user.value?.id, nickname: user.value?.nickname },
      e
    )
    message.error(e?.message || '添加好友失败')
  }
}
</script>
