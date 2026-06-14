<template>
  <!--
    群消息已读状态
    - 标签形态：展示「N 已读」或「全部已读」；点击弹出 popover 用 tab 列出已读 / 未读成员
    - 渲染条件：仅在群聊、自己发送、receiptStatus !== NO_RECEIPT 时挂出（由 MessageItem 把关）
    - 已读名单按需拉：popover 触发 show 才打 /im/message/group/get-read-users，避免每条群消息都预拉
    - 未读名单 = 当前群成员 − 自己 − 已退群 − 已读集合（前端聚合，后端只回已读 userId）
  -->
  <el-popover
    v-model:visible="popVisible"
    placement="left"
    trigger="click"
    :width="320"
    @show="loadReadUsers"
  >
    <template #reference>
      <span
        class="text-12px whitespace-nowrap cursor-pointer text-[var(--el-text-color-secondary)] hover:text-[#409eff]"
      >
        {{ label }}
      </span>
    </template>

    <el-tabs v-model="activeTab" stretch>
      <el-tab-pane :label="`已读(${readMembers.length})`" name="read">
        <PagedScroller :items="readMembers" :page-size="20" item-key="userId" class="h-75">
          <template #default="{ item }">
            <GroupMember :member="item as GroupMemberLite" :height="40" :clickable="false" />
          </template>
        </PagedScroller>
        <div
          v-if="readMembers.length === 0"
          class="py-5 text-12px text-center text-[var(--el-text-color-disabled)]"
        >
          {{ groupMembers.length === 0 ? '群成员未加载' : '暂无已读' }}
        </div>
      </el-tab-pane>
      <el-tab-pane :label="`未读(${unreadMembers.length})`" name="unread">
        <PagedScroller :items="unreadMembers" :page-size="20" item-key="userId" class="h-75">
          <template #default="{ item }">
            <GroupMember :member="item as GroupMemberLite" :height="40" :clickable="false" />
          </template>
        </PagedScroller>
        <div
          v-if="unreadMembers.length === 0"
          class="py-5 text-12px text-center text-[var(--el-text-color-disabled)]"
        >
          {{ groupMembers.length === 0 ? '群成员未加载' : '全部已读' }}
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-popover>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { getGroupReadUsers as apiGetGroupReadUsers } from '@/api/im/message/group'
import { CommonStatusEnum } from '@/utils/constants'
import { ImConversationType, ImMessageReceiptStatus } from '../../../../../utils/constants'
import type { Message } from '../../../../types'
import { useMessageStore } from '../../../../store/messageStore'
import GroupMember, { type GroupMemberLite } from '../../../../components/group/GroupMember.vue'
import PagedScroller from '../../../../components/PagedScroller.vue'

defineOptions({ name: 'ImMessageReadStatus' })

const props = defineProps<{
  message: Message
  // 当前群所有成员（外部 MessagePanel.groupMembers 传入；没有就传空数组，未读列表会变空但不报错）
  groupMembers: GroupMemberLite[]
  // 当前群编号；供 loadReadUsers 作为 /im/message/group/get-read-users 的入参
  groupId: number
}>()

const messageStore = useMessageStore()

// popover 开关：show 时拉已读名单，关闭后保留 readUserIds 缓存（重开同一条消息不再请求）
const popVisible = ref(false)
const activeTab = ref<'read' | 'unread'>('read')
// 服务端返回的"已读这条消息的 userId 列表"，未读靠 visibleMembers 减去这份得到
const readUserIds = ref<number[]>([])

/**
 * 标签文案：
 * - receiptStatus === DONE：服务端确认全员已读 → 直接显示"全部已读"，readCount 不再使用
 * - readCount > 0：显示"N 人已读"
 * - 其他（readCount = 0 或 undefined，且未到 DONE）：显示"未读"
 */
const label = computed(() => {
  if (props.message.receiptStatus === ImMessageReceiptStatus.DONE) {
    return '全部已读'
  }
  const readCount = props.message.readCount || 0
  return readCount > 0 ? `${readCount} 人已读` : '未读'
})

/**
 * 这条消息"应该被谁看到"的可见成员集合（已读 / 未读两个 tab 共用基底）
 *
 * 三层过滤：
 * 1. 定向群消息：receiverUserIds 非空时，只算名单内的成员。少了这层，未在投递范围里的人
 *    会被错算成"未读"（getGroupReadUsers 后端已按可见性过滤，前端必须配套）
 * 2. 发送者本人：自己发的消息算不算"自己已读"语义模糊，索性两个 tab 都不展示
 * 3. 已退群（status === DISABLE）：他读没读已经不关心，UI 不展示
 */
const visibleMembers = computed<GroupMemberLite[]>(() => {
  const receiverUserIds = props.message.receiverUserIds
  const isDirected = !!receiverUserIds && receiverUserIds.length > 0
  return props.groupMembers.filter(
    (member) =>
      member.status !== CommonStatusEnum.DISABLE &&
      member.userId !== props.message.senderId &&
      (!isDirected || receiverUserIds.includes(member.userId))
  )
})

/** 已读 = 可见成员 ∩ readUserIds */
const readMembers = computed(() =>
  visibleMembers.value.filter((member) => readUserIds.value.includes(member.userId))
)

/** 未读 = 可见成员 − readUserIds */
const unreadMembers = computed(() =>
  visibleMembers.value.filter((member) => !readUserIds.value.includes(member.userId))
)

/**
 * 拉取已读用户 id 列表
 *
 * 触发：el-popover @show（按需懒加载，避免每条群消息都预拉）
 * 跳过：本地占位消息（id = 0，还没拿到服务端 id），后端没法按 messageId 查
 * 失败：仅控制台告警，readUserIds 保持空数组 → label 走 readCount 兜底，不阻塞 UI
 *
 * 拉到名单后顺手把 readCount / receiptStatus 回写到 messageStore，让 popover 外面的
 * label 也跟着走最新数：离线 / 漏收 RECEIPT 事件时本地 readCount 会偏旧，弹层里看到"已读 5"
 * 但外面仍是"未读"或旧人数；这里以服务端返回为准矫正回去
 */
async function loadReadUsers() {
  if (!props.message.id) {
    return
  }
  try {
    const userIds = await apiGetGroupReadUsers({
      groupId: props.groupId,
      messageId: props.message.id
    })
    readUserIds.value = userIds || []
    const readCount = readUserIds.value.length
    // 全可见成员都已读 → 更新为 DONE，让外面 label 直接命中「全部已读」分支；
    // 否则只更新 readCount，receiptStatus 维持不变（PENDING）
    const allRead = readCount > 0 && readCount >= visibleMembers.value.length
    messageStore.applyMessageReadReceipt({
      conversationType: ImConversationType.GROUP,
      targetId: props.groupId,
      groupMessageId: props.message.id,
      readCount,
      receiptStatus: allRead ? ImMessageReceiptStatus.DONE : undefined
    })
  } catch (error) {
    console.error('[IM] 拉取群已读列表失败:', error)
  }
}
</script>
