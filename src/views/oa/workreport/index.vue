<template>
  <doc-alert
    title="【协作】日程、任务、计划与汇报"
    url="https://doc.iocoder.cn/oa/collaboration/work/"
  />
  <!-- 汇报类型与搜索工作栏 -->
  <ContentWrap>
    <el-tabs v-model="activeType" @tab-change="handleTypeChange">
      <el-tab-pane label="工作日报" :name="OA_WORK_REPORT_TYPE.DAILY" />
      <el-tab-pane label="工作周报" :name="OA_WORK_REPORT_TYPE.WEEKLY" />
      <el-tab-pane label="工作月报" :name="OA_WORK_REPORT_TYPE.MONTHLY" />
    </el-tabs>

    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px mt-16px"
      label-width="68px"
    >
      <el-form-item label="单据编号" prop="no">
        <el-input
          v-model="queryParams.no"
          clearable
          class="!w-240px"
          placeholder="请输入单据编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="汇报状态" prop="status">
        <el-select
          v-model="queryParams.status"
          clearable
          class="!w-240px"
          placeholder="请选择汇报状态"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_WORK_REPORT_STATUS)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="申请部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-240px" />
      </el-form-item>
      <el-form-item
        v-if="activeType === OA_WORK_REPORT_TYPE.WEEKLY"
        label="汇报周次"
        prop="reportWeek"
      >
        <el-input
          v-model="queryParams.reportWeek"
          clearable
          class="!w-240px"
          placeholder="请输入周次，如 2026-12"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item
        v-if="activeType === OA_WORK_REPORT_TYPE.MONTHLY"
        label="汇报月份"
        prop="reportMonth"
      >
        <el-date-picker
          v-model="queryParams.reportMonth"
          type="month"
          value-format="YYYY-MM"
          class="!w-240px"
          placeholder="请选择汇报月份"
        />
      </el-form-item>
      <el-form-item label="开始日期" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          type="date"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="!w-240px"
          placeholder="请选择开始日期"
        />
      </el-form-item>
      <el-form-item label="结束日期" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          type="date"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="!w-240px"
          placeholder="请选择结束日期"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:work-report:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 工作汇报列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单据编号" prop="no" width="185" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openForm('detail', scope.row.id)">
            {{ scope.row.no }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="90">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_WORK_REPORT_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="汇报类型" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.OA_WORK_REPORT_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column
        v-if="activeType !== OA_WORK_REPORT_TYPE.DAILY"
        :label="activeType === OA_WORK_REPORT_TYPE.WEEKLY ? '汇报周次' : '汇报月份'"
        prop="periodKey"
        width="120"
      />
      <el-table-column label="汇报标题" prop="title" min-width="220" show-overflow-tooltip>
        <template #default="scope">
          <el-link type="primary" :underline="false" @click="openForm('detail', scope.row.id)">
            {{ scope.row.title }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="开始日期" prop="startTime" :formatter="dateFormatter2" width="120" />
      <el-table-column label="结束日期" prop="endTime" :formatter="dateFormatter2" width="120" />
      <el-table-column label="申请人" prop="userName" width="120" />
      <el-table-column label="申请部门" prop="deptName" width="130" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" width="210" fixed="right">
        <template #default="scope">
          <el-button
            v-hasPermi="['oa:work-report:update']"
            link
            type="primary"
            @click="handleStatusChange(scope.row)"
          >
            {{ scope.row.status === OA_WORK_REPORT_STATUS.DRAFT ? '提交' : '取消提交' }}
          </el-button>
          <el-button
            v-if="scope.row.status === OA_WORK_REPORT_STATUS.DRAFT"
            v-hasPermi="['oa:work-report:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            修改
          </el-button>
          <el-button
            v-if="scope.row.status === OA_WORK_REPORT_STATUS.DRAFT"
            v-hasPermi="['oa:work-report:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 工作汇报表单 -->
  <OaWorkReportForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, dateFormatter2, getDateRange, getMonthRange } from '@/utils/formatTime'
import * as WorkReportApi from '@/api/oa/workreport'
import { OA_WORK_REPORT_STATUS, OA_WORK_REPORT_TYPE } from '@/views/oa/utils/constants'
import { formatWorkReportWeek, getWorkReportWeekStart } from '@/views/oa/utils/format'
import OaWorkReportForm from './OaWorkReportForm.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'

defineOptions({ name: 'OaWorkReport' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表加载中
const list = ref<WorkReportApi.OaWorkReportVO[]>([]) // 工作汇报列表
const total = ref(0) // 列表总数
const activeType = ref<number>(OA_WORK_REPORT_TYPE.DAILY) // 当前汇报类型
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: Number(OA_WORK_REPORT_TYPE.DAILY),
  no: undefined,
  deptId: undefined,
  reportWeek: undefined as string | undefined,
  reportMonth: undefined as string | undefined,
  startTime: undefined,
  endTime: undefined,
  status: undefined,
  createTime: undefined
}) // 查询参数
const queryFormRef = ref<FormInstance>() // 搜索表单 Ref
const formRef = ref<InstanceType<typeof OaWorkReportForm>>() // 工作汇报表单 Ref

/** 查询工作汇报列表 */
async function getList() {
  // 1. 将周次或月份转换为完整周期的开始时间范围
  let periodTime: string[] | undefined
  if (queryParams.reportWeek) {
    if (
      !/^[0-9]{4}-(0[1-9]|[1-4][0-9]|5[0-3])$/.test(queryParams.reportWeek) ||
      formatWorkReportWeek(getWorkReportWeekStart(queryParams.reportWeek).valueOf()) !==
        queryParams.reportWeek
    ) {
      message.warning('周次格式为 yyyy-ww')
      return
    }
    const weekStartTime = getWorkReportWeekStart(queryParams.reportWeek)
    periodTime = getDateRange(weekStartTime, weekStartTime.add(6, 'day'))
  } else if (queryParams.reportMonth) {
    periodTime = getMonthRange(queryParams.reportMonth + '-01')
  }

  // 2. 查询工作汇报列表，不向接口传递页面的周次、月份字段
  loading.value = true
  try {
    const { reportWeek, reportMonth, ...filters } = queryParams
    const params = { ...filters, periodTime }
    const data = await WorkReportApi.getWorkReportPage(params)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 切换汇报类型 */
function handleTypeChange(type: string | number) {
  queryParams.type = Number(type)
  queryParams.reportWeek = undefined
  queryParams.reportMonth = undefined
  handleQuery()
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.type = activeType.value
  handleQuery()
}

/** 提交或取消提交工作汇报 */
async function handleStatusChange(row: WorkReportApi.OaWorkReportVO) {
  const isDraft = row.status === OA_WORK_REPORT_STATUS.DRAFT
  try {
    // 1. 确认汇报状态操作
    await message.confirm(isDraft ? '确认提交该工作汇报吗？' : '确认取消提交并恢复为草稿吗？')
    // 2. 更新状态并刷新列表，不发起审批
    if (isDraft) {
      await WorkReportApi.submitWorkReport(row.id!)
    } else {
      await WorkReportApi.cancelWorkReport(row.id!)
    }
    message.success(isDraft ? '提交成功' : '取消提交成功')
    await getList()
  } catch {}
}

/** 添加、修改或查看操作 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id, activeType.value)
}

/** 删除工作汇报 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await WorkReportApi.deleteWorkReport(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
