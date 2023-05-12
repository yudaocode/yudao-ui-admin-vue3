<template>
  <el-card v-loading="loading" class="box-card">
    <template #header>
      <span class="el-icon-picture-outline">审批记录</span>
    </template>
    <el-col :offset="4" :span="16">
      <div class="block">
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in tasks"
            :key="index"
            :icon="getTimelineItemIcon(item)"
            :type="getTimelineItemType(item)"
          >
            <p style="font-weight: 700">任务：{{ item.name }}</p>
            <el-card :body-style="{ padding: '10px' }">
              <label v-if="item.assigneeUser" style="font-weight: normal; margin-right: 30px">
                审批人：{{ item.assigneeUser.nickname }}
                <el-tag size="small" type="info">{{ item.assigneeUser.deptName }}</el-tag>
              </label>
              <label v-if="item.createTime" style="font-weight: normal">创建时间：</label>
              <label style="color: #8a909c; font-weight: normal">
                {{ formatDate(item?.createTime) }}
              </label>
              <label v-if="item.endTime" style="margin-left: 30px; font-weight: normal">
                审批时间：
              </label>
              <label v-if="item.endTime" style="color: #8a909c; font-weight: normal">
                {{ formatDate(item?.endTime) }}
              </label>
              <label v-if="item.durationInMillis" style="margin-left: 30px; font-weight: normal">
                耗时：
              </label>
              <label v-if="item.durationInMillis" style="color: #8a909c; font-weight: normal">
                {{ formatPast2(item?.durationInMillis) }}
              </label>
              <p v-if="item.reason">
                <el-tag :type="getTimelineItemType(item)">{{ item.reason }}</el-tag>
              </p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-col>
  </el-card>
</template>
<script lang="ts" name="BpmProcessInstanceTaskList" setup>
import { formatDate, formatPast2 } from '@/utils/formatTime'
import { propTypes } from '@/utils/propTypes'

defineProps({
  loading: propTypes.bool, // 是否加载中
  tasks: propTypes.array // 流程任务的数组
})

/** 获得任务对应的 icon */
const getTimelineItemIcon = (item) => {
  if (item.result === 1) {
    return 'el-icon-time'
  }
  if (item.result === 2) {
    return 'el-icon-check'
  }
  if (item.result === 3) {
    return 'el-icon-close'
  }
  if (item.result === 4) {
    return 'el-icon-remove-outline'
  }
  return ''
}

/** 获得任务对应的颜色 */
const getTimelineItemType = (item) => {
  if (item.result === 1) {
    return 'primary'
  }
  if (item.result === 2) {
    return 'success'
  }
  if (item.result === 3) {
    return 'danger'
  }
  if (item.result === 4) {
    return 'info'
  }
  return ''
}
</script>
