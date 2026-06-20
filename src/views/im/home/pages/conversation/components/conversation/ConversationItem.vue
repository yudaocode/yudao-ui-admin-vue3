<template>
  <div
    class="relative flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
    :class="{ '!bg-[#d9ecff] dark:!bg-[var(--el-color-primary-light-8)]': isActive }"
    :data-conversation-key="`${conversation.type}-${conversation.targetId}`"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- 头像 + 未读提示 -->
    <div class="relative">
      <GroupAvatar
        v-if="isGroup"
        :group-id="conversation.targetId"
        :url="conversation.avatar"
        :name="conversation.name"
        :size="40"
      />
      <UserAvatar
        v-else
        :url="conversation.avatar"
        :name="conversation.name"
        :size="40"
        :clickable="false"
      />
      <!-- 数字徽标：非免打扰且有未读时显示具体条数 -->
      <span
        v-show="!conversation.silent && conversation.unreadCount > 0"
        class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1.5 text-11px leading-[18px] text-white text-center bg-[#f56c6c] border border-solid border-white dark:border-[var(--el-bg-color)] rounded-full box-border whitespace-nowrap"
      >
        {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
      </span>
      <!-- 小红点：免打扰且有未读时提示存在新消息 -->
      <span
        v-show="conversation.silent && conversation.unreadCount > 0"
        class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#f56c6c] border border-solid border-white dark:border-[var(--el-bg-color)] rounded-full box-border"
      ></span>
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
            class="conversation-item__tag flex-shrink-0 !h-[18px] !px-1 !leading-4"
          >
            群
          </el-tag>
        </span>
        <span class="flex-shrink-0 ml-1 text-12px text-[var(--el-text-color-secondary)]">
          {{ formatConversationTime(conversation.lastSendTime) }}
        </span>
      </div>
      <div class="flex items-center mt-1 leading-5">
        <!-- 进群申请红字前缀：群主 / 管理员看到自己管理的群下还有未处理申请时显示 -->
        <span
          v-if="requestText"
          class="conversation-item__prefix flex-shrink overflow-hidden text-12px text-[#c70b0b] truncate whitespace-nowrap"
        >
          {{ requestText }}
        </span>
        <!-- @红字提示：atMe 优先于 atAll -->
        <span
          v-if="atText"
          class="conversation-item__prefix flex-shrink overflow-hidden text-12px text-[#c70b0b] truncate whitespace-nowrap"
        >
          {{ atText }}
        </span>
        <!-- 免打扰未读条数 -->
        <span
          v-if="mutedUnreadText"
          class="flex-shrink-0 mr-1 text-12px text-[var(--el-text-color-secondary)] whitespace-nowrap"
        >
          {{ mutedUnreadText }}
        </span>
        <!-- 群聊最后一条发送者前缀：按 lastSenderId + 当前会话上下文实时算名字 -->
        <span
          v-if="showSendName"
          class="conversation-item__sender flex-shrink overflow-hidden text-12px text-[var(--el-text-color-secondary)] truncate whitespace-nowrap"
        >
          {{ lastSenderDisplayName }}:&nbsp;
        </span>
        <span
          class="flex-1 min-w-0 overflow-hidden text-12px truncate text-[var(--el-text-color-secondary)]"
        >
          {{ lastContentDisplay }}
        </span>
        <!-- 免打扰图标 -->
        <Icon
          v-if="conversation.silent"
          icon="mdi:bell-off-outline"
          :size="14"
          class="conversation-item__silent flex-shrink-0 ml-1 text-[var(--el-text-color-disabled)]"
          title="消息免打扰"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { formatConversationTime } from '@/views/im/utils/time'

import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useConversationStore } from '../../../../store/conversationStore'
import { useFriendStore } from '../../../../store/friendStore'
import { useGroupStore } from '../../../../store/groupStore'
import { useGroupRequestStore } from '../../../../store/groupRequestStore'
import { useImUiStore } from '../../../../store/uiStore'
import { ImConversationType, ImContentType, isNormalMessage } from '../../../../../utils/constants'
import { getSenderDisplayName } from '@/views/im/utils/user'
import { buildRecallTip } from '@/views/im/utils/conversation'
import type { Conversation } from '../../../../types'
import UserAvatar from '../../../../components/user/UserAvatar.vue'
import GroupAvatar from '../../../../components/group/GroupAvatar.vue'

defineOptions({ name: 'ImConversationItem' })

/** 周中文名（dayjs 的 day() 返回 0-6，0=周日）；项目没全局装 dayjs/locale/zh-cn，本地映射避免引副作用 */

const props = defineProps<{
  conversation: Conversation
}>()

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const groupRequestStore = useGroupRequestStore()
const uiStore = useImUiStore()
const message = useMessage()

const isActive = computed(
  () =>
    conversationStore.activeConversation?.targetId === props.conversation.targetId &&
    conversationStore.activeConversation?.type === props.conversation.type
)

/**
 * 当前会话的草稿快照：存在时列表显示 [草稿] 前缀 + plain 文本，盖掉 sender 前缀和 @我 红字
 * 当前打开的会话不展示草稿；输入内容已经在编辑器里可见，列表再显示 [草稿] 反而冗余
 */
const draft = computed(() => {
  if (isActive.value) {
    return undefined
  }
  return conversationStore.getConversationDraft(props.conversation)
})

const isGroup = computed(() => props.conversation.type === ImConversationType.GROUP)

/** 最后一条消息发送者的展示名：实时算 + 快照 fallback（getSenderDisplayName 算不出时兜底） */
const lastSenderDisplayName = computed(() => {
  const senderId = props.conversation.lastSenderId
  if (!senderId) {
    return ''
  }
  return getSenderDisplayName(
    senderId,
    props.conversation.type,
    props.conversation.targetId,
    props.conversation.lastSenderDisplayName
  )
})

/** 群聊 + 有最后发送者 + 最后一条是普通消息时，显示发送者前缀（FRIEND_* / GROUP_* / RECALL / 草稿态不带前缀） */
const showSendName = computed(() => {
  if (draft.value) {
    return false
  }
  if (!isGroup.value) {
    return false
  }
  if (!props.conversation.lastSenderId) {
    return false
  }
  const lastType = props.conversation.lastMessageType
  return lastType != null && isNormalMessage(lastType)
})

/** 列表展示文案：草稿优先（对齐微信 PC：有草稿时盖掉最后一条预览）→ 撤回实时算 → lastContent 兜底 */
const lastContentDisplay = computed(() => {
  if (draft.value) {
    return draft.value.plain
  }
  if (
    props.conversation.lastMessageType === ImContentType.RECALL &&
    props.conversation.lastSenderId != null
  ) {
    return buildRecallTip(
      props.conversation.lastSenderId,
      !!props.conversation.lastSelfSend,
      props.conversation.type,
      props.conversation.targetId,
      props.conversation.lastSenderDisplayName
    )
  }
  return props.conversation.lastContent
})

/** 会话列表 "[草稿]" / "@ 我" / "@ 全体成员" 红字提示；草稿优先（对齐微信 PC） */
const atText = computed(() => {
  if (draft.value) {
    return '[草稿]'
  }
  if (props.conversation.atMe) {
    return '[有人@我]'
  }
  if (props.conversation.atAll) {
    return '[@全体成员]'
  }
  return ''
})

/** 免打扰会话未读条数文案 */
const mutedUnreadText = computed(() => {
  if (!props.conversation.silent || props.conversation.unreadCount <= 0) {
    return ''
  }
  const count = props.conversation.unreadCount > 99 ? '99+' : props.conversation.unreadCount
  return `[${count}条]`
})

/** 群聊未处理加群申请红字前缀；store 已经按「我管理的群」过滤过，count > 0 即可显示 */
const requestText = computed(() => {
  if (!isGroup.value) {
    return ''
  }
  const count =
    groupRequestStore.getUnhandledGroupRequestCountMap.get(props.conversation.targetId) ?? 0
  return count > 0 ? `[${count}条进群申请]` : ''
})

/** 点击切会话 */
function handleClick() {
  conversationStore.setActiveConversation(props.conversation)
}

/** 切换置顶 */
function handleTop() {
  conversationStore.setConversationTop(
    props.conversation.type,
    props.conversation.targetId,
    !props.conversation.top
  )
}

/** 切换免打扰：乐观 UI（先本地切换，菜单立即关；后端失败回滚 conversation 状态） */
function handleMuted() {
  const next = !props.conversation.silent
  const { type, targetId } = props.conversation
  conversationStore.setConversationSilent(type, targetId, next)
  const sync =
    type === ImConversationType.PRIVATE
      ? friendStore.setFriendSilent(targetId, next)
      : groupStore.setGroupSilent(targetId, next)
  sync.catch((e) => {
    console.error('[IM] 切换免打扰失败', e)
    conversationStore.setConversationSilent(type, targetId, !next)
  })
}

/** 删除会话：二次确认后软删 */
async function handleDelete() {
  try {
    await message.confirm(`确定删除与「${props.conversation.name}」的会话吗？`, '删除会话')
    conversationStore.removeConversation(props.conversation.type, props.conversation.targetId)
  } catch {}
}

/** 右键菜单：置顶 / 免打扰 / 删除 */
function handleContextMenu(e: MouseEvent) {
  uiStore.openContextMenu(
    { x: e.clientX, y: e.clientY },
    [
      { key: 'TOP', name: props.conversation.top ? '取消置顶' : '置顶' },
      { key: 'MUTED', name: props.conversation.silent ? '允许消息通知' : '消息免打扰' },
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
</script>

<style scoped>
/* 消掉 el-tag 切会话时 active 底色变化的渐变（看起来像闪烁）； :deep 穿透 el-tag 自身样式 */
.conversation-item__tag {
  transition: none !important;
}

/* el-icon 的全局 color:var(--color) 在暗色模式下会渲染成白色，这里用 :deep + !important 锁定 */
.conversation-item__silent :deep(svg) {
  fill: currentcolor !important;
}

.conversation-item__prefix {
  max-width: 45%;
}

.conversation-item__sender {
  max-width: 50%;
}
</style>
