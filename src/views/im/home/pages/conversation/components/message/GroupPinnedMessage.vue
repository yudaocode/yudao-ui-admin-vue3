<template>
  <!-- 群聊置顶消息：仅群聊 + 有置顶时显示，悬挂在群聊头部下方左上角；不占整行（对齐微信 PC） -->
  <div
    v-if="pinnedMessages.length > 0"
    class="im-group-pinned-message relative flex flex-shrink-0 flex-col items-start px-4 pt-1.5 pb-2 bg-[var(--el-fill-color-light)]"
  >
    <!-- 顶部胶囊：单条点击跳转；多条折叠点击展开；多条展开点击折叠 -->
    <div
      class="flex items-center gap-1.5 w-[360px] px-3 py-1.5 rounded-[10px] text-13px text-[var(--el-text-color-primary)] bg-[var(--el-bg-color)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
      @click="handleTopClick"
    >
      <Icon
        icon="ant-design:pushpin-outlined"
        :size="14"
        class="flex-shrink-0 text-[var(--el-color-warning)]"
      />
      <span class="flex-shrink-0 text-[var(--el-text-color-secondary)]"
        >{{ getSenderName(latest) }}：</span
      >
      <span class="flex-1 min-w-0 truncate">{{ getPreview(latest) }}</span>
      <!-- 单条：移除按钮；多条折叠：共 N 条；多条展开：收起箭头 -->
      <span
        v-if="pinnedMessages.length === 1 && canManage"
        v-loading="removingId === latest.id"
        class="flex-shrink-0 text-[var(--el-color-primary)] cursor-pointer text-13px hover:text-[var(--el-color-primary-light-3)]"
        @click.stop="handleRemove(latest)"
      >
        移除
      </span>
      <template v-else-if="pinnedMessages.length > 1">
        <span class="flex-shrink-0 text-[var(--el-text-color-secondary)] text-12px">
          共 {{ pinnedMessages.length }} 条
        </span>
        <Icon
          :icon="expanded ? 'ant-design:up-outlined' : 'ant-design:down-outlined'"
          :size="11"
          class="flex-shrink-0 text-[var(--el-text-color-placeholder)]"
        />
      </template>
    </div>

    <!-- 多条展开：浅色面板包裹完整列表，每条独立胶囊；点击跳转到对应消息位置 -->
    <div
      v-if="pinnedMessages.length > 1 && expanded"
      class="im-group-pinned-message__list absolute top-full left-1.5 z-10 flex flex-col gap-2.5 w-[380px] p-3 rounded-xl bg-[var(--el-bg-color)] shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
      style="margin-top: -1px"
    >
      <div
        v-for="msg in pinnedMessages"
        :key="msg.id"
        class="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-[10px] text-13px text-[var(--el-text-color-primary)] bg-[var(--el-fill-color-light)] cursor-pointer hover:bg-[var(--el-bg-color)]"
        @click="handleLocate(msg)"
      >
        <Icon
          icon="ant-design:pushpin-outlined"
          :size="14"
          class="flex-shrink-0 text-[var(--el-color-warning)]"
        />
        <span class="flex-shrink-0 text-[var(--el-text-color-secondary)]">
          {{ getSenderName(msg) }}：
        </span>
        <span class="flex-1 min-w-0 truncate">{{ getPreview(msg) }}</span>
        <span
          v-if="canManage"
          v-loading="removingId === msg.id"
          class="flex-shrink-0 text-[var(--el-color-primary)] cursor-pointer text-13px hover:text-[var(--el-color-primary-light-3)]"
          @click.stop="handleRemove(msg)"
        >
          移除
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { ImConversationType, ImGroupMemberRole } from '@/views/im/utils/constants'
import { unpinGroupMessage as apiUnpinGroupMessage } from '@/api/im/group'
import { getSenderDisplayName, isGroupQuit } from '@/views/im/utils/user'
import { resolveConversationLastContent } from '@/views/im/utils/conversation'
import { getCurrentUserId } from '@/utils/auth'
import { useGroupStore } from '../../../../store/groupStore'
import type { Message } from '../../../../types'

defineOptions({ name: 'ImGroupPinnedMessage' })

const props = defineProps<{
  /** 当前群编号（自行从 groupStore 拿完整 Group，跟随响应式） */
  groupId: number
}>()

const emit = defineEmits<{
  /** 点击置顶消息 → 父级 MessagePanel 滚动定位到原消息位置 */
  locate: [messageId: number]
}>()

const groupStore = useGroupStore()
const message = useMessage()

/** 当前群（含 pinnedMessages） */
const group = computed(() => groupStore.getGroup(props.groupId))

const expanded = ref(false)
const removingId = ref<number | null>(null)

// 切群时重置展开 / 移除中状态：本地 ref 不跟随 groupId，否则上一群"展开"或"移除中"会带到新群
watch(
  () => props.groupId,
  () => {
    expanded.value = false
    removingId.value = null
  }
)

/** 当前群置顶消息列表（直接走 group.value，跟随响应式） */
const pinnedMessages = computed<Message[]>(() => group.value?.pinnedMessages ?? [])

/** 顶部胶囊展示的最新一条（即列表最后一条，pin 顺序追加） */
const latest = computed(() => pinnedMessages.value[pinnedMessages.value.length - 1])

/** 当前用户是否群主 / 管理员（决定是否显示「移除」入口） */
const canManage = computed(() => {
  // 历史退群群：本地缓存残留时也不给「移除」入口
  if (isGroupQuit(group.value)) {
    return false
  }
  const myId = getCurrentUserId()
  const role = group.value?.members?.find((m) => m.userId === myId)?.role
  return role === ImGroupMemberRole.OWNER || role === ImGroupMemberRole.ADMIN
})

/** 顶部胶囊点击：单条直接跳转原消息位置；多条切换展开 / 折叠 */
function handleTopClick() {
  if (pinnedMessages.value.length === 1) {
    handleLocate(latest.value)
    return
  }
  expanded.value = !expanded.value
}

/** 点击置顶消息行 → 触发跳转 + 收起弹出层 */
function handleLocate(message: Message) {
  if (!message.id) {
    return
  }
  emit('locate', message.id)
  expanded.value = false
}

/** 置顶消息发送人显示名 */
function getSenderName(message: Message): string {
  return group.value
    ? getSenderDisplayName(message.senderId, ImConversationType.GROUP, group.value.id)
    : ''
}

/** 置顶消息预览文本：复用会话最后一条摘要逻辑（[图片] / [文件] / 文本等） */
function getPreview(message: Message): string {
  return group.value
    ? resolveConversationLastContent(message, ImConversationType.GROUP, group.value.id)
    : ''
}

/** 移除置顶：调后端 API，loading 期间禁止重复点；后端广播 GROUP_MESSAGE_UNPIN 由 dispatcher 自动同步本地 */
async function handleRemove(pinnedMessage: Message) {
  if (!group.value || !pinnedMessage.id || removingId.value !== null) {
    return
  }
  removingId.value = pinnedMessage.id
  try {
    await apiUnpinGroupMessage({ id: group.value.id, messageId: pinnedMessage.id })
    message.success('已取消置顶')
  } finally {
    removingId.value = null
  }
}
</script>

<style scoped>
/* 弹出层朝上的三角箭头；走 ::before + 4 边 border 配色画，颜色跟弹出层 background 一致 */
.im-group-pinned-message__list::before {
  position: absolute;
  top: -8px;
  left: 184px;
  width: 0;
  height: 0;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--el-bg-color);
  border-left: 8px solid transparent;
  content: '';
  filter: drop-shadow(0 -2px 1px rgb(0 0 0 / 4%));
}
</style>
