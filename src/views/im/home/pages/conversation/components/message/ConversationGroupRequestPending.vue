<template>
  <!--
    群顶部「待处理加群申请」横幅
    - 仅当登录用户是该群 owner / admin 且该群下未处理申请数 > 0 时显示
    - count 与 list 都从 groupRequestStore 派生（全局存）；本端处理 / WS 通知到达后 store 自动更新
    - 单条胶囊一行；点击展开下拉，每条带「同意 / 拒绝」按钮
  -->
  <!-- TODO @AI：还不是新建一个 components/group；这个改成 GroupRequestPending；然后 GroupPinnedMessages ？这样风格更一致一点；  -->
  <div v-if="canManage && pendingCount > 0" class="im-conversation-group-request">
    <div
      class="im-conversation-group-request__row im-conversation-group-request__row--clickable"
      @click="expanded = !expanded"
    >
      <Icon
        icon="ant-design:user-add-outlined"
        :size="14"
        class="im-conversation-group-request__icon"
      />
      <span class="im-conversation-group-request__text">
        {{ pendingCount }} 条新的入群申请待处理
      </span>
      <Icon
        :icon="expanded ? 'ant-design:up-outlined' : 'ant-design:down-outlined'"
        :size="11"
        class="im-conversation-group-request__chevron"
      />
    </div>

    <!-- 展开列表面板：浅色面板 + 每条独立卡片，行内含「同意 / 拒绝」按钮 -->
    <div v-if="expanded" class="im-conversation-group-request__list">
      <div v-for="item in list" :key="item.id" class="im-conversation-group-request__item">
        <UserAvatar
          :url="item.userAvatar"
          :name="item.userNickname"
          :size="32"
          :clickable="false"
        />
        <div class="im-conversation-group-request__item-body">
          <div class="im-conversation-group-request__item-name truncate">
            {{ item.userNickname || `用户 ${item.userId}` }}
            <span v-if="item.inviterUserId" class="im-conversation-group-request__item-inviter">
              ← {{ item.inviterNickname || `用户 ${item.inviterUserId}` }} 邀请
            </span>
          </div>
          <div v-if="item.applyContent" class="im-conversation-group-request__item-msg truncate">
            {{ item.applyContent }}
          </div>
        </div>
        <div class="im-conversation-group-request__item-actions">
          <el-button
            size="small"
            type="primary"
            :loading="actingId === item.id"
            @click="handleAgree(item)"
          >
            同意
          </el-button>
          <el-button size="small" :loading="actingId === item.id" @click="handleRefuse(item)">
            拒绝
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useUserStore } from '@/store/modules/user'

import type { ImGroupRequestRespVO } from '@/api/im/group/request'
import { ImGroupMemberRole } from '@/views/im/utils/constants'
import { useGroupStore } from '../../../../store/groupStore'
import { useGroupRequestStore } from '../../../../store/groupRequestStore'
import UserAvatar from '../../../../components/user/UserAvatar.vue'

defineOptions({ name: 'ImConversationGroupRequestPending' })

const props = defineProps<{
  groupId: number
}>()

const userStore = useUserStore()
const groupStore = useGroupStore()
const groupRequestStore = useGroupRequestStore()
const message = useMessage()

const expanded = ref(false)
const actingId = ref<number | null>(null)

/** 当前群（含 ownerUserId / members） */
const group = computed(() => groupStore.getGroup(props.groupId))

/** 当前用户在群里的角色；优先用 group.members，懒加载未到时回退到 ownerUserId 直判 */
const myRole = computed(() => {
  const myId = Number(userStore.getUser?.id) || 0
  if (group.value?.ownerUserId === myId) {
    return ImGroupMemberRole.OWNER
  }
  return group.value?.members?.find((m) => m.userId === myId)?.role
})

/** 仅群主 / 管理员可见 */
const canManage = computed(
  () => myRole.value === ImGroupMemberRole.OWNER || myRole.value === ImGroupMemberRole.ADMIN
)

/** 当前群未处理申请数；从 store 派生 */
const pendingCount = computed(() => groupRequestStore.getUnhandledCountByGroupId(props.groupId))

/** 当前群未处理申请列表；Drawer 内容 */
const list = computed<ImGroupRequestRespVO[]>(() =>
  groupRequestStore.getUnhandledListByGroupId(props.groupId)
)

/** 切群时收起 */
watch(
  () => props.groupId,
  () => {
    expanded.value = false
  }
)

/** 同意申请 */
async function handleAgree(item: ImGroupRequestRespVO) {
  if (actingId.value !== null) return
  actingId.value = item.id
  try {
    await groupRequestStore.agreeRequest(item.id)
    message.success('已同意')
    if (list.value.length === 0) {
      expanded.value = false
    }
  } finally {
    actingId.value = null
  }
}

/** 拒绝申请 */
async function handleRefuse(item: ImGroupRequestRespVO) {
  if (actingId.value !== null) return
  let handleContent = ''
  try {
    const result = await message.prompt('请输入拒绝理由（可选）', '拒绝申请')
    handleContent = result.value || ''
  } catch {
    return
  }
  actingId.value = item.id
  try {
    await groupRequestStore.refuseRequest(item.id, handleContent || undefined)
    message.success('已拒绝')
    if (list.value.length === 0) {
      expanded.value = false
    }
  } finally {
    actingId.value = null
  }
}
// todo @AI：下面的 style 可以换成 unocss 么？
</script>

<style scoped>
.im-conversation-group-request {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 16px 8px;
  background-color: var(--el-fill-color-light);
}

.im-conversation-group-request__row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 360px;
  padding: 6px 12px;
  background-color: var(--el-bg-color);
  border-radius: 10px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.im-conversation-group-request__row--clickable {
  cursor: pointer;
}
.im-conversation-group-request__row--clickable:hover {
  background-color: var(--el-fill-color-lighter);
}

.im-conversation-group-request__icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.im-conversation-group-request__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.im-conversation-group-request__chevron {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.im-conversation-group-request__list {
  position: absolute;
  top: 100%;
  margin-top: -1px;
  left: 6px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 380px;
  max-height: 360px;
  overflow-y: auto;
  padding: 12px;
  border-radius: 12px;
  background-color: var(--el-bg-color);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.im-conversation-group-request__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
}

.im-conversation-group-request__item-body {
  flex: 1;
  min-width: 0;
}

.im-conversation-group-request__item-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.im-conversation-group-request__item-inviter {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.im-conversation-group-request__item-msg {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.im-conversation-group-request__item-actions {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
}
</style>
