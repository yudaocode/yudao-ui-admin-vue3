<template>
  <!--
    群消息已读状态（对应 boxim chat/ChatGroupReaded.vue）
    - 标签形态：展示「N 已读」或「全部已读」；点击弹出 tab 列出具体成员
    - 仅在群聊、自己发送、已送达的消息下使用
    - 依赖 getGroupReadUsers API 拉已读人列表；未读列表由群成员减去已读得出
  -->
  <el-popover
    v-model:visible="popVisible"
    placement="left"
    trigger="click"
    :width="320"
    @show="loadReadUsers"
  >
    <template #reference>
      <span class="im-message-read-status">
        {{ label }}
      </span>
    </template>

    <el-tabs v-model="activeTab" stretch>
      <el-tab-pane :label="`已读(${readMembers.length})`" name="read">
        <PagedScroller :items="readMembers" :page-size="20" class="im-message-read-status__scroll">
          <template #default="{ item }">
            <ChatGroupMember :member="(item as GroupMemberLite)" :height="40" :clickable="false" />
          </template>
        </PagedScroller>
        <div v-if="readMembers.length === 0" class="im-message-read-status__empty">暂无已读</div>
      </el-tab-pane>
      <el-tab-pane :label="`未读(${unreadMembers.length})`" name="unread">
        <PagedScroller :items="unreadMembers" :page-size="20" class="im-message-read-status__scroll">
          <template #default="{ item }">
            <ChatGroupMember :member="(item as GroupMemberLite)" :height="40" :clickable="false" />
          </template>
        </PagedScroller>
        <div v-if="unreadMembers.length === 0" class="im-message-read-status__empty">全部已读</div>
      </el-tab-pane>
    </el-tabs>
  </el-popover>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { getGroupReadUsers } from '@/api/im/message/group'
import { ImGroupReceiptStatus } from '../../../../../utils/constants'
import type { MessageInfo } from '../../../../types'
import ChatGroupMember, { type GroupMemberLite } from '../ChatGroupMember.vue'
import PagedScroller from '../../../../components/PagedScroller.vue'

defineOptions({ name: 'ImMessageReadStatus' })

const props = defineProps<{
  message: MessageInfo
  /** 当前群所有成员（第一期外部传入；没有就传空数组，未读列表会空） */
  groupMembers: GroupMemberLite[]
  /** 当前群 id */
  groupId: string
}>()

const popVisible = ref(false)
const activeTab = ref<'read' | 'unread'>('read')
const readUserIds = ref<string[]>([])

const label = computed(() => {
  if (props.message.receiptStatus === ImGroupReceiptStatus.DONE) return '全部已读'
  const n = props.message.readCount || 0
  return n > 0 ? `${n} 人已读` : '未读'
})

const readMembers = computed(() =>
  props.groupMembers.filter(
    (m) =>
      !m.quit &&
      String(m.userId) !== String(props.message.sendId) &&
      readUserIds.value.includes(String(m.userId))
  )
)

const unreadMembers = computed(() =>
  props.groupMembers.filter(
    (m) =>
      !m.quit &&
      String(m.userId) !== String(props.message.sendId) &&
      !readUserIds.value.includes(String(m.userId))
  )
)

async function loadReadUsers() {
  if (!props.message.id) return
  try {
    const res = await getGroupReadUsers({
      groupId: props.groupId,
      messageId: props.message.id
    })
    readUserIds.value = (res || []).map(String)
  } catch (e) {
    console.error('[IM] 拉取群已读列表失败:', e)
  }
}
</script>

<style scoped>
.im-message-read-status {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  cursor: pointer;
}

.im-message-read-status:hover {
  color: #409eff;
}

.im-message-read-status__scroll {
  height: 300px;
}

.im-message-read-status__empty {
  padding: 20px 0;
  font-size: 12px;
  color: #c0c4cc;
  text-align: center;
}
</style>
