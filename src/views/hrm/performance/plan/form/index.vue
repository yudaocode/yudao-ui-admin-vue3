<template>
  <ContentWrap v-loading="formLoading">
    <div class="mb-28px flex items-center justify-between">
      <div class="flex min-w-0 items-center">
        <Icon icon="ep:arrow-left" class="mr-10px cursor-pointer" @click="close" />
        <span class="truncate text-16px font-600" :title="pageTitle">{{ pageTitle }}</span>
      </div>
      <div>
        <el-button @click="close">返 回</el-button>
        <el-button v-if="currentStep > 0" :disabled="formLoading" @click="handlePreviousStep">
          上一步
        </el-button>
        <el-button
          v-if="currentStep < steps.length - 1"
          :disabled="formLoading"
          type="primary"
          @click="handleNextStep"
        >
          下一步
        </el-button>
        <el-button
          v-else-if="planEditable"
          :loading="formLoading"
          type="primary"
          @click="submitForm"
        >
          保 存
        </el-button>
      </div>
    </div>

    <el-steps :active="currentStep" align-center class="mx-auto mb-32px max-w-900px">
      <el-step
        v-for="(step, index) in steps"
        :key="step.title"
        :title="step.title"
        class="cursor-pointer"
        @click="handleStepClick(index)"
      />
    </el-steps>

    <el-form
      ref="formRef"
      :disabled="!planEditable"
      :model="formData"
      :rules="formRules"
      label-width="128px"
    >
      <PerformancePlanBasicForm
        v-show="currentStep === 0"
        v-model="formData"
        v-model:custom-date-range="customDateRange"
      />
      <PerformancePlanIndicatorForm
        v-show="currentStep === 1"
        ref="indicatorFormRef"
        v-model="formData"
        :disabled="!planEditable"
      />
      <PerformancePlanProcessForm
        v-show="currentStep === 2"
        v-model="formData"
        :disabled="!planEditable"
      />
      <PerformancePlanResultForm
        v-show="currentStep === 3"
        ref="resultFormRef"
        v-model="formData"
        :disabled="!planEditable"
        :result-template-list="resultTemplateList"
      />
    </el-form>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { isPositiveId, parseId } from '@/utils/id'

import dayjs from 'dayjs'
import type { FormInstance, FormRules } from 'element-plus'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { CommonStatusEnum } from '@/utils/constants'
import * as PerformanceResultTemplateApi from '@/api/hrm/performance/config/result-template'
import * as PerformancePlanApi from '@/api/hrm/performance/plan'
import { createDefaultAssessmentConfig } from '@/views/hrm/utils/performance'
import {
  HrmPerformanceCycleType,
  HrmPerformanceAppealTimeoutAction,
  HrmPerformancePlanScopeType,
  HrmPerformancePlanStatus,
  HrmPerformanceQuotaSettingType,
  HrmPerformanceRaterType,
  HrmPerformanceReviewScoringType,
  HrmPerformanceReviewVisibleContent
} from '@/views/hrm/utils/constants'
import PerformancePlanBasicForm from './PerformancePlanBasicForm.vue'
import PerformancePlanIndicatorForm from './PerformancePlanIndicatorForm.vue'
import PerformancePlanProcessForm from './PerformancePlanProcessForm.vue'
import PerformancePlanResultForm from './PerformancePlanResultForm.vue'
import { formatHrmPerformanceReviewStageName } from '@/views/hrm/utils/format'

defineOptions({ name: 'HrmPerformancePlanForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const route = useRoute() // 当前路由
const router = useRouter() // 路由
const { delView } = useTagsViewStore() // 页签操作

const formLoading = ref(false) // 表单加载中
const currentStep = ref(0) // 当前步骤
const formData = ref<PerformancePlanApi.PerformancePlanVO>(createDefaultFormData()) // 表单数据
const customDateRange = ref<string[]>([]) // 自定义考核日期范围
const resultTemplateList = ref<PerformanceResultTemplateApi.ResultTemplateVO[]>([]) // 结果模板列表
const formRef = ref<FormInstance>() // 表单 Ref
const indicatorFormRef = ref<InstanceType<typeof PerformancePlanIndicatorForm>>() // 指标设置表单 Ref
const resultFormRef = ref<InstanceType<typeof PerformancePlanResultForm>>() // 结果设置表单 Ref
const viewMode = computed(() => route.query.type === 'view') // 是否为查看模式
const pageTitle = computed(() => {
  if (!formData.value.id) {
    return '新增 KPI 考核'
  }
  return `${viewMode.value ? '查看' : '修改'} KPI 考核：${formData.value.name}`
})
const planEditable = computed(
  () =>
    !viewMode.value &&
    (!formData.value.status ||
      formData.value.status === HrmPerformancePlanStatus.DRAFT ||
      formData.value.status === HrmPerformancePlanStatus.NOT_STARTED)
)
const steps = [
  {
    title: '基础设置',
    fields: ['name', 'cycleType', 'cycle', 'scopes']
  },
  {
    title: '指标设置',
    fields: ['assessmentTemplateId']
  },
  {
    title: '流程设置',
    fields: [
      'quotaSettingType',
      'targetConfirmationStage',
      'reviewStages',
      'resultAuditStages',
      'appealTimeoutDays',
      'appealTimeoutAction',
      'appealStages'
    ]
  },
  {
    title: '结果设置',
    fields: ['resultTemplateId', 'paidForMonth']
  }
]

/** 校验评分阶段 */
function validateReviewStages(
  _: unknown,
  value: PerformancePlanApi.PerformanceReviewStageVO[] | undefined,
  callback: (error?: Error) => void
) {
  if (!value?.length) {
    return callback(new Error('请至少配置一个评分阶段'))
  }
  const reviewWeightTotal = value.reduce((total, stage) => total + Number(stage.weight || 0), 0)
  if (Math.abs(reviewWeightTotal - 100) > 0.001) {
    return callback(new Error('评分权重合计必须等于 100%'))
  }
  if (value.filter((stage) => stage.rater?.type === HrmPerformanceRaterType.SELF).length > 1) {
    return callback(new Error('只能配置一个员工自评阶段'))
  }
  const raterKeys = new Set<string>()
  for (const stage of value) {
    const rater = stage.rater
    if (!rater?.type || !stage.weight || stage.weight <= 0) {
      return callback(new Error('请完整填写评分人和权重'))
    }
    if (
      (rater.type === HrmPerformanceRaterType.SUPERIOR ||
        rater.type === HrmPerformanceRaterType.DEPT_LEADER) &&
      !rater.level
    ) {
      return callback(new Error('请选择评分人层级'))
    }
    if (rater.type === HrmPerformanceRaterType.SPECIFIED && !rater.employeeId) {
      return callback(new Error('请选择指定评分人'))
    }
    const raterKey =
      rater.type === HrmPerformanceRaterType.SELF
        ? 'self'
        : `${rater.type}:${
            rater.type === HrmPerformanceRaterType.SPECIFIED ? rater.employeeId : rater.level
          }`
    if (raterKeys.has(raterKey)) {
      return callback(new Error('评分人配置不能重复'))
    }
    raterKeys.add(raterKey)
  }
  callback()
}

/** 校验目标确认节点 */
function validateTargetConfirmation(_: unknown, __: unknown, callback: (error?: Error) => void) {
  if (
    formData.value.quotaSettingType !== HrmPerformanceQuotaSettingType.EMPLOYEE ||
    !formData.value.targetConfirmation
  ) {
    return callback()
  }
  const stage = formData.value.targetConfirmationStage
  if (!stage?.type || !Object.values(HrmPerformanceRaterType).some((type) => type === stage.type)) {
    return callback(new Error('请选择目标确认人'))
  }
  if (
    (stage.type === HrmPerformanceRaterType.SUPERIOR ||
      stage.type === HrmPerformanceRaterType.DEPT_LEADER) &&
    !stage.level
  ) {
    return callback(new Error('请选择目标确认人层级'))
  }
  if (stage.type === HrmPerformanceRaterType.SPECIFIED && !stage.employeeId) {
    return callback(new Error('请选择指定确认员工'))
  }
  callback()
}

/** 校验考评范围 */
function validateScopes(
  _: unknown,
  value: PerformancePlanApi.PerformanceScopeVO[] | undefined,
  callback: (error?: Error) => void
) {
  if (!value?.length || value.length > 3) {
    return callback(new Error('请配置 1 至 3 组考核范围'))
  }
  for (const scope of value) {
    if (
      scope.type === HrmPerformancePlanScopeType.EMPLOYEE_DEPT &&
      !scope.employeeIds?.length &&
      !scope.deptIds?.length
    ) {
      return callback(new Error('员工部门范围至少选择员工或部门'))
    }
    if (
      scope.type === HrmPerformancePlanScopeType.EMPLOYMENT &&
      (!scope.employeeType || !scope.employeeStatuses?.length)
    ) {
      return callback(new Error('请完整选择聘用形式和员工状态'))
    }
  }
  callback()
}

/** 校验处理节点 */
function validateHandlerStages(
  enabled: boolean,
  value: PerformancePlanApi.PerformanceHandlerStageVO[] | undefined,
  callback: (error?: Error) => void
) {
  if (!enabled) {
    return callback()
  }
  if (!value?.length || value.length > 3) {
    return callback(new Error('请配置 1 至 3 个处理节点'))
  }
  const handlerKeys = new Set<string>()
  for (const stage of value) {
    if (
      (stage.type === HrmPerformanceRaterType.SUPERIOR ||
        stage.type === HrmPerformanceRaterType.DEPT_LEADER) &&
      !stage.level
    ) {
      return callback(new Error('请选择处理人层级'))
    }
    if (stage.type === HrmPerformanceRaterType.SPECIFIED && !stage.employeeId) {
      return callback(new Error('请选择指定处理员工'))
    }
    const handlerKey = `${stage.type}:${
      stage.type === HrmPerformanceRaterType.SPECIFIED ? stage.employeeId : stage.level
    }`
    if (handlerKeys.has(handlerKey)) {
      return callback(new Error('处理人配置不能重复'))
    }
    handlerKeys.add(handlerKey)
  }
  callback()
}

/** 表单校验规则 */
const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '考核计划名称不能为空', trigger: 'blur' },
    { max: 50, message: '考核计划名称不能超过 50 个字符', trigger: 'blur' }
  ],
  cycleType: [{ required: true, message: '请选择考核周期类型', trigger: 'change' }],
  cycle: [
    {
      validator: (_rule, _value, callback) => {
        if (
          formData.value.cycleType === HrmPerformanceCycleType.OTHER
            ? customDateRange.value.length !== 2
            : !formData.value.cycle
        ) {
          return callback(new Error('请选择考核周期'))
        }
        if (
          formData.value.cycleType === HrmPerformanceCycleType.QUARTER &&
          !formData.value.quarter
        ) {
          return callback(new Error('请选择季度'))
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  description: [{ max: 200, message: '考核说明不能超过 200 个字符', trigger: 'blur' }],
  assessmentTemplateId: [{ required: true, message: '考核指标模板不能为空', trigger: 'change' }],
  resultTemplateId: [{ required: true, message: '考核结果模板不能为空', trigger: 'change' }],
  quotaSettingType: [{ required: true, message: '请选择指标制定方式', trigger: 'change' }],
  targetConfirmationStage: [{ validator: validateTargetConfirmation, trigger: 'change' }],
  paidForMonth: [
    {
      validator: (_rule, value, callback) => {
        if (formData.value.syncToSalary && !value) {
          return callback(new Error('请选择参与计薪月份'))
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  appealTimeoutDays: [{ required: true, message: '请输入超期天数', trigger: 'change' }],
  appealTimeoutAction: [{ required: true, message: '请选择超期处理方式', trigger: 'change' }],
  scopes: [{ validator: validateScopes, trigger: 'change' }],
  resultAuditStages: [
    {
      validator: (_rule, value, callback) =>
        validateHandlerStages(Boolean(formData.value.resultAudit), value, callback),
      trigger: 'change'
    }
  ],
  appealStages: [
    {
      validator: (_rule, value, callback) =>
        validateHandlerStages(Boolean(formData.value.resultConfirmation), value, callback),
      trigger: 'change'
    }
  ],
  reviewStages: [{ validator: validateReviewStages, trigger: 'change' }]
})

/** 校验指定步骤 */
async function validateStep(stepIndex: number) {
  await formRef.value?.validateField(steps[stepIndex].fields)
  if (stepIndex === 1 && !indicatorFormRef.value?.validate()) {
    throw new Error('请完善考核指标')
  }
  if (stepIndex === steps.length - 1 && !resultFormRef.value?.validate()) {
    throw new Error('请完善结果等级')
  }
}

/** 切换步骤 */
async function handleStepClick(index: number) {
  if (viewMode.value) {
    currentStep.value = index
    return
  }
  if (index <= currentStep.value) {
    currentStep.value = index
    return
  }
  for (let stepIndex = currentStep.value; stepIndex < index; stepIndex++) {
    try {
      await validateStep(stepIndex)
    } catch {
      currentStep.value = stepIndex
      message.warning(`请完善${steps[stepIndex].title}`)
      return
    }
  }
  currentStep.value = index
}

/** 上一步 */
function handlePreviousStep() {
  currentStep.value--
}

/** 下一步 */
function handleNextStep() {
  handleStepClick(currentStep.value + 1)
}

/** 校验全部步骤 */
async function validateAllSteps() {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    try {
      await validateStep(stepIndex)
    } catch {
      currentStep.value = stepIndex
      throw new Error(`请完善${steps[stepIndex].title}`)
    }
  }
}

/** 提交表单 */
async function submitForm() {
  try {
    await validateAllSteps()
  } catch (error) {
    message.warning(error instanceof Error ? error.message : '请完善 KPI 考核信息')
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    // 1. 处理指标、周期和流程配置
    if (formData.value.quotaSettingType !== HrmPerformanceQuotaSettingType.EMPLOYEE) {
      formData.value.targetConfirmation = false
      formData.value.targetConfirmationStage = undefined
    }
    fillCycleDates()
    formData.value.reviewStages = (formData.value.reviewStages || []).map((stage) => ({
      ...stage,
      name: formatHrmPerformanceReviewStageName(stage),
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      rejectAuthority:
        stage.rater?.type === HrmPerformanceRaterType.SELF ? false : Boolean(stage.rejectAuthority)
    }))

    // 2. 新增或修改 KPI 考核计划
    if (formData.value.id) {
      await PerformancePlanApi.updatePerformancePlan(formData.value)
      message.success(t('common.updateSuccess'))
    } else {
      await PerformancePlanApi.createPerformancePlan(formData.value)
      message.success(t('common.createSuccess'))
    }
    close()
  } finally {
    formLoading.value = false
  }
}

/** 返回来源页面 */
function close() {
  delView(unref(router.currentRoute))
  if (formData.value.id) {
    router.push({ name: 'HrmPerformancePlanDetail', params: { id: formData.value.id } })
    return
  }
  router.push({ name: 'HrmPerformancePlan' })
}

/** 初始化表单 */
async function initForm() {
  formLoading.value = true
  try {
    // 1. 加载模板选项
    resultTemplateList.value =
      await PerformanceResultTemplateApi.getPerformanceResultTemplateSimpleList({
        status: CommonStatusEnum.ENABLE
      })

    // 2. 修改或查看时加载 KPI 考核详情
    if (route.query.type !== 'update' && !viewMode.value) {
      return
    }
    const id = parseId(route.query.id)
    if (!isPositiveId(id)) {
      message.error('KPI 考核编号不正确')
      close()
      return
    }
    const data = await PerformancePlanApi.getPerformancePlan(id)
    if (!data) {
      message.error('KPI 考核不存在')
      close()
      return
    }
    if (
      !viewMode.value &&
      data.status !== HrmPerformancePlanStatus.DRAFT &&
      data.status !== HrmPerformancePlanStatus.NOT_STARTED
    ) {
      message.error('当前状态不允许修改 KPI 考核')
      close()
      return
    }
    formData.value = data
    formData.value.assessmentConfig ||= createDefaultAssessmentConfig()
    if (
      data.resultTemplateId &&
      data.resultConfig &&
      !resultTemplateList.value.some((template) => template.id === data.resultTemplateId)
    ) {
      resultTemplateList.value.unshift({
        id: data.resultTemplateId,
        name: data.resultConfig.name,
        levels: data.resultConfig.levels
      })
    }
    formData.value.quotaSettingType ??= HrmPerformanceQuotaSettingType.SYSTEM
    formData.value.targetConfirmation ??= false
    formData.value.resultAudit ??= false
    formData.value.resultConfirmation ??= false
    formData.value.appealTimeoutDays ??= 2
    formData.value.appealTimeoutAction ??= HrmPerformanceAppealTimeoutAction.REJECT
    if (!formData.value.scopes?.length) {
      formData.value.scopes = [createDefaultPlanScope()]
    }
    if (!formData.value.reviewStages?.length) {
      formData.value.reviewStages = createDefaultReviewStages()
    }
    if (!formData.value.resultAuditStages?.length) {
      formData.value.resultAuditStages = [createDefaultHandlerStage()]
    }
    if (!formData.value.appealStages?.length) {
      formData.value.appealStages = [createDefaultHandlerStage()]
    }
    customDateRange.value =
      formData.value.cycleType === HrmPerformanceCycleType.OTHER &&
      formData.value.startTime &&
      formData.value.endTime
        ? [
            dayjs(formData.value.startTime).format('YYYY-MM-DD'),
            dayjs(formData.value.endTime).format('YYYY-MM-DD')
          ]
        : []
  } finally {
    formLoading.value = false
  }
}

/** 填充考核周期的起止日期 */
function fillCycleDates() {
  const cycleType = formData.value.cycleType
  if (cycleType === HrmPerformanceCycleType.OTHER) {
    formData.value.startTime = dayjs(customDateRange.value[0]).startOf('day').valueOf()
    formData.value.endTime = dayjs(customDateRange.value[1]).endOf('day').valueOf()
    formData.value.cycle = customDateRange.value.join(' ~ ')
    formData.value.quarter = undefined
    return
  }
  const cycle = String(formData.value.cycle)
  if (cycleType === HrmPerformanceCycleType.MONTH) {
    const month = dayjs(`${cycle}-01`)
    formData.value.startTime = month.startOf('month').valueOf()
    formData.value.endTime = month.endOf('month').valueOf()
    formData.value.quarter = undefined
    return
  }
  const year = Number(cycle)
  let startMonth = 0
  let endMonth = 11
  if (cycleType === HrmPerformanceCycleType.QUARTER) {
    startMonth = ((formData.value.quarter || 1) - 1) * 3
    endMonth = startMonth + 2
  } else if (cycleType === HrmPerformanceCycleType.FIRST_HALF_YEAR) {
    endMonth = 5
  } else if (cycleType === HrmPerformanceCycleType.SECOND_HALF_YEAR) {
    startMonth = 6
  }
  formData.value.startTime = dayjs().year(year).month(startMonth).startOf('month').valueOf()
  formData.value.endTime = dayjs().year(year).month(endMonth).endOf('month').valueOf()
  if (cycleType !== HrmPerformanceCycleType.QUARTER) {
    formData.value.quarter = undefined
  }
}

/** 创建默认表单数据 */
function createDefaultFormData(): PerformancePlanApi.PerformancePlanVO {
  return {
    id: undefined,
    name: '',
    cycleType: HrmPerformanceCycleType.MONTH,
    cycle: '',
    quarter: undefined,
    startTime: undefined,
    endTime: undefined,
    description: '',
    assessmentTemplateId: undefined,
    assessmentConfig: createDefaultAssessmentConfig(),
    resultTemplateId: undefined,
    resultConfig: { name: '', levels: [] },
    quotaSettingType: HrmPerformanceQuotaSettingType.SYSTEM,
    targetConfirmation: false,
    targetConfirmationStage: undefined,
    resultAudit: false,
    resultConfirmation: false,
    appealTimeoutDays: 2,
    appealTimeoutAction: HrmPerformanceAppealTimeoutAction.REJECT,
    syncToSalary: false,
    paidForMonth: '',
    scopes: [createDefaultPlanScope()],
    reviewStages: createDefaultReviewStages(),
    resultAuditStages: [createDefaultHandlerStage()],
    appealStages: [createDefaultHandlerStage()]
  }
}

/** 创建默认考评范围 */
function createDefaultPlanScope(): PerformancePlanApi.PerformanceScopeVO {
  return {
    type: HrmPerformancePlanScopeType.EMPLOYEE_DEPT,
    employeeIds: [],
    deptIds: []
  }
}

/** 创建默认评分流程 */
function createDefaultReviewStages(): PerformancePlanApi.PerformanceReviewStageVO[] {
  return [
    {
      name: '员工自评',
      rater: { type: HrmPerformanceRaterType.SELF },
      weight: 30,
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      visibleContent: HrmPerformanceReviewVisibleContent.ALL,
      requiredSetting: false,
      rejectAuthority: false
    },
    {
      name: '直属上级评分',
      rater: { type: HrmPerformanceRaterType.SUPERIOR, level: 1 },
      weight: 70,
      scoringType: HrmPerformanceReviewScoringType.QUOTA,
      visibleContent: HrmPerformanceReviewVisibleContent.ALL,
      requiredSetting: true,
      rejectAuthority: true
    }
  ]
}

/** 创建默认处理节点 */
function createDefaultHandlerStage(): PerformancePlanApi.PerformanceHandlerStageVO {
  return {
    type: HrmPerformanceRaterType.DEPT_LEADER,
    level: 1
  }
}

/** 初始化 */
onMounted(() => {
  initForm()
})
</script>
