<template>
  <!--
    群信息浮层（与 UserInfoCard 对位）
    - 仅承担「浮层定位 + 关闭逻辑（点遮罩 / Esc）」，群信息视觉走 <GroupInfo>，与通讯录详情共用一份组件
    - 触发：useImUiStore.openGroupInfoCardAtEvent(group, e)
    - GroupInfo 内部按 groupStore 缓存推导 member / stranger，浮层只负责接 chat / apply 事件做业务
  -->
  <teleport to="body">
    <div v-if="card.show" class="fixed inset-0 z-9998" @click.self="handleClose">
      <div
        class="fixed w-80 p-4 bg-[var(--el-bg-color-overlay)] rounded-md shadow-xl"
        :style="{ left: card.position.x + 'px', top: card.position.y + 'px' }"
        @click.stop
      >
        <GroupInfo v-if="card.group" :group="card.group" @chat="handleChat" @apply="handleApply" />
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import GroupInfo from './GroupInfo.vue'
import { useImUiStore } from '../../store/uiStore'
import { useConversationStore } from '../../store/conversationStore'
import { useGroupStore } from '../../store/groupStore'
import { applyJoinGroup } from '@/api/im/home/group/request'
import { ImConversationType, ImGroupAddSource } from '../../../utils/constants'
import type { GroupLite } from '../../types'

defineOptions({ name: 'ImGroupInfoCard' })

const uiStore = useImUiStore()
const conversationStore = useConversationStore()
const groupStore = useGroupStore()
const router = useRouter()

const card = computed(() => uiStore.groupInfoCard)

/** 关闭浮层 */
function handleClose() {
  uiStore.closeGroupInfoCard()
}

/** Esc 关闭 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && card.value.show) {
    handleClose()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

/** 进入群聊：取本地最新群信息（含 silent / 群备注），新建或激活会话 + 跳路由 */
function handleChat(group: GroupLite) {
  const cached = groupStore.getGroup(group.id)
  conversationStore.openConversation(
    group.id,
    ImConversationType.GROUP,
    cached?.name || group.name || '',
    cached?.avatar || group.showImage || '',
    { silent: !!cached?.silent }
  )
  if (router.currentRoute.value.name !== 'ImHomeConversation') {
    router.push({ name: 'ImHomeConversation' })
  }
  handleClose()
}

/** 加入群聊：先关浮层（避免与 prompt 的 mask 互相遮挡）→ 弹申请理由（可选）→ applyJoinGroup */
async function handleApply(group: GroupLite) {
  handleClose()
  let applyContent = ''
  try {
    const result = await ElMessageBox.prompt(`申请加入「${group.name || ''}」`, '申请加群', {
      confirmButtonText: '发送申请',
      cancelButtonText: '取消',
      inputPlaceholder: '请填写验证消息（可选）',
      inputValue: ''
    })
    applyContent = (result.value || '').trim()
  } catch {
    return
  }
  await applyJoinGroup({
    groupId: group.id,
    applyContent: applyContent || undefined,
    addSource: ImGroupAddSource.SHARE_LINK
  })
  ElMessage.success('加群申请已发送')
}
</script>
