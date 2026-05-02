<template>
  <!-- 聊天面板右侧群信息抽屉：成员宫格 + 群信息 + 开关 + 退出群聊，整体对齐微信 PC -->
  <el-drawer
    v-model="visible"
    :with-header="false"
    direction="rtl"
    size="380px"
    append-to-body
    modal-class="im-conversation-group-side__modal"
  >
    <div v-if="group" class="im-conversation-group-side flex flex-col h-full">
      <!-- 上部：可滚动内容区 -->
      <div class="im-conversation-group-side__scroll flex-1 overflow-y-auto">
        <!-- ==================== 群成员区 ==================== -->
        <div class="im-conversation-group-side__section im-conversation-group-side__members">
          <el-input v-model="searchText" placeholder="搜索群成员" clearable>
            <template #prefix>
              <Icon
                icon="ant-design:search-outlined"
                class="text-[var(--el-text-color-placeholder)]"
              />
            </template>
          </el-input>

          <div class="im-conversation-group-side__grid">
            <GroupMemberGrid
              v-for="member in displayMembers"
              :key="member.userId"
              :member="member"
              :size="50"
              clickable
            />

            <!-- 添加（任何成员都能邀请） -->
            <div
              class="im-conversation-group-side__tile-wrap"
              title="邀请好友入群"
              @click="inviteVisible = true"
            >
              <div class="im-conversation-group-side__icon-tile">
                <Icon icon="ant-design:plus-outlined" />
              </div>
              <div class="im-conversation-group-side__tile-label">添加</div>
            </div>

            <!-- 移出（群主或管理员；管理员只能移出普通成员，由后端校验） -->
            <div
              v-if="isOwnerOrAdmin"
              class="im-conversation-group-side__tile-wrap"
              title="移出群成员"
              @click="removeVisible = true"
            >
              <div class="im-conversation-group-side__icon-tile">
                <Icon icon="ant-design:minus-outlined" />
              </div>
              <div class="im-conversation-group-side__tile-label">移出</div>
            </div>
          </div>

          <!-- 大群折叠：默认只展示前 N 个，点 "查看更多" 全展开（搜索时不折叠） -->
          <div
            v-if="moreMembersHidden"
            class="im-conversation-group-side__more"
            @click="showAllMembers = true"
          >
            查看更多
            <Icon icon="ant-design:down-outlined" :size="10" />
          </div>
        </div>

        <div class="im-conversation-group-side__spacer"></div>

        <!-- ==================== 群信息 ==================== -->
        <!-- label 在上、value 在下，纵向堆叠（对齐微信 PC 设计）；只有 "群公告" 因为内容长加 > chevron -->
        <div class="im-conversation-group-side__section">
          <!-- 群聊名称（群主可改） -->
          <el-popover
            v-if="isOwner"
            v-model:visible="namePopoverVisible"
            trigger="click"
            placement="left-start"
            :width="280"
          >
            <template #reference>
              <div
                class="im-conversation-group-side__row im-conversation-group-side__row--vertical im-conversation-group-side__row--clickable"
              >
                <span class="im-conversation-group-side__label">群聊名称</span>
                <span class="im-conversation-group-side__value truncate">{{ group.name }}</span>
              </div>
            </template>
            <div class="flex flex-col gap-2">
              <el-input v-model="editName" maxlength="20" placeholder="请输入群聊名称" />
              <div class="flex justify-end gap-2">
                <el-button size="small" @click="namePopoverVisible = false">取消</el-button>
                <el-button size="small" type="primary" @click="saveName">保存</el-button>
              </div>
            </div>
          </el-popover>
          <div
            v-else
            class="im-conversation-group-side__row im-conversation-group-side__row--vertical"
          >
            <span class="im-conversation-group-side__label">群聊名称</span>
            <span class="im-conversation-group-side__value truncate">{{ group.name }}</span>
          </div>

          <!-- 群公告（群主可改）：内容可能很长，加 > chevron 表示可展开编辑 -->
          <el-popover
            v-if="isOwner"
            v-model:visible="noticePopoverVisible"
            trigger="click"
            placement="left-start"
            :width="320"
          >
            <template #reference>
              <div
                class="im-conversation-group-side__row im-conversation-group-side__row--vertical im-conversation-group-side__row--clickable"
              >
                <div class="im-conversation-group-side__row-header">
                  <span class="im-conversation-group-side__label">群公告</span>
                  <Icon
                    icon="ant-design:right-outlined"
                    :size="11"
                    class="im-conversation-group-side__chevron"
                  />
                </div>
                <span
                  v-if="group.notice"
                  class="im-conversation-group-side__value im-conversation-group-side__value--clamp"
                >
                  {{ group.notice }}
                </span>
                <span v-else class="im-conversation-group-side__value-placeholder">未设置</span>
              </div>
            </template>
            <div class="flex flex-col gap-2">
              <el-input
                v-model="editNotice"
                type="textarea"
                :rows="4"
                maxlength="1024"
                show-word-limit
                placeholder="请输入群公告"
              />
              <div class="flex justify-end gap-2">
                <el-button size="small" @click="noticePopoverVisible = false">取消</el-button>
                <el-button size="small" type="primary" @click="saveNotice">保存</el-button>
              </div>
            </div>
          </el-popover>
          <div
            v-else
            class="im-conversation-group-side__row im-conversation-group-side__row--vertical"
          >
            <span class="im-conversation-group-side__label">群公告</span>
            <span
              v-if="group.notice"
              class="im-conversation-group-side__value im-conversation-group-side__value--clamp"
            >
              {{ group.notice }}
            </span>
            <span v-else class="im-conversation-group-side__value-placeholder">未设置</span>
          </div>

          <!-- 备注（仅自己可见；保存后会替换会话列表 / 顶部群名展示） -->
          <el-popover
            v-model:visible="groupRemarkPopoverVisible"
            trigger="click"
            placement="left-start"
            :width="280"
          >
            <template #reference>
              <div
                class="im-conversation-group-side__row im-conversation-group-side__row--vertical im-conversation-group-side__row--clickable"
              >
                <span class="im-conversation-group-side__label">备注</span>
                <span
                  v-if="group.groupRemark"
                  class="im-conversation-group-side__value im-conversation-group-side__value--clamp"
                >
                  {{ group.groupRemark }}
                </span>
                <span v-else class="im-conversation-group-side__value-placeholder">
                  群聊的备注仅自己可见
                </span>
              </div>
            </template>
            <div class="flex flex-col gap-2">
              <el-input
                v-model="editGroupRemark"
                type="textarea"
                :rows="3"
                maxlength="64"
                show-word-limit
                placeholder="仅自己可见"
              />
              <div class="flex justify-end gap-2">
                <el-button size="small" @click="groupRemarkPopoverVisible = false">取消</el-button>
                <el-button size="small" type="primary" @click="saveGroupRemark">保存</el-button>
              </div>
            </div>
          </el-popover>

          <!-- 我在本群的昵称（任何成员都能改自己的） -->
          <el-popover
            v-model:visible="remarkPopoverVisible"
            trigger="click"
            placement="left-start"
            :width="280"
          >
            <template #reference>
              <div
                class="im-conversation-group-side__row im-conversation-group-side__row--vertical im-conversation-group-side__row--clickable"
              >
                <span class="im-conversation-group-side__label">我在本群的昵称</span>
                <span
                  v-if="group.remarkNickName"
                  class="im-conversation-group-side__value truncate"
                >
                  {{ group.remarkNickName }}
                </span>
                <span v-else class="im-conversation-group-side__value-placeholder">点击设置</span>
              </div>
            </template>
            <div class="flex flex-col gap-2">
              <el-input v-model="editRemark" maxlength="20" placeholder="请输入本群昵称" />
              <div class="flex justify-end gap-2">
                <el-button size="small" @click="remarkPopoverVisible = false">取消</el-button>
                <el-button size="small" type="primary" @click="saveRemark">保存</el-button>
              </div>
            </div>
          </el-popover>
        </div>

        <div class="im-conversation-group-side__spacer"></div>

        <!-- ==================== 查找聊天内容 ==================== -->
        <!-- 点击 → 父组件打开 MessageHistory 弹窗 -->
        <div class="im-conversation-group-side__section">
          <div
            class="im-conversation-group-side__row im-conversation-group-side__row--clickable"
            @click="emit('open-history')"
          >
            <span class="im-conversation-group-side__label">查找聊天内容</span>
            <Icon
              icon="ant-design:right-outlined"
              :size="11"
              class="im-conversation-group-side__chevron"
            />
          </div>
        </div>

        <div class="im-conversation-group-side__spacer"></div>

        <!-- ==================== 开关项 ==================== -->
        <div class="im-conversation-group-side__section">
          <div class="im-conversation-group-side__row">
            <span class="im-conversation-group-side__label">消息免打扰</span>
            <el-switch :model-value="!!conversation?.muted" @change="onMutedChange" />
          </div>
          <div class="im-conversation-group-side__row">
            <span class="im-conversation-group-side__label">置顶聊天</span>
            <el-switch :model-value="!!conversation?.top" @change="onTopChange" />
          </div>
        </div>

        <!-- ==================== 群主操作 ==================== -->
        <!-- 仅群主可见，含管理员设置 + 群主管理权转让 -->
        <template v-if="isOwner">
          <div class="im-conversation-group-side__spacer"></div>
          <div class="im-conversation-group-side__section">
            <div
              class="im-conversation-group-side__row im-conversation-group-side__row--clickable"
              @click="adminVisible = true"
            >
              <span class="im-conversation-group-side__label">群管理员</span>
              <Icon
                icon="ant-design:right-outlined"
                :size="11"
                class="im-conversation-group-side__chevron"
              />
            </div>
            <div
              class="im-conversation-group-side__row im-conversation-group-side__row--clickable"
              @click="transferOwnerVisible = true"
            >
              <span class="im-conversation-group-side__label">群主管理权转让</span>
              <Icon
                icon="ant-design:right-outlined"
                :size="11"
                class="im-conversation-group-side__chevron"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- ==================== 底部：退出群聊 ==================== -->
      <!-- 仅非群主入口；群主退出走"解散群"另起一条路径，这里不处理 -->
      <div v-if="!isOwner" class="im-conversation-group-side__footer">
        <el-button
          class="im-conversation-group-side__quit-btn"
          type="danger"
          plain
          @click="handleQuit"
        >
          退出群聊
        </el-button>
      </div>
    </div>

    <!-- ==================== 子对话框 ==================== -->
    <!-- 邀请新成员 / 选成员移除 -->
    <GroupMemberAddDialog
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
      :hide-ids="removeHideIds"
      :max-size="50"
      @complete="handleRemoveComplete"
    />

    <!-- 群主操作：管理员设置（一个弹窗合并增 / 删，提交时 diff）+ 群主管理权转让 -->
    <GroupMemberSelector
      v-model="adminVisible"
      title="设置群管理员"
      :members="members"
      :checked-ids="adminCheckedIds"
      :hide-ids="adminHideIds"
      :max-size="GROUP_ADMIN_MAX_COUNT"
      @complete="handleAdminUpdate"
    />
    <GroupMemberSelector
      v-model="transferOwnerVisible"
      title="选择新群主"
      :members="members"
      :hide-ids="transferOwnerHideIds"
      :max-size="1"
      @complete="handleTransferOwnerComplete"
    />
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useUserStore } from '@/store/modules/user'
import { CommonStatusEnum } from '@/utils/constants'
import { updateGroup, addGroupAdmin, removeGroupAdmin, transferGroupOwner } from '@/api/im/group'
import { quitGroup, removeGroupMember, updateGroupMember } from '@/api/im/group/member'
import { useConversationStore } from '../../../../store/conversationStore'
import { useGroupStore } from '../../../../store/groupStore'
import {
  GROUP_ADMIN_MAX_COUNT,
  ImConversationType,
  ImGroupMemberRole
} from '@/views/im/utils/constants'
import GroupMemberGrid from '../../../../components/group/GroupMemberGrid.vue'
import GroupMemberAddDialog from '../../../../components/group/GroupMemberAddDialog.vue'
import GroupMemberSelector, {
  type GroupMemberFlag
} from '../../../../components/group/GroupMemberSelector.vue'
import type { Conversation, FriendLite, GroupLite } from '../../../../types'
import type { GroupMemberLite } from '../../../../components/group/GroupMember.vue'

defineOptions({ name: 'ImConversationGroupSide' })

const MEMBER_PREVIEW_COUNT = 14 // 大群默认只展示前 N 个成员（4×4 宫格 − 2 个瓦片预留给"添加 / 移出"按钮）

const props = withDefaults(
  defineProps<{
    modelValue?: boolean // 抽屉是否打开（v-model）
    group?: GroupLite & { notice?: string; remarkNickName?: string; groupRemark?: string } // 当前群信息（可空：无激活群会话时）
    conversation?: Conversation | null // 当前会话：用于读 / 切免打扰、置顶状态
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
  'open-history': [] // 点击 "查找聊天内容" 行 → 父组件打开 MessageHistory 弹窗
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
const inviteVisible = ref(false)
const removeVisible = ref(false)
const adminVisible = ref(false)
const transferOwnerVisible = ref(false)
const showAllMembers = ref(false)
const namePopoverVisible = ref(false)
const noticePopoverVisible = ref(false)
const remarkPopoverVisible = ref(false)
const groupRemarkPopoverVisible = ref(false)
const editName = ref('')
const editNotice = ref('')
const editRemark = ref('')
const editGroupRemark = ref('')

// ==================== 状态同步 watch ====================

// 抽屉关闭时重置临时态：搜索 / 折叠展开 / 还在打开的 popover 都清掉
watch(visible, (v) => {
  if (!v) {
    searchText.value = ''
    showAllMembers.value = false
    namePopoverVisible.value = false
    noticePopoverVisible.value = false
    remarkPopoverVisible.value = false
    groupRemarkPopoverVisible.value = false
  }
})

// popover 弹出时把当前值灌进编辑态，避免上次未保存的脏值
watch(namePopoverVisible, (v) => {
  if (v) editName.value = props.group?.name || ''
})
watch(noticePopoverVisible, (v) => {
  if (v) editNotice.value = props.group?.notice || ''
})
watch(remarkPopoverVisible, (v) => {
  if (v) editRemark.value = props.group?.remarkNickName || ''
})
watch(groupRemarkPopoverVisible, (v) => {
  if (v) editGroupRemark.value = props.group?.groupRemark || ''
})

// ==================== 角色 / 成员展示 ====================

const myId = computed(() => Number(userStore.getUser?.id) || 0)
const isOwner = computed(() => props.group != null && props.group.ownerId === myId.value)
/** 当前用户在群里的角色（来自 props.members 的 me 行）；用于判定是否可移出他人 */
const myRole = computed(() => props.members.find((m) => m.userId === myId.value)?.role)
/** 群主或管理员：在抽屉里有 "移出群成员" 入口 */
const isOwnerOrAdmin = computed(
  () => myRole.value === ImGroupMemberRole.OWNER || myRole.value === ImGroupMemberRole.ADMIN
)

// 排除已退群成员 + 关键字过滤；按角色排序：群主→管理员→普通成员（同角色按 userId 稳定）
const visibleMembers = computed(() => {
  return props.members
    .filter(
      (member) =>
        member.status !== CommonStatusEnum.DISABLE &&
        (member.showName || '').includes(searchText.value)
    )
    .sort((a, b) => {
      const roleA = a.role ?? ImGroupMemberRole.NORMAL
      const roleB = b.role ?? ImGroupMemberRole.NORMAL
      return roleA !== roleB ? roleA - roleB : a.userId - b.userId
    })
})

// 折叠规则：搜索 / 已展开 时不折叠，其余只取前 N 个
const moreMembersHidden = computed(
  () =>
    !searchText.value && !showAllMembers.value && visibleMembers.value.length > MEMBER_PREVIEW_COUNT
)
const displayMembers = computed(() =>
  moreMembersHidden.value
    ? visibleMembers.value.slice(0, MEMBER_PREVIEW_COUNT)
    : visibleMembers.value
)

// ==================== 群信息编辑 ====================

/** 群主：保存群名（走 /im/group/update） */
async function saveName() {
  if (!props.group) {
    return
  }
  await updateGroup({ id: props.group.id, name: editName.value })
  namePopoverVisible.value = false
  message.success('保存成功')
  emit('reload')
}

/** 群主：保存群公告 */
async function saveNotice() {
  if (!props.group) {
    return
  }
  await updateGroup({ id: props.group.id, notice: editNotice.value })
  noticePopoverVisible.value = false
  message.success('保存成功')
  emit('reload')
}

/** 任何成员：保存群备注（仅自己可见，会替换会话列表 / 顶部群名展示） */
async function saveGroupRemark() {
  if (!props.group) {
    return
  }
  await updateGroupMember({
    groupId: props.group.id,
    groupRemark: editGroupRemark.value.trim()
  })
  groupRemarkPopoverVisible.value = false
  message.success('保存成功')
  emit('reload')
}

/** 任何成员：保存自己在群里的昵称（走 /im/group-member/update） */
async function saveRemark() {
  if (!props.group) {
    return
  }
  await updateGroupMember({
    groupId: props.group.id,
    displayUserName: editRemark.value
  })
  remarkPopoverVisible.value = false
  message.success('保存成功')
  emit('reload')
}

// ==================== 开关切换 ====================

/**
 * 消息免打扰：本地 conversationStore 立即切；后端 /muted 异步同步，失败回滚本地
 *
 * 与 ConversationItem 右键菜单的"消息免打扰"语义一致；区别仅在 UI 入口
 */
function onMutedChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  const next = !!value
  const { type, targetId } = props.conversation
  conversationStore.setMuted(type, targetId, next)
  groupStore.setMuted(targetId, next).catch((error) => {
    console.error('[IM ConversationGroupSide] setMuted 失败', { targetId }, error)
    conversationStore.setMuted(type, targetId, !next)
    message.error('操作失败')
  })
}

/** 置顶聊天：纯本地 conversationStore 排序态（无后端字段） */
function onTopChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  conversationStore.setTop(props.conversation.type, props.conversation.targetId, !!value)
}

// ==================== 退出群聊 ====================

/** 退出群聊（普通成员入口；群主退出走"解散群"是另一条路径，这里不处理） */
async function handleQuit() {
  if (!props.group) {
    return
  }
  // 二次确认（用户点取消时 message.confirm 抛 reject，吃掉直接 return）
  try {
    await message.confirm('退出群聊后将不再接收群里的消息，确认退出吗？', '确认退出')
  } catch {
    return
  }
  const groupId = props.group.id
  await quitGroup(groupId)
  // 同步清本地：会话列表 + 群 store；不清的话冷启动前还会残留这条群 / 会话
  conversationStore.removeConversation(ImConversationType.GROUP, groupId)
  groupStore.removeGroup(groupId)
  message.success('已退出群聊')
  visible.value = false
}

// ==================== 群主操作 ====================
// 移除群成员（群主 / 管理员可见）+ 设置群管理员（仅群主）+ 群主管理权转让（仅群主）

// ---------- 移除群成员 ----------

/** 移除群成员的 hideIds：始终隐藏群主；管理员视角额外隐藏其它管理员（管理员不能移出管理员） */
const removeHideIds = computed(() => {
  const hideIds: number[] = []
  if (props.group?.ownerId) {
    hideIds.push(props.group.ownerId)
  }
  if (myRole.value === ImGroupMemberRole.ADMIN) {
    props.members
      .filter((m) => m.role === ImGroupMemberRole.ADMIN)
      .forEach((m) => hideIds.push(m.userId))
  }
  return hideIds
})

/** 移除群成员入口（群主可移出任意非群主，管理员只能移出普通成员；具体由后端校验） */
async function handleRemoveComplete(members: GroupMemberFlag[]) {
  if (!props.group || members.length === 0) {
    return
  }
  // 一次性批量踢人：把选中成员 userId 数组传给后端，比循环调 N 次接口省往返
  await removeGroupMember({
    groupId: props.group.id,
    memberUserIds: members.map((member) => member.userId)
  })
  message.success(`已移除 ${members.length} 位成员`)
  emit('reload')
}

// ---------- 设置群管理员 ----------

/** 当前管理员的 userId 列表，作为 Selector 默认勾选 */
const adminCheckedIds = computed(() =>
  props.members
    .filter((member) => member.role === ImGroupMemberRole.ADMIN)
    .map((member) => member.userId)
)

/** 设置管理员时隐藏：群主（不能设为管理员） */
const adminHideIds = computed(() => (props.group?.ownerId ? [props.group.ownerId] : []))

/** 群管理员变更：跟当前管理员列表 diff，新增 → addGroupAdmin，撤销 → removeGroupAdmin */
async function handleAdminUpdate(selected: GroupMemberFlag[]) {
  if (!props.group) {
    return
  }
  // 跟当前管理员列表做差集：分别拿到要新增 / 撤销的 userId
  const previousIds = adminCheckedIds.value
  const previousIdSet = new Set(previousIds)
  const selectedIds = selected.map((member) => member.userId)
  const selectedIdSet = new Set(selectedIds)
  const addedIds = selectedIds.filter((id) => !previousIdSet.has(id))
  const removedIds = previousIds.filter((id) => !selectedIdSet.has(id))
  if (addedIds.length === 0 && removedIds.length === 0) {
    return
  }
  if (addedIds.length > 0) {
    await addGroupAdmin({ groupId: props.group.id, userIds: addedIds })
  }
  if (removedIds.length > 0) {
    await removeGroupAdmin({ groupId: props.group.id, userIds: removedIds })
  }
  message.success(`已更新群管理员（新增 ${addedIds.length} 位，撤销 ${removedIds.length} 位）`)
  emit('reload')
}

// ---------- 群主管理权转让 ----------

/** 转让群主时隐藏当前用户（不能转让给自己） */
const transferOwnerHideIds = computed(() => [myId.value])

async function handleTransferOwnerComplete(selected: GroupMemberFlag[]) {
  if (!props.group || selected.length === 0) {
    return
  }
  const newOwner = selected[0]
  // 二次确认：转让后旧群主降为普通成员
  try {
    await message.confirm(
      `确定将群主转让给 ${newOwner.showName}？转让后你将变为普通成员，无法撤销。`,
      '确认转让群主'
    )
  } catch {
    return
  }
  // 转让群主
  await transferGroupOwner({
    groupId: props.group.id,
    newOwnerUserId: newOwner.userId
  })
  // 提示结果 + 刷新数据
  message.success('群主转让成功')
  emit('reload')
}
</script>

<style scoped>
.im-conversation-group-side {
  background-color: var(--el-bg-color);
}

/* 滚动区底色用浅灰，和 section 的白色形成 “块” 视觉，spacer 自动融入背景就不用单独画线 */
.im-conversation-group-side__scroll {
  background-color: var(--el-fill-color-light);
}

.im-conversation-group-side__section {
  background-color: var(--el-bg-color);
}

/* 群成员区：搜索 + 宫格 + 查看更多 */
.im-conversation-group-side__members {
  padding: 16px 16px 10px;
}

.im-conversation-group-side__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 4px;
  margin-top: 14px;
}

/* 添加 / 移出 宫格 wrapper */
.im-conversation-group-side__tile-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 66px;
  cursor: pointer;
}

/* 添加 / 移出 的方块按钮：用浅底 + 虚线边，hover 走主色让交互可读 */
.im-conversation-group-side__icon-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  font-size: 20px;
  color: var(--el-text-color-regular);
  background-color: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  transition:
    color 0.18s,
    border-color 0.18s,
    background-color 0.18s;
}
.im-conversation-group-side__tile-wrap:hover .im-conversation-group-side__icon-tile {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}
.im-conversation-group-side__tile-label {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  text-align: center;
}
/* el-icon 全局 color 在暗色模式下被主题盖过；:deep(svg) 锁 fill 到当前色 */
.im-conversation-group-side__icon-tile :deep(svg) {
  fill: currentColor !important;
}

/* 查看更多 */
.im-conversation-group-side__more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 10px;
  padding: 6px 0 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s;
}
.im-conversation-group-side__more:hover {
  color: var(--el-color-primary);
}

/* section 之间的灰条：靠滚动区底色透出来即可，spacer 高度决定块间距 */
.im-conversation-group-side__spacer {
  flex-shrink: 0;
  height: 10px;
}

/* 信息行：默认左 label 右 value（开关行），__row--vertical 切到 label 在上、value 在下（编辑字段行） */
.im-conversation-group-side__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  font-size: 14px;
  min-height: 24px;
  transition: background-color 0.15s;
}
.im-conversation-group-side__row + .im-conversation-group-side__row {
  border-top: 1px solid var(--el-border-color-lighter);
}
.im-conversation-group-side__row--clickable {
  cursor: pointer;
}
.im-conversation-group-side__row--clickable:hover {
  background-color: var(--el-fill-color-lighter);
}
.im-conversation-group-side__row--vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 14px 16px;
}

.im-conversation-group-side__label {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

/* 编辑字段行的 header：label 居左，可选 chevron 居右 */
.im-conversation-group-side__row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.im-conversation-group-side__value {
  font-size: 13px;
  color: var(--el-text-color-regular);
  word-break: break-all;
  line-height: 1.6;
}
.im-conversation-group-side__value--clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.im-conversation-group-side__value-placeholder {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  line-height: 1.6;
}

/* chevron 统一调成 placeholder 灰，避免 opacity hack 在暗色下偏色 */
.im-conversation-group-side__chevron {
  color: var(--el-text-color-placeholder);
}

/* 底部退出群聊：浅灰分隔条 + 内边距，给按钮喘气空间 */
.im-conversation-group-side__footer {
  flex-shrink: 0;
  padding: 14px 16px 18px;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}
.im-conversation-group-side__quit-btn {
  width: 100%;
  height: 36px;
  font-size: 14px;
}
</style>

<!-- el-drawer 用 append-to-body 后被传送出当前 scoped 边界，scoped CSS 的 data-v 不会落到 body 上；
     这里靠 modal-class（在 .el-overlay 上，是 .el-drawer__body 的祖先）写一段全局规则压掉默认 padding -->
<style>
.im-conversation-group-side__modal .el-drawer__body {
  padding: 0;
}
</style>
