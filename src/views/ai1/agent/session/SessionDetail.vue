<template>
  <Dialog title="会话明细" v-model="dialogVisible" width="1000px">
    <el-descriptions :column="3" :label-width="100" border>
      <el-descriptions-item label="标题" :span="3">{{ session?.title }}</el-descriptions-item>
      <el-descriptions-item label="用户">
        {{ session?.userNickname || session?.userId }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(session?.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="最近活跃">
        {{ formatDate(session?.updateTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-divider content-position="left">消息列表</el-divider>
    <el-table v-loading="loading" :data="list" :stripe="true" border max-height="520">
      <el-table-column label="角色" align="center" prop="role" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI1_SESSION_MESSAGE_ROLE" :value="scope.row.role" />
        </template>
      </el-table-column>
      <el-table-column label="内容" prop="content" min-width="500">
        <template #default="scope">
          <SessionMessageReasoning :reasoning="scope.row.reasoning" />
          <MarkdownView
            v-if="scope.row.role === Ai1SessionMessageRoleEnum.ASSISTANT"
            :content="scope.row.content"
          />
          <span v-else class="whitespace-pre-wrap">{{ scope.row.content }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI1_SESSION_MESSAGE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
    </el-table>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { Session } from '@/api/ai1/session'
import { SessionMessageApi, SessionMessage } from '@/api/ai1/session/message'
import { Ai1SessionMessageRoleEnum } from '@/views/ai1/utils/constants'
import MarkdownView from '@/components/MarkdownView/index.vue'
import SessionMessageReasoning from '@/views/ai1/session/SessionMessageReasoning.vue'

/** AI1 会话明细弹窗 */
defineOptions({ name: 'Ai1SessionDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 列表的加载中
const session = ref<Session>() // 当前会话
const list = ref<SessionMessage[]>([]) // 消息列表

/** 打开弹窗 */
const open = async (row: Session) => {
  dialogVisible.value = true
  session.value = row
  list.value = []
  loading.value = true
  try {
    list.value = await SessionMessageApi.getSessionMessageList(row.id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
