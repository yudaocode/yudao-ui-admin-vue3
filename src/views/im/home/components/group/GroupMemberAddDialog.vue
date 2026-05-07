<template>
  <!--
    邀请好友入群对话框
    - 左：好友列表（checkbox 前置）
    - 右：已勾选预览（每行可 x 移除）
    - 已在群内的好友 disabled，复用 GroupCreateDialog 的视觉
  -->
  <el-dialog v-model="visible" title="邀请好友" width="620px" :close-on-click-modal="false">
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
            <Icon
              icon="ant-design:close-outlined"
              class="im-group-member-add-dialog__remove"
              @click.stop="handleUncheck(friend)"
            />
          </FriendItem>
        </el-scrollbar>
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

import { CommonStatusEnum } from '@/utils/constants'
import { inviteGroupMember } from '@/api/im/group/member'
import { useUserStore } from '@/store/modules/user'
import { ImGroupMemberRole } from '@/views/im/utils/constants'
import { useGroupStore } from '../../store/groupStore'
import FriendItem from '../friend/FriendItem.vue'
import type { FriendLite } from '../../types'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupMemberAddDialog' })

interface FriendCheckable extends FriendLite {
  checked?: boolean
  disabled?: boolean // 已在群里的标记：checkbox 灰态 + 不计入新邀请，不进右侧列表
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    groupId?: number
    members?: GroupMemberLite[] // 本群现有成员，用来判断好友是否已在群里
    friends?: FriendLite[] // 全量好友（由调用方从 friendStore 传入）
  }>(),
  {
    members: () => [],
    friends: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reload: [friendIds: number[]] // 邀请完成，携带被邀请的好友 id 列表
}>()

const message = useMessage()
const userStore = useUserStore()
const groupStore = useGroupStore()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 是否走审批：群开启 joinApproval + 当前用户是普通成员；群主 / 管理员邀请直进，不落审批记录 */
const willGoApproval = computed(() => {
  if (!props.groupId) {
    return false
  }
  const group = groupStore.getGroup(props.groupId)
  if (!group?.joinApproval) {
    return false
  }
  const myId = Number(userStore.getUser?.id)
  if (!myId) {
    return false
  }
  // 群主直判，避开 members 异步加载的窗口；admin 仍依赖 members
  if (group.ownerUserId === myId) {
    return false
  }
  // members 未到位时无法判定 admin，保守按非审批处理，宁可漏报「等待审批」也不误报给真实管理员
  const myRole = props.members.find((member) => member.userId === myId)?.role
  if (myRole == null) {
    return false
  }
  return myRole !== ImGroupMemberRole.ADMIN
})

const searchText = ref('')
const submitting = ref(false)
const workingFriends = ref<FriendCheckable[]>([]) // 工作副本（带 checked / disabled 标记），与 prop 隔离

watch(
  visible,
  (open) => {
    if (!open) {
      return
    }
    searchText.value = ''
    workingFriends.value = props.friends
      .filter((friend) => !friend.deleted)
      .map((friend) => {
        const inGroup = props.members.some(
          (member) => member.status !== CommonStatusEnum.DISABLE && member.userId === friend.id
        )
        return {
          ...friend,
          checked: inGroup,
          disabled: inGroup
        }
      })
  },
  { immediate: true }
)

/** 左侧展示的好友：按搜索关键字过滤 workingFriends */
const shownFriends = computed(() =>
  workingFriends.value.filter((friend) => friend.nickname.includes(searchText.value))
)

/** 本次将被邀请的好友：勾选 + 非已在群成员（disabled 不计入） */
const checkedFriends = computed(() =>
  workingFriends.value.filter((friend) => friend.checked && !friend.disabled)
)

/** 完成按钮可点：至少有 1 个新邀请的好友 */
const canSubmit = computed(() => checkedFriends.value.length > 0)

/** 行点击：切换勾选态，已在群（disabled）的不响应 */
function handleToggleCheck(friend: FriendCheckable) {
  if (friend.disabled) {
    return
  }
  friend.checked = !friend.checked
}

/** checkbox change：直接落 value（disabled 已由属性拦截，这里再守一层） */
function handleCheckChange(friend: FriendCheckable, value: boolean) {
  if (friend.disabled) {
    return
  }
  friend.checked = value
}

/** 右侧 x 点击：取消勾选（disabled 不会进右侧列表，到这里说明非 disabled） */
function handleUncheck(friend: FriendCheckable) {
  friend.checked = false
}

/** 邀请入群：调 /im/group/invite，成功后 emit reload 让父侧刷新群成员 */
async function handleOk() {
  if (!props.groupId) {
    return
  }
  const memberUserIds = checkedFriends.value.map((friend) => friend.id)
  if (memberUserIds.length === 0) {
    return
  }
  submitting.value = true
  try {
    await inviteGroupMember({ groupId: props.groupId, memberUserIds })
    // 审批分支：后端仅落审批记录，未入群
    message.success(willGoApproval.value ? '邀请已发起，等待群主 / 管理员审批' : '邀请成功')
    emit('reload', memberUserIds)
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 右侧已选行的 x：默认浅灰，hover 转危险色，提示"点了就移除" */
.im-group-member-add-dialog__remove {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: color 0.15s;
}
.im-group-member-add-dialog__remove:hover {
  color: var(--el-color-danger);
}
</style>
