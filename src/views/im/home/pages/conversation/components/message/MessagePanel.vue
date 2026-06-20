<template>
  <div class="flex flex-1 flex-col min-w-0 bg-[var(--el-fill-color-light)]">
    <template v-if="conversationStore.activeConversation">
      <!-- 顶部 header：第一行群名 + 右侧图标，第二行嵌入置顶气泡（仅群聊 + 有置顶） -->
      <div
        class="flex flex-shrink-0 flex-col bg-[var(--el-fill-color-light)] border-b border-b-solid border-[var(--el-border-color-light)]"
      >
        <div class="flex items-center justify-between h-14 px-5">
          <span class="flex flex-col min-w-0">
            <span class="flex items-baseline gap-1.5 min-w-0">
              <span
                class="overflow-hidden text-base font-medium truncate text-[var(--el-text-color-primary)]"
              >
                {{ conversationStore.activeConversation?.name || '' }}
              </span>
              <span
                v-if="isGroup && headerMemberCount > 0"
                class="flex-shrink-0 text-sm text-[var(--el-text-color-secondary)]"
              >
                ({{ headerMemberCount }})
              </span>
            </span>
            <!-- 副标题：备注 ≠ 群名时展示原群名，提示用户当前看到的主名是自己设的备注 -->
            <span
              v-if="headerSubtitle"
              class="overflow-hidden text-xs truncate text-[var(--el-text-color-secondary)]"
            >
              {{ headerSubtitle }}
            </span>
          </span>
          <div class="flex gap-3 items-center">
            <!-- 聊天历史 -->
            <el-tooltip content="聊天历史" placement="bottom">
              <Icon
                icon="ep:chat-dot-round"
                :size="20"
                class="message-panel__header-icon cursor-pointer"
                @click="historyDialogRef?.open()"
              />
            </el-tooltip>
            <!-- 通话入口：私聊弹「语音 / 视频」popover；群聊直接进选人弹窗 -->
            <el-popover
              v-if="isPrivate"
              v-model:visible="callPopoverVisible"
              placement="bottom-end"
              :width="140"
              trigger="click"
              popper-class="message-panel__call-popover"
            >
              <template #reference>
                <Icon
                  icon="ant-design:phone-outlined"
                  :size="20"
                  class="message-panel__header-icon cursor-pointer"
                />
              </template>
              <div class="flex flex-col gap-0.5">
                <div
                  class="flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer text-sm text-[var(--el-text-color-primary)] hover:bg-[var(--el-fill-color-light)]"
                  @click="startPrivateCall(ImRtcCallMediaType.VOICE)"
                >
                  <Icon icon="ant-design:phone-outlined" :size="16" />
                  <span>语音通话</span>
                </div>
                <div
                  class="flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer text-sm text-[var(--el-text-color-primary)] hover:bg-[var(--el-fill-color-light)]"
                  @click="startPrivateCall(ImRtcCallMediaType.VIDEO)"
                >
                  <Icon icon="ant-design:video-camera-outlined" :size="16" />
                  <span>视频通话</span>
                </div>
              </div>
            </el-popover>
            <el-tooltip v-else-if="!isQuitGroup" content="通话" placement="bottom">
              <Icon
                icon="ant-design:phone-outlined"
                :size="20"
                class="message-panel__header-icon cursor-pointer"
                @click="handleGroupCall"
              />
            </el-tooltip>
            <!-- 信息抽屉入口：群聊有，私聊仅在对方是好友时显示（非好友会话抽屉内容为空，没意义） -->
            <el-tooltip
              v-if="isGroup || (isPrivate && !showNotFriendBanner)"
              :content="isGroup ? '群聊信息' : '聊天信息'"
              placement="bottom"
            >
              <Icon
                icon="ant-design:ellipsis-outlined"
                :size="20"
                class="message-panel__header-icon cursor-pointer"
                @click="toggleSide"
              />
            </el-tooltip>
          </div>
        </div>

        <!-- 群通话胶囊条：仅群聊 + 该群有活跃通话时显示；点击展开看成员 + 加入按钮 -->
        <RtcGroupCallBanner
          v-if="isGroup && !isQuitGroup && conversationStore.activeConversation"
          :group-id="conversationStore.activeConversation.targetId"
        />

        <!-- 群置顶消息：第二行嵌入 header；仅群聊 + 有置顶时显示 -->
        <GroupPinnedMessage
          v-if="isGroup && conversationStore.activeConversation"
          :group-id="conversationStore.activeConversation.targetId"
          @locate="handleLocate"
        />
        <!-- 群顶部「待处理加群申请」横幅：仅群聊 + owner / admin + count > 0 时显示 -->
        <GroupRequestPending
          v-if="isGroup && !isQuitGroup && conversationStore.activeConversation"
          :group-id="conversationStore.activeConversation.targetId"
        />
        <!-- 私聊：对方不再是有效好友（我删了对方 / 从未加过；单边设计下「被对方删除」本端 friendStore 不更新故不会触发）；胶囊嵌在 header 内（跟群置顶同级），点击弹 UserInfoCard -->
        <div
          v-if="showNotFriendBanner"
          class="flex flex-shrink-0 items-start px-4 pb-2 bg-[var(--el-fill-color-light)]"
        >
          <div
            class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-13px cursor-pointer text-[var(--el-text-color-primary)] bg-[var(--el-color-warning-light-9)] transition-colors hover:bg-[var(--el-color-warning-light-8)]"
            @click="handleNotFriendClick"
          >
            <span
              class="inline-flex items-center justify-center w-4 h-4 rounded-full text-white bg-[var(--el-color-warning)] flex-shrink-0"
            >
              <Icon icon="ant-design:user-outlined" :size="11" />
            </span>
            <span>对方还不是你的朋友</span>
            <Icon icon="ep:arrow-right" :size="12" class="text-[var(--el-text-color-secondary)]" />
          </div>
        </div>
      </div>

      <!-- 中间：消息列表 -->
      <div
        ref="listRef"
        class="relative flex-1 py-2 overflow-y-auto bg-[var(--el-bg-color-page)]"
        @scroll="handleScroll"
      >
        <div
          v-if="messages.length === 0"
          class="flex items-center justify-center h-full text-sm text-[var(--el-text-color-secondary)]"
        >
          暂无消息
        </div>
        <!-- data-message-id 给 MessageHistory "定位到聊天位置" 用：父级通过 querySelector
             找到这层 wrapper，scrollIntoView + 加高亮 class；本地占位消息跳过 -->
        <div
          v-for="(msg, index) in messages"
          :key="msg.id || msg.clientMessageId"
          :data-message-id="msg.id || ''"
          class="message-panel__message-anchor"
        >
          <MessageItem
            :message="msg"
            :prev-message="messages[index - 1]"
            @locate="handleLocate"
            @mute="handleMuteMember"
            @reload="reloadGroupData"
          />
        </div>

        <!-- 回到底部浮动按钮（滚动不在底部时显示） -->
        <transition name="message-panel__jump-fade">
          <div
            v-if="showJumpToBottom"
            class="message-panel__jump-bottom sticky bottom-3 left-1/2 inline-flex gap-1.5 items-center w-fit mx-auto px-3.5 py-1.5 text-xs text-[#409eff] bg-[var(--el-bg-color-overlay)] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] cursor-pointer hover:text-white hover:bg-[#409eff]"
            @click="scrollToBottom(true)"
          >
            <Icon icon="ant-design:down-outlined" :size="14" />
            <span v-if="newMessageCount > 0" class="font-medium">
              {{ newMessageCount > 99 ? '99+' : newMessageCount }} 条新消息
            </span>
            <span v-else>回到底部</span>
          </div>
        </transition>
      </div>

      <!-- 底部：输入框（频道单向消息无需输入框）；多选模式底栏作为浮层盖在上面，保持下方输入框尺寸不变 -->
      <div v-if="!isChannel" class="relative">
        <MessageInput />
        <MessageMultiSelectBar v-if="multiSelect.state.active" class="absolute inset-0 z-10" />
      </div>

      <!-- 右侧信息抽屉：群聊 / 私聊各自一份 -->
      <ConversationGroupSide
        v-if="isGroup"
        v-model="sideVisible"
        :group="groupInfo"
        :conversation="conversationStore.activeConversation"
        :members="groupMembers"
        @reload="reloadGroupData"
        @open-history="historyDialogRef?.open()"
      />
      <ConversationPrivateSide
        v-else
        v-model="sideVisible"
        :conversation="conversationStore.activeConversation"
        :friend="privateFriend"
        @open-history="historyDialogRef?.open()"
      />

      <!-- 历史消息抽屉 -->
      <MessageHistory ref="historyDialogRef" @locate="handleLocate" />

      <!-- 转发弹窗 / 合并消息详情：在 MessagePanel 子树内挂载，子组件通过 inject 触发 -->
      <MessageForwardDialog ref="forwardDialogRef" />
      <MessageMergeDetailDialog ref="mergeDetailDialogRef" />

      <!-- 禁言时长选择弹窗 -->
      <GroupMuteMemberDialog ref="muteMemberDialogRef" @success="reloadGroupData" />

      <!-- 群通话成员选择弹窗 -->
      <RtcCallMemberPickerDialog ref="callMemberPickerRef" @success="onCallMemberPicked" />
    </template>
    <div
      v-else
      class="flex items-center justify-center h-full text-sm text-[var(--el-text-color-secondary)]"
    >
      <span>选择一个会话开始聊天</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, computed, provide } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useConversationStore } from '../../../../store/conversationStore'
import { useFriendStore } from '../../../../store/friendStore'
import { useImUiStore } from '../../../../store/uiStore'
import { getMemberDisplayName, isGroupQuit } from '@/views/im/utils/user'
import { useGroupStore } from '../../../../store/groupStore'
import MessageItem from './MessageItem.vue'
import MessageInput from '../input/MessageInput.vue'
import MessageMultiSelectBar from '../input/MessageMultiSelectBar.vue'
import MessageForwardDialog from './forward/MessageForwardDialog.vue'
import MessageMergeDetailDialog from './forward/MessageMergeDetailDialog.vue'
import {
  IM_FORWARD_DIALOG_KEY,
  IM_MERGE_DETAIL_DIALOG_KEY,
  IM_RTC_REDIAL_KEY
} from './forward/keys'
import { useMessageMultiSelect } from '../../../../composables/useMessageMultiSelect'
import { useVoicePlayer } from '../../../../composables/useVoicePlayer'
import MessageHistory from './MessageHistory.vue'
import ConversationGroupSide from '../conversation/ConversationGroupSide.vue'
import GroupPinnedMessage from './GroupPinnedMessage.vue'
import GroupRequestPending from './GroupRequestPending.vue'
import ConversationPrivateSide from '../conversation/ConversationPrivateSide.vue'
import type { GroupLite } from '../../../../types'
import type { GroupMemberLite } from '../../../../components/group/GroupMember.vue'
import GroupMuteMemberDialog from '../../../../components/group/GroupMuteMemberDialog.vue'
import RtcCallMemberPickerDialog from '../../../../components/rtc/RtcCallMemberPickerDialog.vue'
import RtcGroupCallBanner from '../../../../components/rtc/RtcGroupCallBanner.vue'
import { createCall } from '@/api/im/rtc'
import { ImRtcCallMediaType, ImRtcCallStatus, ImConversationType } from '@/views/im/utils/constants'
import { resolveCallEndReasonText } from '@/views/im/utils/message'
import { getClientConversationId } from '@/views/im/utils/db'
import { getCurrentUserId } from '@/utils/auth'
import { getGroupDisplayName } from '@/views/im/utils/user'
import { useRtcStore } from '../../../../store/rtcStore'
import { useMessageStore } from '../../../../store/messageStore'

defineOptions({ name: 'ImMessagePanel' })

const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const friendStore = useFriendStore()
const uiStore = useImUiStore()
const groupStore = useGroupStore()
const message = useMessage()
const rtcStore = useRtcStore()
const listRef = ref<HTMLElement>()

// ==================== 转发 / 合并消息详情：本地 dialog 浮层 ====================
// MessageItem / MessageMultiSelectBar / MessageHistory 通过 inject 触发；不挂全局 store

const forwardDialogRef = ref<InstanceType<typeof MessageForwardDialog>>()
const mergeDetailDialogRef = ref<InstanceType<typeof MessageMergeDetailDialog>>()

provide(IM_FORWARD_DIALOG_KEY, (opts) => forwardDialogRef.value?.open(opts))
provide(IM_MERGE_DETAIL_DIALOG_KEY, (content) => mergeDetailDialogRef.value?.open(content))
provide(IM_RTC_REDIAL_KEY, (mediaType: number) => {
  if (isPrivate.value) {
    void startPrivateCall(mediaType)
  }
}) // 私聊 RTC_CALL_END 气泡点击重拨；MessageItem 注入后调用

// ==================== 多选模式 ====================
// 模块级单例 state（composable）；本组件仅做切会话退出 + template 显隐判定

const multiSelect = useMessageMultiSelect()
const voicePlayer = useVoicePlayer()

/** 切会话退出多选 + 停语音；避免上一会话的勾选 / 播放态泄漏到新会话（type+targetId 一起监听，私聊与群聊 id 同号时也能触发） */
watch(
  () => [
    conversationStore.activeConversation?.type,
    conversationStore.activeConversation?.targetId
  ],
  () => {
    multiSelect.exit()
    voicePlayer.stop()
  }
)

const messages = computed(() => {
  const conversation = conversationStore.activeConversation
  return conversation
    ? messageStore.getMessages(getClientConversationId(conversation.type, conversation.targetId))
    : []
})
const isGroup = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.GROUP
)
const isPrivate = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.PRIVATE
)
const isChannel = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.CHANNEL
)

/** 当前激活会话是否历史退群群：禁群通话、隐藏群申请横幅等操作入口；聊天历史、群名头像照常展示 */
const isQuitGroup = computed(() => {
  const conversation = conversationStore.activeConversation
  return (
    conversation?.type === ImConversationType.GROUP &&
    isGroupQuit(groupStore.getGroup(conversation.targetId))
  )
})

/** 私聊会话且对端不是有效好友（本端 friend 记录缺失或 DISABLE）；单边删除语义下「被对方删除」不触发本端横幅 */
const showNotFriendBanner = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.PRIVATE) {
    return false
  }
  return !friendStore.isActiveFriend(conversation.targetId)
})

/** 点击「对方还不是你的朋友」胶囊：打开 UserInfoCard，引导用户重新添加 */
function handleNotFriendClick(event: MouseEvent) {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  uiStore.openUserInfoCard(
    {
      id: conversation.targetId,
      nickname: conversation.name,
      avatar: conversation.avatar
    },
    { x: rect.left, y: rect.bottom + 4 }
  )
}

/**
 * 群聊 header 显示的人数：优先 groupStore.memberCount（无需等成员列表），无值再回退 members.length
 *
 * 之所以不直接用 groupMembers.value.length：成员列表是按需懒加载的，刚切到群时未加载完，
 * 而 groupInfo.memberCount 跟群信息一起来，能更早显示人数避免"先空再蹦"
 */
const headerMemberCount = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return 0
  }
  const group = groupStore.getGroup(conversation.targetId)
  return group?.memberCount ?? group?.members?.length ?? 0
})

/** 顶部副标题：仅当群备注 ≠ 原群名时显示原群名（对齐微信 PC 双行 header） */
const headerSubtitle = computed(() => {
  const remark = groupInfo.value?.groupRemark
  const name = groupInfo.value?.name
  return remark && name && remark !== name ? name : ''
})

const BOTTOM_THRESHOLD = 80 // "是否停留在底部"的阈值：距离底部 < 80px 视为底部
const showJumpToBottom = ref(false) // 当前是否已不在底部（显示"回到底部"按钮）
const newMessageCount = ref(0) // 不在底部期间累计的新消息数

/**
 * 当前激活的群详情：优先 groupStore（带详细字段），未加载完时用 activeConversation 兜底
 *
 * groupStore 是按需懒加载的，初次进群时 ensureGroupData 触发后才会有完整数据；
 * 兜底字段（name / avatar）保证 header 不会"闪空"，notice / ownerId / memberCount
 * 必须等 store 就位才有值（这些字段在 conversation 里没有）
 */
const groupInfo = computed<
  | (GroupLite & {
      notice?: string
      remarkNickName?: string
      groupRemark?: string
      ownerId?: number
    })
  | undefined
>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return undefined
  }
  const group = groupStore.getGroup(conversation.targetId)
  const selfMember = group?.members?.find((member) => member.userId === getCurrentUserId())
  const showGroupName = group ? getGroupDisplayName(group) : conversation.name
  return {
    id: conversation.targetId,
    name: group?.name || conversation.name,
    showGroupName,
    showImage: group?.avatar || conversation.avatar,
    notice: group?.notice,
    remarkNickName: selfMember?.displayUserName,
    groupRemark: group?.groupRemark,
    ownerId: group?.ownerUserId,
    memberCount: group?.memberCount,
    joinApproval: group?.joinApproval
  }
})

// 群成员列表：直接取 groupStore 缓存，map 成 GroupMemberLite 给下游消费（@-mention / 邀请等）
const groupMembers = computed<GroupMemberLite[]>(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return []
  }
  const group = groupStore.getGroup(conversation.targetId)
  return (group?.members || []).map((member) => {
    // 显示名走「好友备注 > 群备注 > 真实昵称」三级；头像走 nickname 保稳定
    const friend = friendStore.getFriend(member.userId)
    return {
      userId: member.userId,
      showName: getMemberDisplayName(member, friend),
      nickname: member.nickname,
      avatar: member.avatar,
      status: member.status,
      role: member.role
    }
  })
})

/** 切换到群会话时同步群信息 + 成员 */
async function ensureGroupData(groupId: number) {
  // 远程拉群信息（群名 / 公告 / 群主等元数据）
  await groupStore.fetchGroupInfo(groupId).catch((error) => {
    console.warn('[IM MessagePanel] fetchGroupInfo 失败', { groupId }, error)
  })
  if (isGroupQuit(groupStore.getGroup(groupId))) {
    return
  }

  // 先从 IDB 同步加载群成员，让首帧立即出成员名 / 头像
  await groupStore.loadGroupMemberList(groupId).catch((error) => {
    console.warn('[IM MessagePanel] loadGroupMemberList 失败', { groupId }, error)
    return null
  })
  const group = groupStore.getGroup(groupId)
  if (!group?.membersLoaded || group.membersExpired) {
    groupStore.fetchGroupMemberList(groupId).catch((error) => {
      console.warn('[IM MessagePanel] fetchGroupMemberList 失败', { groupId }, error)
    })
  }
}

/** 群信息抽屉里点"刷新"：强拉一次最新群元数据 + 群成员 */
function reloadGroupData() {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return
  }
  groupStore.fetchGroupInfo(conversation.targetId, true)
  groupStore.fetchGroupMemberList(conversation.targetId, true)
}

/** 历史消息抽屉 ref：「聊天历史」icon / 抽屉「查找聊天内容」入口都调 open() 触发 */
const historyDialogRef = ref<InstanceType<typeof MessageHistory>>()
const sideVisible = ref(false) // 信息抽屉开关：群聊 / 私聊共用一个 ref
const muteMemberDialogRef = ref<InstanceType<typeof GroupMuteMemberDialog>>()
const callMemberPickerRef = ref<InstanceType<typeof RtcCallMemberPickerDialog>>()
/** 群通话发起：成员选择弹窗打开期间临时持有的 mediaType */
const pendingMediaType = ref<number | null>(null)

/** 消息右键菜单「禁言」→ 打开时长选择弹窗 */
function handleMuteMember(groupId: number, userId: number, displayName: string) {
  muteMemberDialogRef.value?.open(groupId, userId, displayName)
}

/** 信息抽屉的 toggle：跟 header 上 3 点图标按钮共用 */
function toggleSide() {
  sideVisible.value = !sideVisible.value
}

/** 私聊通话入口：popover 触发；点 语音 / 视频 直接发起 */
const callPopoverVisible = ref(false)
const callInviting = ref(false) // 通话发起中
async function startPrivateCall(mediaType: number) {
  callPopoverVisible.value = false
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  await doInvite({
    conversationType: ImConversationType.PRIVATE,
    mediaType,
    inviteeIds: [conversation.targetId]
  })
}

/** 群通话入口：默认语音直接弹选人；与微信群通话一致，进通话后用户按需开摄像头 */
function handleGroupCall() {
  const conversation = conversationStore.activeConversation
  if (!conversation) {
    return
  }
  pendingMediaType.value = ImRtcCallMediaType.VOICE
  callMemberPickerRef.value?.open({ groupId: conversation.targetId, mode: 'invite' })
}

/** 选人弹窗确认；带选中 ID 发起群通话 */
async function onCallMemberPicked(selectedIds: number[]) {
  const conversation = conversationStore.activeConversation
  const mediaType = pendingMediaType.value
  pendingMediaType.value = null
  if (!conversation || mediaType == null || selectedIds.length === 0) {
    return
  }
  await doInvite({
    conversationType: ImConversationType.GROUP,
    mediaType,
    groupId: conversation.targetId,
    inviteeIds: selectedIds
  })
}

/** 实际调 create 接口；统一处理成功 / ENDED（如忙线立即结束） */
async function doInvite(reqVO: {
  conversationType: number
  mediaType: number
  groupId?: number
  inviteeIds: number[]
}) {
  if (callInviting.value) {
    return
  }
  if (rtcStore.isActive) {
    message.warning('当前已有通话')
    return
  }
  callInviting.value = true
  try {
    const data = await createCall(reqVO)
    // 后端已 INSERT + 立即 end（如忙线）：toast 提示，不进 INVITING 阶段；chat tip 由 RTC_CALL_END 推送写入消息流
    if (data.status === ImRtcCallStatus.ENDED) {
      message.warning(resolveCallEndReasonText(data.endReason))
      return
    }
    // 正常进入 INVITING 阶段：走 store 逻辑发起通话，后续状态更新 / 消息流更新由 RTC 模块监听推送处理
    rtcStore.startInviting(data)
  } finally {
    callInviting.value = false
  }
}

/** 当前私聊对应的好友（抽屉头部展示用） */
const privateFriend = computed(() => {
  const conversation = conversationStore.activeConversation
  if (!conversation || conversation.type !== ImConversationType.PRIVATE) {
    return undefined
  }
  return friendStore.getFriend(conversation.targetId)
})

/** 计算距离底部的像素 */
function distanceFromBottom(): number {
  const el = listRef.value
  if (!el) {
    return 0
  }
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

/**
 * 消息列表滚动事件：刷新"是否在底部"状态
 * - 在底部：隐藏"回到底部"浮窗 + 清掉"未读新消息"计数
 * - 不在底部：显示"回到底部"浮窗，新消息会累计到 newMessageCount
 */
function handleScroll() {
  const dist = distanceFromBottom()
  const atBottom = dist <= BOTTOM_THRESHOLD
  showJumpToBottom.value = !atBottom
  if (atBottom) {
    newMessageCount.value = 0
  }
}

/**
 * 滚到底部：切会话 / 收到新消息（且当前在底部）/ 用户主动点「回到底部」 都走这里
 *
 * smooth=true 走平滑动画，适合用户主动点击；初始 / 自动滚动用 auto，避免用户感知到动画拖拽
 */
async function scrollToBottom(smooth = false) {
  // 1. 滚到当前 scrollHeight 的底部（图片 / 视频还在加载时只是大致到底）
  // 1.1 等 v-for 把新消息真正渲染进 DOM 后再算 scrollHeight，否则差最后一条的位置
  await nextTick()
  if (!listRef.value) {
    return
  }
  // 1.2 触发滚动；smooth 仅 user 主动点「回到底部」用，初始 / 自动滚走 auto 避免动画拖拽感
  listRef.value.scrollTo({
    top: listRef.value.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
  newMessageCount.value = 0
  showJumpToBottom.value = false
  // 1.3 记下「期望停下的 scrollTop」；图片 / 视频加载完底部会上移，scrollTop 没动就说明用户没手动滚走
  //     不能用 distanceFromBottom 判断：底部上移会让 distance 变大，被误判为「用户滚走了」直接放弃补滚
  const expectedScrollTop = listRef.value.scrollHeight - listRef.value.clientHeight

  // 2. 等媒体加载完后补滚到真实底部
  // 2.1 等容器内未加载完的图片 / 视频元数据；加载完后 scrollHeight 会增长到真实底部
  await waitMediaSettled()
  if (!listRef.value) {
    return
  }
  // 2.2 仅在用户没手动滚走时（scrollTop 仍贴近 expectedScrollTop）才补滚，避免等待期间用户上翻被打断
  if (Math.abs(listRef.value.scrollTop - expectedScrollTop) > BOTTOM_THRESHOLD) {
    return
  }
  // 2.3 补滚到新底部
  listRef.value.scrollTo({ top: listRef.value.scrollHeight, behavior: 'auto' })
}

/**
 * 等待容器内未加载完的图片 / 视频；最多等 2s 防止超大资源把整个滚动跟进卡住
 *
 * 仅关心元数据（loadedmetadata / img.complete），不等真正解码，因为尺寸够算 scrollHeight 就行
 */
function waitMediaSettled(): Promise<void> {
  // 1. 收集容器内未加载完的图片 / 视频
  if (!listRef.value) {
    return Promise.resolve()
  }
  // 1.1 一次扫 img + video，按 element 类型分别看「complete / readyState」过滤 pending
  const pendingMedia = Array.from(
    listRef.value.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img, video')
  ).filter((el) => (el instanceof HTMLImageElement ? !el.complete : el.readyState < 1))
  // 1.2 没有 pending 直接返回，省掉 Promise.race / setTimeout 闭包构造
  if (pendingMedia.length === 0) {
    return Promise.resolve()
  }

  // 2. 等所有 pending 资源 load / error，最长 2s 兜底
  // 2.1 每个 element 都监听对应 loadedEvent + error，任一触发即 resolve（不让单条失败卡 race）
  const loadAll = Promise.all(
    pendingMedia.map(
      (el) =>
        new Promise<void>((resolve) => {
          const loadedEvent = el instanceof HTMLImageElement ? 'load' : 'loadedmetadata'
          el.addEventListener(loadedEvent, () => resolve(), { once: true })
          el.addEventListener('error', () => resolve(), { once: true })
        })
    )
  ).then(() => undefined)
  // 2.2 2s 超时兜底，防止超大资源 / 网络挂起把整个滚动跟进永久卡住
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2000))
  return Promise.race([loadAll, timeout])
}

/**
 * 定位到聊天位置：MessageHistory 行上"定位"按钮 / 气泡内引用块点击触发
 *
 * 1. 先关掉历史弹窗（避免 scroll 时遮挡 + dialog 关闭后让聊天面板拿回焦点）
 * 2. nextTick 等弹窗 leave 动画 / 列表渲染稳定后再查 DOM
 * 3. 按 data-message-id 找 wrapper，scrollIntoView({ block: center }) 让消息落到视口中部
 * 4. 加 --highlight class 短暂高亮，提示用户"就是这条"
 * 5. 找不到 wrapper(原消息已分页出去)时弹 warning 提示,与微信"消息已不在窗口"观感一致
 */
async function handleLocate(messageId: number) {
  if (!messageId) {
    return
  }
  await nextTick()
  if (!listRef.value) {
    return
  }
  const target = listRef.value.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`)
  if (!target) {
    message.warning('原消息不在视野')
    return
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  target.classList.add('message-panel__message-anchor--highlight')
  setTimeout(() => {
    target.classList.remove('message-panel__message-anchor--highlight')
  }, 1600)
}

/**
 * 消息数量变化时的滚动跟进策略
 * - 当前在底部 → 自动滚到新底部（用户在"实时跟读"，体验上跟微信一致）
 * - 不在底部 → 累计 newMessageCount，让 sticky 浮窗显示"X 条新消息"，让用户主动点
 */
watch(
  () => messages.value.length,
  (newLen, oldLen) => {
    // 仅处理新增（delta > 0）；删除 / 撤回让 length 减少时不动滚动状态
    const delta = (newLen || 0) - (oldLen || 0)
    if (delta <= 0) {
      return
    }
    // 用 BOTTOM_THRESHOLD（80px）做容差：用户稍微往上翻几行就视作"不在底部"，
    // 否则一直 auto-scroll 会把人正在读的内容顶走，体验糟糕
    const dist = distanceFromBottom()
    if (dist <= BOTTOM_THRESHOLD) {
      scrollToBottom()
    } else {
      newMessageCount.value += delta
      showJumpToBottom.value = true
    }
  }
)

/**
 * 切换会话：清空"在不在底部"相关状态、强制滚到底部、群会话预拉资料
 *
 * type+targetId 一起监听：私聊与群聊 id 同号时切换也能触发；immediate:true 让首次进入页面就能初始化
 */
watch(
  () => [
    conversationStore.activeConversation?.type,
    conversationStore.activeConversation?.targetId
  ],
  ([type, targetId]) => {
    // 切会话时上一会话的「未读累计 + 浮窗显示」必须清掉，否则会带到新会话里看起来很突兀
    newMessageCount.value = 0
    showJumpToBottom.value = false
    // 抽屉里展示的群信息 / 好友信息属于上一会话，切会话时统一关掉
    sideVisible.value = false
    scrollToBottom()
    // 仅群聊预拉详情 / 成员（私聊对端在首屏 fetchFriendList 时就拉了）
    if (targetId && type === ImConversationType.GROUP) {
      ensureGroupData(targetId)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* :deep 穿透 el-icon 子组件 svg；el-icon 全局规则 .el-icon{color:var(--color,inherit)} 优先级更高，
   用 :deep + !important 锁色；颜色取 Element Plus 主题变量，暗色模式自动切到更亮的灰 */
.message-panel__header-icon,
.message-panel__header-icon :deep(svg) {
  color: var(--el-text-color-regular) !important;
  fill: currentcolor !important;
  transition: color 0.15s;
}

.message-panel__header-icon:hover,
.message-panel__header-icon:hover :deep(svg) {
  color: var(--el-color-primary) !important;
}

/* sticky + translate 居中：fit-content 宽度不会撑满，transform 水平 -50% 偏移；同时 transition opacity 和 transform 两个属性 */
.message-panel__jump-bottom {
  transform: translateX(-50%);
  transition:
    opacity 0.2s,
    transform 0.2s;
}

/* JS 切换 highlight class + background-color transition 联动；MessageHistory「定位」跳过来时短暂高亮 1.6s */
.message-panel__message-anchor {
  transition: background-color 0.6s ease;
}

.message-panel__message-anchor--highlight {
  background-color: var(--el-color-warning-light-9);
}

/* Vue <transition> 钩子类名固定，必须 SCSS 声明；回到底部按钮淡入淡出 */
.message-panel__jump-fade-enter-active,
.message-panel__jump-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.message-panel__jump-fade-enter-from,
.message-panel__jump-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>

<style>
/* el-popover 全局样式：紧贴菜单的小 padding；非 scoped 才能命中 popper-class */
.message-panel__call-popover.el-popover.el-popper {
  min-width: auto;
  padding: 6px;
}
</style>
