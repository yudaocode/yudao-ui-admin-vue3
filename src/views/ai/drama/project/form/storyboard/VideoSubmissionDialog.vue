<!-- AI 短剧：镜头视频的提交记录；提交结果未知时确认任务编号或确认失败，可恢复提交前的视频 -->
<template>
  <Dialog v-model="dialogVisible" :title="`提交记录 · #${storyboard?.sceneNo ?? ''}`" width="960px">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="mb-12px"
      title="提交结果未知（超时、网络中断）时，服务商可能已创建任务并计费：请到服务商控制台核对，有任务时填写任务编号，没有时确认失败后再重新生成"
    />
    <el-table v-loading="loading" :data="list" row-key="id" max-height="460px">
      <el-table-column label="提交时间" width="170" :formatter="dateFormatter" prop="createTime" />
      <el-table-column label="模型" prop="model" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="130" align="center">
        <template #default="{ row }">
          <el-tag v-if="isUnknown(row)" type="warning">结果未知</el-tag>
          <dict-tag v-else :type="DICT_TYPE.AI_DRAMA_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="任务编号" prop="taskId" min-width="150" show-overflow-tooltip />
      <el-table-column label="结果" min-width="200">
        <template #default="{ row }">
          <video
            v-if="row.videoUrl"
            :src="row.videoUrl"
            controls
            preload="none"
            class="max-h-90px w-160px rounded-4px"
          ></video>
          <div
            v-if="row.errorMessage"
            class="line-clamp-3 text-12px text-[var(--el-color-danger)]"
            >{{ row.errorMessage }}</div
          >
        </template>
      </el-table-column>
      <el-table-column label="提交前的视频" width="180" align="center">
        <template #default="{ row }">
          <video
            v-if="row.previousVideo?.videoUrl"
            :src="row.previousVideo.videoUrl"
            controls
            preload="none"
            class="max-h-90px w-160px rounded-4px"
          ></video>
          <span v-else class="text-12px text-[var(--el-text-color-secondary)]">无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="isUnknown(row)">
            <el-button link type="primary" @click="handleResolve(row)">填写任务编号</el-button>
            <el-button link type="danger" @click="handleConfirmFail(row)">确认失败</el-button>
          </template>
          <el-button
            v-if="
              row.status === AiDramaStatusEnum.SUCCESS &&
              row.videoUrl &&
              row.videoUrl !== storyboard?.videoUrl
            "
            link
            type="primary"
            :disabled="isAiDramaRunning(storyboard?.videoStatus)"
            @click="handleUse(row, false)"
          >
            使用此视频
          </el-button>
          <el-button
            v-if="
              row.previousVideo?.videoUrl && row.previousVideo.videoUrl !== storyboard?.videoUrl
            "
            link
            type="primary"
            :disabled="isAiDramaRunning(storyboard?.videoStatus)"
            @click="handleUse(row, true)"
          >
            恢复提交前
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </Dialog>
</template>

<script setup lang="ts">
import {
  DramaStoryboardApi,
  DramaStoryboardVO,
  DramaVideoSubmissionVO
} from '@/api/ai/drama/storyboard'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { AiDramaStatusEnum, isAiDramaRunning } from '@/views/ai/utils/constants'

/** AI 短剧：镜头视频提交记录 */
defineOptions({ name: 'AiDramaVideoSubmissionDialog' })

const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const loading = ref(false)
const storyboard = ref<DramaStoryboardVO>()
const list = ref<DramaVideoSubmissionVO[]>([])

/** 提交结果未知：待处理，且没有服务商任务编号 */
const isUnknown = (row: DramaVideoSubmissionVO) =>
  row.status === AiDramaStatusEnum.PENDING && !row.taskId

const getList = async () => {
  loading.value = true
  try {
    list.value = await DramaStoryboardApi.getVideoSubmissionList(storyboard.value!.id)
  } finally {
    loading.value = false
  }
}

const open = async (row: DramaStoryboardVO) => {
  storyboard.value = row
  list.value = []
  dialogVisible.value = true
  await getList()
}
defineExpose({ open })

/** 刷新：同时通知工作台刷新镜头 */
const refresh = async () => {
  emit('success')
  await getList()
}

const handleResolve = async (row: DramaVideoSubmissionVO) => {
  let taskId: string
  try {
    const { value } = await message.prompt('请输入在服务商控制台核对到的任务编号', '填写任务编号')
    taskId = value?.trim()
  } catch {
    return
  }
  if (!taskId) {
    message.warning('任务编号不能为空')
    return
  }
  await DramaStoryboardApi.resolveVideoSubmission(row.id, taskId)
  message.success('已改为生成中，稍后自动查询结果')
  await refresh()
}

const handleConfirmFail = async (row: DramaVideoSubmissionVO) => {
  try {
    await message.confirm('确认已核对服务商没有创建该任务？确认后可重新生成')
  } catch {
    return
  }
  await DramaStoryboardApi.confirmVideoSubmissionFail(row.id)
  message.success('已确认失败')
  await refresh()
}

const handleUse = async (row: DramaVideoSubmissionVO, previous: boolean) => {
  try {
    await message.confirm(previous ? '恢复为这次提交前的视频？' : '使用这次提交生成的视频？')
  } catch {
    return
  }
  await DramaStoryboardApi.useVideoSubmission(row.id, previous)
  message.success('已更新镜头视频')
  dialogVisible.value = false
  emit('success')
}
</script>
