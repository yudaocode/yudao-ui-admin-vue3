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
            <p style="font-weight: 700">
              任务：{{ item.name }}
              <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT" :value="item.result" />
              <el-button
                style="margin-left: 5px"
                v-if="!isEmpty(item.children)"
                @click="openChildrenTask(item)"
              >
                <Icon icon="ep:memo" />
                子任务
              </el-button>
            </p>
            <el-card :body-style="{ padding: '10px' }">
              <label v-if="item.assigneeUser" style="margin-right: 30px; font-weight: normal">
                审批人：{{ item.assigneeUser.nickname }}
                <el-tag size="small" type="info">{{ item.assigneeUser.deptName }}</el-tag>
              </label>
              <label v-if="item.createTime" style="font-weight: normal">创建时间：</label>
              <label style="font-weight: normal; color: #8a909c">
                {{ formatDate(item?.createTime) }}
              </label>
              <label v-if="item.endTime" style="margin-left: 30px; font-weight: normal">
                审批时间：
              </label>
              <label v-if="item.endTime" style="font-weight: normal; color: #8a909c">
                {{ formatDate(item?.endTime) }}
              </label>
              <label v-if="item.durationInMillis" style="margin-left: 30px; font-weight: normal">
                耗时：
              </label>
              <label v-if="item.durationInMillis" style="font-weight: normal; color: #8a909c">
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
    <!-- 子任务  -->
    <ProcessInstanceChildrenTaskList ref="processInstanceChildrenTaskList" />
  </el-card>
</template>
<script lang="ts" setup>
import { formatDate, formatPast2 } from '@/utils/formatTime'
import { propTypes } from '@/utils/propTypes'
import { DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import ProcessInstanceChildrenTaskList from './ProcessInstanceChildrenTaskList.vue'

defineOptions({ name: 'BpmProcessInstanceTaskList' })

defineProps({
  loading: propTypes.bool, // 是否加载中
  tasks: propTypes.arrayOf(propTypes.object) // 流程任务的数组
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
  if (item.result === 5) {
    return 'el-icon-back'
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
  if (item.result === 5) {
    return 'warning'
  }
  if (item.result === 6) {
    return 'default'
  }
  if (item.result === 7 || item.result === 8) {
    return 'warning'
  }
  return ''
}

/**
 * 子任务
 */
const processInstanceChildrenTaskList = ref()

const openChildrenTask = (item) => {
  processInstanceChildrenTaskList.value.open(item)
}
</script>
