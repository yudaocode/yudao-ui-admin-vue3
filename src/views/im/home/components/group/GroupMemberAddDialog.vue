<template>
  <!--
    添加群成员：选好友邀请入群（已在群成员置灰、不计入已选）
    - dialog 壳本组件持有；选择 UI 委托 FriendPickerPanel
    - 已在群成员通过 disabledIds 传入，不再走 checked+disabled 的"已勾选灰态"
    - 对外接口：ref + open({ groupId }) + emit reload(friendIds)
  -->
  <el-dialog
    v-model="visible"
    title="添加群成员"
    width="720px"
    :close-on-click-modal="false"
    class="im-picker-dialog"
  >
    <div class="h-[480px]">
      <FriendPickerPanel
        v-model:selected-ids="selectedIds"
        :friends="friends"
        :disabled-ids="disabledIds"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleOk">
        添加
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'

import { CommonStatusEnum } from '@/utils/constants'
import { inviteGroupMember } from '@/api/im/group/member'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { getCurrentUserId } from '@/utils/auth'
import { ImGroupMemberRole } from '@/views/im/utils/constants'
import { GROUP_MAX_MEMBER } from '@/views/im/utils/config'
import FriendPickerPanel from '../picker/FriendPickerPanel.vue'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupMemberAddDialog' })

const emit = defineEmits<{
  /** 邀请成功，携带被邀请的好友 id 列表；父侧通常用来 reload 群成员 */
  reload: [friendIds: number[]]
}>()

const message = useMessage()
const friendStore = useFriendStore()
const groupStore = useGroupStore()

const visible = ref(false)
const submitting = ref(false)
const groupId = ref(0)
const selectedIds = ref<number[]>([])

defineExpose({
  /** 打开添加群成员弹窗：reset → 灌参 → visible=true */
  open(opts: { groupId: number }) {
    groupId.value = opts.groupId
    selectedIds.value = []
    submitting.value = false
    visible.value = true
  }
})

/** 当前群成员列表：从 groupStore 现取，避免随 groupId 变化时父侧 prop 更新延迟 */
const members = computed<GroupMemberLite[]>(() => {
  const group = groupStore.getGroup(groupId.value)
  return (group?.members || []).map((member) => ({
    userId: member.userId,
    nickname: member.nickname,
    showName: member.displayUserName || member.nickname,
    avatar: member.avatar,
    status: member.status,
    role: member.role
  }))
})

/** 全量好友：直接复用 friendStore Lite 视图 */
const friends = computed(() => friendStore.getActiveFriendLiteList)

/** 已在群里的好友 id：传给 Panel 的 disabledIds 置灰 + 不计入已选 */
const disabledIds = computed<number[]>(() =>
  members.value
    .filter((member) => member.status !== CommonStatusEnum.DISABLE)
    .map((member) => member.userId)
)

/** 是否走审批分支：群开启 joinApproval + 当前用户是普通成员（群主 / 管理员邀请直进） */
const willGoApproval = computed(() => {
  const group = groupStore.getGroup(groupId.value)
  if (!group?.joinApproval) {
    return false
  }
  const myId = getCurrentUserId()
  if (!myId) {
    return false
  }
  // 群主直判，避开 members 异步加载的窗口；admin 仍依赖 members
  if (group.ownerUserId === myId) {
    return false
  }
  // members 未到位时无法判定 admin，保守按非审批处理，宁可漏报「等待审批」也不误报给真实管理员
  const myRole = members.value.find((member) => member.userId === myId)?.role
  if (myRole == null) {
    return false
  }
  return myRole !== ImGroupMemberRole.ADMIN
})

/** 当前群已启用成员数（DISABLE 即退群 / 被踢不计入），用于上限判定 */
const activeMemberCount = computed(
  () => members.value.filter((member) => member.status !== CommonStatusEnum.DISABLE).length
)

/** 邀请后群总人数若超 GROUP_MAX_MEMBER，前端先拦；activeMemberCount + selectedIds.length 即邀请后的成员数 */
const willExceedLimit = computed(
  () => activeMemberCount.value + selectedIds.value.length > GROUP_MAX_MEMBER
)

/** 添加按钮可点：至少有 1 个新邀请的好友 + 不超群人数上限 */
const canSubmit = computed(() => selectedIds.value.length > 0 && !willExceedLimit.value)

/** 邀请入群：调 /im/group/invite，成功后 emit reload 让父侧刷新群成员 */
async function handleOk() {
  if (!groupId.value) {
    return
  }
  const memberUserIds = [...selectedIds.value]
  if (memberUserIds.length === 0) {
    return
  }
  // 群人数上限冗余防御：与 canSubmit 重复判一次，防止状态在 await 间隙变化或调用方绕过按钮直接调
  if (activeMemberCount.value + memberUserIds.length > GROUP_MAX_MEMBER) {
    message.warning(`群成员上限为 ${GROUP_MAX_MEMBER} 人`)
    return
  }
  submitting.value = true
  try {
    await inviteGroupMember({ groupId: groupId.value, memberUserIds })
    // 审批分支：后端仅落审批记录，未入群
    message.success(willGoApproval.value ? '邀请已发起，等待群主 / 管理员审批' : '邀请成功')
    emit('reload', memberUserIds)
    visible.value = false
  } finally {
    submitting.value = false
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
