<template>
  <doc-alert title="PMS 手册（功能开启）" url="https://doc.iocoder.cn/pms/build/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="项目" prop="projectId">
        <ProjectSelect v-model="queryParams.projectId" @change="handleProjectChange" />
      </el-form-item>
      <el-form-item label="事项" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="搜索标题或编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-240px" clearable placeholder="全部状态">
          <el-option label="未开始" :value="PmsWorkItemStatusType.PENDING" />
          <el-option label="进行中" :value="PmsWorkItemStatusType.PROCESSING" />
          <el-option label="已完成" :value="PmsWorkItemStatusType.COMPLETED" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select
          v-model="queryParams.priority"
          class="!w-240px"
          clearable
          placeholder="全部优先级"
        >
          <el-option
            v-for="option in priorityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="queryParams.projectId" label="迭代" prop="iterationId">
        <IterationSelect
          v-model="queryParams.iterationId"
          :project-id="queryParams.projectId"
          clearable
          class="!w-240px"
          placeholder="全部迭代"
        />
      </el-form-item>
      <el-form-item label="截止日期" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <!-- 工作项类型 -->
    <el-tabs v-model="activeTab" class="workbench-tabs -mt-8px" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in tabs" :key="tab.value" :name="tab.value">
        <template #label>
          <el-badge
            :hidden="displayCountData[tab.countKey] === 0"
            :value="displayCountData[tab.countKey]"
          >
            <span class="px-6px">{{ tab.label }}</span>
          </el-badge>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 迭代表格 -->
    <el-table
      v-if="activeTab !== PmsWorkbenchTab.ITERATION"
      v-loading="loading"
      :data="workItemList"
      :show-overflow-tooltip="true"
    >
      <el-table-column align="center" label="ID" width="90">
        <template #default="scope">#{{ scope.row.serialNumber }}</template>
      </el-table-column>
      <el-table-column label="标题" min-width="240">
        <template #default="scope">
          <el-button link type="primary" @click="openWorkItem(scope.row)">
            {{ scope.row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="优先级" width="120">
        <template #default="scope">
          <el-select
            v-if="isQuickEditing(scope.row, 'priority')"
            v-model="scope.row.priority"
            @blur="cancelQuickEdit"
            @change="handleQuickUpdate(scope.row, 'priority')"
            @keyup.esc.stop="cancelQuickEdit"
          >
            <el-option
              v-for="option in priorityOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button
            v-else-if="scope.row.writeStatus"
            link
            @click="startQuickEdit(scope.row, 'priority')"
          >
            {{ getPriorityName(scope.row.priority) }}
          </el-button>
          <span v-else>{{ getPriorityName(scope.row.priority) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" width="140">
        <template #default="scope">
          <el-select
            v-if="isQuickEditing(scope.row, 'statusId')"
            v-model="scope.row.statusId"
            @blur="cancelQuickEdit"
            @visible-change="getStatusOptions(scope.row, $event)"
            @change="handleStatusChange(scope.row)"
            @keyup.esc.stop="cancelQuickEdit"
          >
            <el-option
              v-for="status in getStatusOptionList(scope.row)"
              :key="status.id"
              :label="status.name"
              :value="status.id"
            />
          </el-select>
          <el-button
            v-else-if="scope.row.writeStatus"
            link
            @click="startQuickEdit(scope.row, 'statusId')"
          >
            {{ scope.row.statusName }}
          </el-button>
          <span v-else>{{ scope.row.statusName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="处理人" min-width="150">
        <template #default="scope">
          <el-select
            v-if="isQuickEditing(scope.row, 'assigneeUserId')"
            v-model="scope.row.assigneeUserId"
            clearable
            filterable
            @blur="cancelQuickEdit"
            @visible-change="getMemberOptions(scope.row.projectId, $event)"
            @change="handleQuickUpdate(scope.row, 'assigneeUserId')"
            @keyup.esc.stop="cancelQuickEdit"
          >
            <el-option
              v-for="member in getMemberOptionList(scope.row)"
              :key="member.userId"
              :label="member.nickname"
              :value="member.userId"
            />
          </el-select>
          <el-button
            v-else-if="scope.row.writeStatus"
            link
            @click="startQuickEdit(scope.row, 'assigneeUserId')"
          >
            {{ scope.row.assigneeUserName || '未分配' }}
          </el-button>
          <span v-else>{{ scope.row.assigneeUserName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建人" min-width="120" prop="creatorUserName" />
      <el-table-column label="所属项目" min-width="180" prop="projectName" />
      <el-table-column align="center" label="截止日期" width="190">
        <template #default="scope">
          <el-date-picker
            v-if="isQuickEditing(scope.row, 'endTime')"
            v-model="scope.row.endTime"
            class="!w-170px"
            clearable
            placeholder="截止日期"
            type="datetime"
            value-format="x"
            @blur="cancelQuickEdit"
            @change="handleQuickUpdate(scope.row, 'endTime')"
            @keyup.esc.stop="cancelQuickEdit"
          />
          <el-button
            v-else-if="scope.row.writeStatus"
            link
            @click="startQuickEdit(scope.row, 'endTime')"
          >
            {{ formatDate(scope.row.endTime) || '未设置' }}
          </el-button>
          <span v-else>{{ formatDate(scope.row.endTime) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="创建日期" width="180">
        <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
      </el-table-column>
    </el-table>

    <!-- 迭代列表 -->
    <el-table v-else v-loading="loading" :data="iterationList" :show-overflow-tooltip="true">
      <el-table-column align="center" label="ID" width="100" prop="id" />
      <el-table-column label="标题" min-width="260">
        <template #default="scope">
          <el-button link type="primary" @click="openIteration(scope.row)">
            {{ scope.row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" width="120">
        <template #default="scope">{{ getIterationStatusName(scope.row.status) }}</template>
      </el-table-column>
      <el-table-column label="所属项目" min-width="180" prop="projectName" />
      <el-table-column align="center" label="开始日期" width="180">
        <template #default="scope">{{ formatDate(scope.row.startTime) }}</template>
      </el-table-column>
      <el-table-column align="center" label="截止日期" width="180">
        <template #default="scope">{{ formatDate(scope.row.endTime) }}</template>
      </el-table-column>
    </el-table>

    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getWorkbenchItemList"
    />
  </ContentWrap>

  <!-- 工作项详情 -->
  <WorkItemDetail ref="workItemDetailRef" @success="refreshWorkbench" />
</template>

<script lang="ts" setup>
import * as ProjectMemberApi from '@/api/pms/pm/project/member'
import * as WorkbenchApi from '@/api/pms/pm/workbench'
import * as WorkItemApi from '@/api/pms/pm/workitem'
import * as WorkItemStatusApi from '@/api/pms/pm/workitem/status'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import {
  PmsWorkbenchTab,
  PmsWorkbenchTabOptions,
  PmsWorkItemStatusType,
  PmsWorkItemType
} from '@/views/pms/pm/utils/constants'
import { getIterationStatusName, getPriorityName } from '@/views/pms/pm/utils/format'
import WorkItemDetail from '@/views/pms/pm/workitem/detail/WorkItemDetail.vue'
import IterationSelect from '@/views/pms/pm/iteration/components/IterationSelect.vue'
import ProjectSelect from './components/ProjectSelect.vue'

defineOptions({ name: 'PmsWorkbench' })

type WorkbenchTab = (typeof PmsWorkbenchTab)[keyof typeof PmsWorkbenchTab]
type QuickUpdateField = 'priority' | 'assigneeUserId' | 'endTime'
type QuickEditField = QuickUpdateField | 'statusId'

const message = useMessage() // 消息弹窗
const { push } = useRouter() // 路由操作
const activeTab = ref<WorkbenchTab>(PmsWorkbenchTab.ALL) // 当前事项类型
const tabs = PmsWorkbenchTabOptions // 工作台事项页签
const priorityOptions = getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY) // 工作项优先级选项
const countData = ref<WorkbenchApi.PmsWorkbenchCountVO>({
  requirementCount: 0,
  taskCount: 0,
  defectCount: 0,
  iterationCount: 0
}) // 各事项数量
const displayCountData = computed(() => ({
  ...countData.value,
  allCount:
    countData.value.requirementCount + countData.value.taskCount + countData.value.defectCount
})) // “全部”页签只展示工作项，不包含独立的迭代页签
const loading = ref(false) // 列表加载中
const workItemList = ref<WorkbenchApi.PmsWorkbenchWorkItemVO[]>([]) // 工作项列表
const iterationList = ref<WorkbenchApi.PmsWorkbenchIterationVO[]>([]) // 迭代列表
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  projectId: undefined as number | undefined,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
  priority: undefined as number | undefined,
  iterationId: undefined as number | undefined,
  endTime: undefined as string[] | undefined
}) // 查询参数
const statusOptionMap = ref<Record<string, WorkItemStatusApi.PmsWorkItemStatusVO[]>>({}) // 状态选项
const memberOptionMap = ref<Record<number, ProjectMemberApi.PmsProjectMemberVO[]>>({}) // 成员选项
const quickEditingKey = ref<string>() // 当前行内编辑字段
const workItemDetailRef = ref<InstanceType<typeof WorkItemDetail>>() // 工作项详情 Ref

/** 获得行内编辑字段键 */
function getQuickEditKey(item: WorkbenchApi.PmsWorkbenchWorkItemVO, field: QuickEditField) {
  return `${item.id}-${field}`
}

/** 判断字段是否处于行内编辑状态 */
function isQuickEditing(item: WorkbenchApi.PmsWorkbenchWorkItemVO, field: QuickEditField) {
  return quickEditingKey.value === getQuickEditKey(item, field)
}

/** 开始行内编辑 */
async function startQuickEdit(item: WorkbenchApi.PmsWorkbenchWorkItemVO, field: QuickEditField) {
  quickEditingKey.value = getQuickEditKey(item, field)
  if (field === 'statusId') {
    await getStatusOptions(item, true)
  } else if (field === 'assigneeUserId') {
    await getMemberOptions(item.projectId, true)
  }
}

/** 取消行内编辑 */
function cancelQuickEdit() {
  quickEditingKey.value = undefined
}

/** 点击当前编辑器外部时退出行内编辑 */
function handleDocumentPointerDown(event: PointerEvent) {
  if (!quickEditingKey.value || !(event.target instanceof Element)) {
    return
  }
  const activeEditor = document.querySelector('.el-table .el-select, .el-table .el-date-editor')
  const isEditorClick = activeEditor?.contains(event.target)
  const isPopupClick = event.target.closest('.el-select-dropdown, .el-picker-panel')
  if (!isEditorClick && !isPopupClick) {
    cancelQuickEdit()
  }
}

/** 查询工作台列表 */
async function getWorkbenchItemList() {
  loading.value = true
  try {
    const params = { ...queryParams, type: getWorkItemType() }
    if (activeTab.value === PmsWorkbenchTab.ITERATION) {
      const data = await WorkbenchApi.getWorkbenchIterationPage(params)
      iterationList.value = data.list
      workItemList.value = []
      total.value = data.total
      return
    }
    const data = await WorkbenchApi.getWorkbenchWorkItemPage(params)
    workItemList.value = data.list
    iterationList.value = []
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询各页签数量 */
async function getCount() {
  countData.value = await WorkbenchApi.getWorkbenchCount(queryParams)
}

/** 获得当前页签的工作项类型 */
function getWorkItemType() {
  return {
    [PmsWorkbenchTab.REQUIREMENT]: PmsWorkItemType.REQUIREMENT,
    [PmsWorkbenchTab.TASK]: PmsWorkItemType.TASK,
    [PmsWorkbenchTab.DEFECT]: PmsWorkItemType.DEFECT
  }[activeTab.value]
}

/** 搜索工作台 */
function handleQuery() {
  queryParams.pageNo = 1
  refreshWorkbench()
}

/** 重置工作台筛选条件 */
function resetQuery() {
  queryParams.name = undefined
  queryParams.status = undefined
  queryParams.priority = undefined
  queryParams.iterationId = undefined
  queryParams.endTime = undefined
  handleQuery()
}

/** 获得工作项选项缓存键 */
function getWorkItemOptionKey(item: WorkbenchApi.PmsWorkbenchWorkItemVO) {
  return `${item.projectId}-${item.type}`
}

/** 获得工作项状态选项 */
function getStatusOptionList(item: WorkbenchApi.PmsWorkbenchWorkItemVO) {
  return (
    statusOptionMap.value[getWorkItemOptionKey(item)] || [
      {
        id: item.statusId,
        projectId: item.projectId,
        workItemType: item.type,
        name: item.statusName,
        statusType: item.status,
        boardName: '',
        defaultStatus: false,
        sort: 0
      }
    ]
  )
}

/** 获得项目成员选项 */
function getMemberOptionList(item: WorkbenchApi.PmsWorkbenchWorkItemVO) {
  if (memberOptionMap.value[item.projectId]) {
    return memberOptionMap.value[item.projectId]
  }
  return item.assigneeUserId
    ? [
        {
          userId: item.assigneeUserId,
          nickname: item.assigneeUserName || `用户 #${item.assigneeUserId}`,
          level: 0,
          creatorStatus: false
        }
      ]
    : []
}

/** 查询工作项状态选项 */
async function getStatusOptions(item: WorkbenchApi.PmsWorkbenchWorkItemVO, visible: boolean) {
  const key = getWorkItemOptionKey(item)
  if (!visible || statusOptionMap.value[key]) {
    return
  }
  statusOptionMap.value[key] = await WorkItemStatusApi.getWorkItemStatusList(
    item.projectId,
    item.type
  )
}

/** 查询项目成员选项 */
async function getMemberOptions(projectId: number, visible: boolean) {
  if (!visible || memberOptionMap.value[projectId]) {
    return
  }
  memberOptionMap.value[projectId] = await ProjectMemberApi.getProjectMemberList(projectId)
}

/** 修改工作项状态 */
async function handleStatusChange(item: WorkbenchApi.PmsWorkbenchWorkItemVO) {
  cancelQuickEdit()
  try {
    await WorkItemApi.updateWorkItemStatus(item.id, item.statusId)
    message.success('状态已更新')
  } finally {
    await refreshWorkbench()
  }
}

/** 快速修改工作项字段 */
async function handleQuickUpdate(
  item: WorkbenchApi.PmsWorkbenchWorkItemVO,
  field: QuickUpdateField
) {
  cancelQuickEdit()
  try {
    // 1. 查询完整工作项，避免快速修改覆盖未展示字段
    const workItem = await WorkItemApi.getWorkItem(item.id)
    // 2. 合并并提交当前字段
    await WorkItemApi.updateWorkItem({ ...workItem, [field]: item[field] })
    message.success('工作项已更新')
  } finally {
    await refreshWorkbench()
  }
}

/** 打开工作项详情 */
function openWorkItem(item: WorkbenchApi.PmsWorkbenchWorkItemVO) {
  workItemDetailRef.value?.open(item.id)
}

/** 打开迭代详情 */
async function openIteration(item: WorkbenchApi.PmsWorkbenchIterationVO) {
  await push({
    name: 'PmsIterationDetail',
    params: {
      id: item.id
    }
  })
}

/** 切换项目 */
async function handleProjectChange() {
  queryParams.pageNo = 1
  queryParams.iterationId = undefined
  await refreshWorkbench()
}

/** 切换页签 */
function handleTabChange() {
  queryParams.pageNo = 1
  getWorkbenchItemList()
}

/** 刷新工作台 */
async function refreshWorkbench() {
  await Promise.all([getCount(), getWorkbenchItemList()])
}

/** 初始化 */
onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true)
  refreshWorkbench()
})

/** 销毁页面事件 */
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
})
</script>

<style lang="scss" scoped>
.workbench-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}
</style>
