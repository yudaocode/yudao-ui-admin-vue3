<template>
  <!-- 搜索与操作 -->
  <div class="mb-16px flex flex-wrap items-center justify-between gap-12px">
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="搜索事项"
          @clear="handleQuery"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-popover
          :visible="showFilterPopover"
          :show-arrow="false"
          :width="420"
          persistent
          placement="bottom-start"
        >
          <template #reference>
            <el-button @click="showFilterPopover = !showFilterPopover">
              <Icon class="mr-5px" icon="ep:plus" />高级筛选
            </el-button>
          </template>
          <div class="max-h-360px overflow-y-auto pr-4px">
            <el-form-item class="font-bold" label="事项类型" label-position="top" prop="types">
              <el-select
                v-model="queryParams.types"
                class="!w-full"
                clearable
                collapse-tags
                collapse-tags-tooltip
                multiple
                placeholder="全部类型"
              >
                <el-option
                  v-if="projectType === PmsProjectType.AGILE"
                  label="需求"
                  :value="PmsWorkItemType.REQUIREMENT"
                />
                <el-option label="任务" :value="PmsWorkItemType.TASK" />
                <el-option
                  v-if="projectType === PmsProjectType.AGILE"
                  label="缺陷"
                  :value="PmsWorkItemType.DEFECT"
                />
              </el-select>
            </el-form-item>
            <el-form-item class="font-bold" label="状态" label-position="top" prop="statuses">
              <el-select
                v-model="queryParams.statuses"
                class="!w-full"
                clearable
                collapse-tags
                collapse-tags-tooltip
                multiple
                placeholder="全部状态"
              >
                <el-option label="未开始" :value="PmsWorkItemStatusType.PENDING" />
                <el-option label="进行中" :value="PmsWorkItemStatusType.PROCESSING" />
                <el-option label="已完成" :value="PmsWorkItemStatusType.COMPLETED" />
              </el-select>
            </el-form-item>
            <el-form-item class="font-bold" label="优先级" label-position="top" prop="priorities">
              <el-select
                v-model="queryParams.priorities"
                class="!w-full"
                clearable
                collapse-tags
                collapse-tags-tooltip
                multiple
                placeholder="全部优先级"
              >
                <el-option
                  v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="projectType === PmsProjectType.AGILE && !iterationId"
              class="font-bold"
              label="所属迭代"
              label-position="top"
              prop="iterationIds"
            >
              <IterationSelect
                v-model="queryParams.iterationIds"
                class="!w-full"
                multiple
                :project-id="projectId"
                placeholder="全部迭代"
              />
            </el-form-item>
            <el-form-item
              v-if="projectType === PmsProjectType.AGILE && !iterationId"
              class="font-bold"
              label="排除迭代"
              label-position="top"
              prop="excludedIterationIds"
            >
              <IterationSelect
                v-model="queryParams.excludedIterationIds"
                class="!w-full"
                multiple
                :project-id="projectId"
                placeholder="不显示所选迭代"
              />
            </el-form-item>
            <el-form-item
              class="font-bold"
              label="负责人"
              label-position="top"
              prop="assigneeUserIds"
            >
              <ProjectMemberSelect
                v-model="queryParams.assigneeUserIds"
                class="!w-full"
                multiple
                :project-id="projectId"
                placeholder="全部负责人"
              />
            </el-form-item>
            <el-form-item class="font-bold" label="标签" label-position="top" prop="labelIds">
              <WorkItemLabelSelect
                v-model="queryParams.labelIds"
                class="!w-full"
                placeholder="全部标签"
              />
            </el-form-item>
            <el-form-item v-if="!iterationId" prop="unplannedOnly">
              <el-checkbox v-model="queryParams.unplannedOnly">只显示未规划事项</el-checkbox>
            </el-form-item>
          </div>
          <div class="flex justify-end">
            <el-button @click="resetQuery">清空</el-button>
            <el-button @click="showFilterPopover = false">取消</el-button>
            <el-button type="primary" @click="handleAdvancedQuery">确认</el-button>
          </div>
        </el-popover>
      </el-form-item>
    </el-form>
    <div class="flex items-center gap-12px">
      <el-dropdown
        v-if="editable"
        v-hasPermi="['pms:pm:work-item:create']"
        @command="openCreateForm"
      >
        <el-button type="primary">新建</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="PmsWorkItemType.REQUIREMENT">新建需求</el-dropdown-item>
            <el-dropdown-item :command="PmsWorkItemType.TASK">新建任务</el-dropdown-item>
            <el-dropdown-item :command="PmsWorkItemType.DEFECT">新建缺陷</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button v-hasPermi="['pms:pm:work-item:export']" @click="handleExport"> 导出 </el-button>
    </div>
  </div>

  <!-- 列表 -->
  <el-table v-loading="loading" class="mt-16px" :data="workItemList" :show-overflow-tooltip="true">
    <el-table-column label="编号" width="90">
      <template #default="scope">#{{ scope.row.serialNumber }}</template>
    </el-table-column>
    <el-table-column label="类型" width="80">
      <template #default="scope">{{ getWorkItemTypeName(scope.row.type) }}</template>
    </el-table-column>
    <el-table-column label="标题" min-width="240">
      <template #default="scope">
        <el-button link type="primary" @click="openDetail(scope.row)">
          {{ scope.row.name }}
        </el-button>
      </template>
    </el-table-column>
    <el-table-column label="状态" prop="statusName" width="120" />
    <el-table-column label="优先级" width="90">
      <template #default="scope">{{ getPriorityName(scope.row.priority) }}</template>
    </el-table-column>
    <el-table-column label="负责人" prop="assigneeUserName" width="110" />
    <el-table-column label="所属迭代" prop="iterationName" min-width="130" />
    <el-table-column align="center" label="进度" width="140">
      <template #default="scope"><el-progress :percentage="scope.row.progress" /></template>
    </el-table-column>
    <el-table-column :formatter="dateFormatter" label="截止时间" prop="endTime" width="180" />
  </el-table>
  <Pagination
    v-model:limit="queryParams.pageSize"
    v-model:page="queryParams.pageNo"
    :total="total"
    @pagination="getWorkItemList"
  />

  <!-- 工作项新增表单 -->
  <WorkItemForm ref="formRef" @success="handleDataChanged" />
  <!-- 工作项详情 -->
  <WorkItemDetail ref="detailRef" @success="handleDataChanged" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import * as WorkItemApi from '@/api/pms/pm/workitem'
import {
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemStatusType,
  PmsWorkItemType
} from '@/views/pms/pm/utils/constants'
import WorkItemDetail from '../detail/WorkItemDetail.vue'
import WorkItemForm from '../form/WorkItemForm.vue'
import IterationSelect from '@/views/pms/pm/iteration/components/IterationSelect.vue'
import ProjectMemberSelect from '@/views/pms/pm/project/components/ProjectMemberSelect.vue'
import WorkItemLabelSelect from '@/views/pms/pm/workitem/label/WorkItemLabelSelect.vue'
import { getPriorityName, getWorkItemTypeName } from '@/views/pms/pm/utils/format'

defineOptions({ name: 'PmsWorkItemAllList' })

const props = defineProps<{
  projectId: number
  projectType: number
  editable: boolean
  iterationId?: number
}>()
const emit = defineEmits<{ changed: [] }>()
const route = useRoute() // 当前项目路由

const loading = ref(false) // 列表加载中
const workItemList = ref<WorkItemApi.PmsWorkItemVO[]>([]) // 全部事项列表
const total = ref(0) // 列表总数
const showFilterPopover = ref(false) // 是否显示高级筛选
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  projectId: props.projectId,
  types: [] as number[],
  name: undefined as string | undefined,
  statuses: [] as number[],
  priorities: [] as number[],
  iterationId: props.iterationId,
  iterationIds: [] as number[],
  excludedIterationIds: [] as number[],
  assigneeUserIds: route.query.assigneeUserId
    ? [Number(route.query.assigneeUserId)]
    : ([] as number[]),
  labelIds: [] as number[],
  unplannedOnly: false,
  rootOnly: true,
  lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref
const formRef = ref<InstanceType<typeof WorkItemForm>>() // 工作项表单 Ref
const detailRef = ref<InstanceType<typeof WorkItemDetail>>() // 工作项详情 Ref

/** 查询全部工作项列表 */
async function getWorkItemList() {
  loading.value = true
  try {
    const data = await WorkItemApi.getWorkItemPage(queryParams)
    workItemList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1
  getWorkItemList()
}

/** 高级筛选确认 */
function handleAdvancedQuery() {
  showFilterPopover.value = false
  handleQuery()
}

/** 重置搜索条件 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  showFilterPopover.value = false
  handleQuery()
}

/** 打开工作项详情 */
function openDetail(workItem: WorkItemApi.PmsWorkItemVO) {
  detailRef.value?.open(workItem.id!)
}

/** 新建工作项 */
function openCreateForm(type: number) {
  formRef.value?.open('create', undefined, {
    projectId: props.projectId,
    projectType: props.projectType,
    type,
    iterationId: props.iterationId
  })
}

/** 刷新工作项并通知上层统计同步 */
async function handleDataChanged() {
  await getWorkItemList()
  emit('changed')
}

/** 导出全部事项 */
async function handleExport() {
  const data = await WorkItemApi.exportWorkItemList(queryParams)
  download.excel(data, '全部事项.xlsx')
}

defineExpose({ refresh: getWorkItemList })

/** 初始化 */
onMounted(() => {
  getWorkItemList()
})
</script>
