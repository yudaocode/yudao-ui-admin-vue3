<template>
  <!--
    转发消息（逐条 / 合并）：选目标会话 + 留言后批量发送
    - dialog 壳本组件持有；选择 UI 委托 ConversationPickerPanel / FriendPickerPanel
    - view='conversation'：选已有会话发送（默认视图）
    - view='contact'：从「创建聊天」入口进入，选好友建群再转发，业务壳层切视图
    - footer slot 塞预览卡（合并 / 逐条不同视觉）+ 留言 + 提交按钮
    - 对外接口沿用：ref + open({ mode, messages, sourceConversation })
  -->
  <el-dialog
    v-model="visible"
    width="720px"
    :close-on-click-modal="false"
    class="im-picker-dialog im-forward-dialog"
  >
    <template #header>
      <div class="flex gap-2 items-center">
        <Icon
          v-if="view === 'contact'"
          icon="ant-design:arrow-left-outlined"
          :size="16"
          class="cursor-pointer im-forward-dialog__back"
          @click="view = 'conversation'"
        />
        <span class="text-base text-[var(--el-text-color-primary)]">
          {{ headerTitle }}
        </span>
      </div>
    </template>

    <div class="h-[480px]">
      <!-- 会话视图：选已有会话转发 -->
      <ConversationPickerPanel
        v-if="view === 'conversation'"
        v-model:selected-keys="selectedKeys"
        :conversations="candidateConversations"
        :recent-forward-conversation-keys="conversationStore.recentForwardConversationKeys"
        :show-create-chat="true"
        @create-chat="handleSwitchToContact"
        @remove-recent="conversationStore.removeRecentForwardConversationKey"
      >
        <template #footer>
          <div class="flex flex-col gap-3 px-4 py-3">
            <!-- 合并模式预览：「[聊天记录] 标题 + 摘要列表」预览卡 -->
            <div
              v-if="state.mode === ImForwardMode.MERGE && mergePreview"
              class="flex flex-col w-full overflow-hidden rounded-md bg-[var(--el-bg-color)] border border-solid border-[var(--el-border-color-lighter)]"
            >
              <div
                class="px-3 py-2 text-sm font-medium truncate text-[var(--el-text-color-primary)]"
              >
                {{ mergePreview.title }}
              </div>
              <div class="flex flex-col px-3 pb-2 gap-0.5">
                <div
                  v-for="(line, idx) in mergePreview.lines"
                  :key="idx"
                  class="text-12px text-[var(--el-text-color-secondary)] truncate"
                >
                  {{ line }}
                </div>
              </div>
              <div
                class="px-3 py-1 text-12px border-t border-t-solid text-[var(--el-text-color-placeholder)] border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)]"
              >
                聊天记录
              </div>
            </div>

            <!-- 逐条模式预览：消息数 + 首条摘要 -->
            <div
              v-else-if="state.mode === ImForwardMode.SINGLE && singlePreviewLines.length > 0"
              class="flex flex-col w-full overflow-hidden rounded-md bg-[var(--el-bg-color)] border border-solid border-[var(--el-border-color-lighter)]"
            >
              <div class="flex flex-col px-3 py-2 gap-0.5">
                <div
                  v-for="(line, idx) in singlePreviewLines"
                  :key="idx"
                  class="text-13px text-[var(--el-text-color-primary)] truncate"
                >
                  {{ line }}
                </div>
              </div>
              <div
                class="px-3 py-1 text-12px border-t border-t-solid text-[var(--el-text-color-placeholder)] border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)]"
              >
                共 {{ state.messages.length }} 条消息
              </div>
            </div>

            <!-- 留言（单行）：右侧表情按钮触发 FacePicker；选中 emoji 拼到末尾 -->
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
              <FacePicker
                v-model:visible="emojiVisible"
                mode="emoji"
                class="bottom-full right-0 mb-2"
                @select-emoji="handleEmojiSelect"
              />
            </div>

            <div class="flex gap-2 justify-end">
              <el-button @click="visible = false">取消</el-button>
              <el-button
                type="primary"
                :loading="sending"
                :disabled="selectedKeys.length === 0"
                @click="handleSend"
              >
                {{ confirmButtonText }}
              </el-button>
            </div>
          </div>
        </template>
      </ConversationPickerPanel>

      <!-- 好友视图：选好友建群后转发 -->
      <FriendPickerPanel v-else v-model:selected-ids="selectedFriendIds" :friends="friends" />
    </div>

    <!-- 好友视图的 dialog footer：建群并转发 -->
    <template v-if="view === 'contact'" #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="sending"
        :disabled="selectedFriendIds.length === 0"
        @click="handleCreateGroupAndSend"
      >
        创建群聊并发送
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { createGroup } from '@/api/im/group'
import ConversationPickerPanel from '@/views/im/home/components/picker/ConversationPickerPanel.vue'
import FriendPickerPanel from '@/views/im/home/components/picker/FriendPickerPanel.vue'
import FacePicker from '../../input/FacePicker.vue'
import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { useFriendStore } from '@/views/im/home/store/friendStore'
import { useGroupStore } from '@/views/im/home/store/groupStore'
import { getGroupDisplayName, isGroupQuit } from '@/views/im/utils/user'
import { useMessageSender } from '@/views/im/home/composables/useMessageSender'
import { useMessageMultiSelect } from '@/views/im/home/composables/useMessageMultiSelect'
import {
  ImConversationType,
  ImForwardMode,
  ImContentType,
  type ImForwardModeValue
} from '@/views/im/utils/constants'
import { MESSAGE_MERGE_PREVIEW_LINES } from '@/views/im/utils/config'
import { getConversationKey, summarizeMessageContent } from '@/views/im/utils/conversation'
import { buildDefaultGroupName } from '@/views/im/utils/group'
import {
  buildMergeMessagePayload,
  removeQuotePayload,
  serializeMessage
} from '@/views/im/utils/message'
import type { Conversation, FriendLite, Message } from '@/views/im/home/types'

defineOptions({ name: 'ImMessageForwardDialog' })

const message = useMessage()
const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const { sendRaw, send } = useMessageSender()
const multiSelect = useMessageMultiSelect()

const state = reactive({
  mode: ImForwardMode.SINGLE as ImForwardModeValue,
  messages: [] as Message[],
  sourceConversation: null as Conversation | null
})
const visible = ref(false)
/** 当前视图：默认会话选择，「创建聊天」入口切到好友选择 */
const view = ref<'conversation' | 'contact'>('conversation')
const selectedKeys = ref<string[]>([])
const selectedFriendIds = ref<number[]>([])
const leaveMessage = ref('')
const sending = ref(false)
/** emoji picker 显隐：右侧笑脸按钮切换 */
const emojiVisible = ref(false)

defineExpose({
  /** 打开转发弹窗：reset → 灌参 → visible=true */
  open(opts: { mode: ImForwardModeValue; messages: Message[]; sourceConversation: Conversation }) {
    state.mode = opts.mode
    state.messages = opts.messages
    state.sourceConversation = opts.sourceConversation
    view.value = 'conversation'
    selectedKeys.value = []
    selectedFriendIds.value = []
    leaveMessage.value = ''
    emojiVisible.value = false
    sending.value = false
    visible.value = true
  }
})

/** 弹窗标题：会话视图按 mode 区分「逐条 / 合并转发」；好友视图固定为「选择好友」 */
const headerTitle = computed(() => {
  if (view.value === 'contact') {
    return '选择好友'
  }
  return state.mode === ImForwardMode.MERGE ? '合并转发' : '逐条转发'
})

/** 确认按钮文案：单选「发送」、多选「分别发送(n)」 */
const confirmButtonText = computed(() =>
  selectedKeys.value.length > 1 ? `分别发送（${selectedKeys.value.length}）` : '发送'
)

/** 候选会话：从 store 拿排序后的列表（转发回原会话也允许，与微信一致）；公众号 / 频道单向消息不接受转发，从候选里剔除 */
const candidateConversations = computed<Conversation[]>(() =>
  conversationStore.getSortedConversationList.filter(
    (conversation) =>
      conversation.type !== ImConversationType.CHANNEL &&
      // 历史退群群不可被转发选中（选了后端也会拒）
      !(
        conversation.type === ImConversationType.GROUP &&
        isGroupQuit(groupStore.getGroup(conversation.targetId))
      )
  )
)

/** 好友视图候选列表：直接复用 friendStore Lite 视图 */
const friends = computed<FriendLite[]>(() => friendStore.getActiveFriendLiteList)

/** 切到好友视图：清掉之前在会话视图输入的留言，避免在不可见输入框里把留言静默发到新群 */
function handleSwitchToContact() {
  view.value = 'contact'
  leaveMessage.value = ''
  emojiVisible.value = false
}

/** 选中 emoji：拼到留言末尾；FacePicker 自身负责关闭面板 */
function handleEmojiSelect(emoji: string) {
  leaveMessage.value = `${leaveMessage.value}${emoji}`
}

/** 合并 payload + 序列化 content；merge 模式下一次构造，预览 / 发送共用 */
const mergeBundle = computed(() => {
  if (
    state.mode !== ImForwardMode.MERGE ||
    !state.sourceConversation ||
    state.messages.length === 0
  ) {
    return null
  }
  const payload = buildMergeMessagePayload(state.messages, state.sourceConversation)
  return { payload, content: serializeMessage(payload) }
})

/** 合并模式预览：从 messages 前 N 条派生「{昵称}：{摘要}」 */
const mergePreview = computed(() => {
  const payload = mergeBundle.value?.payload
  if (!payload) {
    return null
  }
  const lines = payload.messages
    .slice(0, MESSAGE_MERGE_PREVIEW_LINES)
    .map((item) => `${item.senderNickname}：${summarizeMessageContent(item)}`)
  return { title: payload.title, lines }
})

/** 逐条模式预览：取前 N 条摘要 */
const singlePreviewLines = computed(() =>
  state.messages.slice(0, MESSAGE_MERGE_PREVIEW_LINES).map((m) => summarizeMessageContent(m))
)

/** 待发送的逐条消息：剥离 quote 一次，发送多目标时复用 */
const cleanedSinglePayloads = computed(() =>
  state.messages.map((m) => ({ type: m.type, content: removeQuotePayload(m.content) }))
)

/**
 * 给单个目标发送转发消息：merge 一次 sendRaw、single 按时间序逐条 sendRaw
 *
 * 任一原消息失败即停止后续，返回 false 让上层跳过留言
 */
async function forwardToTarget(target: Conversation): Promise<boolean> {
  if (state.mode === ImForwardMode.MERGE) {
    const content = mergeBundle.value?.content
    if (!content) {
      return false
    }
    return sendRaw(ImContentType.MERGE, content, { conversation: target })
  }
  for (const payload of cleanedSinglePayloads.value) {
    const ok = await sendRaw(payload.type, payload.content, { conversation: target })
    if (!ok) {
      return false
    }
  }
  return true
}

/**
 * 确认发送：单条模式逐条循环；合并模式发一条 MergeMessage
 *
 * 文案聚合：全部成功「已转发」、全部失败「转发失败：A、B」、部分失败「已转发，但 X、Y 失败」；
 * 留言只在该目标的转发消息全部成功后才追加，避免错序
 */
async function handleSend() {
  if (selectedKeys.value.length === 0) {
    return
  }
  if (state.messages.length === 0) {
    message.warning('没有可转发的消息')
    return
  }
  // 反查已选 conversation 对象（按 selectedKeys 数组顺序，即点击顺序）
  const candidates = candidateConversations.value
  const byKey = new Map(candidates.map((c) => [getConversationKey(c), c]))
  const targets = selectedKeys.value
    .map((key) => byKey.get(key))
    .filter((c): c is Conversation => c != null)
  if (targets.length === 0) {
    return
  }
  const leaveText = leaveMessage.value.trim()
  sending.value = true
  try {
    const tasks = targets.map(async (target) => {
      const forwardOk = await forwardToTarget(target)
      if (!forwardOk) {
        return { target, ok: false }
      }
      const ok = leaveText ? await send(leaveText, { conversation: target }) : true
      return { target, ok }
    })
    const results = await Promise.all(tasks)
    const failedNames = results.filter((r) => !r.ok).map((r) => r.target.name || '未命名会话')
    // 命中的目标统一推到最近转发列表（部分失败也推：用户的"意图"已表达）
    conversationStore.pushRecentForwardConversationKeyList(
      targets.map((c) => getConversationKey(c))
    )
    if (failedNames.length === 0) {
      message.success('已转发')
    } else if (failedNames.length === targets.length) {
      message.error(`转发失败：${failedNames.join('、')}`)
    } else {
      message.warning(`已转发，但 ${failedNames.join('、')} 失败`)
    }
    if (multiSelect.state.active) {
      multiSelect.exit()
    }
    visible.value = false
  } finally {
    sending.value = false
  }
}

/**
 * 好友视图发送：先建群（同时邀请所选好友）→ 给新群复用 forwardToTarget 转发 → 发留言 → 关弹窗
 *
 * 跟会话视图的差别：先要 createGroup 拿到 groupId，之后构造 GROUP 临时 conversation 喂给已有的 forwardToTarget
 * （sendRaw 内部会自动 insertMessage 把新群登记进 store，最近转发列表也能正常推）
 */
async function handleCreateGroupAndSend() {
  if (selectedFriendIds.value.length === 0) {
    return
  }
  if (state.messages.length === 0) {
    message.warning('没有可转发的消息')
    return
  }
  const byId = new Map(friends.value.map((f) => [f.id, f]))
  const members = selectedFriendIds.value
    .map((id) => byId.get(id))
    .filter((f): f is FriendLite => f != null)
  if (members.length === 0) {
    return
  }
  sending.value = true
  try {
    const memberUserIds = members.map((m) => m.id)
    const name = buildDefaultGroupName(members)
    const group = await createGroup({ name, memberUserIds, joinApproval: false })
    if (!group?.id) {
      throw new Error('创建群失败：未返回群编号')
    }
    // upsert 进 groupStore，省一次 fetchGroupList
    groupStore.upsertGroup({
      id: group.id,
      name: group.name,
      avatar: group.avatar,
      notice: group.notice,
      ownerUserId: group.ownerUserId
    })
    // 给新群构造一个临时 conversation 对象给 forwardToTarget 用；sendRaw 内部会自动 insertMessage 登记
    const newConversation: Conversation = {
      type: ImConversationType.GROUP,
      targetId: group.id,
      name: getGroupDisplayName(group) || name,
      avatar: group.avatar || '',
      unreadCount: 0,
      lastContent: '',
      lastSendTime: 0
    }
    const forwardOk = await forwardToTarget(newConversation)
    if (forwardOk) {
      const leaveText = leaveMessage.value.trim()
      if (leaveText) {
        await send(leaveText, { conversation: newConversation })
      }
      conversationStore.pushRecentForwardConversationKeyList([getConversationKey(newConversation)])
      message.success('已创建群聊并转发')
    } else {
      message.warning('群已创建，但消息转发失败，请稍后在群里重试')
    }
    // 统一退多选 + 关弹窗：成功 / 失败都要退源会话的多选态，避免遗留
    if (multiSelect.state.active) {
      multiSelect.exit()
    }
    visible.value = false
  } finally {
    sending.value = false
  }
}
</script>

<style scoped lang="scss">
/* 复用选择类弹窗的公共 mixin； 内部是 :deep 穿透 el-dialog 内部 header / body 的样式，无法替换为工具类 */
@use '@/views/im/home/components/picker/picker-dialog' as picker;

.im-picker-dialog {
  @include picker.styles;
}
</style>
