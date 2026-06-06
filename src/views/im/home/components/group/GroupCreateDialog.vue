<template>
  <!--
    发起群聊：选好友 → 默认按所选成员名生成群名 → createGroup
    - dialog 壳本组件持有；选择 UI 委托 FriendPickerPanel
    - lockedIds 由调用方通过 open({ lockedIds }) 传入；私聊侧 +建群锁定对方
    - 不再要求先输入群名 / 不再展示「进群审批」开关，对齐微信 PC
    - 对外接口：ref + open({ lockedIds }) + emit created(groupId)
  -->
  <el-dialog
    v-model="visible"
    title="发起群聊"
    width="720px"
    :close-on-click-modal="false"
    class="im-picker-dialog"
  >
    <div class="h-[480px]">
      <FriendPickerPanel
        v-model:selected-ids="selectedIds"
        :friends="friends"
        :locked-ids="lockedIds"
      />
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
import { computed, ref } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'

import { createGroup } from '@/api/im/group'
import { useFriendStore } from '../../store/friendStore'
import { useGroupStore } from '../../store/groupStore'
import { buildDefaultGroupName } from '../../../utils/group'
import FriendPickerPanel from '../picker/FriendPickerPanel.vue'
import type { FriendLite } from '../../types'

defineOptions({ name: 'ImGroupCreateDialog' })

const emit = defineEmits<{
  /** 创建成功，携带新群编号；父侧通常用来跳转到新群会话 */
  created: [groupId: number]
}>()

const message = useMessage()
const friendStore = useFriendStore()
const groupStore = useGroupStore()

const visible = ref(false)
const submitting = ref(false)
const lockedIds = ref<number[]>([])
const selectedIds = ref<number[]>([])

defineExpose({
  /** 打开发起群聊弹窗：reset → 灌参 → visible=true */
  open(opts?: { lockedIds?: number[] }) {
    lockedIds.value = opts?.lockedIds ? [...opts.lockedIds] : []
    selectedIds.value = []
    submitting.value = false
    visible.value = true
  }
})

/** 全量好友：直接复用 friendStore Lite 视图（带拼音字段供分桶用） */
const friends = computed<FriendLite[]>(() => friendStore.getActiveFriendLiteList)

/** 完成按钮可点：至少有 1 个非 locked 勾选（locked 是入口锁定项，不算"用户主动选择"） */
const canSubmit = computed(() => selectedIds.value.length > 0)

/** 拿到所有要进群的好友（locked + selected）；建群默认群名按这批人生成 */
function resolveMembersToInvite(): FriendLite[] {
  const seen = new Set<number>()
  const result: FriendLite[] = []
  const byId = new Map(friends.value.map((f) => [f.id, f]))
  for (const id of lockedIds.value) {
    if (seen.has(id)) {
      continue
    }
    const friend = byId.get(id)
    if (friend) {
      seen.add(id)
      result.push(friend)
    }
  }
  for (const id of selectedIds.value) {
    if (seen.has(id)) {
      continue
    }
    const friend = byId.get(id)
    if (friend) {
      seen.add(id)
      result.push(friend)
    }
  }
  return result
}

/** 创建群聊：建群（同时邀请初始成员）→ upsert groupStore → emit created 让父页跳转新会话 */
async function handleOk() {
  const members = resolveMembersToInvite()
  if (members.length === 0) {
    return
  }
  submitting.value = true
  try {
    const memberUserIds = members.map((m) => m.id)
    const name = buildDefaultGroupName(members)
    const group = await createGroup({ name, memberUserIds, joinApproval: false })
    if (!group?.id) {
      throw new Error('创建群失败：未返回群编号')
    }
    // 直接 upsert 进 groupStore，省一次 fetchGroupList —— 服务端返回 VO 已经够建会话了
    groupStore.upsertGroup({
      id: group.id,
      name: group.name,
      avatar: group.avatar,
      notice: group.notice,
      ownerUserId: group.ownerUserId
    })
    message.success('群聊创建成功')
    emit('created', group.id)
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
