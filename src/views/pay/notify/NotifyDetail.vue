<template>
  <Dialog v-model="dialogVisible" title="通知详情" width="50%">
    <el-descriptions :column="2">
      <el-descriptions-item label="商户订单编号">
        <el-tag>{{ detailData.merchantOrderId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="通知状态">
        <dict-tag :type="DICT_TYPE.PAY_NOTIFY_STATUS" :value="detailData.status" />
      </el-descriptions-item>

      <el-descriptions-item label="应用编号">{{ detailData.appId }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ detailData.appName }}</el-descriptions-item>

      <el-descriptions-item label="关联编号">{{ detailData.dataId }}</el-descriptions-item>
      <el-descriptions-item label="通知类型">
        <dict-tag :type="DICT_TYPE.PAY_NOTIFY_TYPE" :value="detailData.type" />
      </el-descriptions-item>

      <el-descriptions-item label="通知次数">{{ detailData.notifyTimes }}</el-descriptions-item>
      <el-descriptions-item label="最大通知次数">
        {{ detailData.maxNotifyTimes }}
      </el-descriptions-item>

      <el-descriptions-item label="最后通知时间">
        {{ formatDate(detailData.lastExecuteTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="下次通知时间">
        {{ formatDate(detailData.nextNotifyTime) }}
      </el-descriptions-item>

      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ formatDate(detailData.updateTime) }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 分割线 -->
    <el-divider />

    <el-descriptions :column="1" direction="vertical" border>
      <el-descriptions-item label="回调日志">
        <el-table :data="detailData.logs">
          <el-table-column label="日志编号" align="center" prop="id" />
          <el-table-column label="通知状态" align="center" prop="status">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.PAY_NOTIFY_STATUS" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="通知次数" align="center" prop="notifyTimes" />
          <el-table-column label="通知时间" align="center" prop="lastExecuteTime" width="180">
            <template #default="scope">
              <span>{{ formatDate(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="响应结果" align="center" prop="response" />
        </el-table>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as PayNotifyApi from '@/api/pay/notify'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'PayNotifyDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  detailLoading.value = true
  try {
    detailData.value = await PayNotifyApi.getNotifyTaskDetail(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
