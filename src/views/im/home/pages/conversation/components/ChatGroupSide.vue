<template>
  <!-- TODO @AI：不够对齐微信。如果让你改时，需要提醒我给你图片 -->
  <!-- TODO @AI：新建一个 components/side？ -->
  <!--
    聊天面板右侧信息抽屉
    - 抽屉形态：受 v-model 控制，由父组件 ChatPanel 管理开关
    - 群成员宫格 + 邀请 / 移除按钮（仅群主） + 群信息表单 + 退群按钮
    - 跨 page 引用 pages/group/components/ 下的 Dialog 组件
    - TODO TODO @AI：群模块后端 API 对接后替换 saveGroup / quit / remove
  -->
  <el-drawer
    v-model="visible"
    :with-header="false"
    direction="rtl"
    size="360px"
    append-to-body
    modal-class="im-chat-group-side__modal"
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
              class="im-chat-group-side__tool-btn flex items-center justify-center w-[38px] h-[38px] text-[18px] cursor-pointer border border-dashed border-[var(--el-border-color)] rounded text-[var(--el-text-color-regular)] hover:text-[#409eff] hover:border-[#409eff]"
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
              class="im-chat-group-side__tool-btn flex items-center justify-center w-[38px] h-[38px] text-[18px] cursor-pointer border border-dashed border-[var(--el-border-color)] rounded text-[var(--el-text-color-regular)] hover:text-[#409eff] hover:border-[#409eff]"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import Icon from '@/components/Icon/src/Icon.vue'

import { useUserStore } from '@/store/modules/user'
import { CommonStatusEnum } from '@/utils/constants'
import GroupMemberGrid from '../../group/components/GroupMemberGrid.vue'
import AddGroupMemberDialog from '../../group/components/AddGroupMemberDialog.vue'
import GroupMemberSelector, {
  type GroupMemberFlag
} from '../../group/components/GroupMemberSelector.vue'
import type { GroupLite } from '../../group/components/GroupItem.vue'
import type { GroupMemberLite } from './ChatGroupMember.vue'
import type { FriendLite } from '../../friend/components/FriendItem.vue'

defineOptions({ name: 'ImChatGroupSide' })

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

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const searchText = ref('')
const editing = ref(false)
const inviteVisible = ref(false)
const removeVisible = ref(false)

/**
 * 群信息表单本地副本：
 * 不能直接 v-model prop（vue/no-mutating-props），用本地 reactive 承接，
 * 保存时通过 emit / API 把变更回写给父组件。
 */
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

// TODO 接入 /im/group/modify
async function handleSave() {
  ElMessage.info('群信息保存接口待接入，当前为占位实现')
  editing.value = false
}

// TODO 接入 /im/group/quit
async function handleQuit() {
  try {
    await ElMessageBox.confirm('退出群聊后将不再接受群里的消息，确认退出吗？', '确认退出', {
      type: 'warning'
    })
    ElMessage.info('退出群聊接口待接入，当前为占位实现')
  } catch {
    // 用户取消
  }
}

// TODO 接入 /im/group/member/remove
function handleRemoveComplete(members: GroupMemberFlag[]) {
  if (members.length === 0) {
    return
  }
  ElMessage.info(`移除成员接口待接入，选择了 ${members.length} 位成员`)
}
</script>

<style scoped>
/* el-icon 的全局 color 在暗色模式下会被主题盖过；:deep(svg) 锁 fill 到当前色 */
.im-chat-group-side__tool-btn :deep(svg) {
  fill: currentColor !important;
}
</style>
