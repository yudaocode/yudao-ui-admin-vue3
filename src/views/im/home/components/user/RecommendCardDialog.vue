<template>
  <!--
    把他推荐给朋友（个人名片转发弹窗，对齐微信 PC 双栏布局）
    - 左栏：搜索 + 最近聊天列表（圆形单/多选指示）
    - 右栏：已选预览（每行可移除）+ 名片预览卡 + 留言 + 取消/发送
    - 选中时按 1 个走「发送」、多个走「分别发送(n)」文案，与微信一致
    - 失败的消息以 FAILED 状态留在对应会话气泡里，供右键重试
  -->
  <el-dialog
    v-model="visible"
    title="把他推荐给朋友"
    width="720px"
    :close-on-click-modal="false"
    class="im-recommend-dialog"
    @open="resetForm"
  >
    <div class="flex h-[480px]">
      <!-- ============ 左栏：搜索 + 会话列表 ============ -->
      <div
        class="flex flex-col w-[280px] border-r border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]"
      >
        <!-- 搜索框 -->
        <div class="px-3 py-3 flex-shrink-0">
          <el-input v-model="keyword" placeholder="搜索" clearable size="small">
            <template #prefix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </el-input>
        </div>

        <div class="px-3 pb-1.5 text-13px text-[var(--el-text-color-secondary)] flex-shrink-0">
          最近聊天
        </div>

        <!-- 会话列表 -->
        <el-scrollbar class="flex-1">
          <div
            v-for="conversation in shownConversations"
            :key="getConversationKey(conversation)"
            class="flex gap-2.5 items-center px-3 py-1.5 cursor-pointer hover:bg-[var(--el-fill-color)]"
            @click="handleToggle(conversation)"
          >
            <!-- 圆形单选指示：选中绿底白对勾，未选浅灰圈；纯 div 实现，避开 el-checkbox 方框观感 -->
            <span
              class="flex flex-shrink-0 items-center justify-center w-5 h-5 rounded-full transition-colors"
              :class="
                isSelected(conversation)
                  ? 'bg-[#07c160]'
                  : 'border border-[var(--el-border-color)] bg-[var(--el-bg-color)]'
              "
            >
              <Icon
                v-if="isSelected(conversation)"
                icon="ant-design:check-outlined"
                :size="12"
                color="#fff"
              />
            </span>
            <UserAvatar
              :url="conversation.avatar"
              :name="conversation.name"
              :size="32"
              :clickable="false"
            />
            <span
              class="flex-1 min-w-0 overflow-hidden text-sm truncate text-[var(--el-text-color-primary)]"
            >
              {{ conversation.name }}
            </span>
          </div>
          <div
            v-if="shownConversations.length === 0"
            class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
          >
            {{ keyword ? '没有满足条件的会话' : '暂无会话' }}
          </div>
        </el-scrollbar>
      </div>

      <!-- ============ 右栏：已选 + 名片卡 + 留言 + 按钮 ============ -->
      <div class="flex flex-col flex-1 min-w-0">
        <!-- 标题：单选「发送给」/ 多选「分别发送给」，与底部按钮文案保持一致 -->
        <div
          class="px-4 py-3 text-13px text-[var(--el-text-color-secondary)] flex-shrink-0 border-b border-[var(--el-border-color-lighter)]"
        >
          {{ sendTitle }}
        </div>

        <!-- 已选预览：每行 头像 + 名字 + × 移除 -->
        <el-scrollbar class="flex-1">
          <div
            v-for="conversation in selectedConversations"
            :key="getConversationKey(conversation)"
            class="flex gap-2.5 items-center px-4 py-2"
          >
            <UserAvatar
              :url="conversation.avatar"
              :name="conversation.name"
              :size="28"
              :clickable="false"
            />
            <span
              class="flex-1 min-w-0 overflow-hidden text-13px truncate text-[var(--el-text-color-primary)]"
            >
              {{ conversation.name }}
            </span>
            <Icon
              icon="ant-design:close-outlined"
              :size="14"
              class="im-recommend__remove flex-shrink-0 cursor-pointer"
              @click="handleToggle(conversation)"
            />
          </div>
          <div
            v-if="selectedConversations.length === 0"
            class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
          >
            从左侧选择联系人或群聊
          </div>
        </el-scrollbar>

        <!-- 名片预览卡 + 留言 + 按钮 -->
        <div
          class="flex flex-col gap-3 px-4 py-3 flex-shrink-0 border-t border-[var(--el-border-color-lighter)]"
        >
          <!-- 名片预览：和聊天里的名片气泡同源（浅卡片 + 「个人名片」分隔条） -->
          <div
            class="flex flex-col w-full rounded-md overflow-hidden bg-[var(--el-bg-color)] border border-[var(--el-border-color-lighter)]"
          >
            <div class="flex gap-2.5 items-center px-3 py-2.5">
              <UserAvatar
                :id="user?.id"
                :url="user?.avatar"
                :name="user?.nickname"
                :size="36"
                :clickable="false"
              />
              <div
                class="flex-1 min-w-0 text-sm font-medium truncate text-[var(--el-text-color-primary)]"
              >
                {{ user?.nickname }}
              </div>
            </div>
            <div
              class="px-3 py-1 text-12px border-t text-[var(--el-text-color-placeholder)] border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)]"
            >
              个人名片
            </div>
          </div>

          <!-- 留言（单行）：右侧表情按钮触发 EmojiPicker，所选 emoji 直接拼接到输入末尾 -->
          <div class="relative">
            <el-input v-model="leaveMessage" :maxlength="100" placeholder="给朋友留言">
              <template #suffix>
                <Icon
                  icon="ant-design:smile-outlined"
                  :size="18"
                  class="cursor-pointer text-[var(--el-text-color-secondary)] hover:text-[var(--el-color-primary)]"
                  @click.stop="emojiVisible = !emojiVisible"
                />
              </template>
            </el-input>
            <!-- bottom-full 让 picker 下沿贴 input 顶部，向上弹出；right-0 对齐 input 右侧表情按钮 -->
            <EmojiPicker
              v-model:visible="emojiVisible"
              class="bottom-full right-0 mb-2"
              @select="handleEmojiSelect"
            />
          </div>

          <!-- 操作按钮：选 0/1 显示「发送」、多个显示「分别发送(n)」 -->
          <div class="flex gap-2 justify-end">
            <el-button @click="visible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="sending"
              :disabled="selectedKeys.length === 0"
              @click="handleSend"
            >
              {{ selectedKeys.length > 1 ? `分别发送（${selectedKeys.length}）` : '发送' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import UserAvatar from './UserAvatar.vue'
import EmojiPicker from '../../pages/conversation/components/input/EmojiPicker.vue'
import { useConversationStore } from '../../store/conversationStore'
import { useMessageSender } from '../../composables/useMessageSender'
import { ImConversationType, ImMessageType } from '../../../utils/constants'
import { filterConversationsByKeyword, getConversationKey } from '../../../utils/conversation'
import { serializeMessage, type CardMessage } from '../../../utils/message'
import type { Conversation, User } from '../../types'

defineOptions({ name: 'ImRecommendCardDialog' })

const props = defineProps<{
  modelValue: boolean
  /** 被推荐的用户名片：触发方传入；为 null 时不渲染（弹窗也不应被打开） */
  user: User | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const message = useMessage()
const conversationStore = useConversationStore()
const { sendRaw, send } = useMessageSender()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const keyword = ref('')
const leaveMessage = ref('')
const sending = ref(false)
/** 表情面板显隐：右侧 smile icon 切换 */
const emojiVisible = ref(false)
/** 已勾选的会话 key 列表（type:targetId 组合主键）；selectedSet 派生用于 row 快查 */
const selectedKeys = ref<string[]>([])
/** 已选 key 集合：handlerToggle 写数组，row isSelected 走 set 快查避免 O(N) 扫描 */
const selectedSet = computed(() => new Set(selectedKeys.value))

/** 右栏标题：选中多个时改「分别发送给」与底部按钮文案保持一致 */
const sendTitle = computed(() => (selectedKeys.value.length > 1 ? '分别发送给' : '发送给'))

/** 弹窗打开时复位：el-dialog @open 比 watch 更直观 */
function resetForm() {
  keyword.value = ''
  leaveMessage.value = ''
  selectedKeys.value = []
  emojiVisible.value = false
}

/** 选中 emoji：直接拼到留言末尾；EmojiPicker 自身 emit('update:visible', false) 关闭面板 */
function handleEmojiSelect(emoji: string) {
  leaveMessage.value = `${leaveMessage.value}${emoji}`
}

/** 候选会话：私聊「推荐给本人」过滤掉避免无意义自推 */
const candidateConversations = computed<Conversation[]>(() => {
  const recommendId = props.user?.id
  return conversationStore.getSortedConversations.filter(
    (c) => !(recommendId && c.type === ImConversationType.PRIVATE && c.targetId === recommendId)
  )
})

/** 按搜索关键字过滤展示列表（仅按 name 模糊匹配） */
const shownConversations = computed(() =>
  filterConversationsByKeyword(candidateConversations.value, keyword.value)
)

/** 已选会话：右栏预览渲染用，按 selectedKeys 顺序展示 */
const selectedConversations = computed<Conversation[]>(() => {
  const keys = selectedSet.value
  return candidateConversations.value.filter((c) => keys.has(getConversationKey(c)))
})

/** 是否已选中：圆形指示 + 右栏预览过滤都走它 */
function isSelected(conversation: Conversation): boolean {
  return selectedSet.value.has(getConversationKey(conversation))
}

/** 切换选中态：左栏 row 点击 / 右栏 × 移除都走这里 */
function handleToggle(conversation: Conversation) {
  const key = getConversationKey(conversation)
  const index = selectedKeys.value.indexOf(key)
  if (index >= 0) {
    selectedKeys.value.splice(index, 1)
  } else {
    selectedKeys.value.push(key)
  }
}

/** 构造名片消息 content（JSON 字符串）；user 由调用方 narrow 后显式传入避免 non-null 断言 */
function buildCardContent(user: User): string {
  const payload: CardMessage = {
    userId: user.id!,
    nickname: user.nickname || '',
    avatar: user.avatar
  }
  return serializeMessage(payload)
}

/** 确认发送：每个选中会话先发 CARD 再发 TEXT 留言；失败的消息会以 FAILED 状态留在对应会话气泡里供右键重试 */
async function handleSend() {
  const user = props.user
  if (!user?.id || selectedKeys.value.length === 0) {
    return
  }
  const targets = selectedConversations.value
  const cardContent = buildCardContent(user)
  const leaveText = leaveMessage.value.trim()
  sending.value = true
  try {
    const tasks = targets.map(async (target) => {
      await sendRaw(ImMessageType.CARD, cardContent, { conversation: target })
      if (leaveText) {
        await send(leaveText, { conversation: target })
      }
    })
    await Promise.all(tasks)
    message.success('已转发')
    visible.value = false
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
/* 双栏布局要顶到 dialog 边缘：把 el-dialog body 默认 padding / header 下边距清零，两栏 border 自然分隔 */
.im-recommend-dialog :deep(.el-dialog__body) {
  padding: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}
.im-recommend-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding-bottom: 16px;
}

/* 已选行 × 移除：常驻显示，hover 转危险色 */
.im-recommend__remove {
  color: var(--el-text-color-placeholder);
  transition: color 0.15s;
}
.im-recommend__remove:hover {
  color: var(--el-color-danger);
}
</style>
