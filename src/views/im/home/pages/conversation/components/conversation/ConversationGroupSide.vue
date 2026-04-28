<template>
  <!-- TODO @AI：不够对齐微信。如果让你改时，需要提醒我给你图片 -->
  <!-- 聊天面板右侧信息抽屉：群成员宫格 + 群信息表单 + 退群 / 移除等动作 -->
  <el-drawer
    v-model="visible"
    :with-header="false"
    direction="rtl"
    size="360px"
    append-to-body
    modal-class="im-conversation-group-side__modal"
  >
    <div class="flex flex-col h-full p-2.5">
      <!-- 群成员区 -->
      <div v-if="group" class="mb-2.5">
        <el-input
          v-model="searchText"
          placeholder="搜索群成员"
          clearable
          size="small"
          class="mb-2.5"
        >
          <template #prefix>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </el-input>

        <div class="flex flex-wrap gap-1">
          <!-- 邀请按钮 -->
          <div
            class="flex flex-col items-center w-[54px]"
            title="邀请好友入群"
            @click="inviteVisible = true"
          >
            <div
              class="im-conversation-group-side__tool-btn flex items-center justify-center w-[38px] h-[38px] text-[18px] cursor-pointer border border-dashed border-[var(--el-border-color)] rounded text-[var(--el-text-color-regular)] hover:text-[#409eff] hover:border-[#409eff]"
            >
              <Icon icon="ant-design:plus-outlined" />
            </div>
            <div class="mt-1 text-12px text-[var(--el-text-color-regular)]">邀请</div>
          </div>

          <!-- 移除按钮（仅群主） -->
          <div
            v-if="isOwner"
            class="flex flex-col items-center w-[54px]"
            title="移出成员"
            @click="removeVisible = true"
          >
            <div
              class="im-conversation-group-side__tool-btn flex items-center justify-center w-[38px] h-[38px] text-[18px] cursor-pointer border border-dashed border-[var(--el-border-color)] rounded text-[var(--el-text-color-regular)] hover:text-[#409eff] hover:border-[#409eff]"
            >
              <Icon icon="ant-design:minus-outlined" />
            </div>
            <div class="mt-1 text-12px text-[var(--el-text-color-regular)]">移除</div>
          </div>

          <!-- 成员宫格：抽屉里点头像弹 UserInfoCard -->
          <GroupMemberGrid v-for="m in filteredMembers" :key="m.userId" :member="m" clickable />
        </div>
      </div>

      <el-divider />

      <!-- 群信息表单 -->
      <div v-if="group" class="flex-1 overflow-y-auto">
        <el-form label-position="top" size="small">
          <el-form-item label="群聊名称">
            <el-input v-model="formData.name" :disabled="!editing" maxlength="20" />
          </el-form-item>
          <el-form-item label="群主">
            <el-input :model-value="ownerName" disabled />
          </el-form-item>
          <el-form-item label="群公告">
            <el-input
              v-model="formData.notice"
              :disabled="!editing"
              type="textarea"
              maxlength="1024"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="我在本群的昵称">
            <el-input v-model="formData.remarkNickName" :disabled="!editing" maxlength="20" />
          </el-form-item>
        </el-form>

        <div class="flex gap-2 justify-center mt-3">
          <el-button v-if="editing" type="success" @click="handleSave">保存</el-button>
          <el-button v-else type="primary" @click="editing = true">编辑</el-button>
          <el-button v-if="!isOwner" type="danger" @click="handleQuit">退出群聊</el-button>
        </div>
      </div>
    </div>

    <!-- 子对话框（跨 page 引用 pages/group/ 下的组件） -->
    <AddGroupMemberDialog
      v-model="inviteVisible"
      :group-id="group?.id"
      :members="members"
      :friends="friends"
      @reload="$emit('reload')"
    />
    <GroupMemberSelector
      v-model="removeVisible"
      title="选择成员进行移除"
      :members="members"
      :hide-ids="group?.ownerId ? [group.ownerId] : []"
      :max-size="50"
      @complete="handleRemoveComplete"
    />
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useUserStore } from '@/store/modules/user'
import { CommonStatusEnum } from '@/utils/constants'
import { updateGroup } from '@/api/im/group'
import { quitGroup, removeGroupMember, updateGroupMember } from '@/api/im/group/member'
import { useConversationStore } from '../../../../store/conversationStore'
import { useGroupStore } from '../../../../store/groupStore'
import { ImConversationType } from '../../../../../utils/constants'
import GroupMemberGrid from '../../../group/components/GroupMemberGrid.vue'
import AddGroupMemberDialog from '../../../group/components/AddGroupMemberDialog.vue'
import GroupMemberSelector, {
  type GroupMemberFlag
} from '../../../group/components/GroupMemberSelector.vue'
import type { GroupLite } from '../../../group/components/GroupItem.vue'
import type { GroupMemberLite } from '../../../../components/GroupMember.vue'
import type { FriendLite } from '../../../friend/components/FriendItem.vue'

defineOptions({ name: 'ImConversationGroupSide' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean // 抽屉是否打开（v-model）
    group?: GroupLite & { notice?: string; remarkNickName?: string } // 当前群信息（可空：无激活群会话时）
    members?: GroupMemberLite[]
    friends?: FriendLite[]
  }>(),
  {
    modelValue: false,
    members: () => [],
    friends: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reload: [] // 邀请 / 移除 / 修改群资料后，父组件重新拉群数据
}>()

const userStore = useUserStore()
const conversationStore = useConversationStore()
const groupStore = useGroupStore()
const message = useMessage()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const searchText = ref('')
const editing = ref(false)
const inviteVisible = ref(false)
const removeVisible = ref(false)

const formData = reactive({
  name: '',
  notice: '',
  remarkNickName: ''
})

watch(
  () => props.group,
  (g) => {
    formData.name = g?.name || ''
    formData.notice = g?.notice || ''
    formData.remarkNickName = g?.remarkNickName || ''
  },
  { immediate: true, deep: true }
)

const myId = computed(() => Number(userStore.getUser?.id) || 0)
const isOwner = computed(() => props.group != null && props.group.ownerId === myId.value)
const ownerName = computed(() => {
  if (!props.group) {
    return ''
  }
  const owner = props.members.find((m) => m.userId === props.group!.ownerId)
  return owner?.showNickName || '-'
})
const filteredMembers = computed(() =>
  props.members.filter(
    (member) =>
      member.status !== CommonStatusEnum.DISABLE &&
      (member.showNickName || '').includes(searchText.value)
  )
)

/**
 * 保存群信息
 * - 群主：群名 / 群公告 走 /im/group/update；自己在群里的昵称 走 /im/group-member/update
 * - 普通成员：仅自己的群昵称（群名 / 公告 disabled，但兜底防表单被绕开）
 */
async function handleSave() {
  if (!props.group) {
    return
  }
  const groupId = props.group.id
  try {
    // 1. 群主才允许更新群名 / 公告（普通成员表单上虽然 disabled，仍兜底防表单被绕开）
    if (isOwner.value) {
      await updateGroup({
        id: groupId,
        name: formData.name,
        notice: formData.notice
      })
    }
    // 2. 任何成员都能改自己在群里的昵称（displayUserName）
    await updateGroupMember({
      groupId,
      displayUserName: formData.remarkNickName
    })
    // 3. emit reload 让父组件 MessagePanel 走 reloadGroupData 把最新群资料 + 成员拉一份
    message.success('保存成功')
    editing.value = false
    emit('reload')
  } catch (error) {
    console.error('[IM ConversationGroupSide] 保存群信息失败', { groupId }, error)
    message.error('保存失败')
  }
}

/** 退出群聊（普通成员入口；群主退出走"解散群"是另一条路径，这里不处理） */
async function handleQuit() {
  if (!props.group) {
    return
  }
  // 1. 二次确认（用户点取消时 ElMessageBox 抛 reject，吃掉直接 return）
  try {
    await message.confirm('退出群聊后将不再接收群里的消息，确认退出吗？', '确认退出')
  } catch {
    return
  }
  const groupId = props.group.id
  try {
    // 2. 调后端 /im/group/quit
    await quitGroup(groupId)
    // 3. 同步清本地：会话列表 + 群 store；不清的话冷启动前还会残留这条群 / 会话
    conversationStore.removeConversation(ImConversationType.GROUP, groupId)
    groupStore.removeGroup(groupId)
    // 4. 关抽屉，让用户回到主面板
    message.success('已退出群聊')
    visible.value = false
  } catch (error) {
    console.error('[IM ConversationGroupSide] 退出群聊失败', { groupId }, error)
    message.error('退出群聊失败')
  }
}

/** 移除群成员（仅群主入口）*/
async function handleRemoveComplete(members: GroupMemberFlag[]) {
  if (!props.group || members.length === 0) {
    return
  }
  const groupId = props.group.id
  try {
    // 1. 一次性批量踢人：把选中成员 userId 数组传给后端，比循环调 N 次接口省往返
    await removeGroupMember({
      groupId,
      memberUserIds: members.map((member) => member.userId)
    })
    // 2. emit reload 让父组件重新拉群成员，UI 刷新看到被踢的人消失
    message.success(`已移除 ${members.length} 位成员`)
    emit('reload')
  } catch (error) {
    console.error('[IM ConversationGroupSide] 移除群成员失败', { groupId }, error)
    message.error('移除成员失败')
  }
}
</script>

<style scoped>
/* el-icon 的全局 color 在暗色模式下会被主题盖过；:deep(svg) 锁 fill 到当前色 */
.im-conversation-group-side__tool-btn :deep(svg) {
  fill: currentColor !important;
}
</style>
