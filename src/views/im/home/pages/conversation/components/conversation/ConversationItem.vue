<template>
  <div
    class="relative flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
    :class="{ '!bg-[#d9ecff] dark:!bg-[var(--el-color-primary-light-8)]': isActive }"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 头像 + 未读徽标；免打扰会话不显示徽标 -->
    <div class="relative">
      <UserAvatar
        :url="conversation.avatar"
        :name="conversation.name"
        :size="40"
        :clickable="false"
      />
      <span
        v-show="!conversation.muted && conversation.unreadCount > 0"
        class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1.5 text-11px leading-[18px] text-white text-center bg-[#f56c6c] border border-white dark:border-[var(--el-bg-color)] rounded-full box-border whitespace-nowrap"
      >
        {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
      </span>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <span class="flex flex-1 items-center gap-1 min-w-0">
          <span class="overflow-hidden text-sm truncate text-[var(--el-text-color-primary)]">
            {{ conversation.name }}
          </span>
          <el-tag
            v-if="isGroup"
            type="primary"
            size="small"
            effect="plain"
            class="conversation-item__tag"
          >
            群
          </el-tag>
        </span>
        <span class="flex-shrink-0 ml-1 text-12px text-[var(--el-text-color-secondary)]">
          {{ formatTime(conversation.lastSendTime) }}
        </span>
      </div>
      <div class="flex items-center mt-1 leading-5">
        <!-- @红字提示：atMe 优先于 atAll -->
        <span v-if="atText" class="flex-shrink-0 text-12px text-[#c70b0b]">{{ atText }}</span>
        <!-- 群聊最后一条发送者前缀 -->
        <span
          v-if="showSendName"
          class="flex-shrink-0 text-12px text-[var(--el-text-color-secondary)] whitespace-nowrap"
        >
          {{ conversation.senderNickName }}:&nbsp;
        </span>
        <span
          class="flex-1 overflow-hidden text-12px truncate text-[var(--el-text-color-secondary)]"
        >
          {{ conversation.lastContent }}
        </span>
        <!-- 免打扰图标 -->
        <Icon
          v-if="conversation.muted"
          icon="mdi:bell-off-outline"
          :size="14"
          class="conversation-item__muted flex-shrink-0 ml-1 text-[var(--el-text-color-disabled)]"
          title="消息免打扰"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

import Icon from '@/components/Icon/src/Icon.vue'
import { isSameDay } from '@/utils/formatTime'
import { useConversationStore } from '../../../../store/conversationStore'
import { useFriendStore } from '../../../../store/friendStore'
import { useGroupStore } from '../../../../store/groupStore'
import { useImUiStore } from '../../../../store/uiStore'
import { ImConversationType, isNormalMessage } from '../../../../../utils/constants'
import type { Conversation } from '../../../../types'
import UserAvatar from '../../../../components/UserAvatar.vue'

defineOptions({ name: 'ImConversationItem' })

const props = defineProps<{
  conversation: Conversation
}>()

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const uiStore = useImUiStore()

const isActive = computed(
  () =>
    conversationStore.activeConversation?.targetId === props.conversation.targetId &&
    conversationStore.activeConversation?.type === props.conversation.type
)

const isGroup = computed(() => props.conversation.type === ImConversationType.GROUP)

/** 群聊 + 有发送者昵称 + 最后一条是普通消息 时，显示发送者前缀 */
const showSendName = computed(() => {
  if (!isGroup.value) {
    return false
  }
  if (!props.conversation.senderNickName) {
    return false
  }
  const last = props.conversation.messages?.[props.conversation.messages.length - 1]
  if (!last) {
    return false
  }
  return isNormalMessage(last.type)
})

/** 会话列表 "@ 我" / "@ 全体成员" 红字提示 */
const atText = computed(() => {
  if (props.conversation.atMe) {
    return '[有人@我]'
  }
  if (props.conversation.atAll) {
    return '[@全体成员]'
  }
  return ''
})

/** 点击切会话 */
function handleClick() {
  conversationStore.setActiveConversation(props.conversation)
}

/** 切换置顶 */
function handleTop() {
  conversationStore.setTop(
    props.conversation.type,
    props.conversation.targetId,
    !props.conversation.top
  )
}

/**
 * 切换免打扰：会话级 muted 立刻同步，friend / group 侧在后台异步推后端 + 落本地
 *
 * 不 await friend / group 的 setMuted：UI 已经通过 conversationStore.setMuted 完成视觉切换，
 * 后台 /im/friend/update / /im/group-member/update 失败也不应阻塞菜单关闭；用 void 显式表达 fire-and-forget
 */
function handleMuted() {
  const next = !props.conversation.muted
  conversationStore.setMuted(props.conversation.type, props.conversation.targetId, next)
  if (props.conversation.type === ImConversationType.PRIVATE) {
    void friendStore.setMuted(props.conversation.targetId, next)
  } else {
    void groupStore.setMuted(props.conversation.targetId, next)
  }
}

/** 删除会话：二次确认后软删（用户取消走 catch 静默） */
async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      `确定删除与「${props.conversation.name}」的会话吗？`,
      '删除会话',
      { type: 'warning' }
    )
    conversationStore.removeConversation(props.conversation.type, props.conversation.targetId)
  } catch {
    // 用户取消
  }
}

/** 右键菜单：置顶 / 免打扰 / 删除 */
function handleContextMenu(e: MouseEvent) {
  uiStore.openContextMenu(
    { x: e.clientX, y: e.clientY },
    [
      { key: 'TOP', name: props.conversation.top ? '取消置顶' : '置顶' },
      { key: 'MUTED', name: props.conversation.muted ? '允许消息通知' : '消息免打扰' },
      { key: 'DELETE', name: '删除', divided: true, danger: true }
    ],
    (item) => {
      if (item.key === 'TOP') {
        handleTop()
      } else if (item.key === 'MUTED') {
        handleMuted()
      } else if (item.key === 'DELETE') {
        void handleDelete()
      }
    }
  )
}

/** 会话列表时间：当天显示 HH:mm，否则显示 MM-DD（微信风格） */
function formatTime(timestamp: number): string {
  if (!timestamp) {
    return ''
  }
  return isSameDay(timestamp, Date.now())
    ? dayjs(timestamp).format('HH:mm')
    : dayjs(timestamp).format('MM-DD')
}
</script>

<style scoped>
/* el-tag 内部尺寸走 CSS 变量，UnoCSS 的高度/内边距会被 el-tag 自身的样式覆盖，用 :deep 微调 */
/* transition:none 是为了消掉 el-tag 切会话时 active 底色变化的渐变（看起来像闪烁） */
.conversation-item__tag {
  flex-shrink: 0;
  height: 18px;
  padding: 0 4px;
  line-height: 16px;
  transition: none !important;
}

/* el-icon 的全局 color:var(--color) 在暗色模式下会渲染成白色，这里用 :deep + !important 锁定 */
.conversation-item__muted :deep(svg) {
  fill: currentColor !important;
}
</style>
