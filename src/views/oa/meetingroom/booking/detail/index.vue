<template>
  <ContentWrap>
    <!-- 会议室预定信息 -->
    <el-descriptions v-loading="detailLoading" :column="2" border>
      <el-descriptions-item label="预定单号">{{ detailData.no }}</el-descriptions-item>
      <el-descriptions-item label="会议室">{{ detailData.roomName }}</el-descriptions-item>
      <el-descriptions-item label="位置">{{ detailData.roomLocation }}</el-descriptions-item>
      <el-descriptions-item label="会议室类型">
        <DictTag
          v-if="detailData.roomType !== undefined"
          :type="DICT_TYPE.OA_MEETING_ROOM_TYPE"
          :value="detailData.roomType"
        />
      </el-descriptions-item>
      <el-descriptions-item label="会议主题">{{ detailData.title }}</el-descriptions-item>
      <el-descriptions-item label="申请人">{{ detailData.creatorName }}</el-descriptions-item>
      <el-descriptions-item label="申请部门">{{ detailData.deptName }}</el-descriptions-item>
      <el-descriptions-item label="主持人">{{ detailData.moderatorName }}</el-descriptions-item>
      <el-descriptions-item label="开始时间">
        {{ formatDate(detailData.startTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="参会人">
        {{ detailData.attendeeNames?.join('、') }}
      </el-descriptions-item>
      <el-descriptions-item label="提醒方式">
        <DictTag
          v-if="detailData.reminderType !== undefined"
          :type="DICT_TYPE.OA_MEETING_ROOM_REMINDER_TYPE"
          :value="detailData.reminderType"
        />
      </el-descriptions-item>
      <el-descriptions-item label="审批状态">
        <el-tag v-if="detailData.status === BpmProcessInstanceStatus.NOT_START" type="info">
          未提交
        </el-tag>
        <DictTag
          v-else-if="detailData.status !== undefined"
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detailData.status"
        />
      </el-descriptions-item>
      <el-descriptions-item label="使用状态">
        <DictTag
          v-if="detailData.useStatus !== undefined"
          :type="DICT_TYPE.OA_MEETING_ROOM_USE_STATUS"
          :value="detailData.useStatus"
        />
      </el-descriptions-item>
      <el-descriptions-item label="需要审批">
        <DictTag
          v-if="detailData.needApproval != null"
          :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
          :value="detailData.needApproval"
        />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="会议内容">{{ detailData.description }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detailData.remark }}</el-descriptions-item>
      <el-descriptions-item label="附件" :span="2">
        <UploadFile :model-value="detailData.fileUrls" disabled :is-show-tip="false" />
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as MeetingRoomBookingApi from '@/api/oa/meetingroom/booking'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaMeetingRoomBookingBusinessDetail' })

const props = defineProps<{ id?: number | string }>()
const route = useRoute() // 路由
const detailLoading = ref(false) // 详情加载中
const detailData = ref<MeetingRoomBookingApi.MeetingRoomBookingVO>({
  attendeeUserIds: [],
  fileUrls: []
}) // 预定详情

/** 获得预定详情 */
async function getInfo() {
  const id = props.id || route.query.id
  if (!id) return
  detailLoading.value = true
  try {
    detailData.value = await MeetingRoomBookingApi.getMeetingRoomBooking(Number(id))
  } finally {
    detailLoading.value = false
  }
}

/** 初始化及切换预定 */
watch(
  () => props.id || route.query.id,
  () => {
    getInfo()
  },
  { immediate: true }
)
</script>
