<!-- 审批详情的右侧：审批流 -->
<template>
  <el-timeline class="pt-20px">
    <!-- 遍历每个审批节点 -->
    <el-timeline-item
      v-for="(activity, index) in approveNodes"
      :key="index"
      size="large"
      :icon="getApprovalNodeIcon(activity.status, activity.nodeType)"
      :color="getApprovalNodeColor(activity.status)"
    >
      <div class="flex flex-col items-start">
        <div class="font-bold"> {{ activity.name }}</div>
        <div class="flex items-center mt-1">
          <!-- 情况一：遍历每个审批节点下的【进行中】task 任务 -->
          <div v-for="(task, idx) in activity.tasks" :key="idx" class="flex items-center">
            <div class="flex items-center flex-col pr-2">
              <div class="position-relative" v-if="task.assigneeUser || task.ownerUser">
                <!-- 信息：头像 -->
                <el-avatar
                  :size="36"
                  v-if="task.assigneeUser && task.assigneeUser.avatar"
                  :src="task.assigneeUser.avatar"
                />
                <el-avatar v-else-if="task.assigneeUser && task.assigneeUser.nickname">
                  {{ task.assigneeUser.nickname.substring(0, 1) }}
                </el-avatar>
                <el-avatar
                  v-else-if="task.ownerUser && task.ownerUser.avatar"
                  :src="task.ownerUser.avatar"
                />
                <el-avatar v-else-if="task.ownerUser && task.ownerUser.nickname">
                  {{ task.ownerUser.nickname.substring(0, 1) }}
                </el-avatar>
                <!-- 信息：任务 ICON -->
                <div
                  class="position-absolute top-26px left-26px bg-#fff rounded-full flex items-center p-2px"
                >
                  <Icon
                    :size="12"
                    :icon="statusIconMap2[task.status]?.icon"
                    :color="statusIconMap2[task.status]?.color"
                  />
                </div>
              </div>
              <div class="flex flex-col mt-1">
                <!-- 信息：昵称 -->
                <div
                  v-if="task.assigneeUser && task.assigneeUser.nickname"
                  class="text-10px text-align-center"
                >
                  {{ task.assigneeUser.nickname }}
                </div>
                <div
                  v-else-if="task.ownerUser && task.ownerUser.nickname"
                  class="text-10px text-align-center"
                >
                  {{ task.ownerUser.nickname }}
                </div>
                <!-- TODO @jason：审批意见，要展示哈。 -->
                <!-- <div v-if="task.reason" :title="task.reason" class="text-13px text-truncate w-150px mt-1"> 审批意见: {{ task.reason }}</div> -->
              </div>
            </div>
          </div>
          <!-- 情况二：遍历每个审批节点下的【候选的】task 任务。例如说，1）依次审批，2）未来的审批任务等 -->
          <div
            v-for="(user, idx1) in activity.candidateUserList"
            :key="idx1"
            class="flex items-center"
          >
            <div class="flex items-center flex-col pr-2">
              <div class="position-relative">
                <!-- 信息：头像 -->
                <el-avatar :size="36" v-if="user.avatar" :src="user.avatar" />
                <el-avatar v-else-if="user.nickname && user.nickname">
                  {{ user.nickname.substring(0, 1) }}
                </el-avatar>
                <!-- 信息：任务 ICON -->
                <div
                  class="position-absolute top-26px left-26px bg-#fff rounded-full flex items-center p-2px"
                >
                  <Icon
                    :size="12"
                    :icon="statusIconMap2['-1']?.icon"
                    :color="statusIconMap2['-1']?.color"
                  />
                </div>
              </div>
              <div class="flex flex-col mt-1">
                <!-- 信息：昵称 -->
                <div v-if="user.nickname" class="text-10px text-align-center">
                  {{ user.nickname }}
                </div>
                <!-- <div v-if="task.reason" :title="task.reason" class="text-13px text-truncate w-150px mt-1"> 审批意见: {{ task.reason }}</div> -->
              </div>
            </div>
          </div>
        </div>
        <!-- 信息：时间 -->
        <div
          v-if="activity.status !== TaskStatusEnum.NOT_START"
          class="text-#a5a5a5 text-13px mt-1"
        >
          {{ getApprovalNodeTime(activity) }}
        </div>

        <!-- TODO @jason：审批意见，要展示哈。 -->
        <!-- <div class="color-#a1a6ae text-12px mb-10px"> {{ activity.assigneeUser.nickname }}</div>
        <div v-if="activity.opinion" class="text-#a5a5a5 text-12px w-100%">
          <div class="mb-5px">审批意见：</div>
          <div
            class="w-100% border-1px border-#a5a5a5 border-dashed rounded py-5px px-15px text-#2d2d2d"
          >
            {{ activity.opinion }}
          </div>
        </div>
        <div v-if="activity.createTime" class="text-#a5a5a5 text-13px">
          {{ formatDate(activity.createTime) }}
        </div> -->
      </div>
    </el-timeline-item>
  </el-timeline>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { TaskStatusEnum } from '@/api/bpm/task'
import { NodeType } from '@/components/SimpleProcessDesignerV2/src/consts'
import { Check, Close, Loading, Clock, Minus, Delete } from '@element-plus/icons-vue'
defineOptions({ name: 'BpmProcessInstanceTimeline' })
const props = defineProps({
  // 流程实例编号
  processInstanceId: {
    type: String,
    required: false,
    default: ''
  },
  // 流程定义编号
  processDefinitionId: {
    type: String,
    required: false,
    default: ''
  }
})

// 审批节点
const approveNodes = ref<ProcessInstanceApi.ApprovalNodeInfo[]>([])

const statusIconMap2 = {
  // 未开始
  '-1': { color: '#e5e7ec', icon: 'ep-clock' },
  // 待审批
  '0': { color: '#e5e7ec', icon: 'ep:loading' },
  // 审批中
  '1': { color: '#448ef7', icon: 'ep:loading' },
  // 审批通过
  '2': { color: '#00b32a', icon: 'ep:circle-check-filled' },
  // 审批不通过
  '3': { color: '#f46b6c', icon: 'fa-solid:times-circle' },
  // 取消
  '4': { color: '#cccccc', icon: 'ep:delete-filled' },
  // 回退
  '5': { color: '#f46b6c', icon: 'ep:remove-filled' },
  // 委派中
  '6': { color: '#448ef7', icon: 'ep:loading' },
  // 审批通过中
  '7': { color: '#00b32a', icon: 'ep:circle-check-filled' }
}

const statusIconMap = {
  // 审批未开始
  '-1': { color: '#e5e7ec', icon: Clock },
  '0': { color: '#e5e7ec', icon: Clock },
  // 审批中
  '1': { color: '#448ef7', icon: Loading },
  // 审批通过
  '2': { color: '#00b32a', icon: Check },
  // 审批不通过
  '3': { color: '#f46b6c', icon: Close },
  // 已取消
  '4': { color: '#cccccc', icon: Delete },
  // 回退
  '5': { color: '#f46b6c', icon: Minus },
  // 委派中
  '6': { color: '#448ef7', icon: Loading },
  // 审批通过中
  '7': { color: '#00b32a', icon: Check }
}

/** 获得审批详情 */
const getApprovalDetail = async () => {
  const data = await ProcessInstanceApi.getApprovalDetail(
    props.processInstanceId,
    props.processDefinitionId
  )
  approveNodes.value = data.approveNodes
}

const getApprovalNodeIcon = (taskStatus: number, nodeType: NodeType) => {
  if (taskStatus == TaskStatusEnum.NOT_START) {
    return statusIconMap[taskStatus]?.icon
  }

  if (nodeType === NodeType.START_USER_NODE || nodeType === NodeType.USER_TASK_NODE) {
    return statusIconMap[taskStatus]?.icon
  }
}

const getApprovalNodeColor = (taskStatus: number) => {
  return statusIconMap[taskStatus]?.color
}

const getApprovalNodeTime = (node: ProcessInstanceApi.ApprovalNodeInfo) => {
  if (node.endTime) {
    return `结束时间：${formatDate(node.endTime)}`
  }
  if (node.startTime) {
    return `创建时间：${formatDate(node.startTime)}`
  }
}

/** 重新刷新审批详情 */
const refresh = () => {
  getApprovalDetail()
}

defineExpose({ refresh })

onMounted(async () => {
  await getApprovalDetail()
})
</script>
