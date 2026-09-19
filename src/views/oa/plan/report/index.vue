<template>
  <doc-alert
    title="【协作】日程、任务、计划与汇报"
    url="https://doc.iocoder.cn/oa/collaboration/work/"
  />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="成员姓名" prop="userName">
        <el-input
          v-model="queryParams.userName"
          clearable
          class="!w-240px"
          placeholder="请输入成员姓名"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="计划类型" prop="type">
        <el-radio-group v-model="queryParams.type" @change="handleTypeChange">
          <el-radio-button
            v-for="item in getIntDictOptions(DICT_TYPE.OA_PLAN_TYPE)"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="统计周期">
        <el-date-picker
          v-model="periodDate"
          :type="queryParams.type === OA_PLAN_TYPE.MONTH ? 'month' : 'date'"
          :format="queryParams.type === OA_PLAN_TYPE.MONTH ? 'YYYY-MM' : 'YYYY-MM-DD'"
          value-format="YYYY-MM-DD"
          :clearable="false"
          placeholder="请选择统计日期"
          class="!w-240px"
          @change="handlePeriodDateChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handlePeriodChange(-1)">上一周期</el-button>
        <el-button @click="handlePeriodChange(1)">下一周期</el-button>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 报表列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="部门" prop="deptName" min-width="120" />
      <el-table-column label="成员" prop="userName" min-width="110" />
      <el-table-column label="计划" min-width="260">
        <template #default="scope">
          <template v-if="scope.row.planId">
            <div class="font-medium">
              <span v-if="scope.row.label">【{{ scope.row.label }}】</span>{{ scope.row.title }}
            </div>
            <div class="mt-4px whitespace-pre-line text-13px text-gray-500">
              {{ scope.row.content }}
            </div>
            <div v-if="scope.row.fileUrls?.length" class="mt-4px">
              <el-link
                v-for="(fileUrl, index) in scope.row.fileUrls"
                :key="fileUrl"
                :href="fileUrl"
                class="mr-10px"
                target="_blank"
                type="primary"
              >
                附件 {{ Number(index) + 1 }}
              </el-link>
            </div>
          </template>
          <span v-else class="text-gray-400">未提交</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.planId"
            :type="DICT_TYPE.OA_PLAN_STATUS"
            :value="scope.row.status"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="总结" prop="summary" min-width="180" show-overflow-tooltip />
      <el-table-column label="点评" min-width="180">
        <template #default="scope">
          <div class="whitespace-pre-line">{{ scope.row.comment || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.planId"
            type="primary"
            link
            v-hasPermi="['oa:plan:comment']"
            @click="openCommentForm(scope.row.planId)"
          >
            点评
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
  <!-- 计划点评表单 -->
  <Dialog v-model="commentDialogVisible" title="点评工作计划" width="560px">
    <el-form
      ref="commentFormRef"
      v-loading="commentLoading"
      :model="commentFormData"
      :rules="commentFormRules"
      label-width="80px"
    >
      <el-form-item label="点评内容" prop="comment">
        <el-input
          v-model="commentFormData.comment"
          type="textarea"
          :rows="5"
          maxlength="1000"
          placeholder="请输入本次点评内容"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="commentLoading" @click="submitComment">确 定</el-button>
      <el-button @click="commentDialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { FormInstance, FormRules } from 'element-plus'
import * as PlanApi from '@/api/oa/plan'
import { getDateRange } from '@/utils/formatTime'
import { OA_PLAN_TYPE } from '../../utils/constants'

defineOptions({ name: 'OaPlanReport' })

const message = useMessage() // 消息弹窗
const loading = ref(true) // 列表加载中
const list = ref<PlanApi.OaPlanReportVO[]>([]) // 工作计划报表列表
const total = ref(0) // 列表总数
const periodDate = ref(dayjs().format('YYYY-MM-DD')) // 统计日期，周计划归一到周一，月计划归一到月初
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userName: undefined,
  type: OA_PLAN_TYPE.DAY as number,
  createTime: [] as string[]
}) // 查询参数
const queryFormRef = ref<FormInstance>() // 搜索表单 Ref

const commentDialogVisible = ref(false) // 点评弹窗是否显示
const commentLoading = ref(false) // 点评提交中
const commentFormRef = ref<FormInstance>() // 点评表单 Ref
const commentFormData = ref({ id: 0, comment: '' }) // 点评表单数据
const commentFormRules = reactive<FormRules>({
  comment: [{ required: true, whitespace: true, message: '点评内容不能为空', trigger: 'blur' }]
}) // 点评表单校验规则

/** 查询工作计划报表 */
async function getList() {
  loading.value = true
  try {
    const data = await PlanApi.getPlanReportPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.type = OA_PLAN_TYPE.DAY
  periodDate.value = dayjs().format('YYYY-MM-DD')
  updatePeriod()
  handleQuery()
}

/** 切换计划类型 */
function handleTypeChange() {
  periodDate.value = dayjs().format('YYYY-MM-DD')
  updatePeriod()
  handleQuery()
}

/** 切换上一个或下一个统计周期 */
function handlePeriodChange(step: number) {
  const unit =
    queryParams.type === OA_PLAN_TYPE.DAY
      ? 'day'
      : queryParams.type === OA_PLAN_TYPE.WEEK
        ? 'week'
        : 'month'
  periodDate.value = dayjs(periodDate.value).add(step, unit).format('YYYY-MM-DD')
  updatePeriod()
  handleQuery()
}

/** 选择统计日期 */
function handlePeriodDateChange() {
  updatePeriod()
  handleQuery()
}

/** 更新统计周期 */
function updatePeriod() {
  // 查询时间覆盖整个自然周期，包含结束日的最后一秒
  const beginTime = getPeriodBeginTime(dayjs(periodDate.value))
  periodDate.value = beginTime.format('YYYY-MM-DD')
  const endTime =
    queryParams.type === OA_PLAN_TYPE.DAY
      ? beginTime
      : queryParams.type === OA_PLAN_TYPE.WEEK
        ? beginTime.add(6, 'day')
        : beginTime.endOf('month')
  queryParams.createTime = getDateRange(beginTime, endTime)
}

/** 获得统计周期开始时间 */
function getPeriodBeginTime(date: Dayjs) {
  if (queryParams.type === OA_PLAN_TYPE.DAY) {
    return date.startOf('day')
  }
  if (queryParams.type === OA_PLAN_TYPE.WEEK) {
    // 周报固定从周一开始，周日归入当前周
    const dayOfWeek = date.day()
    return date.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day').startOf('day')
  }
  return date.startOf('month')
}

/** 打开点评表单 */
function openCommentForm(planId: number) {
  commentFormRef.value?.resetFields()
  commentFormData.value = { id: planId, comment: '' }
  commentDialogVisible.value = true
}

/** 提交计划点评 */
async function submitComment() {
  // 1. 校验点评内容
  await commentFormRef.value?.validate()
  // 2. 提交请求，禁用按钮避免重复点评
  commentLoading.value = true
  try {
    await PlanApi.addPlanComment(commentFormData.value.id, commentFormData.value.comment.trim())
    message.success('点评成功')
    commentDialogVisible.value = false
    // 3. 刷新报表
    await getList()
  } finally {
    commentLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  updatePeriod()
  getList()
})
</script>
