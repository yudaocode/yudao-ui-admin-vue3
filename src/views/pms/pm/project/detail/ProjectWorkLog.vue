<template>
  <div v-loading="loading">
    <!-- 搜索 -->
    <el-form :inline="true" class="-mb-15px">
      <el-form-item label="迭代名称">
        <el-input
          v-model="queryParams.iterationName"
          class="!w-240px"
          clearable
          placeholder="搜索迭代名称"
          @keyup.enter="getWorkLogReport"
        />
      </el-form-item>
      <el-form-item label="日期范围">
        <el-date-picker
          v-model="queryParams.createTime"
          class="!w-240px"
          :clearable="false"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          :shortcuts="defaultShortcuts"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          @change="getWorkLogReport"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getWorkLogReport">
          <Icon icon="ep:search" />查询
        </el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工时汇总 -->
    <el-alert
      class="!mb-12px !mt-16px"
      :closable="false"
      :title="`当前范围累计登记 ${report.totalHours} 小时`"
      type="info"
    />
    <el-empty v-if="report.groups.length === 0" description="当前范围暂无工时记录" />

    <!-- 列表 -->
    <el-table
      v-else
      :data="tableRows"
      default-expand-all
      row-key="rowKey"
      :tree-props="{ children: 'children' }"
      :show-overflow-tooltip="true"
    >
      <el-table-column fixed="left" label="迭代 / 工作项" min-width="260">
        <template #default="scope">
          <span v-if="scope.row.group" class="font-600">{{ scope.row.name }}</span>
          <el-button v-else link type="primary" @click="openWorkItem(scope.row)">
            #{{ scope.row.serialNumber }} {{ scope.row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="left" label="总计" width="90">
        <template #default="scope">{{ scope.row.totalHours || '-' }}</template>
      </el-table-column>
      <el-table-column v-for="date in report.dates" :key="date" align="center" min-width="110">
        <template #header>
          <span class="whitespace-nowrap">{{ formatDateWithWeekday(date) }}</span>
        </template>
        <template #default="scope">
          {{
            scope.row.group
              ? getGroupDailyHours(scope.row.children, date) || '-'
              : scope.row.dailyHours[date] || '-'
          }}
        </template>
      </el-table-column>
    </el-table>
  </div>
  <!-- 工作项详情 -->
  <WorkItemDetail ref="workItemDetailRef" @success="getWorkLogReport" />
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import * as WorkLogApi from '@/api/pms/pm/workitem/worklog'
import { defaultShortcuts } from '@/utils/formatTime'
import WorkItemDetail from '@/views/pms/pm/workitem/detail/WorkItemDetail.vue'
import { formatDateWithWeekday } from '@/views/pms/pm/utils/format'

defineOptions({ name: 'PmsProjectWorkLog' })

const props = defineProps<{
  projectId: number
  projectType: number
  editable: boolean
}>()

type ReportRow = WorkLogApi.PmsProjectWorkLogReportItemVO & {
  rowKey: string
  group?: boolean
  children?: ReportRow[]
}

const loading = ref(false) // 报表加载中
const queryParams = reactive({
  iterationName: '',
  createTime: [
    dayjs().startOf('month').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
  ] as [string, string]
}) // 查询参数
const report = ref<WorkLogApi.PmsProjectWorkLogReportVO>({ dates: [], totalHours: 0, groups: [] }) // 工时统计报表
const workItemDetailRef = ref<InstanceType<typeof WorkItemDetail>>() // 工作项详情 Ref
const tableRows = computed<ReportRow[]>(() =>
  report.value.groups.map((group) => ({
    rowKey: `group-${group.iterationId || 0}`,
    workItemId: 0,
    serialNumber: 0,
    name: group.iterationName,
    type: 0,
    totalHours: group.totalHours,
    dailyHours: {},
    group: true,
    children: group.items.map((item) => ({ ...item, rowKey: `item-${item.workItemId}` }))
  }))
) // 工时统计表格树形行

/** 查询工时统计报表 */
async function getWorkLogReport() {
  loading.value = true
  try {
    // 查询指定日期范围和迭代名称的工时报表
    report.value = await WorkLogApi.getProjectWorkItemWorkLogReport({
      projectId: props.projectId,
      createTime: queryParams.createTime,
      iterationName: queryParams.iterationName || undefined
    })
  } finally {
    loading.value = false
  }
}

/** 重置按钮操作 */
function resetQuery() {
  queryParams.iterationName = ''
  queryParams.createTime = [
    dayjs().startOf('month').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss')
  ]
  getWorkLogReport()
}

/** 汇总分组内工作项的每日工时 */
function getGroupDailyHours(items: ReportRow[] | undefined, date: string) {
  return (items || []).reduce((sum, item) => sum + (item.dailyHours[date] || 0), 0)
}

/** 打开工作项详情 */
function openWorkItem(row: ReportRow) {
  workItemDetailRef.value?.open(row.workItemId!)
}

defineExpose({ refresh: getWorkLogReport })

/** 初始化 */
onMounted(() => {
  getWorkLogReport()
})
</script>
