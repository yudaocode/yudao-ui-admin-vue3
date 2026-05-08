<template>
  <!--
    群顶部「待处理加群申请」横幅
    - 仅当登录用户是该群 owner / admin 且该群下未处理申请数 > 0 时显示
    - count 从 groupRequestStore 派生（全局存）；本端处理 / WS 通知到达后 store 自动更新
    - 点击横幅打开 GroupRequestListDialog（含历史已处理记录），不再就地展开
  -->
  <div v-if="canManage && pendingCount > 0" class="im-group-request-pending">
    <div class="im-group-request-pending__row" @click="handleOpen">
      <Icon
        icon="ant-design:user-add-outlined"
        :size="14"
        class="im-group-request-pending__icon"
      />
      <span class="im-group-request-pending__text"> 新进群申请（{{ pendingCount }}） </span>
      <Icon
        icon="ant-design:right-outlined"
        :size="11"
        class="im-group-request-pending__chevron"
      />
    </div>

    <!-- 申请列表 dialog：复用同一组件，避免群管理面板与会话顶部各写一份 -->
    <GroupRequestListDialog ref="requestListDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useUserStore } from '@/store/modules/user'

import { ImGroupMemberRole } from '@/views/im/utils/constants'
import { useGroupStore } from '../../../../store/groupStore'
import { useGroupRequestStore } from '../../../../store/groupRequestStore'
import GroupRequestListDialog from '../../../../components/group/GroupRequestListDialog.vue'

defineOptions({ name: 'ImGroupRequestPending' })

const props = defineProps<{
  groupId: number
}>()

const userStore = useUserStore()
const groupStore = useGroupStore()
const groupRequestStore = useGroupRequestStore()

/** 申请列表弹窗 ref：handleOpen 调 open({ groupId }) 触发 */
const requestListDialogRef = ref<InstanceType<typeof GroupRequestListDialog>>()

/** 打开当前群的进群申请列表 */
function handleOpen() {
  requestListDialogRef.value?.open({ groupId: props.groupId })
}

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
</script>

<style scoped>
/* 容器：align-items flex-start 让胶囊靠左、不占整行；高度由内容撑开，与置顶消息横幅节奏对齐 */
.im-group-request-pending {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 16px 8px;
  background-color: var(--el-fill-color-light);
}

/* 胶囊本体：内容自适应宽度，padding / 圆角 / 阴影对齐 GroupPinnedMessage 的 __row */
.im-group-request-pending__row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--el-bg-color);
  border-radius: 10px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: background-color 0.15s;
}
.im-group-request-pending__row:hover {
  background-color: var(--el-fill-color-lighter);
}

/* 绿色「加好友」icon：与置顶消息黄色 pushpin 同节奏，仅换色调；svg 强制 currentColor 应对暗色覆盖 */
.im-group-request-pending__icon {
  flex-shrink: 0;
  color: var(--el-color-success);
}
.im-group-request-pending__icon :deep(svg) {
  fill: currentColor !important;
}

.im-group-request-pending__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.im-group-request-pending__chevron {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}
</style>
