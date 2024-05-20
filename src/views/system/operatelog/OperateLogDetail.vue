<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" title="详情" width="800">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="日志主键" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="链路追踪" v-if="detailData.traceId">
        {{ detailData.traceId }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人编号">
        {{ detailData.userId }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人名字">
        {{ detailData.userName }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人 IP">
        {{ detailData.userIp }}
      </el-descriptions-item>
      <el-descriptions-item label="操作人 UA">
        {{ detailData.userAgent }}
      </el-descriptions-item>
      <el-descriptions-item label="操作模块">
        {{ detailData.type }}
      </el-descriptions-item>
      <el-descriptions-item label="操作名">
        {{ detailData.subType }}
      </el-descriptions-item>
      <el-descriptions-item label="操作内容">
        {{ detailData.action }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.extra" label="操作拓展参数">
        {{ detailData.extra }}
      </el-descriptions-item>
      <el-descriptions-item label="请求 URL">
        {{ detailData.requestMethod }} {{ detailData.requestUrl }}
      </el-descriptions-item>
      <el-descriptions-item label="操作时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="业务编号">
        {{ detailData.bizId }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as OperateLogApi from '@/api/system/operatelog'

defineOptions({ name: 'SystemOperateLogDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({} as OperateLogApi.OperateLogVO) // 详情数据

/** 打开弹窗 */
const open = async (data: OperateLogApi.OperateLogVO) => {
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
