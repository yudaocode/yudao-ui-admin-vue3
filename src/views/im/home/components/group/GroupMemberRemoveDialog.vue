<template>
  <!--
    移除群成员：选成员 → removeGroupMember 批量踢人
    - dialog 壳本组件持有；选择 UI 委托 GroupMemberPickerPanel
    - 群主 / 管理员视角的不可移除成员通过 hideIds 隐藏，由调用方传入
    - 对外接口：ref + open({ groupId, members, hideIds }) + emit reload()
  -->
  <el-dialog
    v-model="visible"
    title="移出群成员"
    width="700px"
    :close-on-click-modal="false"
    class="im-picker-dialog"
  >
    <div class="h-[480px]">
      <GroupMemberPickerPanel
        v-model:selected-ids="selectedIds"
        :members="members"
        :hide-ids="hideIds"
        :max-size="50"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="selectedIds.length === 0"
        @click="handleOk"
      >
        移出
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'

import { removeGroupMember } from '@/api/im/group/member'
import GroupMemberPickerPanel from '../picker/GroupMemberPickerPanel.vue'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupMemberRemoveDialog' })

const emit = defineEmits<{
  /** 移出成功；父侧通常用来 reload 群数据 */
  reload: []
}>()

const message = useMessage()

const visible = ref(false)
const submitting = ref(false)
const groupId = ref(0)
const members = ref<GroupMemberLite[]>([])
const hideIds = ref<number[]>([])
const selectedIds = ref<number[]>([])

defineExpose({
  /** 打开移除群成员弹窗：reset → 灌参 → visible=true */
  open(opts: {
    groupId: number
    members: GroupMemberLite[]
    /** 隐藏 userId：群主始终隐藏；管理员视角额外隐藏其它管理员 */
    hideIds?: number[]
  }) {
    groupId.value = opts.groupId
    members.value = opts.members
    hideIds.value = opts.hideIds ? [...opts.hideIds] : []
    selectedIds.value = []
    submitting.value = false
    visible.value = true
  }
})

/** 一次性批量踢人：选中成员 userId 数组传给后端，比循环调 N 次接口省往返 */
async function handleOk() {
  if (!groupId.value || selectedIds.value.length === 0) {
    return
  }
  submitting.value = true
  try {
    const memberUserIds = [...selectedIds.value]
    await removeGroupMember({ groupId: groupId.value, memberUserIds })
    message.success(`已移除 ${memberUserIds.length} 位成员`)
    emit('reload')
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
