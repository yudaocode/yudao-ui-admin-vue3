<template>
  <Dialog v-model="dialogVisible" :title="`${currentUser?.userName || ''}的汇报明细`" width="760px">
    <el-descriptions :column="3" class="mb-16px">
      <el-descriptions-item label="姓名">{{ currentUser?.userName }}</el-descriptions-item>
      <el-descriptions-item label="部门">{{ currentUser?.deptName }}</el-descriptions-item>
      <el-descriptions-item label="统计周期">
        {{ formatDate(queryParams.startTime, 'YYYY-MM-DD') }} ~
        {{ formatDate(queryParams.endTime, 'YYYY-MM-DD') }}
      </el-descriptions-item>
    </el-descriptions>
    <el-tabs v-model="detailTab">
      <el-tab-pane :label="`已填 ${currentUser?.submittedReports.length || 0}`" name="submitted">
        <el-table :data="currentUser?.submittedReports || []" max-height="360">
          <el-table-column label="日期" prop="startTime" :formatter="dateFormatter2" width="120" />
          <el-table-column label="汇报标题" prop="title" min-width="260" show-overflow-tooltip>
            <template #default="scope">
              <el-link type="primary" :underline="false" @click="openReportDetail(scope.row.id)">
                {{ scope.row.title }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.OA_WORK_REPORT_STATUS" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column
            label="提交时间"
            prop="createTime"
            :formatter="dateFormatter"
            width="170"
          />
        </el-table>
      </el-tab-pane>
      <el-tab-pane :label="`未填 ${currentUser?.missingCount || 0}`" name="missing">
        <el-table :data="missingRows" max-height="360">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column
            v-if="queryParams.type !== OA_WORK_REPORT_TYPE.DAILY"
            :label="queryParams.type === OA_WORK_REPORT_TYPE.WEEKLY ? '周次' : '月份'"
            prop="periodKey"
            width="130"
          />
          <el-table-column
            :label="queryParams.type === OA_WORK_REPORT_TYPE.DAILY ? '应填日期' : '起始日期'"
            prop="startDate"
            width="130"
          />
          <el-table-column
            v-if="queryParams.type === OA_WORK_REPORT_TYPE.DAILY"
            label="星期"
            prop="weekDay"
            width="100"
          />
          <el-table-column label="逾期天数" prop="overdueDays" width="110" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </Dialog>

  <!-- 工作汇报详情 -->
  <OaWorkReportForm ref="workReportFormRef" />
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { formatDate, dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { getWorkReportWeekStart } from '@/views/oa/utils/format'
import * as WorkReportApi from '@/api/oa/workreport'
import { OA_WORK_REPORT_TYPE } from '@/views/oa/utils/constants'
import OaWorkReportForm from '../OaWorkReportForm.vue'

defineOptions({ name: 'OaWorkReportStatisticsDetail' })

const dialogVisible = ref(false) // 弹窗是否显示
const detailTab = ref('submitted') // 汇报明细当前 Tab
const currentUser = ref<WorkReportApi.OaWorkReportUserStatisticsVO>() // 当前查看的员工
const queryParams = ref<WorkReportApi.OaWorkReportStatisticsReqVO>({
  type: OA_WORK_REPORT_TYPE.DAILY,
  startTime: '',
  endTime: '',
  queryStartTime: '',
  queryEndTime: ''
}) // 当前明细的统计条件
const workReportFormRef = ref<InstanceType<typeof OaWorkReportForm>>() // 工作汇报详情 Ref

const missingRows = computed(() =>
  (currentUser.value?.missingPeriodKeys || []).map((periodKey) => {
    const periodStartTime =
      queryParams.value.type === OA_WORK_REPORT_TYPE.WEEKLY
        ? getWorkReportWeekStart(periodKey)
        : dayjs(
            queryParams.value.type === OA_WORK_REPORT_TYPE.MONTHLY ? periodKey + '-01' : periodKey
          )
    const startTime = periodStartTime.isBefore(queryParams.value.startTime, 'day')
      ? dayjs(queryParams.value.startTime)
      : periodStartTime
    return {
      periodKey,
      startDate: startTime.format('YYYY-MM-DD'),
      weekDay: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][startTime.day()],
      overdueDays: Math.max(0, dayjs().startOf('day').diff(startTime.startOf('day'), 'day'))
    }
  })
) // 未填明细，逾期从统计范围内的周期起始日期计算

/** 打开弹窗 */
function open(
  user: WorkReportApi.OaWorkReportUserStatisticsVO,
  tab: string,
  params: WorkReportApi.OaWorkReportStatisticsReqVO
) {
  // 1. 回填员工及统计条件
  currentUser.value = user
  detailTab.value = tab
  queryParams.value = { ...params }

  // 2. 展示汇报明细
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 打开工作汇报详情 */
function openReportDetail(id: number) {
  workReportFormRef.value?.open('detail', id)
}
</script>
