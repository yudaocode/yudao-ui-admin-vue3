<template>
  <!--
    历史消息弹窗（对齐微信 PC）
    - 居中 dialog，title "与「X」聊天记录" / "「X 群」聊天记录(N)"
    - 默认无筛选，全量倒序展示；点击 tab 落筛选 → 搜索框左侧出 chip × 可清
    - 文件 / 图片 / 链接：直接落筛选；日期 / 群成员：弹 popover 二次选择再落
    - "加载更早消息"：列表底部按钮，点击调 /im/message/{private,group}/list 拿一页 + prepend
  -->
  <el-dialog
    v-model="visible"
    :title="title"
    width="640px"
    append-to-body
    class="im-message-history__dialog"
    @open="onDialogOpen"
  >
    <div class="flex flex-col gap-3 h-[520px]">
      <!-- 搜索区：activeFilter 存在时左侧出 chip × 可清，否则纯搜索框 -->
      <div
        class="im-message-history__searchbar flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--el-fill-color-light)]"
      >
        <el-tag
          v-if="activeFilter"
          closable
          size="small"
          round
          class="im-message-history__chip flex-shrink-0"
          @close="clearFilter"
        >
          {{ filterChipLabel }}
        </el-tag>
        <Icon
          v-else
          icon="ant-design:search-outlined"
          class="text-[var(--el-text-color-secondary)]"
        />
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索"
          class="im-message-history__search-input flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-[var(--el-text-color-primary)]"
        />
      </div>

      <!-- Tab 行：文件 / 图片 / 语音 / 日期(popover) / 群成员(popover, 仅群聊)；底部一条分割线把 tab 区跟消息列表分开，对齐微信观感 -->
      <div
        class="flex gap-5 px-2 pb-2 text-sm flex-shrink-0 text-[#1989fa] border-b border-b-solid border-[var(--el-border-color-lighter)]"
      >
        <span
          class="im-message-history__tab cursor-pointer"
          :class="{ 'im-message-history__tab--active': activeFilter?.kind === 'file' }"
          @click="setFilter({ kind: 'file' })"
        >
          文件
        </span>
        <span
          class="im-message-history__tab cursor-pointer"
          :class="{ 'im-message-history__tab--active': activeFilter?.kind === 'image' }"
          @click="setFilter({ kind: 'image' })"
        >
          图片
        </span>
        <span
          class="im-message-history__tab cursor-pointer"
          :class="{ 'im-message-history__tab--active': activeFilter?.kind === 'voice' }"
          @click="setFilter({ kind: 'voice' })"
        >
          语音
        </span>
        <!-- 日期：el-popover 包 el-calendar，确认后才落筛选 -->
        <el-popover
          v-model:visible="datePopoverVisible"
          trigger="click"
          placement="bottom"
          :width="320"
        >
          <template #reference>
            <span
              class="im-message-history__tab cursor-pointer"
              :class="{ 'im-message-history__tab--active': activeFilter?.kind === 'date' }"
            >
              日期
            </span>
          </template>
          <div class="im-message-history__date-panel">
            <div class="px-2 pt-1 pb-2 text-13px font-medium text-[var(--el-text-color-primary)]">
              选择发送日期
            </div>
            <el-calendar v-model="datePickerValue" class="im-message-history__calendar" />
            <div class="flex gap-2 justify-end px-2 pt-2">
              <el-button size="small" @click="datePopoverVisible = false">取消</el-button>
              <el-button size="small" type="primary" @click="onDateConfirm">确定</el-button>
            </div>
          </div>
        </el-popover>
        <!-- 群成员：仅群聊；popover 内自带搜索 + GroupMember 列表 -->
        <el-popover
          v-if="isGroup"
          v-model:visible="memberPopoverVisible"
          trigger="click"
          placement="bottom"
          :width="320"
        >
          <template #reference>
            <span
              class="im-message-history__tab cursor-pointer"
              :class="{ 'im-message-history__tab--active': activeFilter?.kind === 'member' }"
            >
              群成员
            </span>
          </template>
          <div>
            <el-input v-model="memberSearchKeyword" placeholder="搜索群成员" size="small">
              <template #prefix>
                <Icon icon="ant-design:search-outlined" />
              </template>
            </el-input>
            <div class="max-h-[360px] overflow-y-auto mt-2">
              <GroupMember
                v-for="member in filteredMembersForPicker"
                :key="member.userId"
                :member="member"
                :height="44"
                :clickable="false"
                class="cursor-pointer hover:bg-[var(--el-fill-color)]"
                @click="onMemberSelect(member)"
              />
              <div
                v-if="filteredMembersForPicker.length === 0"
                class="py-6 text-12px text-center text-[var(--el-text-color-disabled)]"
              >
                没有匹配的成员
              </div>
            </div>
          </div>
        </el-popover>
      </div>

      <!-- 消息列表 -->
      <div class="flex-1 overflow-y-auto">
        <template v-for="message in currentList" :key="message.id || message.clientMessageId">
          <!-- 好友会话事件（FRIEND_ADD / FRIEND_DELETE）：居中灰色，不挂头像 / sender，
               跟主聊天面板里 MessageItem 的渲染语义对齐 -->
          <div
            v-if="isFriendChatTip(message.type)"
            class="px-4 py-3 text-12px text-center italic text-[var(--el-text-color-secondary)] border-b border-b-solid border-[var(--el-border-color-lighter)]"
          >
            <TipSegments :segments="resolveFriendNotificationSegments(message)" />
          </div>

          <!-- 群广播事件：跟好友事件同灰色样式，mention 段挂点击弹 UserInfoCard -->
          <div
            v-else-if="isGroupNotification(message.type)"
            class="px-4 py-3 text-12px text-center italic text-[var(--el-text-color-secondary)] border-b border-b-solid border-[var(--el-border-color-lighter)]"
          >
            <TipSegments
              :segments="resolveGroupNotificationSegments(message, resolveGroupMemberName(message))"
            />
          </div>

          <!-- 普通消息行 -->
          <div
            v-else
            class="im-message-history__row flex gap-3 items-start px-1 py-3 border-b border-b-solid border-[var(--el-border-color-lighter)]"
          >
            <UserAvatar
              :url="getAvatar(message)"
              :name="senderRealNicknameOf(message)"
              :size="36"
              :clickable="false"
            />
            <div class="flex-1 min-w-0">
              <div
                class="flex justify-between items-start text-12px text-[var(--el-text-color-secondary)]"
              >
                <span class="font-medium text-[var(--el-text-color-regular)]">
                  {{ senderDisplayNameOf(message) }}
                </span>
                <span class="im-message-history__meta relative flex-shrink-0">
                  <span class="block text-right">{{ formatHistoryTime(message.sendTime) }}</span>
                  <!-- 定位到聊天位置：absolute 浮在时间下方，行 hover 才显示，
                       不参与右侧栏 flex 排版（避免隐藏时占位让"我"和内容之间留空）；
                       仅有真实 id 的消息才支持（本地占位消息不行） -->
                  <span
                    v-if="message.id && message.id > 0"
                    class="im-message-history__locate"
                    @click="locateMessage(message.id!)"
                  >
                    定位到聊天位置
                  </span>
                </span>
              </div>

              <div class="mt-1.5">
                <!-- 撤回：单独走灰色 tip，sender 名段可点击 -->
                <div
                  v-if="message.type === ImContentType.RECALL"
                  class="text-sm italic text-[var(--el-text-color-secondary)]"
                >
                  <TipSegments :segments="recallTipSegmentsOf(message)" />
                </div>
                <!-- 其它类型走 MessageBubble 复用主聊天气泡 -->
                <MessageBubble
                  v-else
                  :type="message.type"
                  :content="message.content"
                  @open-merge="openMergeDetail?.($event)"
                />
              </div>
            </div>
          </div>
        </template>

        <div
          v-if="currentList.length === 0"
          class="py-10 text-center text-13px text-[var(--el-text-color-disabled)]"
        >
          {{ keyword || activeFilter ? '没有匹配的消息' : '暂无消息' }}
        </div>

        <!-- 加载更早消息：列表底部 trigger（reverse 后最早的在最下，按钮放底部更自然）；
             filter 命中 0 条时仍保留 —— 加载更早可能带回匹配内容 -->
        <div
          v-if="hasMore && allMessages.length > 0"
          class="py-3 text-center border-t border-t-solid border-[var(--el-border-color-lighter)]"
        >
          <el-button :loading="loadingMore" link type="primary" @click="loadEarlier">
            加载更早消息
          </el-button>
        </div>
        <!-- "没有更早" 只在已有匹配项时露出，避免和上面"没有匹配的消息"空态文案重叠 -->
        <div
          v-else-if="!hasMore && currentList.length > 0"
          class="py-3 text-12px text-center text-[var(--el-text-color-disabled)]"
        >
          没有更早的消息了
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { formatHistoryTime } from '@/views/im/utils/time'

import Icon from '@/components/Icon/src/Icon.vue'
import { useUserStore } from '@/store/modules/user'
import { getPrivateMessageList as apiGetPrivateMessageList } from '@/api/im/message/private'
import { getGroupMessageList as apiGetGroupMessageList } from '@/api/im/message/group'
import { useConversationStore } from '../../../../store/conversationStore'
import { useMessageStore } from '../../../../store/messageStore'
import { useGroupStore } from '../../../../store/groupStore'
import { useFriendStore } from '../../../../store/friendStore'
import { IM_MERGE_DETAIL_DIALOG_KEY } from './forward/keys'
import {
  getMemberDisplayName,
  getSenderDisplayName,
  getSenderRealNickname
} from '@/views/im/utils/user'
import {
  resolveFriendNotificationSegments,
  resolveFriendNotificationText,
  resolveGroupNotificationSegments
} from '@/views/im/utils/message'
import {
  buildFacePreviewText,
  buildRecallTip,
  buildRecallTipSegments,
  getConversationKey
} from '@/views/im/utils/conversation'
import { useMessagePuller } from '@/views/im/home/composables/useMessagePuller'
import { useVoicePlayer } from '@/views/im/home/composables/useVoicePlayer'
import {
  ImConversationType,
  ImContentType,
  isFriendChatTip,
  isGroupNotification
} from '@/views/im/utils/constants'
import {
  parseMessage,
  getCardLabelInfo,
  type TextMessage,
  type FileMessage,
  type CardMessage,
  type FaceMessage,
  type MergeMessage
} from '@/views/im/utils/message'
import type { Message } from '@/views/im/home/types'
import { getClientConversationId } from '@/views/im/utils/db'
import UserAvatar from '../../../../components/user/UserAvatar.vue'
import MessageBubble from './MessageBubble.vue'
import GroupMember, { type GroupMemberLite } from '../../../../components/group/GroupMember.vue'
import TipSegments from './TipSegments.vue'

defineOptions({ name: 'ImMessageHistory' })

const emit = defineEmits<{
  // 历史消息行上的"定位"按钮：通知父组件 MessagePanel 滚到对应消息位置 + 关掉自己
  locate: [messageId: number]
}>()

const userStore = useUserStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const groupStore = useGroupStore()
const friendStore = useFriendStore()
const openMergeDetail = inject(IM_MERGE_DETAIL_DIALOG_KEY)
const voicePlayer = useVoicePlayer()
const { convertPrivateMessage, convertGroupMessage } = useMessagePuller()

const visible = ref(false)

defineExpose({
  /** 打开历史消息抽屉 */
  open() {
    visible.value = true
  }
})

const conversation = computed(() => conversationStore.activeConversation)
const isGroup = computed(() => conversation.value?.type === ImConversationType.GROUP)
const allMessages = computed<Message[]>(() =>
  conversation.value
    ? messageStore.getMessages(
        getClientConversationId(conversation.value.type, conversation.value.targetId)
      )
    : []
)

/** 单条消息的发送人显示名：渲染时按 conversation 上下文走 WeChat 优先级实时算 */
function senderDisplayNameOf(message: Message): string {
  return getSenderDisplayName(
    message.senderId,
    conversation.value?.type ?? 0,
    conversation.value?.targetId ?? 0
  )
}

/** 群广播事件 segments 的成员名解析器；按当前会话 targetId 走 getSenderDisplayName */
function resolveGroupMemberName(message: Message): (userId: number) => string {
  return (id: number) => getSenderDisplayName(id, ImConversationType.GROUP, message.targetId ?? 0)
}

/** 单条消息的发送人真实昵称：给 UserAvatar 色卡 / alt 用，永远是 nickname 不掺备注 */
function senderRealNicknameOf(message: Message): string {
  return getSenderRealNickname(
    message.senderId,
    conversation.value?.type ?? 0,
    conversation.value?.targetId ?? 0
  )
}

/** 单条撤回消息的 tip 文案：buildRecallTip 内部按 conversation 上下文实时算 sender 名 */
function recallTipOf(message: Message): string {
  return buildRecallTip(
    message.senderId,
    message.selfSend,
    conversation.value?.type ?? 0,
    conversation.value?.targetId ?? 0
  )
}

/** 单条撤回消息的 tip segments：sender 名段挂可点击 mention */
function recallTipSegmentsOf(message: Message) {
  return buildRecallTipSegments(
    message.senderId,
    message.selfSend,
    conversation.value?.type ?? 0,
    conversation.value?.targetId ?? 0
  )
}

// ==================== 标题 ====================

/**
 * 弹窗标题：参考微信 PC
 * - 私聊：与"X"的聊天记录
 * - 群聊："X 群"的聊天记录(N)
 */
const title = computed(() => {
  if (!conversation.value) {
    return '聊天记录'
  }
  const name = conversation.value.name
  if (isGroup.value) {
    return `"${name}"的聊天记录(${allMessages.value.length})`
  }
  return `与"${name}"的聊天记录`
})

// ==================== 搜索 + 筛选 chip ====================

/** 当前激活的筛选条件 —— 单 chip 模式（同时只 1 个），点击 tab 落新值，× 清空 */
type ActiveFilter =
  | { kind: 'file' }
  | { kind: 'image' }
  | { kind: 'voice' }
  | { kind: 'date'; day: string } // YYYY-MM-DD
  | { kind: 'member'; userId: number; nickname: string }

const keyword = ref('')
const activeFilter = ref<ActiveFilter | null>(null)

/** chip 文案：日期 / 群成员 多带值，其他直接 tab 名 */
const filterChipLabel = computed(() => {
  if (!activeFilter.value) {
    return ''
  }
  switch (activeFilter.value.kind) {
    case 'file':
      return '文件'
    case 'image':
      return '图片'
    case 'voice':
      return '语音'
    case 'date':
      return `日期：${activeFilter.value.day}`
    case 'member':
      return `@${activeFilter.value.nickname}`
    default:
      return ''
  }
})

/** 点 tab 落筛选；同 kind 重复点击 → 当 toggle 关掉（避免迷惑） */
function setFilter(filter: ActiveFilter) {
  if (
    activeFilter.value?.kind === filter.kind &&
    filter.kind !== 'date' &&
    filter.kind !== 'member'
  ) {
    activeFilter.value = null
    return
  }
  activeFilter.value = filter
}

/** chip × 关闭 / 重置 */
function clearFilter() {
  activeFilter.value = null
}

// ==================== 日期 popover ====================

const datePopoverVisible = ref(false)
const datePickerValue = ref<Date>(new Date())

/** 日期 popover 确定：把 Date → YYYY-MM-DD 落到 activeFilter，关 popover */
function onDateConfirm() {
  if (!datePickerValue.value) {
    datePopoverVisible.value = false
    return
  }
  const day = dayjs(datePickerValue.value).format('YYYY-MM-DD')
  activeFilter.value = { kind: 'date', day }
  datePopoverVisible.value = false
}

// ==================== 群成员 popover ====================

const memberPopoverVisible = ref(false)
const memberSearchKeyword = ref('')

/** 群成员 picker 列表：从 groupStore 拉 + 适配 GroupMemberLite + 关键字过滤 */
const filteredMembersForPicker = computed<GroupMemberLite[]>(() => {
  if (!isGroup.value || !conversation.value) {
    return []
  }
  const group = groupStore.getGroup(conversation.value.targetId)
  const all = (group?.members || []).map((member) => {
    const friend = friendStore.getFriend(member.userId)
    return {
      userId: member.userId,
      showName: getMemberDisplayName(member, friend),
      nickname: member.nickname,
      avatar: member.avatar,
      status: member.status
    }
  })
  const trimmedKeyword = memberSearchKeyword.value.trim()
  if (!trimmedKeyword) {
    return all
  }
  return all.filter((member) => member.showName.includes(trimmedKeyword))
})

/** 群成员 picker 选择：落 activeFilter + 关 popover + 清搜索词 */
function onMemberSelect(member: GroupMemberLite) {
  activeFilter.value = {
    kind: 'member',
    userId: member.userId,
    nickname: member.showName
  }
  memberPopoverVisible.value = false
  memberSearchKeyword.value = ''
}

// ==================== 列表过滤 ====================

/** activeFilter 命中：默认无筛选时全部命中 */
function matchesActiveFilter(message: Message): boolean {
  if (!activeFilter.value) {
    return true
  }
  switch (activeFilter.value.kind) {
    case 'file':
      return message.type === ImContentType.FILE
    case 'image':
      return message.type === ImContentType.IMAGE
    case 'voice':
      return message.type === ImContentType.VOICE
    case 'date':
      return dayjs(message.sendTime).format('YYYY-MM-DD') === activeFilter.value.day
    case 'member':
      return message.senderId === activeFilter.value.userId
    default:
      return true
  }
}

/**
 * 当前列表：先 activeFilter 过滤、再 keyword 模糊命中、最后 reverse（最新在前）
 *
 * 关键字命中走 textSnippetOf —— 文本拿原文、媒体拿"[图片]"等占位词、文件拿文件名
 */
const currentList = computed<Message[]>(() => {
  const trimmedKeyword = keyword.value.trim()
  let list = allMessages.value.filter(matchesActiveFilter)
  if (trimmedKeyword) {
    list = list.filter((message) => textSnippetOf(message).includes(trimmedKeyword))
  }
  return list.slice().reverse()
})

// ==================== 加载更早消息 ====================

const HISTORY_PAGE_SIZE = 50
const loadingMore = ref(false)
const hasMore = ref(true)

/**
 * 加载更早消息：拿当前最早一条 id 作 maxId（不含），调 list 接口拉一页 + convert + prepend
 *
 * - 未对接 list 接口的 type / keyword / sender 过滤参数：后端只支持 maxId + limit 游标分页，
 *   tab 筛选在前端做（数据来回到本地后过滤）
 * - 本地占位跳过：后端没法按 messageId 查
 * - 返回数量 < limit 视为到顶
 */
async function loadEarlier() {
  // 重入 / 到顶 / 无会话 早退：避免重复请求或在 conversation 切换间隙触发
  if (loadingMore.value || !hasMore.value || !conversation.value) {
    return
  }
  // 仅 PRIVATE / GROUP 走分页接口；CHANNEL 单向广播、没有 list 接口，落到 else 会误调私聊接口（receiverId 传 channelId）
  const requestedType = conversation.value.type
  if (requestedType !== ImConversationType.PRIVATE && requestedType !== ImConversationType.GROUP) {
    return
  }
  // 快照当前会话主键：await 期间用户切走 / 关闭面板时丢弃响应，避免旧会话历史被 prepend 到新会话造成串号
  const requestedKey = getConversationKey(conversation.value)
  const requestedTargetId = conversation.value.targetId
  const requestedIsGroup = requestedType === ImConversationType.GROUP

  loadingMore.value = true
  try {
    // 算 maxId（不含，作为后端游标）：取当前会话本地缓存里最早一条服务端 id；
    // 本地乐观占位消息没有服务端 id，要剔除
    // 全是占位 / 列表为空时 reduce 不更新初值（POSITIVE_INFINITY），转成 undefined → 后端从最新拉
    const earliestId = allMessages.value
      .filter((message) => !!message.id && message.id > 0)
      .reduce((min, message) => Math.min(min, message.id || min), Number.POSITIVE_INFINITY)
    const maxId = Number.isFinite(earliestId) ? earliestId : undefined

    // 调后端 list 接口：私聊 / 群聊接口签名不同，分支调度；返回结果用 useMessagePuller
    // 暴露的 convert 函数转成本地 Message（与 puller 同一份字段映射，避免分歧）
    let earlier: Message[] = []
    let pageLength = 0
    if (requestedIsGroup) {
      const list = await apiGetGroupMessageList({
        groupId: requestedTargetId,
        maxId,
        limit: HISTORY_PAGE_SIZE
      })
      earlier = (list || []).map(convertGroupMessage)
      pageLength = list?.length ?? 0
    } else {
      const list = await apiGetPrivateMessageList({
        receiverId: requestedTargetId,
        maxId,
        limit: HISTORY_PAGE_SIZE
      })
      earlier = (list || []).map(convertPrivateMessage)
      pageLength = list?.length ?? 0
    }

    // await 期间 active 可能被外部置 null / 换主键：直接丢弃响应；不更新 hasMore（旧会话到顶不代表新会话到顶）也不 prepend
    if (!conversation.value || getConversationKey(conversation.value) !== requestedKey) {
      return
    }

    // 返回数量 < limit 视为到顶 —— 关闭"加载更早"按钮，避免后续点击空跑接口
    if (pageLength < HISTORY_PAGE_SIZE) {
      hasMore.value = false
    }
    // 合并到 messageStore：prependMessageList 内部去重 + 升序合并 + 落 IndexedDB；
    // 主聊天面板的 messages 是同一份引用，老消息也会一起出现在主面板里（符合预期）
    messageStore.prependMessageList(requestedType, requestedTargetId, earlier)
  } finally {
    loadingMore.value = false
  }
}

// ==================== 弹窗打开 reset ====================

/** 弹窗打开时把上次的 chip / 搜索 / 加载状态都清干净，避免上次的状态残留迷惑 */
function onDialogOpen() {
  activeFilter.value = null
  keyword.value = ''
  hasMore.value = true
  datePopoverVisible.value = false
  memberPopoverVisible.value = false
  memberSearchKeyword.value = ''
  datePickerValue.value = new Date()
  // 本地无消息时立即拉一次（maxId=undefined 从最新开始），避免新设备 / 缓存清后弹窗只显示"暂无消息"
  if (allMessages.value.length === 0 && hasMore.value && conversation.value) {
    void loadEarlier()
  }
}

/** 抽屉关闭时复位 + 停语音 */
watch(visible, (value) => {
  if (!value) {
    activeFilter.value = null
    keyword.value = ''
    voicePlayer.stop()
  }
})

/**
 * 抽屉开着时外部切了 active conversation：dialog 的 title / 列表 / isGroup 全部跟着新 conversation 走，
 * 这里把分页态一并重置；否则旧会话残留的 loadingMore=true / hasMore=false 会让新会话"加载更早"按钮失效
 */
watch(conversation, () => {
  loadingMore.value = false
  hasMore.value = true
})

// ==================== helper ====================

/** 取头像 url：自己用 userStore，群里查 groupStore 成员，私聊用 conversation.avatar */
function getAvatar(message: Message): string {
  if (message.selfSend) {
    return userStore.getUser?.avatar || ''
  }
  if (!conversation.value) {
    return ''
  }
  if (isGroup.value) {
    const group = groupStore.getGroup(conversation.value.targetId)
    return group?.members?.find((member) => member.userId === message.senderId)?.avatar || ''
  }
  return conversation.value.avatar || ''
}

/** 关键字命中文本：文本类返回原文、文件返回文件名（利于按文件名搜）、其他返回占位词 */
function textSnippetOf(message: Message): string {
  if (isFriendChatTip(message.type)) {
    return resolveFriendNotificationText(message)
  }
  switch (message.type) {
    case ImContentType.TEXT:
      return parseMessage<TextMessage>(message.content)?.content ?? ''
    case ImContentType.IMAGE:
      return '[图片]'
    case ImContentType.FILE:
      return parseMessage<FileMessage>(message.content)?.name ?? '[文件]'
    case ImContentType.VOICE:
      return '[语音]'
    case ImContentType.VIDEO:
      return '[视频]'
    case ImContentType.CARD: {
      const card = parseMessage<CardMessage>(message.content)
      return `[${getCardLabelInfo(card).label}] ${card?.name ?? ''}`
    }
    case ImContentType.FACE:
      return buildFacePreviewText(parseMessage<FaceMessage>(message.content))
    case ImContentType.MERGE: {
      const merge = parseMessage<MergeMessage>(message.content)
      return merge?.title ?? '[聊天记录]'
    }
    case ImContentType.RECALL:
      return recallTipOf(message)
    default:
      return ''
  }
}

/**
 * 定位到聊天位置：emit 给 MessagePanel 走 scrollIntoView + 短暂高亮，再关掉自己
 * messageId === 0（本地占位消息）跳过——还没拿到真实 id，DOM 上没法 querySelector
 */
function locateMessage(messageId: number) {
  if (!messageId) {
    return
  }
  emit('locate', messageId)
  visible.value = false
}
</script>

<style scoped>
/* :deep 穿透 el-tag 子组件 DOM；搜索区 chip 禁掉 hover 颜色过渡 / × 图标动效，避免在搜索区里有抖动感 */
.im-message-history__chip,
.im-message-history__chip :deep(.el-tag__close) {
  animation: none !important;
  transition: none !important;
}

/* 「定位到聊天位置」按钮：父行 hover 才显示，走 .parent:hover .child 跨元素状态联动 */
.im-message-history__locate {
  position: absolute;
  top: 100%;
  right: 0;
  display: none;
  margin-top: 4px;
  color: #1989fa;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s;
}

.im-message-history__row:hover .im-message-history__locate {
  display: block;
}

.im-message-history__locate:hover {
  color: #146fc7;
}

/* ::after 伪元素画激活下划线；tab 默认蓝色行内文字，激活态加下划线 */
.im-message-history__tab {
  position: relative;
  padding: 4px 2px;
  color: #1989fa;
  transition: color 0.15s;
}

.im-message-history__tab:hover {
  color: #2f81d4;
}

.im-message-history__tab--active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: #1989fa;
  border-radius: 1px;
  content: '';
}

/* :deep 穿透 el-calendar 子组件 DOM；默认偏大压一压让它能塞进 320 popover */
.im-message-history__calendar :deep(.el-calendar) {
  --el-calendar-cell-width: 36px;
}

.im-message-history__calendar :deep(.el-calendar__header) {
  padding: 4px 8px;
}

.im-message-history__calendar :deep(.el-calendar-table) {
  font-size: 12px;
}

.im-message-history__calendar :deep(.el-calendar-day) {
  height: 36px;
  padding: 4px;
}
</style>
