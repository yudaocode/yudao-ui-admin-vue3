<template>
  <!--
    通话成员选择弹窗：发起群通话时选邀请人 / 通话中添加成员；
    选择 UI 委托 GroupMemberPickerPanel；自己 hide、已在通话内的成员 disabled
  -->
  <el-dialog
    v-model="visible"
    :title="title"
    width="720px"
    :close-on-click-modal="false"
    class="im-picker-dialog"
  >
    <div class="h-[480px]">
      <GroupMemberPickerPanel
        v-model:selected-ids="selectedIds"
        :members="members"
        :disabled-ids="disabledIds"
        :hide-ids="hideIds"
      />
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!canSubmit" @click="handleOk">完成</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useGroupStore } from '../../store/groupStore'
import { getCurrentUserId } from '@/utils/auth'
import GroupMemberPickerPanel from '../picker/GroupMemberPickerPanel.vue'
import type { GroupMemberLite } from '../group/GroupMember.vue'

defineOptions({ name: 'ImRtcCallMemberPickerDialog' })

type PickerMode = 'invite' | 'add'

const emit = defineEmits<{
  /** 选完点完成；携带选中的 userId 列表 */
  success: [selectedIds: number[]]
}>()

const groupStore = useGroupStore()

/** 弹窗显隐 */
const visible = ref(false)
/** 当前群编号；open 时由调用方传入 */
const groupId = ref(0)
/** 弹窗用途；invite=发起群通话选邀请人 / add=通话中追加成员 */
const mode = ref<PickerMode>('invite')
/** 置灰的 userId 列表；add 场景把已在通话内的人禁用 */
const excludeUserIds = ref<number[]>([])
/** 当前选中的 userId 列表；GroupMemberPickerPanel v-model 绑过来 */
const selectedIds = ref<number[]>([])

/** 标题；按用途切换 */
const title = computed(() => (mode.value === 'add' ? '添加成员' : '选择成员'))

/** 群成员列表；从 groupStore 现取，map 成 GroupMemberLite */
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

/** 自己不出现在选项里 */
const hideIds = computed<number[]>(() => {
  const myId = getCurrentUserId()
  return myId ? [myId] : []
})

/** 已在通话内的成员置灰 */
const disabledIds = computed<number[]>(() => excludeUserIds.value)

/** 是否可提交：至少选 1 个 */
const canSubmit = computed(() => selectedIds.value.length > 0)

/** 打开弹窗；excludeUserIds 用于「添加成员」时把已在通话内的人置灰 */
function open(opts: { groupId: number; mode?: PickerMode; excludeUserIds?: number[] }) {
  groupId.value = opts.groupId
  mode.value = opts.mode || 'invite'
  excludeUserIds.value = opts.excludeUserIds || []
  selectedIds.value = []
  visible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 点完成：emit 选中 ID 列表给父级 + 关闭弹窗；提交按钮 disabled 已保证 selectedIds 非空 */
function handleOk() {
  emit('success', [...selectedIds.value])
  visible.value = false
}
</script>

<style scoped lang="scss">
@use '../picker/picker-dialog' as picker;

/* :deep 穿透 el-dialog 内部类；复用 picker 公共 mixin */
.im-picker-dialog {
  @include picker.styles;
}
</style>
