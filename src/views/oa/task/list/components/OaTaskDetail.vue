<template>
  <Dialog v-model="dialogVisible" title="任务详情" width="900px" scroll max-height="70vh">
    <div v-loading="loading" class="flex flex-col gap-16px">
      <!-- 任务信息 -->
      <el-card v-if="task" shadow="never">
        <template #header>
          <span class="font-bold">任务信息</span>
        </template>
        <el-descriptions :column="2" border class="task-descriptions">
          <el-descriptions-item label="任务标题" :span="2">{{ task.title }}</el-descriptions-item>
          <el-descriptions-item label="发布人">
            {{ task.publisherUserName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="发布部门">
            {{ task.publisherDeptName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="任务类型">
            <dict-tag :type="DICT_TYPE.OA_TASK_TYPE" :value="task.type ?? ''" />
          </el-descriptions-item>
          <el-descriptions-item label="总体状态">
            <dict-tag :type="DICT_TYPE.OA_TASK_STATUS" :value="task.status ?? ''" />
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDate(task.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ formatDate(task.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="是否置顶">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="task.top ?? false" />
          </el-descriptions-item>
          <el-descriptions-item label="是否取消">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="task.canceled ?? false" />
          </el-descriptions-item>
          <el-descriptions-item label="任务描述" :span="2">
            <div class="whitespace-pre-wrap">{{ task.description }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="任务评价" :span="2">
            <div class="whitespace-pre-wrap">{{ task.comment || '-' }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 总体进度 -->
        <div class="mt-16px">
          <div class="mb-8px text-14px font-bold">总体进度</div>
          <el-progress :percentage="getTaskStatusProgress(task.status)" />
        </div>
      </el-card>

      <!-- 接收人状态 -->
      <el-card v-if="task" shadow="never">
        <template #header>
          <span class="font-bold">接收人状态</span>
        </template>
        <el-table :data="task.receivers || []" border>
          <el-table-column label="接收人" prop="userName" min-width="120" />
          <el-table-column label="部门" prop="deptName" min-width="120" />
          <el-table-column label="状态" prop="status" width="110">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.OA_TASK_STATUS" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="进度" prop="status" min-width="180">
            <template #default="scope">
              <el-progress :percentage="getTaskStatusProgress(scope.row.status)" />
            </template>
          </el-table-column>
          <el-table-column
            label="更新时间"
            prop="updateTime"
            :formatter="dateFormatter"
            width="180"
          />
        </el-table>
      </el-card>

      <!-- 反馈日志 -->
      <el-card v-if="task" shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-bold">反馈日志</span>
            <el-button
              v-if="!task.canceled"
              type="primary"
              :disabled="
                loading ||
                (detailMode !== 'published' &&
                  (task.receiverStatus ?? OA_TASK_STATUS.NEW) >= OA_TASK_STATUS.SUBMITTED)
              "
              @click="openFeedbackForm"
            >
              <Icon icon="ep:plus" /> 新增反馈
            </el-button>
          </div>
        </template>
        <el-table :data="task.logs || []" border>
          <el-table-column label="反馈人" prop="userName" width="120" />
          <el-table-column label="任务状态" prop="status" width="110">
            <template #default="scope">
              <dict-tag
                v-if="scope.row.status"
                :type="DICT_TYPE.OA_TASK_STATUS"
                :value="scope.row.status"
              />
            </template>
          </el-table-column>
          <el-table-column label="反馈内容" prop="content" min-width="260">
            <template #default="scope">
              <div class="whitespace-pre-wrap break-words">{{ scope.row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column
            label="反馈时间"
            prop="createTime"
            :formatter="dateFormatter"
            width="180"
          />
        </el-table>
      </el-card>
    </div>
  </Dialog>
  <!-- 新增反馈弹窗，与详情分离 -->
  <OaTaskFeedbackForm v-if="dialogVisible" ref="feedbackFormRef" @success="handleFeedbackSuccess" />
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import * as TaskApi from '@/api/oa/task'
import { dateFormatter, formatDate } from '@/utils/formatTime'

import { getTaskStatusProgress } from '@/views/oa/utils/format'
import { OA_TASK_STATUS } from '@/views/oa/utils/constants'
import OaTaskFeedbackForm from './OaTaskFeedbackForm.vue'

defineOptions({ name: 'OaTaskDetail' })

const dialogVisible = ref(false) // 弹窗是否显示
const loading = ref(false) // 详情加载中
const task = ref<TaskApi.OaTaskVO>() // 任务详情
const detailMode = ref('published') // 详情场景
const feedbackFormRef = ref<InstanceType<typeof OaTaskFeedbackForm>>() // 反馈表单 Ref

const emit = defineEmits<{ success: [] }>()

/** 打开详情 */
async function open(id: number, mode: string) {
  dialogVisible.value = true
  detailMode.value = mode
  task.value = undefined
  await getTask(id)
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询任务详情 */
async function getTask(id: number) {
  loading.value = true
  try {
    task.value = await TaskApi.getTask(id)
  } finally {
    loading.value = false
  }
}

/** 打开反馈表单 */
function openFeedbackForm() {
  if (!task.value || task.value.canceled) return
  feedbackFormRef.value?.open(task.value, detailMode.value)
}

/** 反馈成功后刷新详情和列表 */
async function handleFeedbackSuccess() {
  emit('success')
  if (task.value?.id) await getTask(task.value.id)
}
</script>

<style scoped>
.task-descriptions :deep(.el-descriptions__label) {
  width: 100px;
  white-space: nowrap;
}
</style>
