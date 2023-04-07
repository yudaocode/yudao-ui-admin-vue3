<template>
  <Dialog title="详情" v-model="dialogVisible" :scroll="true" :max-height="500">
    <el-descriptions border :column="1">
      <el-descriptions-item label="任务编号" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="任务名称">
        {{ detailData.name }}
      </el-descriptions-item>
      <el-descriptions-item label="所属流程">
        {{ detailData.processInstance.name }}
      </el-descriptions-item>
      <el-descriptions-item label="流程发起人">
        {{ detailData.processInstance.startUserNickname }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT" :value="detailData.result" />
      </el-descriptions-item>
      <el-descriptions-item label="原因">
        {{ detailData.reason }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as TaskApi from '@/api/bpm/task'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref() // 详情数据

/** 打开弹窗 */
const open = async (data: TaskApi.TaskVO) => {
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
