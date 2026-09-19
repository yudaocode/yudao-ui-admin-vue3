<template>
  <doc-alert
    title="【绩效】绩效考核、绩效档案"
    url="https://doc.iocoder.cn/hrm/performance/assessment/"
  />

  <div v-if="accessible">
    <ContentWrap>
      <PerformanceTaskTabs
        v-model:active-tab="activeTab"
        v-model:active-status="activeStatus"
        v-model:keyword="keyword"
        :task-count="taskCount"
        :status-tabs="statusTabs"
        @query="handleQuery"
        @main-change="handleMainTabChange"
        @status-change="handleStatusTabChange"
      />
      <PerformanceTaskTable
        :active-tab="activeTab"
        :active-status="activeStatus"
        :loading="loading"
        :list="list"
        @detail="openDetail"
        @quota="quotaFormRef?.open"
        @result-confirm="confirmResult"
        @appeal="appealFormRef?.open"
        @target-confirm="targetConfirmFormRef?.open"
        @review="reviewFormRef?.open"
        @result-audit="resultAuditFormRef?.open"
        @appeal-handle="appealHandleFormRef?.open"
      />
      <Pagination
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>

    <PerformanceAssessmentDetail ref="detailRef" />
    <PerformanceQuotaForm ref="quotaFormRef" @success="loadData" />
    <PerformanceTargetConfirmForm ref="targetConfirmFormRef" @success="loadData" />
    <PerformanceReviewForm ref="reviewFormRef" @success="loadData" />
    <PerformanceAppealForm ref="appealFormRef" @success="loadData" />
    <PerformanceHandleForm ref="resultAuditFormRef" mode="result-audit" @success="loadData" />
    <PerformanceHandleForm ref="appealHandleFormRef" mode="appeal" @success="loadData" />
  </div>
</template>

<script lang="ts" setup>
import * as PerformanceAssessmentApi from '@/api/hrm/portal/performance/assessment'
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceStageType
} from '@/views/hrm/utils/constants'
import { checkHrmPortalAccess } from '@/views/hrm/utils/employee'
import PerformanceAssessmentDetail from './detail/index.vue'
import PerformanceTaskTable from './PerformanceTaskTable.vue'
import PerformanceTaskTabs from './PerformanceTaskTabs.vue'
import PerformanceAppealForm from './process/PerformanceAppealForm.vue'
import PerformanceHandleForm from './process/PerformanceHandleForm.vue'
import PerformanceTargetConfirmForm from './process/PerformanceTargetConfirmForm.vue'
import PerformanceQuotaForm from './review/PerformanceQuotaForm.vue'
import PerformanceReviewForm from './review/PerformanceReviewForm.vue'

defineOptions({ name: 'HrmPortalPerformanceAssessment' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const activeTab = ref<number>(HrmPerformanceStageType.FILL_QUOTA) // 当前页签
const activeStatus = ref<number>(HrmPerformanceAssessmentStageStatus.PENDING) // 当前状态
const keyword = ref('') // 搜索关键字
const list = ref<PerformanceAssessmentApi.PortalPerformanceAssessmentVO[]>([]) // 列表数据
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})
const taskCount = ref<PerformanceAssessmentApi.PortalPerformanceTaskCountVO>({
  fillPendingCount: 0,
  fillCompletedCount: 0,
  targetPendingCount: 0,
  targetCompletedCount: 0,
  reviewPendingCount: 0,
  reviewCompletedCount: 0,
  resultAuditPendingCount: 0,
  resultAuditCompletedCount: 0,
  resultConfirmationPendingCount: 0,
  resultConfirmationCompletedCount: 0,
  resultConfirmationAppealedCount: 0,
  appealPendingCount: 0,
  appealCompletedCount: 0
})
const detailRef = ref<InstanceType<typeof PerformanceAssessmentDetail>>() // 详情组件 Ref
const appealFormRef = ref<InstanceType<typeof PerformanceAppealForm>>() // 申诉表单 Ref
const quotaFormRef = ref<InstanceType<typeof PerformanceQuotaForm>>() // 指标表单 Ref
const targetConfirmFormRef = ref<InstanceType<typeof PerformanceTargetConfirmForm>>() // 目标确认表单 Ref
const reviewFormRef = ref<InstanceType<typeof PerformanceReviewForm>>() // 评分表单 Ref
const resultAuditFormRef = ref<InstanceType<typeof PerformanceHandleForm>>() // 结果审核表单 Ref
const appealHandleFormRef = ref<InstanceType<typeof PerformanceHandleForm>>() // 申诉处理表单 Ref
const statusTabs = computed(() => {
  if (activeTab.value === HrmPerformanceStageType.FILL_QUOTA) {
    return [
      {
        label: '待填写',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.fillPendingCount
      },
      {
        label: '已填写',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.fillCompletedCount
      }
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.TARGET_CONFIRM) {
    return [
      {
        label: '待确认',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.targetPendingCount
      },
      {
        label: '已确认',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.targetCompletedCount
      }
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.OTHER_SCORE) {
    return [
      {
        label: '待评分',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.reviewPendingCount
      },
      {
        label: '已评分',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.reviewCompletedCount
      }
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_AUDIT) {
    return [
      {
        label: '待审核',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.resultAuditPendingCount
      },
      {
        label: '已审核',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.resultAuditCompletedCount
      }
    ]
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM) {
    return [
      {
        label: '待确认结果',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.resultConfirmationPendingCount
      },
      {
        label: '已确认',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.resultConfirmationCompletedCount
      },
      {
        label: '已申诉',
        name: HrmPerformanceAssessmentStageStatus.APPEALED,
        count: taskCount.value.resultConfirmationAppealedCount
      }
    ]
  }
  return [
    {
      label: '待确认',
      name: HrmPerformanceAssessmentStageStatus.PENDING,
      count: taskCount.value.appealPendingCount
    },
    {
      label: '已确认',
      name: HrmPerformanceAssessmentStageStatus.PROCESSED,
      count: taskCount.value.appealCompletedCount
    }
  ]
})

/** 打开详情 */
function openDetail(row: PerformanceAssessmentApi.PortalPerformanceAssessmentVO) {
  detailRef.value?.open(row, activeTab.value)
}

/** 确认绩效结果 */
async function confirmResult(id?: number) {
  if (!id) {
    return
  }
  try {
    await message.confirm('确认当前绩效结果？确认后将进入后续流程。')
    await PerformanceAssessmentApi.confirmPerformanceAssessmentResult({
      assessmentId: id,
      pass: 1,
      comment: '结果确认'
    })
    message.success('绩效结果已确认')
    await loadData()
  } catch {}
}

/** 获取任务分页 */
async function getTaskPage(params: PageParam & { search?: string; stageStatus?: number }) {
  if (activeTab.value === HrmPerformanceStageType.FILL_QUOTA) {
    return await PerformanceAssessmentApi.getPerformanceAssessmentFillQuotaTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.TARGET_CONFIRM) {
    return await PerformanceAssessmentApi.getPerformanceAssessmentTargetConfirmationTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.OTHER_SCORE) {
    return await PerformanceAssessmentApi.getPerformanceAssessmentReviewTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_AUDIT) {
    return await PerformanceAssessmentApi.getPerformanceAssessmentResultAuditTaskPage(params)
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM) {
    return await PerformanceAssessmentApi.getPerformanceAssessmentResultConfirmationTaskPage(params)
  }
  return await PerformanceAssessmentApi.getPerformanceAssessmentAppealTaskPage(params)
}

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const search = keyword.value.trim() || undefined
    const pageResult = await getTaskPage({
      ...queryParams,
      search,
      stageStatus: activeStatus.value
    })
    list.value = pageResult.list || []
    total.value = pageResult.total || 0
  } finally {
    loading.value = false
  }
}

/** 获取任务数量 */
async function getTaskCount() {
  taskCount.value = await PerformanceAssessmentApi.getPerformanceAssessmentTaskCount(
    keyword.value.trim() || undefined
  )
}

/** 加载页面数据 */
async function loadData() {
  await Promise.all([getList(), getTaskCount()])
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  loadData()
}

/** 主页签切换操作 */
function handleMainTabChange() {
  activeStatus.value = HrmPerformanceAssessmentStageStatus.PENDING
  queryParams.pageNo = 1
  loadData()
}

/** 状态页签切换操作 */
function handleStatusTabChange() {
  queryParams.pageNo = 1
  getList()
}

/** 页面激活时刷新绩效任务 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router)
  if (!accessible.value) {
    return
  }
  await loadData()
})
</script>
