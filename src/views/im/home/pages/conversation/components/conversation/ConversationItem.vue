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
          <!-- TODO @AI：不要有动效 -->
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
        <!-- 置顶 & 免打扰图标 -->
        <el-icon
          v-if="conversation.muted"
          class="conversation-item__muted flex-shrink-0 ml-1 text-14px text-[var(--el-text-color-disabled)]"
          title="消息免打扰"
        >
          <!-- TODO @AI：消息免打扰后，是个 / 铃铛； -->
          <Bell />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

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

// 群聊 + 有发送者昵称 + 最后一条是普通消息 时，显示发送者前缀
// TODO @AI：注释风格；
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

// 会话列表 "@ 我" / "@ 全体成员" 红字提示
// TODO @AI：注释风格；
const atText = computed(() => {
  if (props.conversation.atMe) {
    return '[有人@我]'
  }
  if (props.conversation.atAll) {
    return '[@全体成员]'
  }
  return ''
})

function handleClick() {
  conversationStore.setActiveConversation(props.conversation)
}

// 右键菜单：置顶 / 免打扰 / 删除会话
// TODO @AI：注释风格；
function handleContextMenu(e: MouseEvent) {
  uiStore.openContextMenu(
    { x: e.clientX, y: e.clientY },
    // TODO @AI：TOP/MUTED 下面的删除，可以加个横线，类似微信。然后颜色是红色么？【删除会话，简化为删除】
    [
      { key: 'TOP', name: props.conversation.top ? '取消置顶' : '置顶' },
      // TODO @AI：消息免打扰、允许消息通知。
      { key: 'MUTED', name: props.conversation.muted ? '新消息提醒' : '消息免打扰' },
      { key: 'DELETE', name: '删除会话' }
    ],
    async (item) => {
      // TODO @AI：是不是抽成小方法。handleXXX；下面的每个 key；
      if (item.key === 'TOP') {
        conversationStore.setTop(
          props.conversation.type,
          props.conversation.targetId,
          !props.conversation.top
        )
      } else if (item.key === 'MUTED') {
        // TODO 群聊 /im/group/update 接入 muted 字段后，groupStore.setMuted 里也要调后端（好友侧已经在 friendStore.setMuted 里调过 /im/friend/update）
        // 当前同步刷新 friendStore / groupStore，保证两边状态一致（避免点头像名片再看时还显示旧值）
        const next = !props.conversation.muted
        conversationStore.setMuted(props.conversation.type, props.conversation.targetId, next)
        // TODO @AI：要 await 么？
        if (props.conversation.type === ImConversationType.PRIVATE) {
          friendStore.setMuted(props.conversation.targetId, next)
        } else {
          groupStore.setMuted(props.conversation.targetId, next)
        }
      } else if (item.key === 'DELETE') {
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
    }
  )
}

// TODO @AI：全局的 format 或者 date 有相关工具方法么？
function formatTime(timestamp: number): string {
  if (!timestamp) {
    return ''
  }
  const date = new Date(timestamp)
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (isToday) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
</script>

<style scoped>
/* el-tag 内部尺寸走 CSS 变量，UnoCSS 的高度/内边距会被 el-tag 自身的样式覆盖，用 :deep 微调 */
.conversation-item__tag {
  flex-shrink: 0;
  height: 18px;
  padding: 0 4px;
  line-height: 16px;
}

/* el-icon 的全局 color:var(--color) 在暗色模式下会渲染成白色，这里用 :deep + !important 锁定 */
.conversation-item__muted :deep(svg) {
  fill: currentColor !important;
}
</style>
