<template>
  <!-- 项目工作项列表 -->
  <div class="mb-16px flex flex-wrap items-center justify-between gap-12px">
    <!-- 搜索与高级筛选 -->
    <div class="flex flex-wrap items-center gap-8px">
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="!m-0 flex items-center gap-8px"
      >
        <el-form-item class="!mb-0 !mr-0">
          <el-input
            v-model="searchKeyword"
            class="!w-240px"
            clearable
            :placeholder="`请输入${workItemTypeName}标题`"
          />
        </el-form-item>
        <!-- 高级筛选 -->
        <el-form-item class="!mb-0 !mr-0">
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
              <el-form-item
                class="font-bold"
                label="数据范围"
                label-position="top"
                prop="lifecycleStatus"
              >
                <el-radio-group v-model="queryParams.lifecycleStatus">
                  <el-radio-button :value="PmsWorkItemLifecycleStatus.ACTIVE">当前</el-radio-button>
                  <el-radio-button :value="PmsWorkItemLifecycleStatus.ARCHIVED">
                    已归档
                  </el-radio-button>
                  <el-radio-button :value="PmsWorkItemLifecycleStatus.RECYCLED">
                    回收站
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item class="font-bold" label="语义状态" label-position="top" prop="statuses">
                <el-select
                  v-model="queryParams.statuses"
                  class="!w-full"
                  clearable
                  collapse-tags
                  collapse-tags-tooltip
                  multiple
                  placeholder="全部状态"
                >
                  <el-option
                    v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
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
                  @loaded="memberOptions = $event"
                />
              </el-form-item>
              <el-form-item class="font-bold" label="标签" label-position="top" prop="labelIds">
                <WorkItemLabelSelect
                  v-model="queryParams.labelIds"
                  class="!w-full"
                  placeholder="全部标签"
                />
              </el-form-item>
            </div>
            <el-form-item class="font-bold" label-position="top">
              <div class="flex w-full justify-end">
                <el-button @click="resetQuery">清空</el-button>
                <el-button @click="showFilterPopover = false">取消</el-button>
                <el-button type="primary" @click="handleAdvancedQuery">确认</el-button>
              </div>
            </el-form-item>
          </el-popover>
        </el-form-item>
      </el-form>
      <!-- 展示模式 -->
      <el-radio-group v-model="viewMode" @change="getWorkItemList">
        <el-radio-button value="list">列表</el-radio-button>
        <el-radio-button :disabled="!isActiveLifecycle" value="board">看板</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 创建与更多操作 -->
    <div class="flex items-center gap-8px">
      <el-button
        v-if="editable && isActiveLifecycle"
        v-hasPermi="['pms:pm:work-item:create']"
        type="primary"
        @click="openCreateForm"
      >
        创建{{ workItemTypeName }}
      </el-button>
      <el-dropdown trigger="click" @command="handleToolbarCommand">
        <el-button aria-label="更多操作">
          <Icon icon="ep:more-filled" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-if="editable && isActiveLifecycle && checkPermi(['pms:pm:work-item:update'])"
              command="status-config"
            >
              状态设置
            </el-dropdown-item>
            <el-dropdown-item
              v-if="editable && isActiveLifecycle && checkPermi(['pms:pm:work-item:import'])"
              command="import"
            >
              导入
            </el-dropdown-item>
            <el-dropdown-item v-if="checkPermi(['pms:pm:work-item:export'])" command="export">
              导出
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <template v-if="viewMode === 'list'">
    <!-- 列表 -->
    <el-table v-loading="loading" :data="filteredWorkItemList" :show-overflow-tooltip="true">
      <el-table-column :label="`${workItemTypeName}编号`" width="100">
        <template #default="scope">#{{ scope.row.serialNumber }}</template>
      </el-table-column>
      <el-table-column :label="`${workItemTypeName}标题`" min-width="220">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row)">
            {{ scope.row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="优先级" width="90">
        <template #default="scope">
          <el-tag :type="getPriorityTagType(scope.row.priority)">
            {{ getPriorityName(scope.row.priority) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="140">
        <template #default="scope">
          <el-select
            v-if="editable && isActiveLifecycle"
            v-model="scope.row.statusId"
            size="small"
            @change="handleStatusChange(scope.row)"
          >
            <el-option
              v-for="status in statusOptions"
              :key="status.id"
              :label="status.name"
              :value="status.id"
            />
          </el-select>
          <span v-else>{{ scope.row.statusName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="负责人" min-width="110" prop="assigneeUserName" />
      <el-table-column label="标签" min-width="150">
        <template #default="scope">
          <el-space wrap>
            <el-tag
              v-for="label in scope.row.labels"
              :key="label.id"
              :color="label.color"
              effect="dark"
              size="small"
            >
              {{ label.name }}
            </el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column
        v-if="projectType === PmsProjectType.AGILE"
        label="所属迭代"
        min-width="130"
        prop="iterationName"
      />
      <el-table-column align="center" label="进度" width="150">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" :stroke-width="8" />
        </template>
      </el-table-column>
      <el-table-column :formatter="dateFormatter" label="截止时间" prop="endTime" width="180" />
      <el-table-column align="center" fixed="right" label="操作" width="220">
        <template #default="scope">
          <el-button
            v-if="editable && isActiveLifecycle"
            v-hasPermi="['pms:pm:work-item:update']"
            link
            type="primary"
            @click="openEditForm(scope.row)"
          >
            编辑
          </el-button>
          <el-button v-else link type="primary" @click="openDetail(scope.row)"> 查看 </el-button>
          <el-button
            v-if="editable && isActiveLifecycle"
            v-hasPermi="['pms:pm:work-item:update']"
            link
            @click="handleArchive(scope.row)"
          >
            归档
          </el-button>
          <el-button
            v-if="editable && queryParams.lifecycleStatus !== PmsWorkItemLifecycleStatus.RECYCLED"
            v-hasPermi="['pms:pm:work-item:update']"
            link
            type="danger"
            @click="handleRecycle(scope.row)"
          >
            回收站
          </el-button>
          <el-button
            v-if="editable && !isActiveLifecycle"
            v-hasPermi="['pms:pm:work-item:update']"
            link
            type="primary"
            @click="handleRestore(scope.row)"
          >
            恢复
          </el-button>
          <el-button
            v-if="editable && queryParams.lifecycleStatus === PmsWorkItemLifecycleStatus.RECYCLED"
            v-hasPermi="['pms:pm:work-item:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      v-if="!normalizedSearchKeyword"
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getWorkItemList"
    />
  </template>

  <div v-else v-loading="loading" class="flex min-h-460px gap-16px overflow-x-auto pb-12px">
    <!-- 看板 -->
    <section
      v-for="column in filteredBoard"
      :key="column.name"
      class="basis-300px shrink-0 grow-0 rounded-8px bg-[var(--el-fill-color-light)] p-12px"
    >
      <header class="flex items-center justify-between px-4px pb-12px font-600">
        <div>
          <span>{{ column.name }}</span>
          <div v-if="column.statuses.length > 1" class="mt-4px text-11px font-normal opacity-70">
            {{ getBoardColumnStatusNames(column) }}
          </div>
        </div>
        <el-tag round size="small" type="info">{{ getBoardColumnItemCount(column) }}</el-tag>
      </header>
      <!-- 合并列按具体状态拆分投放区，避免拖入列后静默落到第一个状态 -->
      <div
        v-for="statusGroup in column.statusGroups"
        :key="statusGroup.status.id"
        class="mb-12px last:mb-0"
      >
        <div
          v-if="column.statusGroups.length > 1"
          class="mb-6px text-12px font-500 text-[var(--el-text-color-secondary)]"
        >
          {{ statusGroup.status.name }}
        </div>
        <draggable
          v-model="statusGroup.items"
          class="min-h-90px rounded-4px border border-dashed border-[var(--el-border-color)] p-6px"
          :disabled="boardSaving || !editable"
          group="pms-work-items"
          item-key="id"
          @add="handleBoardAdd($event, statusGroup)"
          @update="handleBoardSort(statusGroup)"
        >
          <template #item="{ element }">
            <article
              class="mb-10px cursor-pointer rounded-6px border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] p-12px shadow-[var(--el-box-shadow-lighter)] last:mb-0"
              @click="openDetail(element)"
            >
              <div class="line-clamp-2 text-14px font-500 leading-21px">{{ element.name }}</div>
              <div v-if="element.endTime" class="mt-8px">
                <el-tag :type="isWorkItemOverdue(element) ? 'danger' : 'info'" size="small">
                  {{ formatDate(element.endTime, 'MM月DD日') }}截止
                </el-tag>
              </div>
              <div class="mt-12px flex items-center justify-between gap-8px">
                <span
                  class="flex items-center gap-4px text-12px text-[var(--el-text-color-secondary)]"
                >
                  <Icon :size="15" icon="ep:list" />#{{ element.serialNumber }}
                </span>
                <div class="flex min-w-0 items-center gap-8px">
                  <span
                    class="flex items-center gap-4px whitespace-nowrap text-12px"
                    :style="{ color: getPriorityColor(element.priority) }"
                  >
                    <span class="h-8px w-8px rounded-full bg-current"></span>
                    {{ getPriorityName(element.priority) }}
                  </span>
                  <el-tag :type="getWorkItemStatusTagType(element.status)" size="small">
                    {{ element.statusName }}
                  </el-tag>
                  <el-tooltip :content="element.assigneeUserName || '未分配'" placement="top">
                    <el-avatar :size="24" :src="memberMap.get(element.assigneeUserId || 0)?.avatar">
                      {{ element.assigneeUserName?.slice(0, 1) || '未' }}
                    </el-avatar>
                  </el-tooltip>
                </div>
              </div>
            </article>
          </template>
        </draggable>
      </div>
    </section>
  </div>

  <!-- 工作项新增、编辑表单 -->
  <WorkItemForm ref="formRef" @success="handleDataChanged" />
  <!-- 工作项详情 -->
  <WorkItemDetail ref="detailRef" @success="handleDataChanged" />
  <!-- 状态设置弹窗 -->
  <WorkItemStatusList ref="statusListRef" @success="getWorkItemList" />
  <!-- 工作项导入弹窗 -->
  <WorkItemImportForm ref="importFormRef" @success="getWorkItemList" />
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import draggable from 'vuedraggable'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { checkPermi } from '@/utils/permission'
import * as ProjectMemberApi from '@/api/pms/pm/project/member'
import * as WorkItemApi from '@/api/pms/pm/workitem'
import * as WorkItemStatusApi from '@/api/pms/pm/workitem/status'
import {
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemStatusType
} from '@/views/pms/pm/utils/constants'
import WorkItemDetail from '../detail/WorkItemDetail.vue'
import WorkItemForm from '../form/WorkItemForm.vue'
import WorkItemStatusList from '../status/WorkItemStatusList.vue'
import WorkItemImportForm from '../import/WorkItemImportForm.vue'
import { getAllPageItems } from '@/utils/page'
import {
  getPriorityColor,
  getPriorityName,
  getPriorityTagType,
  getWorkItemStatusTagType,
  getWorkItemTypeName
} from '@/views/pms/pm/utils/format'
import IterationSelect from '@/views/pms/pm/iteration/components/IterationSelect.vue'
import ProjectMemberSelect from '@/views/pms/pm/project/components/ProjectMemberSelect.vue'
import WorkItemLabelSelect from '@/views/pms/pm/workitem/label/WorkItemLabelSelect.vue'

defineOptions({ name: 'PmsWorkItemList' })

const props = defineProps<{
  projectId: number
  projectType: number
  type: number
  editable: boolean
  defaultViewMode?: 'list' | 'board'
  iterationId?: number
}>()
const emit = defineEmits<{ changed: [] }>()
const route = useRoute() // 当前项目路由

const message = useMessage() // 消息弹窗
const loading = ref(true) // 数据加载中
const boardSaving = ref(false) // 看板拖拽保存中
const showFilterPopover = ref(false) // 高级筛选是否展示
const viewMode = ref<'list' | 'board'>(props.defaultViewMode || 'list') // 当前展示模式
const searchKeyword = ref('') // 当前页前端搜索关键字
const total = ref(0) // 列表总数
const workItemList = ref<WorkItemApi.PmsWorkItemVO[]>([]) // 工作项列表
const searchableWorkItemList = ref<WorkItemApi.PmsWorkItemVO[]>([]) // 列表前端搜索数据

type BoardStatusGroup = {
  status: WorkItemStatusApi.PmsWorkItemStatusVO
  items: WorkItemApi.PmsWorkItemVO[]
}
type BoardColumn = WorkItemApi.PmsWorkItemBoardVO & {
  statusGroups: BoardStatusGroup[]
}

const board = ref<BoardColumn[]>([]) // 工作项看板
const statusOptions = ref<WorkItemStatusApi.PmsWorkItemStatusVO[]>([]) // 看板状态列表
const memberOptions = ref<ProjectMemberApi.PmsProjectMemberVO[]>([]) // 负责人筛选选项
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  projectId: props.projectId,
  type: props.type,
  statuses: [] as number[],
  priorities: [] as number[],
  iterationId: props.iterationId,
  iterationIds: [] as number[],
  excludedIterationIds: [] as number[],
  assigneeUserIds: route.query.assigneeUserId
    ? [Number(route.query.assigneeUserId)]
    : ([] as number[]),
  labelIds: [] as number[],
  rootOnly: true,
  lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE as number
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref
const formRef = ref<InstanceType<typeof WorkItemForm>>() // 工作项表单 Ref
const detailRef = ref<InstanceType<typeof WorkItemDetail>>() // 工作项详情 Ref
const statusListRef = ref<InstanceType<typeof WorkItemStatusList>>() // 状态列表弹窗 Ref
const importFormRef = ref<InstanceType<typeof WorkItemImportForm>>() // 导入弹窗 Ref
const workItemTypeName = computed(() => getWorkItemTypeName(props.type)) // 工作项业务名称
const normalizedSearchKeyword = computed(() => searchKeyword.value.trim().toLowerCase()) // 规范化搜索关键字
const filteredWorkItemList = computed(() =>
  normalizedSearchKeyword.value
    ? searchableWorkItemList.value.filter((item) => matchSearchKeyword(item))
    : workItemList.value
) // 当前页前端搜索结果
const filteredBoard = computed(() =>
  normalizedSearchKeyword.value
    ? board.value.map((column) => ({
        ...column,
        items: column.items.filter((item) => matchSearchKeyword(item)),
        statusGroups: column.statusGroups.map((statusGroup) => ({
          ...statusGroup,
          items: statusGroup.items.filter((item) => matchSearchKeyword(item))
        }))
      }))
    : board.value
) // 看板前端搜索结果
const memberMap = computed(
  () => new Map(memberOptions.value.map((member) => [member.userId, member]))
) // 项目成员 Map
const isActiveLifecycle = computed(
  () => queryParams.lifecycleStatus === PmsWorkItemLifecycleStatus.ACTIVE
) // 是否展示当前工作项
const hasBoardFilter = computed(() =>
  Boolean(
    normalizedSearchKeyword.value ||
    queryParams.statuses.length ||
    queryParams.priorities.length ||
    queryParams.iterationId ||
    queryParams.iterationIds.length ||
    queryParams.excludedIterationIds.length ||
    queryParams.assigneeUserIds.length ||
    queryParams.labelIds.length
  )
) // 看板是否正在筛选，筛选结果不允许拖拽排序

/** 查询工作项 */
async function getWorkItemList() {
  loading.value = true
  try {
    // 根据展示模式查询列表或看板数据
    if (viewMode.value === 'board') {
      const boardData = await WorkItemApi.getWorkItemBoard(queryParams)
      board.value = boardData.map((column) => ({
        ...column,
        statusGroups: column.statuses.map((status) => ({
          status,
          items: column.items.filter((item) => item.statusId === status.id)
        }))
      }))
    } else {
      const [data, searchableItems] = await Promise.all([
        WorkItemApi.getWorkItemPage(queryParams),
        getAllPageItems<WorkItemApi.PmsWorkItemVO>((pageNo, pageSize) =>
          WorkItemApi.getWorkItemPage({ ...queryParams, pageNo, pageSize })
        )
      ])
      workItemList.value = data.list
      total.value = data.total
      searchableWorkItemList.value = searchableItems
    }
    // 查询状态选项，供列表快捷修改和看板展示使用
    statusOptions.value = await WorkItemStatusApi.getWorkItemStatusList(props.projectId, props.type)
  } finally {
    loading.value = false
  }
}

/** 判断工作项是否匹配前端搜索关键字 */
function matchSearchKeyword(workItem: WorkItemApi.PmsWorkItemVO) {
  return (
    workItem.name.toLowerCase().includes(normalizedSearchKeyword.value) ||
    String(workItem.serialNumber).includes(normalizedSearchKeyword.value)
  )
}

/** 获得看板列包含的状态名称 */
function getBoardColumnStatusNames(column: WorkItemApi.PmsWorkItemBoardVO) {
  return column.statuses.map((item) => item.name).join(' · ')
}

/** 获得看板列内工作项数量 */
function getBoardColumnItemCount(column: BoardColumn) {
  return column.statusGroups.reduce((count, group) => count + group.items.length, 0)
}

/** 确认高级筛选 */
function handleAdvancedQuery() {
  showFilterPopover.value = false
  queryParams.pageNo = 1
  if (!isActiveLifecycle.value) {
    viewMode.value = 'list'
  }
  getWorkItemList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  searchKeyword.value = ''
  showFilterPopover.value = false
  queryParams.pageNo = 1
  getWorkItemList()
}

/** 打开工作项详情 */
function openDetail(workItem: WorkItemApi.PmsWorkItemVO) {
  detailRef.value?.open(workItem.id!)
}

/** 打开工作项新增表单 */
function openCreateForm() {
  formRef.value?.open('create', undefined, {
    projectId: props.projectId,
    projectType: props.projectType,
    type: props.type,
    iterationId: props.iterationId
  })
}

/** 刷新工作项并通知上层统计同步 */
async function handleDataChanged() {
  await getWorkItemList()
  emit('changed')
}

/** 打开工作项编辑表单 */
function openEditForm(workItem: WorkItemApi.PmsWorkItemVO) {
  formRef.value?.open('update', workItem.id)
}

/** 归档工作项 */
async function handleArchive(workItem: WorkItemApi.PmsWorkItemVO) {
  try {
    // 归档的二次确认
    await message.confirm(`确认归档${workItemTypeName.value}“${workItem.name}”吗？`)
    // 发起归档
    await WorkItemApi.archiveWorkItem(workItem.id!)
    message.success('归档成功')
    await handleDataChanged()
  } catch {}
}

/** 将工作项移入回收站 */
async function handleRecycle(workItem: WorkItemApi.PmsWorkItemVO) {
  try {
    // 删除的二次确认
    await message.delConfirm(`确认将${workItemTypeName.value}“${workItem.name}”移入回收站吗？`)
    // 发起删除
    await WorkItemApi.recycleWorkItem(workItem.id!)
    message.success('已移入回收站')
    await handleDataChanged()
  } catch {}
}

/** 恢复工作项 */
async function handleRestore(workItem: WorkItemApi.PmsWorkItemVO) {
  try {
    // 恢复的二次确认
    await message.confirm(`确认恢复${workItemTypeName.value}“${workItem.name}”吗？`)
    // 发起恢复
    await WorkItemApi.restoreWorkItem(workItem.id!)
    message.success('恢复成功')
    await handleDataChanged()
  } catch {}
}

/** 彻底删除回收站中的工作项 */
async function handleDelete(workItem: WorkItemApi.PmsWorkItemVO) {
  try {
    // 删除的二次确认
    await message.delConfirm(`确认彻底删除${workItemTypeName.value}“${workItem.name}”吗？`)
    // 发起删除
    await WorkItemApi.deleteWorkItem(workItem.id!)
    message.success('删除成功')
    await handleDataChanged()
  } catch {}
}

/** 打开状态设置弹窗 */
function openStatusConfig() {
  statusListRef.value?.open(props.projectId, props.type)
}

/** 处理工作项工具栏更多操作 */
function handleToolbarCommand(command: string) {
  if (command === 'status-config') {
    openStatusConfig()
  } else if (command === 'import') {
    importFormRef.value?.open(props.projectId, props.type)
  } else if (command === 'export') {
    handleExport()
  }
}

/** 判断工作项是否已经逾期 */
function isWorkItemOverdue(workItem: WorkItemApi.PmsWorkItemVO) {
  return (
    workItem.status !== PmsWorkItemStatusType.COMPLETED &&
    Boolean(workItem.endTime) &&
    dayjs(workItem.endTime).valueOf() < Date.now()
  )
}

/** 修改工作项状态 */
async function handleStatusChange(workItem: WorkItemApi.PmsWorkItemVO) {
  try {
    await WorkItemApi.updateWorkItemStatus(workItem.id!, workItem.statusId!)
    message.success('状态已更新')
    await handleDataChanged()
  } catch {
    await getWorkItemList()
  }
}

/** 看板跨列移动工作项 */
async function handleBoardAdd(event: { newIndex?: number }, statusGroup: BoardStatusGroup) {
  // 定位跨列拖入的工作项
  if (boardSaving.value || event.newIndex === undefined) {
    return
  }
  const statusId = statusGroup.status.id
  const workItem = statusGroup.items[event.newIndex]
  if (!workItem || workItem.statusId === statusId) {
    return
  }
  // 更新工作项状态和目标列排序
  boardSaving.value = true
  try {
    await WorkItemApi.updateWorkItemStatus(workItem.id!, statusId)
    // 筛选结果不是完整列数据，只更新状态，避免用部分结果覆盖完整排序。
    if (!hasBoardFilter.value) {
      await WorkItemApi.updateWorkItemSort(
        statusId,
        statusGroup.items.map((item) => item.id!)
      )
    }
    message.success('状态已更新')
    emit('changed')
  } finally {
    await getWorkItemList()
    boardSaving.value = false
  }
}

/** 保存看板列内工作项顺序 */
async function handleBoardSort(statusGroup: BoardStatusGroup) {
  if (boardSaving.value) {
    return
  }
  // 筛选状态下只允许跨列换状态，不能用部分结果持久化列内顺序。
  if (hasBoardFilter.value) {
    await getWorkItemList()
    return
  }
  // 保存当前列的工作项顺序
  boardSaving.value = true
  try {
    await WorkItemApi.updateWorkItemSort(
      statusGroup.status.id,
      statusGroup.items.map((item) => item.id!)
    )
  } catch {
    await getWorkItemList()
  } finally {
    boardSaving.value = false
  }
}

/** 导出工作项 */
async function handleExport() {
  const data = await WorkItemApi.exportWorkItemList(queryParams)
  download.excel(data, `${workItemTypeName.value}.xlsx`)
}

defineExpose({ refresh: getWorkItemList })

/** 初始化 */
onMounted(() => {
  getWorkItemList()
})
</script>
