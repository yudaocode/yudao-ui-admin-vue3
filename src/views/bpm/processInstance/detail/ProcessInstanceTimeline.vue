<template>
  <el-timeline class="pt-20px">
    <el-timeline-item v-for="(activity, index) in mockData" :key="index" size="large">
      <div class="flex flex-col items-start">
        <div class="font-bold"> {{ activity.name }}</div>
        <div class="color-#a1a6ae text-12px mb-10px"> {{ activity.assigneeUser.nickname }}</div>
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
        </div>
      </div>
      <!-- 该节点用户的头像 -->
      <template #dot>
        <div class="w-35px h-35px position-relative">
          <img
            src="@/assets/imgs/avatar.jpg"
            class="rounded-full w-full h-full position-absolute bottom-6px right-12px"
            alt=""
          />
          <div
            class="position-absolute top-16px left-8px bg-#fff rounded-full flex items-center content-center p-2px"
          >
            <Icon
              :size="12"
              :icon="optIconMap[activity.status]?.icon"
              :color="optIconMap[activity.status]?.color"
            />
          </div>
        </div>
      </template>
    </el-timeline-item>
  </el-timeline>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'BpmProcessInstanceTimeline' })
defineProps({
  tasks: propTypes.array // 流程任务的数组
})

const optIconMap = {
  // 审批中
  '1': {
    color: '#00b32a',
    icon: 'fa-solid:clock'
  },
  // 审批通过
  '2': { color: '#00b32a', icon: 'fa-solid:check-circle' },
  // 审批不通过
  '3': { color: '#f46b6c', icon: 'fa-solid:times-circle' }
}

const mockData: any = [
  {
    id: 'fe1190ee-68c3-11ef-9c7d-00a6181404fd',
    name: '发起人',
    createTime: 1725237646192,
    endTime: null,
    durationInMillis: null,
    status: 1,
    reason: null,
    ownerUser: null,
    assigneeUser: {
      id: 104,
      nickname: '测试号',
      deptId: 107,
      deptName: '运维部门'
    },
    taskDefinitionKey: 'task-01',
    processInstanceId: 'fe0c60c6-68c3-11ef-9c7d-00a6181404fd',
    processInstance: {
      id: 'fe0c60c6-68c3-11ef-9c7d-00a6181404fd',
      name: 'oa_leave',
      createTime: null,
      processDefinitionId: 'oa_leave:1:6e5ac269-5f87-11ef-bdb6-00a6181404fd',
      startUser: null
    },
    parentTaskId: null,
    children: null,
    formId: null,
    formName: null,
    formConf: null,
    formFields: null,
    formVariables: null
  },
  {
    id: 'fe1190ee-68c3-11ef-9c7d-00a6181404fd',
    name: '领导审批',
    createTime: 1725237646192,
    endTime: null,
    durationInMillis: null,
    status: 2,
    reason: null,
    ownerUser: null,
    assigneeUser: {
      id: 104,
      nickname: '领导',
      deptId: 107,
      deptName: '运维部门'
    },
    taskDefinitionKey: 'task-01',
    processInstanceId: 'fe0c60c6-68c3-11ef-9c7d-00a6181404fd',
    processInstance: {
      id: 'fe0c60c6-68c3-11ef-9c7d-00a6181404fd',
      name: 'oa_leave',
      createTime: null,
      processDefinitionId: 'oa_leave:1:6e5ac269-5f87-11ef-bdb6-00a6181404fd',
      startUser: null
    },
    parentTaskId: null,
    children: null,
    formId: null,
    formName: null,
    formConf: null,
    formFields: null,
    formVariables: null
  },
  {
    id: 'fe1190ee-68c3-11ef-9c7d-00a6181404fd',
    name: '财务总监审核',
    createTime: 1725237646192,
    endTime: null,
    durationInMillis: null,
    status: 3,
    reason: null,
    ownerUser: null,
    assigneeUser: {
      id: 104,
      nickname: '财务总监',
      deptId: 107,
      deptName: '运维部门'
    },
    taskDefinitionKey: 'task-01',
    processInstanceId: 'fe0c60c6-68c3-11ef-9c7d-00a6181404fd',
    processInstance: {
      id: 'fe0c60c6-68c3-11ef-9c7d-00a6181404fd',
      name: 'oa_leave',
      createTime: null,
      processDefinitionId: 'oa_leave:1:6e5ac269-5f87-11ef-bdb6-00a6181404fd',
      startUser: null
    },
    parentTaskId: null,
    children: null,
    formId: null,
    formName: null,
    formConf: null,
    formFields: null,
    formVariables: null
  }
]
</script>
