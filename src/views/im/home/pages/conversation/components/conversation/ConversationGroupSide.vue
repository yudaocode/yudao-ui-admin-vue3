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
              :group-name="group.name"
            />

            <!-- 添加（任何成员都能邀请） -->
            <div
              class="im-conversation-group-side__tile-wrap"
              title="邀请好友入群"
              @click="handleOpenInvite"
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
              @click="handleOpenRemove"
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

        <div class="im-conversation-group-side__spacer"></div>

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
          <!-- 分享群名片：弹 RecommendCardDialog，把当前群作为名片消息推荐给其他会话 -->
          <div
            v-if="group"
            class="im-conversation-group-side__row im-conversation-group-side__row--clickable"
            @click="handleShareGroupCard"
          >
            <span class="im-conversation-group-side__label">分享群名片</span>
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
            <el-switch :model-value="!!conversation?.silent" @change="onMutedChange" />
          </div>
          <div class="im-conversation-group-side__row">
            <span class="im-conversation-group-side__label">置顶聊天</span>
            <el-switch :model-value="!!conversation?.top" @change="onTopChange" />
          </div>
          <!-- 全群禁言：仅群主或管理员可操作 -->
          <div v-if="isOwnerOrAdmin" class="im-conversation-group-side__row">
            <span class="im-conversation-group-side__label">全群禁言</span>
            <el-switch :model-value="!!currentMutedAll" @change="onMuteAllChange" />
          </div>
        </div>

        <!-- ==================== 进群审批 ==================== -->
        <!-- 单独一段：群主开关 + 紧跟「- 进群申请」子项；与微信群管理布局对齐 -->
        <template v-if="isOwner || (isOwnerOrAdmin && !!group.joinApproval)">
          <div class="im-conversation-group-side__spacer"></div>
          <div class="im-conversation-group-side__section">
            <!-- 进群审批：仅群主可操作；开启后普通成员的「申请」「邀请」路径都需群主 / 管理员同意；群主 / 管理员邀请直进 -->
            <div v-if="isOwner" class="im-conversation-group-side__row">
              <span class="im-conversation-group-side__label">进群需要群主 / 群管理确认</span>
              <el-switch :model-value="!!group.joinApproval" @change="onJoinApprovalChange" />
            </div>
            <!-- 进群申请子项：仅当开启审批 + 当前用户是 owner / admin 时出现；点击进列表 dialog -->
            <div
              v-if="isOwnerOrAdmin && !!group.joinApproval"
              class="im-conversation-group-side__row im-conversation-group-side__row--clickable"
              @click="handleOpenRequestList"
            >
              <span class="im-conversation-group-side__label">- 进群申请</span>
              <Icon
                icon="ant-design:right-outlined"
                :size="11"
                class="im-conversation-group-side__chevron"
              />
            </div>
          </div>
        </template>

        <!-- ==================== 群主操作 ==================== -->
        <!-- 仅群主可见，含管理员设置 + 群主管理权转让 -->
        <template v-if="isOwner">
          <div class="im-conversation-group-side__spacer"></div>
          <div class="im-conversation-group-side__section">
            <div
              class="im-conversation-group-side__row im-conversation-group-side__row--clickable"
              @click="handleOpenAdminSet"
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
              @click="handleOpenTransferOwner"
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

      <!-- ==================== 底部：退出 / 解散群聊 ==================== -->
      <div class="im-conversation-group-side__footer">
        <!-- 群主：解散群聊 -->
        <el-button
          v-if="isOwner"
          class="im-conversation-group-side__quit-btn"
          type="danger"
          plain
          @click="handleDissolve"
        >
          解散群聊
        </el-button>
        <!-- 非群主：退出群聊 -->
        <el-button
          v-else
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
    <GroupMemberAddDialog ref="inviteDialogRef" @reload="$emit('reload')" />
    <GroupMemberRemoveDialog ref="removeDialogRef" @reload="$emit('reload')" />

    <!-- 群主操作：管理员设置（一个弹窗合并增 / 删，提交时 diff）+ 群主管理权转让 -->
    <GroupAdminSetDialog ref="adminSetDialogRef" @reload="$emit('reload')" />
    <GroupOwnerTransferDialog ref="ownerTransferDialogRef" @reload="$emit('reload')" />

    <!-- 进群申请列表（仅当开启审批 + 当前用户是 owner / admin 时入口可见） -->
    <GroupRequestListDialog ref="requestListDialogRef" />

    <!-- 分享群名片：把当前群作为名片消息推荐给其他会话 -->
    <RecommendCardDialog ref="recommendCardDialogRef" />
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { useUserStore } from '@/store/modules/user'
import { CommonStatusEnum } from '@/utils/constants'
import {
  updateGroup,
  muteAll,
  dissolveGroup
} from '@/api/im/group'
import { quitGroup, updateGroupMember } from '@/api/im/group/member'
import { useConversationStore } from '../../../../store/conversationStore'
import { useGroupStore } from '../../../../store/groupStore'
import { ImConversationType, ImGroupMemberRole } from '@/views/im/utils/constants'
import GroupMemberGrid from '../../../../components/group/GroupMemberGrid.vue'
import GroupMemberAddDialog from '../../../../components/group/GroupMemberAddDialog.vue'
import GroupMemberRemoveDialog from '../../../../components/group/GroupMemberRemoveDialog.vue'
import GroupAdminSetDialog from '../../../../components/group/GroupAdminSetDialog.vue'
import GroupOwnerTransferDialog from '../../../../components/group/GroupOwnerTransferDialog.vue'
import GroupRequestListDialog from '../../../../components/group/GroupRequestListDialog.vue'
import RecommendCardDialog from '../../../../components/user/RecommendCardDialog.vue'
import { toGroupCardTarget } from '@/views/im/utils/message'
import type { Conversation, GroupLite } from '../../../../types'
import type { GroupMemberLite } from '../../../../components/group/GroupMember.vue'

defineOptions({ name: 'ImConversationGroupSide' })

const MEMBER_PREVIEW_COUNT = 14 // 大群默认只展示前 N 个成员（4×4 宫格 − 2 个瓦片预留给"添加 / 移出"按钮）

const props = withDefaults(
  defineProps<{
    modelValue?: boolean // 抽屉是否打开（v-model）
    group?: GroupLite & { notice?: string; remarkNickName?: string; groupRemark?: string } // 当前群信息（可空：无激活群会话时）
    conversation?: Conversation | null // 当前会话：用于读 / 切免打扰、置顶状态
    members?: GroupMemberLite[]
  }>(),
  {
    modelValue: false,
    members: () => []
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

// ==================== 角色 / 成员展示 ====================

const searchText = ref('')
const showAllMembers = ref(false)

/** 邀请好友入群弹窗 ref：handleOpenInvite 调 open({ groupId }) 打开 */
const inviteDialogRef = ref<InstanceType<typeof GroupMemberAddDialog>>()
/** 打开邀请好友入群弹窗 */
function handleOpenInvite() {
  if (!props.group?.id) {
    return
  }
  inviteDialogRef.value?.open({ groupId: props.group.id })
}

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

// 抽屉关闭时清掉成员区临时态（搜索关键字、查看更多展开）
watch(visible, (v) => {
  if (!v) {
    searchText.value = ''
    showAllMembers.value = false
  }
})

// ==================== 群信息编辑 ====================

const namePopoverVisible = ref(false)
const noticePopoverVisible = ref(false)
const remarkPopoverVisible = ref(false)
const groupRemarkPopoverVisible = ref(false)
const editName = ref('')
const editNotice = ref('')
const editRemark = ref('')
const editGroupRemark = ref('')

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

// 抽屉关闭时清掉所有 popover，避免下次打开仍弹着
watch(visible, (v) => {
  if (!v) {
    namePopoverVisible.value = false
    noticePopoverVisible.value = false
    remarkPopoverVisible.value = false
    groupRemarkPopoverVisible.value = false
  }
})

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

/** 群主：切换「进群审批」开关；开启后所有「申请」「邀请」路径都需群主 / 管理员同意 */
// TODO @AI：应该是 handleXXX；别的方法也看看，是不是统一调整过来。
async function onJoinApprovalChange(value: boolean | string | number) {
  if (!props.group) {
    return
  }
  await updateGroup({ id: props.group.id, joinApproval: !!value })
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
 * 消息免打扰：本地 conversationStore 立即切；后端 /silent 异步同步，失败回滚本地
 *
 * 与 ConversationItem 右键菜单的"消息免打扰"语义一致；区别仅在 UI 入口
 */
function onMutedChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  const next = !!value
  const { type, targetId } = props.conversation
  conversationStore.setSilent(type, targetId, next)
  groupStore.setSilent(targetId, next).catch((error) => {
    console.error('[IM ConversationGroupSide] setSilent 失败', { targetId }, error)
    conversationStore.setSilent(type, targetId, !next)
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

// ==================== 全群禁言 ====================

/** 当前群是否全群禁言 */
const currentMutedAll = computed(() => {
  if (!props.group) {
    return false
  }
  return groupStore.getGroup(props.group.id)?.mutedAll ?? false
})

/** 全群禁言开关切换 */
async function onMuteAllChange(value: boolean | string | number) {
  if (!props.group) {
    return
  }
  const newValue = !!value
  try {
    await muteAll({ groupId: props.group.id, mutedAll: newValue })
    message.success(newValue ? '已开启全群禁言' : '已关闭全群禁言')
    emit('reload')
  } catch {
    message.error('操作失败')
  }
}

// ==================== 进群审批 ====================

/** 进群申请列表弹窗 ref：handleOpenRequestList 调 open({ groupId }) 触发 */
const requestListDialogRef = ref<InstanceType<typeof GroupRequestListDialog>>()

/** 打开当前群的进群申请列表 */
function handleOpenRequestList() {
  if (!props.group?.id) {
    return
  }
  requestListDialogRef.value?.open({ groupId: props.group.id })
}

// ==================== 分享群名片 ====================

/** 分享群名片弹窗 ref：handleShareGroupCard 调用 open({ target }) 打开 */
const recommendCardDialogRef = ref<InstanceType<typeof RecommendCardDialog>>()

/** 分享群名片：把当前群作为名片消息推荐给其他会话 */
function handleShareGroupCard() {
  const target = toGroupCardTarget(props.group)
  if (!target) {
    return
  }
  recommendCardDialogRef.value?.open({ target })
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
  // 本地立即响应：先把 self.member 置 DISABLE（让 GroupInfo 等 isMember 收敛），再清会话 + 群 store
  if (myId.value) {
    groupStore.updateMemberStatus(groupId, myId.value, CommonStatusEnum.DISABLE)
  }
  conversationStore.removeConversation(ImConversationType.GROUP, groupId)
  groupStore.removeGroup(groupId)
  message.success('已退出群聊')
  visible.value = false
}

/** 解散群聊（仅群主入口） */
async function handleDissolve() {
  if (!props.group) {
    return
  }
  try {
    await message.confirm('解散后所有成员将被移出，且无法恢复，确认解散吗？', '确认解散')
  } catch {
    return
  }
  const groupId = props.group.id
  await dissolveGroup(groupId)
  conversationStore.removeConversation(ImConversationType.GROUP, groupId)
  groupStore.removeGroup(groupId)
  message.success('群聊已解散')
  visible.value = false
}

// ==================== 群主操作 ====================
// 移除群成员（群主 / 管理员可见）+ 设置群管理员（仅群主）+ 群主管理权转让（仅群主）

/** 移除群成员弹窗 ref */
const removeDialogRef = ref<InstanceType<typeof GroupMemberRemoveDialog>>()
/** 设置群管理员弹窗 ref */
const adminSetDialogRef = ref<InstanceType<typeof GroupAdminSetDialog>>()
/** 转让群主弹窗 ref */
const ownerTransferDialogRef = ref<InstanceType<typeof GroupOwnerTransferDialog>>()

// ---------- 移除群成员 ----------

/** 打开移除群成员弹窗：始终隐藏群主；管理员视角额外隐藏其它管理员（管理员不能移出管理员） */
function handleOpenRemove() {
  if (!props.group?.id) {
    return
  }
  const hideIds: number[] = []
  if (props.group.ownerId) {
    hideIds.push(props.group.ownerId)
  }
  if (myRole.value === ImGroupMemberRole.ADMIN) {
    props.members
      .filter((m) => m.role === ImGroupMemberRole.ADMIN)
      .forEach((m) => hideIds.push(m.userId))
  }
  removeDialogRef.value?.open({
    groupId: props.group.id,
    members: props.members,
    hideIds
  })
}

// ---------- 设置群管理员 ----------

/** 打开设置群管理员弹窗：当前管理员默认勾选；群主从候选里隐藏 */
function handleOpenAdminSet() {
  if (!props.group?.id) {
    return
  }
  // 过滤已退群成员，避免 maxSize 名额被隐藏成员占用导致无法新增管理员
  const currentAdminIds = props.members
    .filter(
      (member) =>
        member.role === ImGroupMemberRole.ADMIN && member.status !== CommonStatusEnum.DISABLE
    )
    .map((member) => member.userId)
  const hideIds = props.group.ownerId ? [props.group.ownerId] : []
  adminSetDialogRef.value?.open({
    groupId: props.group.id,
    members: props.members,
    currentAdminIds,
    hideIds
  })
}

// ---------- 群主管理权转让 ----------

/** 打开转让群主弹窗：当前用户从候选里隐藏（不能转给自己） */
function handleOpenTransferOwner() {
  if (!props.group?.id) {
    return
  }
  ownerTransferDialogRef.value?.open({
    groupId: props.group.id,
    members: props.members,
    hideIds: [myId.value]
  })
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
