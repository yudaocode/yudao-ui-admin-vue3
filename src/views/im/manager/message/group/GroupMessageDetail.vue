<template>
  <el-dialog v-model="dialogVisible" title="群聊消息详情" width="700">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="客户端编号">{{
        detail.clientMessageId || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="群">
        {{ detail.groupName }} ({{ detail.groupId }})
      </el-descriptions-item>
      <el-descriptions-item label="发送人">
        {{ detail.senderNickname }} ({{ detail.senderId }})
      </el-descriptions-item>
      <el-descriptions-item label="类型">
        <dict-tag :type="DICT_TYPE.IM_CONTENT_TYPE" :value="detail.type" />
      </el-descriptions-item>
      <el-descriptions-item v-if="MESSAGE_GROUP_READ_ENABLED" label="状态">
        <dict-tag :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="detail.status" />
      </el-descriptions-item>
      <el-descriptions-item v-if="MESSAGE_GROUP_READ_ENABLED" label="回执">
        <dict-tag :type="DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS" :value="detail.receiptStatus" />
      </el-descriptions-item>
      <el-descriptions-item label="@用户" :span="2">
        <template v-if="detail.atUserIds?.length">
          <span v-for="(userId, idx) in detail.atUserIds" :key="userId">
            <span v-if="idx > 0">、</span>
            <template v-if="userId === IM_AT_ALL_USER_ID">@{{ IM_AT_ALL_NICKNAME }}</template>
            <template v-else>
              @{{ detail.atUserNicknames?.[idx] || userId }}
              <span class="text-gray-400">({{ userId }})</span>
            </template>
          </span>
        </template>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="发送时间" :span="2">
        {{ formatDate(detail.sendTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="消息内容" :span="2">
        <MessageContentPreview
          :type="detail.type"
          :content="detail.content"
          :sender-nickname="detail.senderNickname"
        />
      </el-descriptions-item>
      <el-descriptions-item label="原始 JSON" :span="2">
        <pre
          class="m-0 whitespace-pre-wrap break-all font-mono text-12px bg-[#f5f5f5] p-8px rounded-4px"
          >{{ formatJson(detail.content) }}</pre
        >
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { IM_AT_ALL_NICKNAME, IM_AT_ALL_USER_ID } from '@/views/im/utils/constants'
import { formatJson } from '@/views/im/utils/message'
import { MESSAGE_GROUP_READ_ENABLED } from '@/views/im/utils/config'
import * as ManagerGroupMessageApi from '@/api/im/manager/message/group'
import MessageContentPreview from '../MessageContentPreview.vue'

defineOptions({ name: 'ImGroupMessageDetail' })

const dialogVisible = ref(false) // 弹窗的显示
const detail = ref<ManagerGroupMessageApi.ImManagerGroupMessageVO>(
  {} as ManagerGroupMessageApi.ImManagerGroupMessageVO
) // 当前详情数据

/** 打开详情弹窗 */
const open = (row: ManagerGroupMessageApi.ImManagerGroupMessageVO) => {
  detail.value = row
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
