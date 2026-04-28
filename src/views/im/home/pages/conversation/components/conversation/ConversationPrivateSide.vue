<template>
  <!--
    私聊侧边抽屉
    - 整体结构对齐 ConversationGroupSide：宫格 + 信息行 + 开关；
    - "添加 / 清空聊天记录" 按钮在 WeChat 里有，但目前后端没建群-from-私聊 / 清空消息能力，先不加避免做半吊子
  -->
  <el-drawer
    v-model="visible"
    :with-header="false"
    direction="rtl"
    size="340px"
    append-to-body
    modal-class="im-conversation-private-side__modal"
  >
    <div v-if="friend" class="im-conversation-private-side flex flex-col h-full">
      <div class="im-conversation-private-side__scroll flex-1 overflow-y-auto">
        <!-- 好友宫格：单个头像 tile，对齐 GroupSide 视觉，让两种抽屉看起来是一家的 -->
        <div class="im-conversation-private-side__section im-conversation-private-side__friend">
          <div class="im-conversation-private-side__tile-wrap">
            <UserAvatar
              :id="friend.friendUserId"
              :url="friend.avatar"
              :name="friend.nickname"
              :size="50"
              :clickable="false"
            />
            <div class="im-conversation-private-side__tile-label">
              {{ displayName }}
            </div>
          </div>
        </div>

        <div class="im-conversation-private-side__spacer"></div>

        <!-- 备注（仅自己可见）：点击弹 popover 编辑，保存后立即刷新本抽屉 + 会话列表展示名 -->
        <div class="im-conversation-private-side__section">
          <el-popover
            v-model:visible="displayNamePopoverVisible"
            trigger="click"
            placement="left-start"
            :width="280"
          >
            <template #reference>
              <div
                class="im-conversation-private-side__row im-conversation-private-side__row--vertical im-conversation-private-side__row--clickable"
              >
                <span class="im-conversation-private-side__label">备注</span>
                <span
                  v-if="friend.displayName"
                  class="im-conversation-private-side__value im-conversation-private-side__value--clamp"
                >
                  {{ friend.displayName }}
                </span>
                <span v-else class="im-conversation-private-side__value-placeholder">
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
                <el-button size="small" type="primary" @click="handleSaveDisplayName"
                  >保存</el-button
                >
              </div>
            </div>
          </el-popover>
        </div>

        <div class="im-conversation-private-side__spacer"></div>

        <!-- 查找聊天内容 -->
        <div class="im-conversation-private-side__section">
          <div
            class="im-conversation-private-side__row im-conversation-private-side__row--clickable"
            @click="emit('open-history')"
          >
            <span class="im-conversation-private-side__label">查找聊天内容</span>
            <Icon
              icon="ant-design:right-outlined"
              :size="11"
              class="im-conversation-private-side__chevron"
            />
          </div>
        </div>

        <div class="im-conversation-private-side__spacer"></div>

        <!-- 开关项 -->
        <div class="im-conversation-private-side__section">
          <div class="im-conversation-private-side__row">
            <span class="im-conversation-private-side__label">消息免打扰</span>
            <el-switch :model-value="!!conversation?.muted" @change="handleMutedChange" />
          </div>
          <div class="im-conversation-private-side__row">
            <span class="im-conversation-private-side__label">置顶聊天</span>
            <el-switch :model-value="!!conversation?.top" @change="handleTopChange" />
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../../../../components/UserAvatar.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useConversationStore } from '../../../../store/conversationStore'
import { useFriendStore } from '../../../../store/friendStore'
import { ImConversationType } from '../../../../../utils/constants'
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

/** 备注 popover 点击保存：先走 store API 同步后端，成功后再关 popover + 提示 */
async function handleSaveDisplayName() {
  if (!props.friend) {
    return
  }
  try {
    await friendStore.setDisplayName(props.friend.friendUserId, editDisplayName.value)
    displayNamePopoverVisible.value = false
    message.success('保存成功')
  } catch (error) {
    console.error('[IM ConversationPrivateSide] 保存好友备注失败', error)
    message.error('保存失败')
  }
}

/** 切免打扰：双写 conversationStore（本地排序状态）+ friendStore（与后端同步） */
function handleMutedChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  const next = !!value
  conversationStore.setMuted(props.conversation.type, props.conversation.targetId, next)
  if (props.conversation.type === ImConversationType.PRIVATE) {
    friendStore.setMuted(props.conversation.targetId, next)
  }
}

/** 切置顶：纯本地 conversationStore 排序态（无后端字段） */
function handleTopChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  conversationStore.setTop(props.conversation.type, props.conversation.targetId, !!value)
}
</script>

<style scoped>
.im-conversation-private-side {
  background-color: var(--el-bg-color);
}

/* 滚动区底色用浅灰，配合 section 的白色形成 “块” 视觉，spacer 自动透出来当分隔条 */
.im-conversation-private-side__scroll {
  background-color: var(--el-fill-color-light);
}

.im-conversation-private-side__section {
  background-color: var(--el-bg-color);
}

/* 好友宫格区：留白和 GroupSide__members 对齐，单 tile 居左展示 */
.im-conversation-private-side__friend {
  padding: 16px 16px 14px;
}

.im-conversation-private-side__tile-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 66px;
}

.im-conversation-private-side__tile-label {
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* section 间隔条 */
.im-conversation-private-side__spacer {
  flex-shrink: 0;
  height: 10px;
}

/* 信息行：和 GroupSide 完全一致的尺寸 / hover，避免两个抽屉切换时 jitter */
.im-conversation-private-side__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  font-size: 14px;
  min-height: 24px;
  transition: background-color 0.15s;
}
.im-conversation-private-side__row + .im-conversation-private-side__row {
  border-top: 1px solid var(--el-border-color-lighter);
}
.im-conversation-private-side__row--clickable {
  cursor: pointer;
}
.im-conversation-private-side__row--clickable:hover {
  background-color: var(--el-fill-color-lighter);
}
/* 备注行：label 在上、value 在下，编辑场景才用 */
.im-conversation-private-side__row--vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 14px 16px;
}

.im-conversation-private-side__label {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.im-conversation-private-side__value {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-all;
}
.im-conversation-private-side__value--clamp {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.im-conversation-private-side__value-placeholder {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
}

.im-conversation-private-side__chevron {
  color: var(--el-text-color-placeholder);
}
</style>

<!-- 同 GroupSide：el-drawer append-to-body 后 scoped CSS 的 data-v 不会落到 body 上，靠 modal-class 作祖先选择器写一段全局规则 -->
<style>
.im-conversation-private-side__modal .el-drawer__body {
  padding: 0;
}
</style>
