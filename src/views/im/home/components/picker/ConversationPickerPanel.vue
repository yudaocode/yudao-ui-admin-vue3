<template>
  <!--
    会话选择面板：用于推荐名片 / 转发消息等"选已有会话"场景
    - 左：搜索 + 最近转发横向头像 + 创建聊天入口 + 最近聊天列表（圆形勾选）
    - 右：已选数标题 + 已选会话列表（按点击顺序）+ footer slot
    - Panel 不带 el-dialog 壳；dialog 由业务壳持有
    - footer slot 渲染在右栏已选列表下方，业务壳放预览卡 / 留言 / 提交按钮
  -->
  <div class="flex h-full">
    <!-- 左栏 -->
    <div
      class="flex flex-col w-[280px] border-r border-r-solid border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]"
    >
      <!-- 搜索框 -->
      <div class="flex-shrink-0 px-3 py-2">
        <el-input v-model="keyword" placeholder="搜索" clearable>
          <template #prefix>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </el-input>
      </div>

      <el-scrollbar class="flex-1">
        <!-- 最近转发横向头像区：keyword 为空 + 有最近转发数据时展示 -->
        <template v-if="showRecentSection">
          <div class="flex justify-between items-center pl-3 pr-2 pb-1.5">
            <span class="text-13px text-[var(--el-text-color-secondary)]">最近转发</span>
            <span
              class="px-1 cursor-pointer text-13px text-[var(--el-color-primary)] hover:opacity-80"
              @click="recentRemoveMode = !recentRemoveMode"
            >
              {{ recentRemoveMode ? '完成' : '移除' }}
            </span>
          </div>
          <div
            class="flex gap-2 pl-3 pr-2 pt-1 pb-2 overflow-x-auto im-conversation-picker__recent"
          >
            <div
              v-for="conversation in recentForwardConversations"
              :key="getConversationKey(conversation)"
              class="flex flex-col flex-shrink-0 gap-1 items-center"
              :class="{ 'cursor-pointer': !recentRemoveMode }"
              @click="handleRecentTileClick(conversation)"
            >
              <div class="relative">
                <GroupAvatar
                  v-if="conversation.type === ImConversationType.GROUP"
                  :group-id="conversation.targetId"
                  :url="conversation.avatar"
                  :name="conversation.name"
                  :size="36"
                />
                <UserAvatar
                  v-else
                  :url="conversation.avatar"
                  :name="conversation.name"
                  :size="36"
                  :clickable="false"
                />
                <!-- 移除模式：右上角 × 圆角标，点击把这条 key 从 recentForwardConversationKeys 删掉 -->
                <span
                  v-if="recentRemoveMode"
                  class="flex absolute -top-1 -right-1 justify-center items-center w-4 h-4 rounded-full cursor-pointer bg-[var(--el-fill-color-dark)] text-[var(--el-text-color-primary)]"
                  @click.stop="emit('remove-recent', getConversationKey(conversation))"
                >
                  <Icon icon="ant-design:close-outlined" :size="10" />
                </span>
                <!-- 非移除模式：右上角圆形勾选指示器；未选灰空心圈、选中绿底白对勾 -->
                <span
                  v-else
                  class="flex absolute -top-1 -right-1 justify-center items-center w-4 h-4 rounded-full transition-colors"
                  :class="
                    isSelected(conversation)
                      ? 'bg-[#07c160] border border-solid border-[#07c160]'
                      : 'border border-solid border-[var(--el-border-color)] bg-[var(--el-bg-color)]'
                  "
                >
                  <Icon
                    v-if="isSelected(conversation)"
                    icon="ant-design:check-outlined"
                    :size="10"
                    color="#fff"
                  />
                </span>
              </div>
              <span
                class="overflow-hidden max-w-[48px] text-12px truncate text-[var(--el-text-color-primary)]"
              >
                {{ conversation.name }}
              </span>
            </div>
          </div>
        </template>

        <!-- 创建聊天入口：keyword 为空 + showCreateChat=true 时展示 -->
        <div
          v-if="showCreateChat && !keyword.trim()"
          class="flex gap-2.5 items-center px-3 py-1.5 cursor-pointer hover:bg-[var(--el-fill-color)]"
          @click="emit('create-chat')"
        >
          <span
            class="flex flex-shrink-0 justify-center items-center w-8 h-8 rounded-full bg-[var(--el-fill-color)] text-[var(--el-text-color-secondary)]"
          >
            <Icon icon="ant-design:plus-outlined" :size="16" />
          </span>
          <span class="text-sm text-[var(--el-text-color-primary)]">创建聊天</span>
        </div>

        <!-- 最近聊天分组标题 -->
        <div class="px-3 pb-1.5 text-13px text-[var(--el-text-color-secondary)]">最近聊天</div>

        <!-- 会话列表 -->
        <div
          v-for="conversation in shownConversations"
          :key="getConversationKey(conversation)"
          class="flex gap-2.5 items-center px-3 py-1.5 cursor-pointer hover:bg-[var(--el-fill-color)]"
          @click="handleToggle(conversation)"
        >
          <!-- 圆形勾选指示器：未选灰色空心圆，选中实心微信绿 + 白对勾 -->
          <span
            class="flex flex-shrink-0 justify-center items-center w-5 h-5 rounded-full transition-colors"
            :class="
              isSelected(conversation)
                ? 'bg-[#07c160] border border-solid border-[#07c160]'
                : 'border border-solid border-[var(--el-border-color)] bg-[var(--el-bg-color)]'
            "
          >
            <Icon
              v-if="isSelected(conversation)"
              icon="ant-design:check-outlined"
              :size="12"
              color="#fff"
            />
          </span>
          <GroupAvatar
            v-if="conversation.type === ImConversationType.GROUP"
            :group-id="conversation.targetId"
            :url="conversation.avatar"
            :name="conversation.name"
            :size="32"
          />
          <UserAvatar
            v-else
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

        <!-- 空态 -->
        <div
          v-if="shownConversations.length === 0"
          class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
        >
          {{ keyword ? '没有满足条件的会话' : '暂无会话' }}
        </div>
      </el-scrollbar>
    </div>

    <!-- 右栏 -->
    <div class="flex flex-col flex-1 min-w-0">
      <!-- 标题：选 0/1「发送给」、多个「分别发送给」（与微信文案一致） -->
      <div
        class="flex-shrink-0 px-4 py-3 border-b border-b-solid text-13px text-[var(--el-text-color-secondary)] border-[var(--el-border-color-lighter)]"
      >
        {{ sendTitle }}
      </div>

      <!-- 已选预览：按 selectedKeys 数组顺序（点击顺序）展示 -->
      <el-scrollbar class="flex-1">
        <div
          v-for="conversation in selectedConversations"
          :key="getConversationKey(conversation)"
          class="flex gap-2.5 items-center px-4 py-2"
        >
          <GroupAvatar
            v-if="conversation.type === ImConversationType.GROUP"
            :group-id="conversation.targetId"
            :url="conversation.avatar"
            :name="conversation.name"
            :size="32"
          />
          <UserAvatar
            v-else
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
          <Icon
            icon="ant-design:close-outlined"
            :size="14"
            class="flex-shrink-0 cursor-pointer transition-colors text-[var(--el-text-color-placeholder)] hover:text-[var(--el-color-danger)]"
            @click="handleToggle(conversation)"
          />
        </div>
        <div
          v-if="selectedConversations.length === 0"
          class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
        >
          从左侧选择好友或群聊
        </div>
      </el-scrollbar>

      <!-- 业务壳塞预览卡 / 留言 / 提交按钮的位置 -->
      <div
        v-if="$slots.footer"
        class="flex-shrink-0 border-t border-t-solid border-[var(--el-border-color-lighter)]"
      >
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import UserAvatar from '../user/UserAvatar.vue'
import GroupAvatar from '../group/GroupAvatar.vue'
import { filterConversationsByKeyword, getConversationKey } from '../../../utils/conversation'
import { ImConversationType } from '../../../utils/constants'
import type { Conversation } from '../../types'

defineOptions({ name: 'ImConversationPickerPanel' })

const props = withDefaults(
  defineProps<{
    /** 全量会话列表 */
    conversations: Conversation[]
    /** 已选会话 key（v-model）；key 由 getConversationKey 生成 */
    selectedKeys: string[]
    /** 最近转发会话 key 列表；展示在左栏顶部横向头像区 */
    recentForwardConversationKeys?: string[]
    /** 隐藏 key：从候选 / 已选 / 最近转发里都剔除（不能转发回自己、推荐名片自身的会话等） */
    hideKeys?: string[]
    /** 已选数上限；不传或 <=0 时不限 */
    maxSize?: number
    /** 是否展示「创建聊天」入口 */
    showCreateChat?: boolean
  }>(),
  {
    recentForwardConversationKeys: () => [],
    hideKeys: () => [],
    maxSize: 0,
    showCreateChat: false
  }
)

const emit = defineEmits<{
  'update:selectedKeys': [value: string[]]
  'create-chat': []
  /** 用户在「最近转发」段进入移除模式后点 ×；业务壳收到后调 conversationStore.removeRecentForwardConversationKey 落盘 */
  'remove-recent': [key: string]
}>()

const message = useMessage()

const keyword = ref('')
/** 「最近转发」段是否处于移除模式：true 时头像右上角变 × 不再切勾选 */
const recentRemoveMode = ref(false)

/** 全量会话的 key→Conversation 映射，已选 / 最近转发反查共用，避免每次 O(N) 扫 */
const byKey = computed(() => {
  const map = new Map<string, Conversation>()
  for (const conversation of props.conversations) {
    map.set(getConversationKey(conversation), conversation)
  }
  return map
})

/** 隐藏集合：每次过滤复用 */
const hideSet = computed(() => new Set(props.hideKeys))

/** 已选集合：圆形指示器 isSelected 走 set 快查 */
const selectedSet = computed(() => new Set(props.selectedKeys))

/** 候选会话：剔除 hideKeys */
const candidateConversations = computed(() =>
  props.conversations.filter((c) => !hideSet.value.has(getConversationKey(c)))
)

/** 左栏展示列表：在候选基础上按 keyword 过滤 */
const shownConversations = computed(() =>
  filterConversationsByKeyword(candidateConversations.value, keyword.value)
)

/** 最近转发的会话对象列表：从 recentForwardConversationKeys 反查；剔除 hide / 不存在的 key */
const recentForwardConversations = computed(() =>
  props.recentForwardConversationKeys
    .map((key) => byKey.value.get(key))
    .filter((c): c is Conversation => c != null && !hideSet.value.has(getConversationKey(c)))
)

/** 是否展示「最近转发」段：keyword 为空 + 有数据时才展示，搜索时让位 */
const showRecentSection = computed(
  () => !keyword.value.trim() && recentForwardConversations.value.length > 0
)

/** 已选会话列表：按 selectedKeys 数组顺序（即点击顺序）反查；过滤 hideSet 避免父组件动态隐藏的会话仍在右侧渲染 / 提交 */
const selectedConversations = computed(() =>
  props.selectedKeys
    .map((key) => byKey.value.get(key))
    .filter(
      (conversation): conversation is Conversation =>
        conversation != null && !hideSet.value.has(getConversationKey(conversation))
    )
)

/** 右栏标题文案：单选「发送给」、多选「分别发送给」 */
const sendTitle = computed(() => (props.selectedKeys.length > 1 ? '分别发送给' : '发送给'))

/** 是否已选中：左栏圆形指示器 / 最近转发头像角标共用 */
function isSelected(conversation: Conversation): boolean {
  return selectedSet.value.has(getConversationKey(conversation))
}

/** 「最近转发」头像点击：移除模式下不切勾选（移除由 × 角标处理） */
function handleRecentTileClick(conversation: Conversation) {
  if (recentRemoveMode.value) {
    return
  }
  handleToggle(conversation)
}

/** 切换选中态：左栏 row / 最近转发头像 / 右栏 × 移除都走这里 */
function handleToggle(conversation: Conversation) {
  const key = getConversationKey(conversation)
  const next = [...props.selectedKeys]
  const index = next.indexOf(key)
  if (index >= 0) {
    next.splice(index, 1)
  } else {
    // 父组件标记隐藏的会话即便有路径触达也不应入选
    if (hideSet.value.has(key)) {
      return
    }
    if (props.maxSize > 0 && next.length >= props.maxSize) {
      message.error(`最多选择 ${props.maxSize} 个会话`)
      return
    }
    next.push(key)
  }
  emit('update:selectedKeys', next)
}
</script>

<style scoped>
/* 横向滚动条做窄一点避免占视觉；走 ::-webkit-scrollbar 浏览器伪元素 */
.im-conversation-picker__recent::-webkit-scrollbar {
  height: 4px;
}

.im-conversation-picker__recent::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 2px;
}
</style>
