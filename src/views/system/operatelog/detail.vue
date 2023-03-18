<template>
  <Dialog title="详情" v-model="modelVisible" :scroll="true" :max-height="500" width="800">
    <el-descriptions border :column="1">
      <el-descriptions-item label="日志主键" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="链路追踪">
        {{ detailData.traceId }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人编号">
        {{ detailData.userId }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人名字">
        {{ detailData.userNickname }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人 IP">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人 UA">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item label="操作模块">
        {{ detailData.module }}
      </el-descriptions-item>
      <el-descriptions-item label="操作名">
        {{ detailData.name }}
      </el-descriptions-item>
      <el-descriptions-item label="操作内容" v-if="detailData.content">
        {{ detailData.content }}
      </el-descriptions-item>
      <el-descriptions-item label="操作拓展参数" v-if="detailData.exts">
        {{ detailData.exts }}
      </el-descriptions-item>
      <el-descriptions-item label="请求 URL">
        {{ detailData.requestMethod }} {{ detailData.requestUrl }}
      </el-descriptions-item>
      <el-descriptions-item label="Java 方法名">
        {{ detailData.javaMethod }}
      </el-descriptions-item>
      <el-descriptions-item label="Java 方法参数">
        {{ detailData.javaMethodArgs }}
      </el-descriptions-item>
      <el-descriptions-item label="操作时间">
        {{ formatDate(detailData.startTime, 'YYYY-MM-DD HH:mm:ss') }}
      </el-descriptions-item>
      <el-descriptions-item label="执行时长">{{ detailData.duration }} ms</el-descriptions-item>
      <el-descriptions-item label="操作结果">
        <div v-if="detailData.resultCode === 0">正常</div>
        <div v-else>失败({{ detailData.resultCode }})</div>
      </el-descriptions-item>
      <el-descriptions-item label="操作结果" v-if="detailData.resultCode === 0">
        {{ detailData.resultData }}
      </el-descriptions-item>
      <el-descriptions-item label="失败提示" v-if="detailData.resultCode > 0">
        {{ detailData.resultMsg }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import * as OperateLogApi from '@/api/system/operatelog'

const modelVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref() // 详情数据

/** 打开弹窗 */
const openModal = async (data: OperateLogApi.OperateLogVO) => {
  modelVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = data
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗
</script>
