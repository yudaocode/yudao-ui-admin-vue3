<template>
  <Dialog v-model="dialogVisible" title="任务详细" width="700px">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="任务编号" min-width="60">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="任务名称">
        {{ detailData.name }}
      </el-descriptions-item>
      <el-descriptions-item label="任务名称">
        <dict-tag :type="DICT_TYPE.INFRA_JOB_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item label="处理器的名字">
        {{ detailData.handlerName }}
      </el-descriptions-item>
      <el-descriptions-item label="处理器的参数">
        {{ detailData.handlerParam }}
      </el-descriptions-item>
      <el-descriptions-item label="Cron 表达式">
        {{ detailData.cronExpression }}
      </el-descriptions-item>
      <el-descriptions-item label="重试次数">
        {{ detailData.retryCount }}
      </el-descriptions-item>
      <el-descriptions-item label="重试间隔">
        {{ detailData.retryInterval + ' 毫秒' }}
      </el-descriptions-item>
      <el-descriptions-item label="监控超时时间">
        {{ detailData.monitorTimeout > 0 ? detailData.monitorTimeout + ' 毫秒' : '未开启' }}
      </el-descriptions-item>
      <el-descriptions-item label="后续执行时间">
        <el-timeline>
          <el-timeline-item
            v-for="(nextTime, index) in nextTimes"
            :key="index"
            :timestamp="formatDate(nextTime)"
          >
            第 {{ index + 1 }} 次
          </el-timeline-item>
        </el-timeline>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as JobApi from '@/api/infra/job'

defineOptions({ name: 'InfraJobDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({}) // 详情数据
const nextTimes = ref([]) // 下一轮执行时间的数组

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 查看，设置数据
  if (id) {
    detailLoading.value = true
    try {
      detailData.value = await JobApi.getJob(id)
      // 获取下一次执行时间
      nextTimes.value = await JobApi.getJobNextTimes(id)
    } finally {
      detailLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
