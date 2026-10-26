<template>
  <div v-loading="loading" class="leave-process-detail">
    <div class="form-title">员工请假申请</div>
    <el-descriptions v-if="leave" :column="2" border>
      <el-descriptions-item label="员工姓名">{{ leave.employeeName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="请假类型">
        <dict-tag :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE" :value="leave.type" />
      </el-descriptions-item>
      <el-descriptions-item label="开始时间">
        {{ formatDate(leave.startTime) || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ formatDate(leave.endTime) || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="请假天数">{{ leave.day }} 天</el-descriptions-item>
      <el-descriptions-item label="审批状态">
        <dict-tag
          v-if="leave.approvalStatus !== undefined"
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="leave.approvalStatus"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="请假事由" :span="2">
        {{ leave.reason || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">
        {{ leave.remark || '-' }}
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as AttendanceLeaveApi from '@/api/hrm/attendance/leave'

defineOptions({ name: 'HrmAttendanceLeaveProcessDetail' })

const props = defineProps<{ id: string }>() // 组件属性
const loading = ref(false) // 加载中
const leave = ref<AttendanceLeaveApi.HrmAttendanceLeaveVO>() // 请假详情

/** 获取请假详情 */
async function getLeave() {
  const id = parseId(props.id)
  if (!id) {
    return
  }
  loading.value = true
  try {
    leave.value = await AttendanceLeaveApi.getAttendanceLeave(id)
  } finally {
    loading.value = false
  }
}

/** 监听请假记录编号变化 */
watch(() => props.id, getLeave, { immediate: true })
</script>

<style scoped>
.leave-process-detail {
  min-height: 220px;
  padding: 4px 0 20px;
}

.form-title {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}
</style>
