<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1080px" top="8vh" max-height="70vh">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :disabled="readonly"
      :model="formData"
      :rules="formRules"
      label-width="96px"
    >
      <!-- 基本信息 -->
      <div class="mb-16px text-16px font-600">基本信息</div>
      <el-row :gutter="20">
        <el-col v-if="formData.type === OA_WORK_REPORT_TYPE.WEEKLY" :span="16">
          <el-form-item label="汇报周次">
            <el-select v-model="reportWeek" class="w-full" @change="handleWeekChange">
              <el-option
                v-for="item in weekOptions"
                :key="item.value"
                :value="item.value"
                :label="item.label"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="formData.type === OA_WORK_REPORT_TYPE.MONTHLY" :span="8">
          <el-form-item label="汇报月份">
            <el-date-picker
              v-model="periodValue"
              type="month"
              value-format="x"
              class="!w-full"
              :clearable="false"
              @change="handlePeriodChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始日期" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="date"
              value-format="x"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束日期" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="date"
              value-format="x"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="汇报标题" prop="title">
        <el-input
          v-model="formData.title"
          maxlength="255"
          placeholder="留空时将根据汇报周期自动生成"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="工作总结" prop="summary">
        <el-input
          v-model="formData.summary"
          :rows="3"
          maxlength="5000"
          placeholder="请输入工作总结补充说明"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="工作计划" prop="plan">
        <el-input
          v-model="formData.plan"
          :rows="3"
          maxlength="5000"
          placeholder="请输入工作计划补充说明"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="问题与协调" prop="problem">
        <el-input
          v-model="formData.problem"
          :rows="3"
          maxlength="5000"
          placeholder="请输入存在的问题或需要协调的事项"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          :rows="2"
          maxlength="1000"
          placeholder="请输入备注"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :limit="10" :file-size="20" :disabled="readonly" />
      </el-form-item>

      <!-- 已完成工作 -->
      <el-divider content-position="left">已完成工作</el-divider>
      <el-table :data="formData.workItems" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="工作内容" min-width="460">
          <template #default="scope">
            <el-input
              v-model="scope.row.content"
              maxlength="1000"
              placeholder="请输入已完成的工作内容"
            />
          </template>
        </el-table-column>
        <el-table-column label="完成进度" width="260">
          <template #default="scope">
            <div class="flex items-center gap-12px">
              <el-slider v-if="!readonly" v-model="scope.row.progress" :step="10" class="flex-1" />
              <span class="w-42px text-right">{{ scope.row.progress }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="!readonly" label="操作" width="80" align="center">
          <template #default="scope">
            <el-button type="danger" link @click="removeWorkItem(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button
        v-if="!readonly"
        :disabled="formData.workItems.length >= 100"
        class="mt-12px"
        type="primary"
        plain
        @click="addWorkItem"
      >
        <Icon icon="ep:plus" /> 新增工作项
      </el-button>

      <!-- 工作计划 -->
      <el-divider content-position="left">工作计划</el-divider>
      <el-table :data="formData.planItems" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="计划内容" min-width="720">
          <template #default="scope">
            <el-input
              v-model="scope.row.content"
              maxlength="1000"
              placeholder="请输入下一阶段工作计划"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="!readonly" label="操作" width="80" align="center">
          <template #default="scope">
            <el-button type="danger" link @click="removePlanItem(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button
        v-if="!readonly"
        :disabled="formData.planItems.length >= 100"
        class="mt-12px"
        type="primary"
        plain
        @click="addPlanItem"
      >
        <Icon icon="ep:plus" /> 新增计划项
      </el-button>
    </el-form>
    <!-- 表单操作 -->
    <template #footer>
      <el-button v-if="!readonly" :disabled="formLoading" type="primary" @click="submitForm">
        保 存
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import {
  formatWorkReportWeek,
  getWorkReportWeekStart,
  getWorkReportWeekOptions
} from '@/views/oa/utils/format'
import * as WorkReportApi from '@/api/oa/workreport'
import { OA_WORK_REPORT_TYPE } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaWorkReportForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）详情数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改；detail - 详情
const reportWeek = ref('') // 当前汇报周次
const weekOptions = ref(getWorkReportWeekOptions(dayjs().year())) // 周次选项
const periodValue = ref<string | number>() // 当前选择的汇报周期
const formData = ref<WorkReportApi.OaWorkReportVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  type: [{ required: true, message: '汇报类型不能为空', trigger: 'change' }],
  startTime: [{ required: true, message: '开始日期不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束日期不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref

const readonly = computed(() => formType.value === 'detail') // 是否只读

/** 打开弹窗 */
async function open(type: string, id?: number, reportType: number = OA_WORK_REPORT_TYPE.DAILY) {
  dialogVisible.value = true
  dialogTitle.value = type === 'detail' ? '工作汇报详情' : t('action.' + type)
  formType.value = type
  resetForm(reportType)

  // 修改或查看时，加载工作汇报详情
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WorkReportApi.getWorkReport(id)
      // 日期控件使用时间戳格式，回填时转换日期值
      formData.value.startTime = dayjs(formData.value.startTime).valueOf()
      formData.value.endTime = dayjs(formData.value.endTime).valueOf()
      periodValue.value = formData.value.startTime
      reportWeek.value = formatWorkReportWeek(periodValue.value)
      weekOptions.value = getWorkReportWeekOptions(Number(reportWeek.value.split('-')[0]))
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 保存工作汇报草稿 */
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 1. 校验表单
  await formRef.value?.validate()

  // 2. 统一日期边界，忽略尚未填写的表格空白行
  formData.value.startTime = dayjs(Number(formData.value.startTime)).startOf('day').valueOf()
  formData.value.endTime = dayjs(Number(formData.value.endTime)).endOf('day').valueOf()
  formData.value.workItems = formData.value.workItems.filter((item) => item.content)
  formData.value.planItems = formData.value.planItems.filter((item) => item.content)
  if (
    !formData.value.summary?.trim() &&
    !formData.value.plan?.trim() &&
    !formData.value.workItems.length &&
    !formData.value.planItems.length
  ) {
    return message.warning('请填写工作总结、计划说明或工作明细')
  }

  // 3. 保存草稿，提交由列表单独操作
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      formData.value.id = await WorkReportApi.createWorkReport(formData.value)
    } else {
      await WorkReportApi.updateWorkReport(formData.value)
    }
    dialogVisible.value = false
    message.success('保存成功')
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 处理汇报周期变化 */
function handlePeriodChange(value?: string | number) {
  if (!value) return
  const date = dayjs(Number(value))
  // 日报默认覆盖当天
  if (formData.value.type === OA_WORK_REPORT_TYPE.DAILY) {
    formData.value.startTime = date.startOf('day').valueOf()
    formData.value.endTime = date.endOf('day').valueOf()
    return
  }
  // 周报默认覆盖周一至周日
  if (formData.value.type === OA_WORK_REPORT_TYPE.WEEKLY) {
    const weekDay = date.day() === 0 ? 7 : date.day()
    const startTime = date.subtract(weekDay - 1, 'day').startOf('day')
    formData.value.startTime = startTime.valueOf()
    formData.value.endTime = startTime.add(6, 'day').endOf('day').valueOf()
    return
  }
  // 月报默认覆盖整月
  formData.value.startTime = date.startOf('month').valueOf()
  formData.value.endTime = date.endOf('month').valueOf()
}

/** 选择周次时初始化日期，之后仍可手动调整 */
function handleWeekChange(value: string) {
  const startTime = getWorkReportWeekStart(value)
  formData.value.startTime = startTime.startOf('day').valueOf()
  formData.value.endTime = startTime.add(6, 'day').endOf('day').valueOf()
}

/** 新增已完成工作项 */
function addWorkItem() {
  formData.value.workItems.push({ content: '', progress: 0 })
}

/** 删除已完成工作项 */
function removeWorkItem(index: number) {
  formData.value.workItems.splice(index, 1)
}

/** 新增工作计划项 */
function addPlanItem() {
  formData.value.planItems.push({ content: '' })
}

/** 删除工作计划项 */
function removePlanItem(index: number) {
  formData.value.planItems.splice(index, 1)
}

/** 重置表单 */
function resetForm(reportType: number) {
  formData.value = createDefaultFormData(reportType)
  periodValue.value = Date.now()
  handlePeriodChange(periodValue.value)
  reportWeek.value = formatWorkReportWeek(periodValue.value)
  weekOptions.value = getWorkReportWeekOptions(Number(reportWeek.value.split('-')[0]))
  formRef.value?.resetFields()
}

/** 创建工作汇报默认表单数据 */
function createDefaultFormData(
  reportType: number = OA_WORK_REPORT_TYPE.DAILY
): WorkReportApi.OaWorkReportVO {
  return {
    type: reportType,
    title: '',
    startTime: '',
    endTime: '',
    summary: '',
    plan: '',
    problem: '',
    workItems: [],
    planItems: [],
    fileUrls: [],
    remark: ''
  }
}
</script>
