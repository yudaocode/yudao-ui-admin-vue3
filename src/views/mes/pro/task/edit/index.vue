<!-- MES 甘特图编辑 -->
<template>
  <ContentWrap>
    <div class="mb-10px flex items-center justify-between">
      <span class="text-14px text-gray-500">双击任务条可编辑开始时间和时长，修改后点击"批量保存"</span>
      <div>
        <el-badge :value="pendingCount" :hidden="pendingCount === 0" class="mr-10px">
          <el-button
            type="primary"
            @click="handleSave"
            :loading="formLoading"
            :disabled="pendingCount === 0"
          >
            批量保存
          </el-button>
        </el-badge>
        <el-button @click="handleRefresh">刷新</el-button>
      </div>
    </div>
    <GanttChart
      :tasks="taskList"
      :readonly="false"
      :height="ganttHeight"
      @task-update="handleTaskUpdate"
    />
  </ContentWrap>
</template>
<script setup lang="ts">
import { ProTaskApi } from '@/api/mes/pro/task'
import GanttChart from '../components/GanttChart.vue'

defineOptions({ name: 'MesProTaskGanttEdit' })

const message = useMessage() // 消息弹窗

const formLoading = ref(false) // 提交的按钮禁用
const taskList = ref<any[]>([]) // 甘特图任务数据

const pendingChanges = ref(new Map<number, any>()) // 待保存的修改 Map<taskId, changeData>
const pendingCount = computed(() => pendingChanges.value.size) // 待保存数量
const ganttHeight = computed(() => window.innerHeight - 180) // 甘特图高度

/** 加载甘特图数据 */
const loadGanttData = async () => {
  taskList.value = await ProTaskApi.getGanttTaskList({})
}

/** 任务编辑回调 */
const handleTaskUpdate = (change: any) => {
  pendingChanges.value.set(change.id, change)
}

/** 批量保存 */
const handleSave = async () => {
  if (pendingChanges.value.size === 0) {
    return
  }
  formLoading.value = true
  try {
    const promises = Array.from(pendingChanges.value.values()).map((change) =>
      ProTaskApi.updateTask({
        id: change.id,
        startTime: change.startTime,
        endTime: change.endTime,
        duration: change.duration
      } as any)
    )
    await Promise.all(promises)
    message.success(`已保存 ${pendingChanges.value.size} 条修改`)
    pendingChanges.value = new Map()
    // 重新加载数据
    await loadGanttData()
  } finally {
    formLoading.value = false
  }
}

/** 刷新 */
const handleRefresh = async () => {
  pendingChanges.value = new Map()
  await loadGanttData()
}

/** 初始化 */
onMounted(async () => {
  await loadGanttData()
})
</script>
