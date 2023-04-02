<template>
  <Dialog title="任务详细" v-model="dialogVisible" width="700px">
    <el-descriptions border :column="1">
      <el-descriptions-item label="日志编号" min-width="60">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="任务编号">
        {{ detailData.jobId }}
      </el-descriptions-item>
      <el-descriptions-item label="处理器的名字">
        {{ detailData.handlerName }}
      </el-descriptions-item>
      <el-descriptions-item label="处理器的参数">
        {{ detailData.handlerParam }}
      </el-descriptions-item>
      <el-descriptions-item label="第几次执行">
        {{ detailData.executeIndex }}
      </el-descriptions-item>
      <el-descriptions-item label="执行时间">
        {{ formatDate(detailData.beginTime) + ' ~ ' + formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="执行时长">
        {{ detailData.duration + ' 毫秒' }}
      </el-descriptions-item>
      <el-descriptions-item label="任务状态">
        <dict-tag :type="DICT_TYPE.INFRA_JOB_LOG_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item label="执行结果">
        {{ detailData.duration + ' result' }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as JobLogApi from '@/api/infra/jobLog'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({}) // 详情数据

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 查看，设置数据
  if (id) {
    detailLoading.value = true
    try {
      detailData.value = await JobLogApi.getJobLog(id)
    } finally {
      detailLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
