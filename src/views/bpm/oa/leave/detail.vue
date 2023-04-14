<template>
  <Dialog v-model="dialogVisible" :max-height="200" :scroll="true" title="详情">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="请假类型">
        <dict-tag :type="DICT_TYPE.BPM_OA_LEAVE_TYPE" :value="detailData.type" />
      </el-descriptions-item>
      <el-descriptions-item label="开始时间">
        {{ formatDate(detailData.startTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="结束时间">
        {{ formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="原因">
        {{ detailData.reason }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" name="BpmOALeaveDetail" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as LeaveApi from '@/api/bpm/leave'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref() // 详情数据

/** 打开弹窗 */
const open = async (data: LeaveApi.LeaveVO) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = data
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
