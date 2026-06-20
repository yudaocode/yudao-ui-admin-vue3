<template>
  <!--
    私聊侧边抽屉
    - 整体结构对齐 ConversationGroupSide：宫格 + 信息行 + 开关
    - 顶部好友宫格 + "+" tile：点 + 调起 GroupCreateDialog 并锁定对方，对齐微信"基于私聊发起群聊"
    - "清空聊天记录"按钮在 WeChat 里有，但目前后端没建消息清空能力，先不加避免做半吊子
  -->
  <el-drawer
    v-model="visible"
    :with-header="false"
    direction="rtl"
    size="340px"
    append-to-body
    modal-class="im-conversation-private-side__modal"
  >
    <!-- friend 缺失场景：陌生人会话刚打开 / 好友数据还没补拉到；空白会让用户以为抽屉坏了，给个加载占位 -->
    <div
      v-if="!friend"
      v-loading="true"
      class="flex flex-col items-center justify-center h-full text-13px text-[var(--el-text-color-placeholder)] bg-[var(--el-bg-color)]"
    >
      加载中…
    </div>
    <div v-else class="flex flex-col h-full bg-[var(--el-bg-color)]">
      <div class="flex-1 overflow-y-auto bg-[var(--el-fill-color-light)]">
        <!-- 好友宫格：原 tile + "+" tile，对齐 GroupSide 视觉，让两种抽屉看起来是一家的 -->
        <div class="flex flex-wrap gap-1 px-4 pt-4 pb-[14px] bg-[var(--el-bg-color)]">
          <div class="flex flex-col items-center w-[66px]">
            <UserAvatar
              :id="friend.friendUserId"
              :url="friend.avatar"
              :name="friend.nickname"
              :size="50"
            />
            <div
              class="w-full mt-1.5 overflow-hidden text-12px leading-[1.5] text-[var(--el-text-color-regular)] text-center truncate"
            >
              {{ displayName }}
            </div>
          </div>

          <!-- + tile：点击调起 GroupCreateDialog，把对方 id 作为 lockedIds 传入 -->
          <div
            class="im-conversation-private-side__tile-wrap-clickable flex flex-col items-center w-[66px] cursor-pointer"
            title="发起群聊"
            @click="handleOpenCreateGroup"
          >
            <div
              class="im-conversation-private-side__icon-tile flex items-center justify-center w-[50px] h-[50px] text-20px text-[var(--el-text-color-regular)] bg-[var(--el-fill-color-lighter)] border border-dashed border-[var(--el-border-color)] rounded-md transition-colors duration-200"
            >
              <Icon icon="ant-design:plus-outlined" />
            </div>
            <div
              class="w-full mt-1.5 overflow-hidden text-12px leading-[1.5] text-[var(--el-text-color-regular)] text-center truncate"
              >添加</div
            >
          </div>
        </div>

        <div class="flex-shrink-0 h-[10px]"></div>

        <!-- 备注（仅自己可见）：点击弹 popover 编辑，保存后立即刷新本抽屉 + 会话列表展示名 -->
        <div class="bg-[var(--el-bg-color)]">
          <el-popover
            v-model:visible="displayNamePopoverVisible"
            trigger="click"
            placement="left-start"
            :width="280"
          >
            <template #reference>
              <div
                class="im-conversation-private-side__row flex flex-col items-stretch gap-1.5 px-4 py-[14px] text-14px min-h-6 cursor-pointer transition-colors duration-150 hover:bg-[var(--el-fill-color-lighter)]"
              >
                <span class="flex-shrink-0 text-14px text-[var(--el-text-color-primary)]"
                  >备注</span
                >
                <span
                  v-if="friend.displayName"
                  class="text-13px leading-[1.6] text-[var(--el-text-color-regular)] break-all line-clamp-2"
                >
                  {{ friend.displayName }}
                </span>
                <span
                  v-else
                  class="text-13px leading-[1.6] text-[var(--el-text-color-placeholder)]"
                >
                  好友备注仅自己可见
                </span>
              </div>
            </template>
            <div class="flex flex-col gap-2">
              <el-input
                v-model="editDisplayName"
                maxlength="16"
                show-word-limit
                placeholder="请输入备注名"
              />
              <div class="flex justify-end gap-2">
                <el-button size="small" @click="displayNamePopoverVisible = false">取消</el-button>
                <el-button size="small" type="primary" @click="handleSaveDisplayName">
                  保存
                </el-button>
              </div>
            </div>
          </el-popover>
        </div>

        <div class="flex-shrink-0 h-[10px]"></div>

        <!-- 查找聊天内容 -->
        <div class="bg-[var(--el-bg-color)]">
          <div
            class="im-conversation-private-side__row flex items-center justify-between gap-3 px-4 py-[13px] text-14px min-h-6 cursor-pointer transition-colors duration-150 hover:bg-[var(--el-fill-color-lighter)]"
            @click="emit('open-history')"
          >
            <span class="flex-shrink-0 text-14px text-[var(--el-text-color-primary)]"
              >查找聊天内容</span
            >
            <Icon
              icon="ant-design:right-outlined"
              :size="11"
              class="text-[var(--el-text-color-placeholder)]"
            />
          </div>
        </div>

        <div class="flex-shrink-0 h-[10px]"></div>

        <!-- 开关项 -->
        <div class="bg-[var(--el-bg-color)]">
          <div
            class="im-conversation-private-side__row flex items-center justify-between gap-3 px-4 py-[13px] text-14px min-h-6 transition-colors duration-150"
          >
            <span class="flex-shrink-0 text-14px text-[var(--el-text-color-primary)]"
              >消息免打扰</span
            >
            <el-switch :model-value="!!conversation?.silent" @change="handleMutedChange" />
          </div>
          <div
            class="im-conversation-private-side__row flex items-center justify-between gap-3 px-4 py-[13px] text-14px min-h-6 transition-colors duration-150"
          >
            <span class="flex-shrink-0 text-14px text-[var(--el-text-color-primary)]"
              >置顶聊天</span
            >
            <el-switch :model-value="!!conversation?.top" @change="handleTopChange" />
          </div>
        </div>
      </div>
    </div>

    <!-- 子对话框：发起群聊（锁定对方为已选） -->
    <GroupCreateDialog ref="createGroupDialogRef" @created="handleGroupCreated" />
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../../../../components/user/UserAvatar.vue'
import GroupCreateDialog from '../../../../components/group/GroupCreateDialog.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { useFriendStore } from '@/views/im/home/store/friendStore'
import { useGroupStore } from '@/views/im/home/store/groupStore'
import { getFriendDisplayName, getGroupDisplayName } from '@/views/im/utils/user'
import { ImConversationType } from '@/views/im/utils/constants'
import type { Conversation, Friend } from '../../../../types'

defineOptions({ name: 'ImConversationPrivateSide' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean // 抽屉开关（v-model）
    conversation?: Conversation | null // 当前会话（取置顶 / 免打扰态）
    friend?: Friend // 对方好友信息（取头像 / 昵称）
  }>(),
  {
    modelValue: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open-history': [] // 点击 "查找聊天内容" 行 → 父组件打开 MessageHistory 弹窗
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const message = useMessage()

/** tile 标签 / 后续聊天界面用的展示名：备注优先 */
const displayName = computed(() => (props.friend ? getFriendDisplayName(props.friend) : ''))

/** 发起群聊弹窗 ref：handleOpenCreateGroup 调 open({ lockedIds }) 锁定对方 */
const createGroupDialogRef = ref<InstanceType<typeof GroupCreateDialog>>()

/** 打开发起群聊弹窗：把对方默认勾上且不可取消，对应微信"基于私聊发起群聊" */
function handleOpenCreateGroup() {
  const lockedIds = props.friend ? [props.friend.friendUserId] : []
  createGroupDialogRef.value?.open({ lockedIds })
}

const displayNamePopoverVisible = ref(false)
const editDisplayName = ref('')

// popover 弹出时把当前备注灌进编辑态，避免上次未保存的脏值
watch(displayNamePopoverVisible, (open) => {
  if (open) {
    editDisplayName.value = props.friend?.displayName || ''
  }
})

// 抽屉关闭时把还没收掉的 popover 一并清掉，避免下次打开闪一下
watch(visible, (open) => {
  if (!open) {
    displayNamePopoverVisible.value = false
  }
})

/** 备注 popover 点击保存 */
async function handleSaveDisplayName() {
  if (!props.friend) {
    return
  }
  await friendStore.setFriendDisplayName(props.friend.friendUserId, editDisplayName.value)
  displayNamePopoverVisible.value = false
  message.success('保存成功')
}

/**
 * 切免打扰：乐观双写 conversationStore + friendStore；后端失败回滚 conversation 状态，保持与 ConversationItem.handleMuted 一致
 */
function handleMutedChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  const next = !!value
  const { type, targetId } = props.conversation
  conversationStore.setConversationSilent(type, targetId, next)
  if (type !== ImConversationType.PRIVATE) {
    return
  }
  friendStore.setFriendSilent(targetId, next).catch((error) => {
    console.error('[IM ConversationPrivateSide] 切换免打扰失败', { targetId }, error)
    conversationStore.setConversationSilent(type, targetId, !next)
  })
}

/** 切置顶：纯本地 conversationStore 排序态（无后端字段） */
function handleTopChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  conversationStore.setConversationTop(
    props.conversation.type,
    props.conversation.targetId,
    !!value
  )
}

/** 群创建成功：跳到新群会话 + 关掉本侧抽屉，让用户专注新群 */
function handleGroupCreated(groupId: number) {
  const group = groupStore.getGroup(groupId)
  if (!group) {
    return
  }
  conversationStore.openConversation(
    groupId,
    ImConversationType.GROUP,
    getGroupDisplayName(group),
    group.avatar || '',
    { silent: !!group.silent }
  )
  visible.value = false
}
</script>

<style scoped>
/* 「+」 tile： hover 时联动内部 icon-tile 走主色； 跨子元素的 hover 联动无法用单元素工具类表达 */
.im-conversation-private-side__tile-wrap-clickable:hover .im-conversation-private-side__icon-tile {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

/* :deep 穿透 Icon 内部 svg； el-icon 全局 color 在暗色模式下被主题盖过，锁 fill 到当前色 */
.im-conversation-private-side__icon-tile :deep(svg) {
  fill: currentcolor !important;
}

/* 相邻信息行加分隔线； 相邻兄弟选择器无法用工具类表达 */
.im-conversation-private-side__row + .im-conversation-private-side__row {
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>

<!-- 同 GroupSide：el-drawer append-to-body 后 scoped CSS 的 data-v 不会落到 body 上，靠 modal-class 作祖先选择器写一段全局规则 -->
<style>
.im-conversation-private-side__modal .el-drawer__body {
  padding: 0;
}
</style>
