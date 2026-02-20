<!-- MES 甘特图编辑（全屏 Dialog） -->
<!-- TODO @AI：独立路由 -->
<template>
  <Dialog title="甘特图编辑" v-model="dialogVisible" fullscreen>
    <div class="mb-10px flex items-center justify-between">
      <span class="text-14px text-gray-500">
        拖拽任务条可调整开始时间和时长，修改后点击"批量保存"
      </span>
      <div>
        <el-badge :value="pendingCount" :hidden="pendingCount === 0" class="mr-10px">
          <el-button
            type="primary"
            @click="handleSave"
            :loading="saving"
            :disabled="pendingCount === 0"
          >
            批量保存
          </el-button>
        </el-badge>
        <el-button @click="handleRefresh">刷新</el-button>
      </div>
    </div>
    <GanttChart
      ref="ganttRef"
      :tasks="taskList"
      :readonly="false"
      :height="ganttHeight"
      @task-update="handleTaskUpdate"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'
import GanttChart from './components/GanttChart.vue'

defineOptions({ name: 'GanttEdit' })

const message = useMessage()

const dialogVisible = ref(false)
const taskList = ref<ProTaskVO[]>([])
const saving = ref(false)
const ganttRef = ref()

/** 待保存的修改 Map<taskId, changeData> */
const pendingChanges = ref(new Map<number, any>())
const pendingCount = computed(() => pendingChanges.value.size)

/** 甘特图高度 = 视口高度 - 顶栏 - 操作栏 */
const ganttHeight = computed(() => window.innerHeight - 140)

/** 打开 */
const open = async () => {
  dialogVisible.value = true
  pendingChanges.value = new Map()
  await loadGanttData()
}

/** 加载甘特图数据（复用 page 接口，传大 pageSize） */
const loadGanttData = async () => {
  // TODO @AI：请求地址不存在:admin-api/mes/pro/task/page；这个在对齐下；
  const data = await ProTaskApi.getTaskPage({ pageNo: 1, pageSize: 999 })
  taskList.value = data.list
}

/** 拖拽变更回调 */
const handleTaskUpdate = (change: any) => {
  pendingChanges.value.set(change.id, change)
}

/** 批量保存 */
const handleSave = async () => {
  if (pendingChanges.value.size === 0) return
  saving.value = true
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
    await loadGanttData()
  } finally {
    saving.value = false
  }
}

/** 刷新 */
const handleRefresh = async () => {
  pendingChanges.value = new Map()
  await loadGanttData()
}

defineExpose({ open })
</script>
