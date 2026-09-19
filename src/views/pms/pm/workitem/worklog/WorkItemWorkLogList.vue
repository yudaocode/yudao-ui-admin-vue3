<template>
  <el-divider v-if="showTitle" content-position="left">工时记录</el-divider>
  <div v-loading="loading">
    <!-- 工时汇总 -->
    <div class="mb-12px flex items-center justify-between">
      <el-space :size="24">
        <span>预估：{{ formatWorkHours(summary.estimatedHours) }}</span>
        <span>已登记：{{ formatWorkHours(summary.actualHours) }}</span>
        <span>剩余：{{ formatWorkHours(summary.remainingHours) }}</span>
      </el-space>
      <el-button
        v-if="editable"
        v-hasPermi="['pms:pm:work-item:update']"
        plain
        type="primary"
        @click="openForm()"
      >
        登记工时
      </el-button>
    </div>

    <!-- 工时列表 -->
    <el-table :data="summary.records" max-height="260" size="small">
      <el-table-column align="center" label="投入工时" prop="actualHours" width="100">
        <template #default="scope">{{ formatWorkHours(scope.row.actualHours) }}</template>
      </el-table-column>
      <el-table-column align="center" label="登记后剩余" prop="remainingHours" width="110">
        <template #default="scope">{{ formatWorkHours(scope.row.remainingHours) }}</template>
      </el-table-column>
      <el-table-column label="说明" min-width="180" prop="description" />
      <el-table-column label="登记人" prop="creatorUserName" width="110" />
      <el-table-column :formatter="dateFormatter" label="登记时间" prop="createTime" width="170" />
      <el-table-column v-if="editable" align="center" label="操作" width="70">
        <template #default="scope">
          <el-button
            v-hasPermi="['pms:pm:work-item:update']"
            link
            type="primary"
            @click="openForm(scope.row.id)"
          >
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 工时登记表单 -->
  <WorkItemWorkLogForm ref="workLogFormRef" @success="handleFormSuccess" />
</template>

<script lang="ts" setup>
import * as WorkLogApi from '@/api/pms/pm/workitem/worklog'
import { dateFormatter } from '@/utils/formatTime'
import { formatWorkHours } from '@/views/pms/pm/utils/format'
import WorkItemWorkLogForm from './WorkItemWorkLogForm.vue'

defineOptions({ name: 'PmsWorkItemWorkLogList' })

const props = withDefaults(
  defineProps<{
    workItemId: number
    editable: boolean
    showTitle?: boolean
  }>(),
  { showTitle: true }
)
const emit = defineEmits<{ changed: [] }>() // 定义 changed 事件，用于工时变化后的回调

const loading = ref(false) // 数据加载中
const summary = ref<WorkLogApi.PmsWorkItemWorkLogSummaryVO>({
  actualHours: 0,
  records: []
}) // 工时汇总
const workLogFormRef = ref<InstanceType<typeof WorkItemWorkLogForm>>() // 工时表单 Ref

/** 查询工时汇总 */
async function getWorkLogSummary() {
  loading.value = true
  try {
    summary.value = await WorkLogApi.getWorkItemWorkLogSummary(props.workItemId)
  } finally {
    loading.value = false
  }
}

/** 打开工时表单 */
function openForm(id?: number) {
  workLogFormRef.value?.open(props.workItemId, id, summary.value.remainingHours)
}

/** 处理工时表单提交成功 */
async function handleFormSuccess() {
  await getWorkLogSummary()
  emit('changed')
}

/** 监听工作项变化并刷新工时汇总 */
watch(
  () => props.workItemId,
  () => getWorkLogSummary(),
  { immediate: true }
)
</script>
