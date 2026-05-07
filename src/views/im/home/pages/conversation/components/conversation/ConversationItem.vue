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
        v-show="!conversation.silent && conversation.unreadCount > 0"
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
          {{ formatConversationTime(conversation.lastSendTime) }}
        </span>
      </div>
      <div class="flex items-center mt-1 leading-5">
        <!-- 进群申请红字前缀：群主 / 管理员看到自己管理的群下还有未处理申请时显示 -->
        <span v-if="requestText" class="flex-shrink-0 text-12px text-[#c70b0b]">
          {{ requestText }}
        </span>
        <!-- @红字提示：atMe 优先于 atAll -->
        <span v-if="atText" class="flex-shrink-0 text-12px text-[#c70b0b]">{{ atText }}</span>
        <!-- 群聊最后一条发送者前缀：按 lastSenderId + 当前会话上下文实时算名字 -->
        <span
          v-if="showSendName"
          class="flex-shrink-0 text-12px text-[var(--el-text-color-secondary)] whitespace-nowrap"
        >
          {{ lastSenderDisplayName }}:&nbsp;
        </span>
        <span
          class="flex-1 overflow-hidden text-12px truncate text-[var(--el-text-color-secondary)]"
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
import { useDraftStore } from '../../../../store/draftStore'
import { ImConversationType, ImMessageType, isNormalMessage } from '../../../../../utils/constants'
import { getSenderDisplayName } from '@/views/im/utils/user'
import { buildRecallTip } from '@/views/im/utils/conversation'
import type { Conversation } from '../../../../types'
import UserAvatar from '../../../../components/user/UserAvatar.vue'

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
const draftStore = useDraftStore()
const message = useMessage()

/** 当前会话的草稿快照：存在时列表显示 [草稿] 前缀 + plain 文本，盖掉 sender 前缀和 @我 红字 */
const draft = computed(() => draftStore.getDraft(props.conversation))

const isActive = computed(
  () =>
    conversationStore.activeConversation?.targetId === props.conversation.targetId &&
    conversationStore.activeConversation?.type === props.conversation.type
)

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
    props.conversation.lastMessageType === ImMessageType.RECALL &&
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

/** 群聊未处理加群申请红字前缀；store 已经按「我管理的群」过滤过，count > 0 即可显示 */
const requestText = computed(() => {
  if (!isGroup.value) {
    return ''
  }
  const count = groupRequestStore.unhandledCountMap.get(props.conversation.targetId) ?? 0
  return count > 0 ? `[${count}条进群申请]` : ''
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

/** 切换免打扰：乐观 UI（先本地切换，菜单立即关；后端失败回滚 conversation 状态） */
function handleMuted() {
  const next = !props.conversation.silent
  const { type, targetId } = props.conversation
  conversationStore.setSilent(type, targetId, next)
  const sync =
    type === ImConversationType.PRIVATE
      ? friendStore.setSilent(targetId, next)
      : groupStore.setSilent(targetId, next)
  sync.catch((e) => {
    console.error('[IM] 切换免打扰失败', e)
    message.error('切换免打扰失败')
    conversationStore.setSilent(type, targetId, !next)
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
.conversation-item__silent :deep(svg) {
  fill: currentColor !important;
}
</style>
