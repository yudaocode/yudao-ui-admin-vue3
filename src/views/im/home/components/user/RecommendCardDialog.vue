<template>
  <!--
    把名片推荐给朋友（用户 / 群通用）
    - dialog 壳由本组件持有；选择 UI 委托 ConversationPickerPanel / FriendPickerPanel
    - view='conversation'：选已有会话发名片（默认视图）
    - view='contact'：从「创建聊天」入口进入，选好友建群再发名片，业务壳层切视图，两个 Panel 互不知道对方
    - 选 1 走「发送」、多个走「分别发送(n)」文案，与微信一致
    - 失败的消息以 FAILED 状态留在对应会话气泡里，供右键重试
    - 对外接口：ref + open({ target })，不再走 v-model
  -->
  <el-dialog
    v-model="visible"
    width="720px"
    :close-on-click-modal="false"
    class="im-picker-dialog im-recommend-dialog"
  >
    <template #header>
      <div class="flex gap-2 items-center">
        <Icon
          v-if="view === 'contact'"
          icon="ant-design:arrow-left-outlined"
          :size="16"
          class="cursor-pointer text-[var(--el-text-color-secondary)] transition-colors duration-150 hover:text-[var(--el-color-primary)]"
          @click="view = 'conversation'"
        />
        <span class="text-base text-[var(--el-text-color-primary)]">
          {{ headerTitle }}
        </span>
      </div>
    </template>

    <div class="h-[480px]">
      <!-- 会话视图：选已有会话发送 -->
      <ConversationPickerPanel
        v-if="view === 'conversation'"
        v-model:selected-keys="selectedKeys"
        :conversations="candidateConversations"
        :recent-forward-conversation-keys="conversationStore.recentForwardConversationKeys"
        :hide-keys="hideKeys"
        :show-create-chat="true"
        @create-chat="handleSwitchToContact"
        @remove-recent="conversationStore.removeRecentForwardConversationKey"
      >
        <template #footer>
          <div class="flex flex-col gap-3 px-4 py-3">
            <!-- 名片预览卡 -->
            <CardBubble v-if="target" :card="target" />

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
        </template>
      </ConversationPickerPanel>

      <!-- 好友视图：选好友建群后发送 -->
      <FriendPickerPanel v-else v-model:selected-ids="selectedFriendIds" :friends="friends" />
    </div>

    <!-- 好友视图的 dialog footer：建群并发送 -->
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
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { createGroup } from '@/api/im/group'
import CardBubble from '@/views/im/home/components/card/CardBubble.vue'
import ConversationPickerPanel from '../picker/ConversationPickerPanel.vue'
import FriendPickerPanel from '../picker/FriendPickerPanel.vue'
import FacePicker from '../../pages/conversation/components/input/FacePicker.vue'
import { useConversationStore } from '../../store/conversationStore'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { useMessageSender } from '../../composables/useMessageSender'
import { ImConversationType, ImContentType, isGroupConversation } from '../../../utils/constants'
import { getConversationKey } from '../../../utils/conversation'
import { buildDefaultGroupName } from '../../../utils/group'
import { serializeMessage, type CardTarget } from '../../../utils/message'
import { getGroupDisplayName, isGroupQuit } from '../../../utils/user'
import type { Conversation, FriendLite } from '../../types'

defineOptions({ name: 'ImRecommendCardDialog' })

const message = useMessage()
const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const { sendRaw, send } = useMessageSender()

const visible = ref(false)
const target = ref<CardTarget | null>(null)
/** 当前视图：默认会话选择，「创建聊天」入口切到好友选择 */
const view = ref<'conversation' | 'contact'>('conversation')
const selectedKeys = ref<string[]>([])
const selectedFriendIds = ref<number[]>([])
const leaveMessage = ref('')
const sending = ref(false)
/** 表情面板显隐：右侧 smile icon 切换 */
const emojiVisible = ref(false)

defineExpose({
  /** 打开推荐弹窗：reset → 灌参 → visible=true */
  open(opts: { target: CardTarget }) {
    target.value = opts.target
    view.value = 'conversation'
    selectedKeys.value = []
    selectedFriendIds.value = []
    leaveMessage.value = ''
    emojiVisible.value = false
    sending.value = false
    visible.value = true
  }
})

/** 弹窗标题：会话视图按 target 类型分文案；好友视图固定为「选择好友」 */
const headerTitle = computed(() => {
  if (view.value === 'contact') {
    return '选择好友'
  }
  return isGroupConversation(target.value?.targetType) ? '把这个群推荐给朋友' : '把他推荐给朋友'
})

/** 候选会话：从 store 拿排序后的列表（hide 由 Panel 接 hideKeys 过滤）；历史退群群不可被推荐选中（选了后端也会拒） */
const candidateConversations = computed<Conversation[]>(() =>
  conversationStore.getSortedConversationList.filter(
    (conversation) =>
      !(
        conversation.type === ImConversationType.GROUP &&
        isGroupQuit(groupStore.getGroup(conversation.targetId))
      )
  )
)

/** 隐藏 key：不能把名片推回名片本身的会话（用户名片避免自推、群名片避免推回该群） */
const hideKeys = computed<string[]>(() => {
  const t = target.value
  if (!t) {
    return []
  }
  return [getConversationKey({ type: t.targetType, targetId: t.targetId })]
})

/** 好友视图候选列表：直接复用 friendStore Lite 视图 */
const friends = computed<FriendLite[]>(() => friendStore.getActiveFriendLiteList)

/** 把选中的 emoji 拼到留言末尾；FacePicker 自身负责关闭面板 */
function handleEmojiSelect(emoji: string) {
  leaveMessage.value = `${leaveMessage.value}${emoji}`
}

/** 切到好友视图：清掉之前在会话视图输入的留言，避免在不可见输入框里把留言静默发到新群 */
function handleSwitchToContact() {
  view.value = 'contact'
  leaveMessage.value = ''
  emojiVisible.value = false
}

/**
 * 确认发送（会话视图）：每个选中会话先发 CARD，CARD 成功后才发留言（保证「先看到名片」的顺序意图）
 *
 * 文案聚合：全部成功「已转发」、全部失败「转发失败：A、B」、部分失败「已转发，但 X、Y 失败」；
 * 失败的消息以 FAILED 状态留在对应会话气泡里，可右键重试
 */
async function handleSend() {
  const card = target.value
  if (!card?.targetId || selectedKeys.value.length === 0) {
    return
  }
  const byKey = new Map(candidateConversations.value.map((c) => [getConversationKey(c), c]))
  const targets = selectedKeys.value
    .map((key) => byKey.get(key))
    .filter((c): c is Conversation => c != null)
  if (targets.length === 0) {
    return
  }
  const cardContent = serializeMessage({ ...card })
  const leaveText = leaveMessage.value.trim()
  sending.value = true
  try {
    const tasks = targets.map(async (conversation) => {
      const cardOk = await sendRaw(ImContentType.CARD, cardContent, { conversation })
      if (!cardOk) {
        return { conversation, ok: false }
      }
      const ok = leaveText ? await send(leaveText, { conversation }) : true
      return { conversation, ok }
    })
    const results = await Promise.all(tasks)
    const failedNames = results.filter((r) => !r.ok).map((r) => r.conversation.name || '未命名会话')
    // 把命中的目标推到最近转发列表（部分失败也推：用户的"意图"已表达）
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
    visible.value = false
  } finally {
    sending.value = false
  }
}

/**
 * 好友视图发送：先建群（同时邀请所选好友）→ 给新群发名片 → 发留言 → 关弹窗
 *
 * 跟会话视图的差别：先要 createGroup 拿到 groupId，之后构造一个 GROUP 类型的 conversation 对象给 sendRaw 用
 * （sendRaw 内部会自动 insertMessage 把新群登记进 store，最近转发列表也能正常推）
 */
async function handleCreateGroupAndSend() {
  const card = target.value
  if (!card?.targetId || selectedFriendIds.value.length === 0) {
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
    // 给新群构造一个临时 conversation 对象给 sendRaw 用；sendRaw 内部会自动 insertMessage 登记
    const newConversation: Conversation = {
      type: ImConversationType.GROUP,
      targetId: group.id,
      name: getGroupDisplayName(group) || name,
      avatar: group.avatar || '',
      unreadCount: 0,
      lastContent: '',
      lastSendTime: 0
    }
    const cardOk = await sendRaw(ImContentType.CARD, serializeMessage({ ...card }), {
      conversation: newConversation
    })
    if (!cardOk) {
      message.warning('群已创建，但名片发送失败，请稍后在群里重试')
      visible.value = false
      return
    }
    const leaveText = leaveMessage.value.trim()
    if (leaveText) {
      await send(leaveText, { conversation: newConversation })
    }
    conversationStore.pushRecentForwardConversationKeyList([getConversationKey(newConversation)])
    message.success('已创建群聊并发送')
    visible.value = false
  } finally {
    sending.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../picker/picker-dialog' as picker;

/* :deep 穿透 el-dialog 内部类；复用 picker 公共 mixin */
.im-picker-dialog {
  @include picker.styles;
}
</style>
