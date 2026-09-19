<template>
  <doc-alert
    title="【协作】日程、任务、计划与汇报"
    url="https://doc.iocoder.cn/oa/collaboration/work/"
  />
  <el-row :gutter="20">
    <!-- 左侧部门树 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <DeptTreeSelect ref="deptTreeRef" @node-click="handleDeptNodeClick" />
      </ContentWrap>
    </el-col>
    <el-col :span="20" :xs="24">
      <ContentWrap>
        <el-tabs v-model="activeType" @tab-change="handleTypeChange">
          <el-tab-pane label="日报" :name="OA_WORK_REPORT_TYPE.DAILY" />
          <el-tab-pane label="周报" :name="OA_WORK_REPORT_TYPE.WEEKLY" />
          <el-tab-pane label="月报" :name="OA_WORK_REPORT_TYPE.MONTHLY" />
        </el-tabs>

        <!-- 搜索工作栏 -->
        <el-form
          ref="queryFormRef"
          :inline="true"
          :model="queryParams"
          class="-mb-15px mt-16px"
          label-width="68px"
        >
          <el-form-item label="统计周期" prop="reportDate">
            <el-date-picker
              v-model="reportDate"
              class="!w-260px"
              end-placeholder="结束日期"
              start-placeholder="开始日期"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <el-empty v-if="!queryParams.deptId" description="请选择部门查看汇报统计" />
      <template v-else>
        <!-- 汇报统计概览 -->
        <div class="mb-16px grid grid-cols-2 gap-12px xl:grid-cols-5">
          <el-card shadow="never" :body-style="{ padding: '12px 16px' }">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">统计人数</div>
                <div class="mt-4px text-22px text-blue-500 font-600 leading-28px">
                  {{ statistics.userCount }} 人
                </div>
              </div>
              <div class="h-36px w-36px flex items-center justify-center rounded-8px bg-gray-100">
                <Icon icon="ep:user" :size="20" class="text-blue-500" />
              </div>
            </div>
          </el-card>
          <el-card shadow="never" :body-style="{ padding: '12px 16px' }">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">应填汇报</div>
                <div class="mt-4px text-22px text-orange-500 font-600 leading-28px">
                  {{ statistics.expectedCount }} 份
                </div>
              </div>
              <div class="h-36px w-36px flex items-center justify-center rounded-8px bg-gray-100">
                <Icon icon="ep:document" :size="20" class="text-orange-500" />
              </div>
            </div>
          </el-card>
          <el-card shadow="never" :body-style="{ padding: '12px 16px' }">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">已填汇报</div>
                <div class="mt-4px text-22px text-green-500 font-600 leading-28px">
                  {{ statistics.submittedCount }} 份
                </div>
              </div>
              <div class="h-36px w-36px flex items-center justify-center rounded-8px bg-gray-100">
                <Icon icon="ep:circle-check" :size="20" class="text-green-500" />
              </div>
            </div>
          </el-card>
          <el-card shadow="never" :body-style="{ padding: '12px 16px' }">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">未填汇报</div>
                <div class="mt-4px text-22px text-red-500 font-600 leading-28px">
                  {{ statistics.missingCount }} 份
                </div>
              </div>
              <div class="h-36px w-36px flex items-center justify-center rounded-8px bg-gray-100">
                <Icon icon="ep:clock" :size="20" class="text-red-500" />
              </div>
            </div>
          </el-card>
          <el-card shadow="never" :body-style="{ padding: '12px 16px' }">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-14px text-gray-500">整体填写率</div>
                <div class="mt-4px text-22px text-purple-500 font-600 leading-28px">
                  {{ calculateFillRate(statistics.submittedCount, statistics.expectedCount) }}%
                </div>
              </div>
              <div class="h-36px w-36px flex items-center justify-center rounded-8px bg-gray-100">
                <Icon icon="ep:data-analysis" :size="20" class="text-purple-500" />
              </div>
            </div>
          </el-card>
        </div>

        <!-- 员工汇报统计 -->
        <ContentWrap>
          <el-table v-loading="loading" :data="statistics.users">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="员工" prop="userName" min-width="120" align="center" />
            <el-table-column
              label="部门"
              prop="deptName"
              min-width="120"
              align="center"
              show-overflow-tooltip
            />
            <el-table-column label="应填" prop="expectedCount" min-width="100" align="center" />
            <el-table-column label="已填" prop="submittedCount" min-width="100" align="center">
              <template #default="scope">
                <el-link
                  type="success"
                  :underline="false"
                  @click="openStatisticsDetail(scope.row, 'submitted')"
                >
                  {{ scope.row.submittedCount }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column label="未填" prop="missingCount" min-width="100" align="center">
              <template #default="scope">
                <el-link
                  :type="scope.row.missingCount ? 'danger' : 'info'"
                  :underline="false"
                  @click="openStatisticsDetail(scope.row, 'missing')"
                >
                  {{ scope.row.missingCount }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column label="填写率" min-width="160" align="center">
              <template #default="scope">
                <el-progress
                  :percentage="calculateFillRate(scope.row.submittedCount, scope.row.expectedCount)"
                />
              </template>
            </el-table-column>
          </el-table>
        </ContentWrap>
      </template>
    </el-col>
  </el-row>

  <!-- 员工汇报明细 -->
  <OaWorkReportStatisticsDetail ref="statisticsDetailRef" />
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import dayjs from 'dayjs'
import { getDateRange } from '@/utils/formatTime'
import * as WorkReportApi from '@/api/oa/workreport'
import DeptTreeSelect from '@/views/system/dept/components/DeptTreeSelect.vue'
import { OA_WORK_REPORT_TYPE } from '@/views/oa/utils/constants'
import OaWorkReportStatisticsDetail from './OaWorkReportStatisticsDetail.vue'

defineOptions({ name: 'OaWorkReportStatistics' })

const loading = ref(false) // 统计加载中
const activeType = ref<number>(OA_WORK_REPORT_TYPE.DAILY) // 当前汇报类型
const deptTreeRef = ref<InstanceType<typeof DeptTreeSelect>>() // 部门树 Ref
const reportDate = ref<[string, string]>(getDefaultReportDate(activeType.value)) // 统计日期范围
const queryParams = reactive<WorkReportApi.OaWorkReportStatisticsReqVO>({
  type: OA_WORK_REPORT_TYPE.DAILY,
  startTime: '',
  endTime: '',
  queryStartTime: '',
  queryEndTime: '',
  deptId: undefined
}) // 查询参数
const queryFormRef = ref<FormInstance>() // 搜索表单 Ref
const statistics = ref<WorkReportApi.OaWorkReportStatisticsVO>({
  userCount: 0,
  expectedCount: 0,
  submittedCount: 0,
  missingCount: 0,
  users: []
}) // 汇报统计
const statisticsDetailRef = ref<InstanceType<typeof OaWorkReportStatisticsDetail>>() // 员工汇报明细 Ref

/** 获得默认统计日期范围：月报从年初开始，日报和周报从月初开始 */
function getDefaultReportDate(type: number): [string, string] {
  const currentTime = dayjs()
  return [
    currentTime
      .startOf(type === OA_WORK_REPORT_TYPE.MONTHLY ? 'year' : 'month')
      .format('YYYY-MM-DD'),
    currentTime.format('YYYY-MM-DD')
  ]
}

/** 计算填写率，四舍五入保留一位小数 */
function calculateFillRate(submittedCount: number, expectedCount: number) {
  if (expectedCount === 0) {
    return 0
  }
  return Math.round((submittedCount * 1000) / expectedCount) / 10
}

/** 查询工作汇报统计 */
async function getStatistics() {
  if (!queryParams.deptId || !reportDate.value?.length) return
  loading.value = true
  try {
    // 1.1 设置统计时间范围，包含首日零点和末日最后一秒
    ;[queryParams.startTime, queryParams.endTime] = getDateRange(
      reportDate.value[0],
      reportDate.value[1]
    )
    // 1.2 设置完整周期的查询范围，避免统计从周中、月中开始时漏掉汇报
    let queryStartTime = dayjs(queryParams.startTime)
    let queryEndTime = dayjs(queryParams.endTime)
    if (queryParams.type === OA_WORK_REPORT_TYPE.WEEKLY) {
      queryStartTime = queryStartTime.subtract((queryStartTime.day() + 6) % 7, 'day')
      queryEndTime = queryEndTime.add((7 - queryEndTime.day()) % 7, 'day')
    } else if (queryParams.type === OA_WORK_REPORT_TYPE.MONTHLY) {
      queryStartTime = queryStartTime.startOf('month')
      queryEndTime = queryEndTime.endOf('month')
    }
    ;[queryParams.queryStartTime, queryParams.queryEndTime] = getDateRange(
      queryStartTime,
      queryEndTime
    )

    // 2. 查询并更新工作汇报统计结果
    statistics.value = await WorkReportApi.getWorkReportStatistics(queryParams)
  } finally {
    loading.value = false
  }
}

/** 切换汇报类型 */
function handleTypeChange(type: string | number) {
  queryParams.type = Number(type)
  reportDate.value = getDefaultReportDate(queryParams.type)
  getStatistics()
}

/** 搜索按钮操作 */
function handleQuery() {
  getStatistics()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  deptTreeRef.value?.reset()
  reportDate.value = getDefaultReportDate(activeType.value)
  queryParams.deptId = undefined
  getStatistics()
}

/** 处理部门节点点击 */
function handleDeptNodeClick(deptId?: number) {
  queryParams.deptId = deptId
  getStatistics()
}

/** 打开员工汇报明细 */
function openStatisticsDetail(user: WorkReportApi.OaWorkReportUserStatisticsVO, tab: string) {
  statisticsDetailRef.value?.open(user, tab, queryParams)
}

/** 初始化 */
onMounted(() => {
  getStatistics()
})
</script>
