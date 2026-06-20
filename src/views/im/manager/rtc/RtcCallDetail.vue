<template>
  <el-drawer v-model="drawerVisible" title="通话记录详情" size="900px" :destroy-on-close="true">
    <!-- 基础信息 -->
    <el-descriptions :column="2" border>
      <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="业务通话编号">{{ detail.room }}</el-descriptions-item>
      <el-descriptions-item label="发起人">
        {{ detail.inviterNickname || '-' }} ({{ detail.inviterUserId }})
      </el-descriptions-item>
      <el-descriptions-item label="会话类型">
        <dict-tag
          :type="DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE"
          :value="detail.conversationType"
        />
      </el-descriptions-item>
      <el-descriptions-item label="群">
        <span v-if="detail.groupId"> {{ detail.groupName || '-' }} ({{ detail.groupId }}) </span>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="媒体类型">
        <dict-tag :type="DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE" :value="detail.mediaType" />
      </el-descriptions-item>
      <el-descriptions-item label="通话状态">
        <dict-tag :type="DICT_TYPE.IM_RTC_CALL_STATUS" :value="detail.status" />
      </el-descriptions-item>
      <el-descriptions-item label="结束原因">
        <dict-tag
          v-if="detail.endReason"
          :type="DICT_TYPE.IM_RTC_CALL_END_REASON"
          :value="detail.endReason"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="发起时间">{{
        formatDate(detail.startTime)
      }}</el-descriptions-item>
      <el-descriptions-item label="接通时间">
        {{ detail.acceptTime ? formatDate(detail.acceptTime) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ detail.endTime ? formatDate(detail.endTime) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="通话时长">{{ duration }}</el-descriptions-item>
    </el-descriptions>

    <!-- 参与者列表 -->
    <div class="mt-20px mb-15px font-bold">参与者列表</div>
    <el-table v-loading="loading" :data="participants" border>
      <el-table-column label="用户编号" prop="userId" width="120" align="center" />
      <el-table-column label="昵称" prop="userNickname" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.userNickname || '-' }}</template>
      </el-table-column>
      <el-table-column label="参与角色" prop="role" width="120" align="center">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_RTC_PARTICIPANT_ROLE" :value="row.role" />
        </template>
      </el-table-column>
      <el-table-column label="参与状态" prop="status" width="120" align="center">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_RTC_PARTICIPANT_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="被邀请时间"
        prop="inviteTime"
        width="170"
        align="center"
        :formatter="dateFormatter"
      />
      <el-table-column label="接听时间" prop="acceptTime" width="170" align="center">
        <template #default="{ row }">
          {{ row.acceptTime ? formatDate(row.acceptTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="离开时间" prop="leaveTime" width="170" align="center">
        <template #default="{ row }">
          {{ row.leaveTime ? formatDate(row.leaveTime) : '-' }}
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script lang="ts" setup>
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import * as ManagerRtcCallApi from '@/api/im/manager/rtc'
import { resolveCallDuration } from '@/views/im/utils/time'

defineOptions({ name: 'ImRtcCallDetail' })

const drawerVisible = ref(false)
const detail = ref<ManagerRtcCallApi.ImManagerRtcCallVO>({} as ManagerRtcCallApi.ImManagerRtcCallVO)
const loading = ref(false)
const participants = ref<ManagerRtcCallApi.ImManagerRtcParticipantVO[]>([])

/** 通话时长（接通到结束）；未接通显示 - */
const duration = computed(() => resolveCallDuration(detail.value.acceptTime, detail.value.endTime))

/** 打开详情，加载参与者 */
const open = async (row: ManagerRtcCallApi.ImManagerRtcCallVO) => {
  detail.value = row
  drawerVisible.value = true
  loading.value = true
  try {
    participants.value = await ManagerRtcCallApi.getManagerRtcCallParticipantList(row.id)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
