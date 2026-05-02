<template>
  <!--
    新建群聊对话框
    - 顶部：群名称输入
    - 左：好友列表（checkbox 前置）
    - 右：已勾选预览（每行可 x 移除，locked 不渲染 x）
    - 提交：先 createGroup 再 inviteGroupMember，最后让父页 reload
    - lockedIds：锁定不可取消的好友 id；私聊侧 "+创建群" 入口用来锁定对方
  -->
  <el-dialog v-model="visible" title="新建群聊" width="620px" :close-on-click-modal="false">
    <div class="flex flex-col gap-3">
      <el-input v-model="groupName" placeholder="请输入群名称" maxlength="20" show-word-limit />

      <div class="flex gap-2.5">
        <div
          class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]"
        >
          <el-input v-model="searchText" placeholder="搜索好友" clearable>
            <template #prefix>
              <Icon
                icon="ant-design:search-outlined"
                class="text-[var(--el-text-color-placeholder)]"
              />
            </template>
          </el-input>
          <el-scrollbar class="h-[400px]">
            <FriendItem
              v-for="friend in shownFriends"
              :key="friend.id"
              :friend="friend"
              :menu="false"
              :active="false"
              @click="handleToggleCheck(friend)"
            >
              <template #prefix>
                <el-checkbox
                  :model-value="friend.checked"
                  :disabled="friend.disabled"
                  @click.stop
                  @change="(value) => handleCheckChange(friend, !!value)"
                />
              </template>
            </FriendItem>
          </el-scrollbar>
        </div>

        <div class="flex items-center text-lg text-[#409eff]">
          <Icon icon="ant-design:double-right-outlined" />
        </div>

        <div
          class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]"
        >
          <!-- 标题高度对齐左侧 el-input default（32px），保证两侧第一项起点在同一水平 -->
          <div
            class="h-8 pl-2.5 leading-8 text-13px text-[var(--el-text-color-secondary)] border-b border-[var(--el-border-color-lighter)]"
          >
            已勾选 {{ checkedFriends.length }} 位好友
          </div>
          <el-scrollbar class="h-[400px]">
            <FriendItem
              v-for="friend in checkedFriends"
              :key="friend.id"
              :friend="friend"
              :menu="false"
              :active="false"
            >
              <!-- locked 的好友不渲染 x，避免误以为可移除 -->
              <Icon
                v-if="!friend.disabled"
                icon="ant-design:close-outlined"
                class="im-group-create-dialog__remove"
                @click.stop="handleUncheck(friend)"
              />
            </FriendItem>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleOk">
        完成
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { createGroup } from '@/api/im/group'
import { useGroupStore } from '../../store/groupStore'
import FriendItem from '../friend/FriendItem.vue'
import type { FriendLite } from '../../types'

defineOptions({ name: 'ImGroupCreateDialog' })

interface FriendCheckable extends FriendLite {
  checked?: boolean
  disabled?: boolean // locked 的好友：勾选态由 lockedIds 强制为 true，UI 上 checkbox / x 都不响应
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    friends?: FriendLite[] // 全量好友（由调用方从 friendStore 传入）
    lockedIds?: number[] // 锁定的好友 id：自动勾选 + 不可取消（私聊侧 "+创建群" 用来锁定对方）
  }>(),
  {
    friends: () => [],
    lockedIds: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [groupId: number] // 创建成功，携带新群编号
}>()

const message = useMessage()
const groupStore = useGroupStore()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const groupName = ref('')
const searchText = ref('')
const submitting = ref(false)
const workingFriends = ref<FriendCheckable[]>([]) // 工作副本（带 checked / disabled 标记），与 prop 隔离

watch(
  visible,
  (open) => {
    if (!open) {
      return
    }
    groupName.value = ''
    searchText.value = ''
    workingFriends.value = props.friends
      .filter((friend) => !friend.deleted)
      .map((friend) => {
        const locked = props.lockedIds.some((id) => id === friend.id)
        return { ...friend, checked: locked, disabled: locked }
      })
  },
  { immediate: true }
)

/** 左侧展示的好友：按搜索关键字过滤 workingFriends */
const shownFriends = computed(() =>
  workingFriends.value.filter((friend) => friend.nickname.includes(searchText.value))
)

/** 已勾选的好友：右侧预览 + 提交时取 memberUserIds */
const checkedFriends = computed(() => workingFriends.value.filter((friend) => friend.checked))

/**
 * 完成按钮可点：群名非空 + 至少有 1 个非 locked 勾选
 *
 * locked 是入口侧自动选的（如私聊对方），不算"用户主动选择"——否则用户什么都没勾就能建 2 人群，体验上等于私聊
 */
const canSubmit = computed(() => {
  if (!groupName.value.trim()) {
    return false
  }
  return checkedFriends.value.some((friend) => !friend.disabled)
})

/** 行点击：切换勾选态，locked 的不响应 */
function handleToggleCheck(friend: FriendCheckable) {
  if (friend.disabled) {
    return
  }
  friend.checked = !friend.checked
}

/** checkbox change：直接落 value（locked 已由 :disabled 拦截，这里再守一层） */
function handleCheckChange(friend: FriendCheckable, value: boolean) {
  if (friend.disabled) {
    return
  }
  friend.checked = value
}

/** 右侧 x 点击：取消勾选（locked 不渲染 x，到这里说明非 locked） */
function handleUncheck(friend: FriendCheckable) {
  friend.checked = false
}

/** 创建群聊：建群（同时邀请初始成员）→ upsert groupStore → emit('created') 让父页跳转新会话 */
async function handleOk() {
  const name = groupName.value.trim()
  const memberUserIds = checkedFriends.value.map((friend) => friend.id)
  // canSubmit 已挡住空状态，这里再守一道防止 disabled 被外部绕过
  if (!name || memberUserIds.length === 0) {
    return
  }
  submitting.value = true
  try {
    // 1. 新建群聊
    const group = await createGroup({ name, memberUserIds })
    if (!group?.id) {
      throw new Error('创建群失败：未返回群编号')
    }

    // 2.1 直接 upsert 进 groupStore，省一次 fetchGroups——服务端返回 VO 已经够建会话了
    groupStore.upsertGroup({
      id: group.id,
      name: group.name,
      avatar: group.avatar,
      notice: group.notice,
      ownerUserId: group.ownerUserId
    })
    // 2.2 提示成功 + emit 让父页跳转新会话 + 关弹窗
    message.success('群聊创建成功')
    emit('created', group.id)
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 右侧已选行的 x：默认浅灰，hover 转危险色，提示"点了就移除" */
.im-group-create-dialog__remove {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: color 0.15s;
}
.im-group-create-dialog__remove:hover {
  color: var(--el-color-danger);
}
</style>
