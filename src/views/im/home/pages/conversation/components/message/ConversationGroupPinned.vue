<template>
  <!-- 群聊置顶消息：仅群聊 + 有置顶时显示，悬挂在群聊头部下方左上角；不占整行（对齐微信 PC） -->
  <div v-if="pinnedMessages.length > 0" class="im-conversation-group-pinned">
    <!-- 顶部胶囊：单条点击跳转；多条折叠点击展开；多条展开点击折叠 -->
    <div
      class="im-conversation-group-pinned__row im-conversation-group-pinned__row--clickable"
      @click="handleTopClick"
    >
      <Icon icon="ant-design:pushpin-outlined" :size="14" class="im-conversation-group-pinned__icon" />
      <span class="im-conversation-group-pinned__sender">{{ getSenderName(latest) }}：</span>
      <span class="im-conversation-group-pinned__text">{{ getPreview(latest) }}</span>
      <!-- 单条：移除按钮；多条折叠：共 N 条；多条展开：收起箭头 -->
      <span
        v-if="pinnedMessages.length === 1 && canManage"
        v-loading="removingId === latest.id"
        class="im-conversation-group-pinned__remove"
        @click.stop="handleRemove(latest)"
      >
        移除
      </span>
      <template v-else-if="pinnedMessages.length > 1">
        <span class="im-conversation-group-pinned__count">共 {{ pinnedMessages.length }} 条</span>
        <Icon
          :icon="expanded ? 'ant-design:up-outlined' : 'ant-design:down-outlined'"
          :size="11"
          class="im-conversation-group-pinned__chevron"
        />
      </template>
    </div>

    <!-- 多条展开：浅色面板包裹完整列表，每条独立胶囊；点击跳转到对应消息位置 -->
    <div v-if="pinnedMessages.length > 1 && expanded" class="im-conversation-group-pinned__list">
      <div
        v-for="msg in pinnedMessages"
        :key="msg.id"
        class="im-conversation-group-pinned__row im-conversation-group-pinned__row--list im-conversation-group-pinned__row--clickable"
        @click="handleLocate(msg)"
      >
        <Icon icon="ant-design:pushpin-outlined" :size="14" class="im-conversation-group-pinned__icon" />
        <span class="im-conversation-group-pinned__sender">{{ getSenderName(msg) }}：</span>
        <span class="im-conversation-group-pinned__text">{{ getPreview(msg) }}</span>
        <span
          v-if="canManage"
          v-loading="removingId === msg.id"
          class="im-conversation-group-pinned__remove"
          @click.stop="handleRemove(msg)"
        >
          移除
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { ImConversationType, ImGroupMemberRole } from '@/views/im/utils/constants'
import { unpinGroupMessage as apiUnpinGroupMessage } from '@/api/im/group'
import { getSenderDisplayName } from '@/views/im/utils/user'
import { resolveConversationLastContent } from '@/views/im/utils/conversation'
import { useUserStore } from '@/store/modules/user'
import { useGroupStore } from '../../../../store/groupStore'
import type { Message } from '../../../../types'

defineOptions({ name: 'ImConversationGroupPinned' })

const props = defineProps<{
  /** 当前群编号（自行从 groupStore 拿完整 Group，跟随响应式） */
  groupId: number
}>()

const emit = defineEmits<{
  /** 点击置顶消息 → 父级 MessagePanel 滚动定位到原消息位置 */
  locate: [messageId: number]
}>()

const userStore = useUserStore()
const groupStore = useGroupStore()
const message = useMessage()

/** 当前群（含 pinnedMessages） */
const group = computed(() => groupStore.getGroup(props.groupId))

const expanded = ref(false)
const removingId = ref<number | null>(null)

/** 当前群置顶消息列表（直接走 group.value，跟随响应式） */
const pinnedMessages = computed<Message[]>(() => group.value?.pinnedMessages ?? [])

/** 顶部胶囊展示的最新一条（即列表最后一条，pin 顺序追加） */
const latest = computed(() => pinnedMessages.value[pinnedMessages.value.length - 1])

/** 当前用户是否群主 / 管理员（决定是否显示「移除」入口） */
const canManage = computed(() => {
  const myId = Number(userStore.getUser?.id) || 0
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
function handleLocate(msg: Message) {
  emit('locate', msg.id)
  expanded.value = false
}

/** 置顶消息发送人显示名 */
function getSenderName(msg: Message): string {
  return group.value ? getSenderDisplayName(msg.senderId, ImConversationType.GROUP, group.value.id) : ''
}

/** 置顶消息预览文本：复用会话最后一条摘要逻辑（[图片] / [文件] / 文本等） */
function getPreview(msg: Message): string {
  return group.value ? resolveConversationLastContent(msg, ImConversationType.GROUP, group.value.id) : ''
}

/** 移除置顶：调后端 API，loading 期间禁止重复点；后端广播 GROUP_MESSAGE_UNPIN 由 dispatcher 自动同步本地 */
async function handleRemove(msg: Message) {
  if (!group.value || removingId.value !== null) {
    return
  }
  removingId.value = msg.id
  try {
    await apiUnpinGroupMessage({ groupId: group.value.id, messageId: msg.id })
    message.success('已取消置顶')
  } finally {
    removingId.value = null
  }
}
</script>

<style scoped>
/* 容器：左对齐悬浮在 header 下方；不占整行；relative 让展开列表绝对定位贴顶部胶囊下方 */
.im-conversation-group-pinned {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 16px 8px;
  background-color: var(--el-fill-color-light);
}

/* 列表面板：绝对定位悬浮在顶部胶囊正下方；白色背景 + 强阴影跟 header 浅灰对比，呈现卡片层级感
   margin-top: -1px 让弹出层往上盖住 header bottom 那 1px 分隔线，避免视觉上有横向空隙 */
.im-conversation-group-pinned__list {
  position: absolute;
  top: 100%;
  margin-top: -1px;
  left: 6px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 380px;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--el-bg-color);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
/* 弹出层箭头：朝上的三角，颜色跟弹出层 background 一致（白色），跟 header 浅灰强对比 */
.im-conversation-group-pinned__list::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 184px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--el-bg-color);
  filter: drop-shadow(0 -2px 1px rgba(0, 0, 0, 0.04));
}

/* 胶囊基础样式：顶部固定 width；弹出层里的胶囊撑满外框宽度 */
.im-conversation-group-pinned__row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 360px;
  padding: 6px 12px;
  background-color: var(--el-bg-color);
  border-radius: 10px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.im-conversation-group-pinned__row--clickable {
  cursor: pointer;
}
.im-conversation-group-pinned__row--clickable:hover {
  background-color: var(--el-fill-color-lighter);
}
/* 列表里的胶囊：撑满弹出层宽度；浅灰背景跟弹出层白色区分，hover 反相白色 */
.im-conversation-group-pinned__row--list {
  width: 100%;
  background-color: var(--el-fill-color-light);
  box-shadow: none;
}
.im-conversation-group-pinned__row--list:hover {
  background-color: var(--el-bg-color);
}

.im-conversation-group-pinned__icon {
  flex-shrink: 0;
  color: var(--el-color-warning);
}

.im-conversation-group-pinned__sender {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}
.im-conversation-group-pinned__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.im-conversation-group-pinned__count {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.im-conversation-group-pinned__chevron {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.im-conversation-group-pinned__remove {
  flex-shrink: 0;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 13px;
}
.im-conversation-group-pinned__remove:hover {
  color: var(--el-color-primary-light-3);
}
</style>
