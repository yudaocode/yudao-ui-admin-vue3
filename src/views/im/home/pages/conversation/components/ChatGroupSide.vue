<template>
  <!--
    聊天面板右侧信息抽屉（对应 boxim chat/ChatGroupSide.vue）
    - 抽屉形态：当 uiStore.chatGroupSide.show=true 时滑入
    - 群成员宫格 + 邀请 / 移除按钮（仅群主） + 群信息表单 + 退群按钮
    - 跨 page 引用 pages/group/components/ 下的 Dialog 组件
    - TODO 群模块后端 API 对接后替换 saveGroup / quit / remove
  -->
  <el-drawer
    v-model="visible"
    :with-header="false"
    direction="rtl"
    size="360px"
    append-to-body
    modal-class="im-chat-group-side__modal"
  >
    <div class="im-chat-group-side">
      <!-- 群成员区 -->
      <div v-if="group" class="im-chat-group-side__block">
        <el-input
          v-model="searchText"
          placeholder="搜索群成员"
          clearable
          size="small"
          class="im-chat-group-side__search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="im-chat-group-side__members">
          <!-- 邀请按钮 -->
          <div class="im-chat-group-side__tool" title="邀请好友入群" @click="inviteVisible = true">
            <div class="im-chat-group-side__tool-btn">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="im-chat-group-side__tool-text">邀请</div>
          </div>

          <!-- 移除按钮（仅群主） -->
          <div
            v-if="isOwner"
            class="im-chat-group-side__tool"
            title="移出成员"
            @click="removeVisible = true"
          >
            <div class="im-chat-group-side__tool-btn">
              <el-icon><Minus /></el-icon>
            </div>
            <div class="im-chat-group-side__tool-text">移除</div>
          </div>

          <!-- 成员宫格 -->
          <GroupMemberGrid
            v-for="m in filteredMembers"
            :key="m.userId"
            :member="m"
          />
        </div>
      </div>

      <el-divider />

      <!-- 群信息表单 -->
      <div v-if="group" class="im-chat-group-side__form">
        <el-form label-position="top" size="small">
          <el-form-item label="群聊名称">
            <el-input v-model="group.name" :disabled="!editing" maxlength="20" />
          </el-form-item>
          <el-form-item label="群主">
            <el-input :model-value="ownerName" disabled />
          </el-form-item>
          <el-form-item label="群公告">
            <el-input
              v-model="group.notice"
              :disabled="!editing"
              type="textarea"
              maxlength="1024"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="我在本群的昵称">
            <el-input v-model="group.remarkNickName" :disabled="!editing" maxlength="20" />
          </el-form-item>
        </el-form>

        <div class="im-chat-group-side__actions">
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
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Minus } from '@element-plus/icons-vue'

import { useUserStore } from '@/store/modules/user'
import { useImUiStore } from '../../../store/uiStore'
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
    /** 当前群信息（可空：无激活群会话时） */
    group?: GroupLite & { notice?: string; remarkNickName?: string }
    members?: GroupMemberLite[]
    friends?: FriendLite[]
  }>(),
  {
    members: () => [],
    friends: () => []
  }
)

defineEmits<{
  /** 邀请 / 移除 / 修改群资料后，父组件重新拉群数据 */
  reload: []
}>()

const uiStore = useImUiStore()
const userStore = useUserStore()

const visible = computed({
  get: () => uiStore.chatGroupSide.show,
  set: (v) => uiStore.toggleChatGroupSide(v)
})

const searchText = ref('')
const editing = ref(false)
const inviteVisible = ref(false)
const removeVisible = ref(false)

const myId = computed(() => userStore.getUser?.id?.toString() || '')

const isOwner = computed(
  () => props.group != null && String(props.group.ownerId) === myId.value
)

const ownerName = computed(() => {
  if (!props.group) return ''
  const owner = props.members.find(
    (m) => String(m.userId) === String(props.group!.ownerId)
  )
  return owner?.showNickName || '-'
})

const filteredMembers = computed(() =>
  props.members.filter(
    (m) => !m.quit && (m.showNickName || '').includes(searchText.value)
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
    await ElMessageBox.confirm(
      '退出群聊后将不再接受群里的消息，确认退出吗？',
      '确认退出',
      { type: 'warning' }
    )
    ElMessage.info('退出群聊接口待接入，当前为占位实现')
  } catch {
    // 用户取消
  }
}

// TODO 接入 /im/group/member/remove
function handleRemoveComplete(members: GroupMemberFlag[]) {
  if (members.length === 0) return
  ElMessage.info(`移除成员接口待接入，选择了 ${members.length} 位成员`)
}
</script>

<style scoped>
.im-chat-group-side {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}

.im-chat-group-side__block {
  margin-bottom: 10px;
}

.im-chat-group-side__search {
  margin-bottom: 10px;
}

.im-chat-group-side__members {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.im-chat-group-side__tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 54px;
}

.im-chat-group-side__tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  font-size: 18px;
  color: #606266;
  cursor: pointer;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.im-chat-group-side__tool-btn:hover {
  color: #409eff;
  border-color: #409eff;
}

.im-chat-group-side__tool-text {
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}

.im-chat-group-side__form {
  flex: 1;
  overflow-y: auto;
}

.im-chat-group-side__actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 12px;
}
</style>
