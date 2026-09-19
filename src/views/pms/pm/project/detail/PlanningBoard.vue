<template>
  <!-- 待规划工作项 -->
  <div v-loading="loading">
    <!-- 搜索与布局 -->
    <div class="mb-16px flex flex-wrap items-center justify-between gap-12px">
      <el-input
        v-model="searchKeyword"
        class="!w-240px"
        clearable
        placeholder="搜索事项"
        @clear="getPlanningData"
        @keyup.enter="getPlanningData"
      />
      <el-select v-model="layoutMode" class="!w-130px">
        <el-option label="双栏展示" value="double" />
        <el-option label="单栏展示" value="single" />
      </el-select>
    </div>

    <!-- Backlog 与迭代规划面板 -->
    <div
      class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-16px max-[1200px]:grid-cols-1"
      :class="{ '!grid-cols-1': layoutMode === 'single' }"
    >
      <!-- Backlog 区域：展示尚未规划到迭代的工作项 -->
      <el-card shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-600">Backlog 共 {{ unplannedWorkItems.length }} 个事项</span>
          </div>
        </template>
        <draggable
          v-model="unplannedWorkItems"
          class="min-h-420px p-4px"
          :disabled="!editable || saving || Boolean(searchKeyword.trim())"
          group="pms-planning"
          item-key="id"
          @start="handlePlanningDragStart"
          @add="handleUnplanDrop"
          @end="handlePlanningSort(undefined, unplannedWorkItems, $event)"
        >
          <template #item="{ element }">
            <article
              :data-work-item-id="element.id"
              class="mb-8px flex cursor-move items-center gap-12px rounded-6px border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-blank)] p-12px hover:border-[var(--el-color-primary-light-5)]"
            >
              <div class="flex min-w-0 flex-1 items-center justify-between gap-12px">
                <el-button link type="primary" @click.stop="openWorkItem(element)">
                  #{{ element.serialNumber }} {{ element.name }}
                </el-button>
                <div class="flex shrink-0 items-center gap-10px">
                  <span
                    class="flex items-center gap-4px text-12px"
                    :style="{ color: getPriorityColor(element.priority) }"
                  >
                    <span class="h-8px w-8px rounded-full bg-current"></span>
                    {{ getPriorityName(element.priority) }}
                  </span>
                  <el-tag :type="getWorkItemStatusTagType(element.status)" size="small">
                    {{ element.statusName }}
                  </el-tag>
                  <el-avatar :size="24">
                    {{ element.assigneeUserName?.slice(0, 1) || '未' }}
                  </el-avatar>
                  <el-dropdown v-if="editable" @command="handleWorkItemCommand($event, element)">
                    <el-button link @click.stop><Icon icon="ep:more-filled" /></el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑事项</el-dropdown-item>
                        <el-dropdown-item command="recycle" divided>移入回收站</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </article>
          </template>
        </draggable>
        <el-button
          v-if="editable && !backlogCreating"
          class="mt-8px"
          link
          type="primary"
          @click="backlogCreating = true"
        >
          <Icon icon="ep:plus" />新建事项
        </el-button>
        <div
          v-if="editable && backlogCreating"
          class="flex items-center gap-8px border-t border-solid border-[var(--el-border-color-lighter)] pt-12px"
          @click.stop
        >
          <el-select v-model="backlogDraft.type" class="!w-92px">
            <el-option
              v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input
            v-model="backlogDraft.name"
            maxlength="100"
            placeholder="快速创建待规划事项"
            @keyup.enter="createQuickWorkItem(backlogDraft)"
          />
          <el-button
            v-hasPermi="['pms:pm:work-item:create']"
            :loading="creatingKey === 'backlog'"
            type="primary"
            @click="createQuickWorkItem(backlogDraft)"
          >
            创建
          </el-button>
          <el-button @click="backlogCreating = false">取消</el-button>
        </div>
      </el-card>

      <!-- 迭代规划区域：按迭代组织工作项，并支持跨区域拖拽规划 -->
      <div class="flex flex-col gap-12px">
        <el-empty v-if="iterationList.length === 0" description="暂无可规划迭代" />
        <el-card v-for="iteration in iterationList" :key="iteration.id" shadow="never">
          <template #header>
            <div
              class="flex cursor-pointer items-center justify-between gap-16px"
              @dragover.prevent="!iteration.expanded"
              @drop.prevent="handleCollapsedIterationDrop(iteration)"
              @click="toggleIteration(iteration)"
            >
              <div class="flex min-w-0 items-center gap-8px">
                <Icon :icon="iteration.expanded ? 'ep:arrow-down' : 'ep:arrow-right'" />
                <span class="truncate font-500">{{ iteration.name }}</span>
                <span class="shrink-0 text-13px text-[var(--el-text-color-secondary)]">
                  共 {{ iteration.list.length }} 个事项
                </span>
                <el-dropdown
                  v-if="editable"
                  trigger="click"
                  @command="handleIterationCommand($event, iteration)"
                >
                  <el-button link @click.stop><Icon icon="ep:more-filled" /></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-if="iteration.status === PmsIterationStatus.PLANNED"
                        v-hasPermi="['pms:pm:iteration:update']"
                        command="start"
                      >
                        开始迭代
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-if="iteration.status === PmsIterationStatus.ACTIVE"
                        v-hasPermi="['pms:pm:iteration:update']"
                        command="complete"
                      >
                        完成迭代
                      </el-dropdown-item>
                      <el-dropdown-item v-hasPermi="['pms:pm:iteration:update']" command="edit">
                        编辑迭代
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-hasPermi="['pms:pm:iteration:delete']"
                        command="delete"
                        divided
                      >
                        删除迭代
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="flex shrink-0 items-center gap-12px">
                <span class="text-12px text-[var(--el-text-color-secondary)]">
                  {{ formatDate(iteration.startTime, 'YYYY-MM-DD') || '--' }} 至
                  {{ formatDate(iteration.endTime, 'YYYY-MM-DD') || '--' }}
                </span>
                <el-tag :type="getIterationStatusTagType(iteration.status)">
                  {{ getIterationStatusName(iteration.status) }}
                </el-tag>
              </div>
            </div>
          </template>
          <draggable
            v-show="iteration.expanded"
            v-model="iteration.list"
            class="min-h-72px p-4px"
            :disabled="!editable || saving || Boolean(searchKeyword.trim())"
            group="pms-planning"
            item-key="id"
            @start="handlePlanningDragStart"
            @add="handlePlanDrop(iteration, $event)"
            @end="handlePlanningSort(iteration.id, iteration.list, $event)"
          >
            <template #item="{ element }">
              <article
                :data-work-item-id="element.id"
                class="mb-8px flex cursor-move items-center gap-12px rounded-6px border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-blank)] p-12px hover:border-[var(--el-color-primary-light-5)]"
              >
                <div class="flex min-w-0 flex-1 items-center justify-between gap-12px">
                  <el-button link type="primary" @click.stop="openWorkItem(element)">
                    #{{ element.serialNumber }} {{ element.name }}
                  </el-button>
                  <div class="flex shrink-0 items-center gap-10px">
                    <span
                      class="flex items-center gap-4px text-12px"
                      :style="{ color: getPriorityColor(element.priority) }"
                    >
                      <span class="h-8px w-8px rounded-full bg-current"></span>
                      {{ getPriorityName(element.priority) }}
                    </span>
                    <el-tag :type="getWorkItemStatusTagType(element.status)" size="small">
                      {{ element.statusName }}
                    </el-tag>
                    <el-avatar :size="24">
                      {{ element.assigneeUserName?.slice(0, 1) || '未' }}
                    </el-avatar>
                    <el-dropdown v-if="editable" @command="handleWorkItemCommand($event, element)">
                      <el-button link @click.stop><Icon icon="ep:more-filled" /></el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="edit">编辑事项</el-dropdown-item>
                          <el-dropdown-item command="recycle" divided>移入回收站</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </article>
            </template>
          </draggable>
          <el-button
            v-if="editable && iteration.expanded && creatingIterationId !== iteration.id"
            class="mt-8px"
            link
            type="primary"
            @click="creatingIterationId = iteration.id"
          >
            <Icon icon="ep:plus" />新建事项
          </el-button>
          <div
            v-if="editable && iteration.expanded && creatingIterationId === iteration.id"
            class="flex items-center gap-8px border-t border-solid border-[var(--el-border-color-lighter)] pt-12px"
            @click.stop
          >
            <el-select v-model="iterationDrafts[iteration.id].type" class="!w-92px">
              <el-option
                v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE)"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-input
              v-model="iterationDrafts[iteration.id].name"
              maxlength="100"
              :placeholder="`在“${iteration.name}”中快速创建事项`"
              @keyup.enter="createQuickWorkItem(iterationDrafts[iteration.id], iteration.id)"
            />
            <el-button
              v-hasPermi="['pms:pm:work-item:create']"
              :loading="creatingKey === `iteration-${iteration.id}`"
              type="primary"
              @click="createQuickWorkItem(iterationDrafts[iteration.id], iteration.id)"
            >
              创建
            </el-button>
            <el-button @click="creatingIterationId = undefined">取消</el-button>
          </div>
        </el-card>
        <el-button
          v-if="editable && !iterationCreating"
          class="self-start"
          link
          type="primary"
          @click="iterationCreating = true"
        >
          <Icon icon="ep:plus" />新建迭代
        </el-button>
        <el-card v-if="editable && iterationCreating" shadow="never">
          <div class="quick-create !border-0 !pt-0">
            <el-input
              v-model="quickIterationName"
              maxlength="100"
              placeholder="快速创建迭代"
              @keyup.enter="createQuickIteration"
            />
            <el-button
              v-hasPermi="['pms:pm:iteration:create']"
              :loading="creatingKey === 'iteration'"
              type="primary"
              @click="createQuickIteration"
            >
              创建迭代
            </el-button>
            <el-button @click="iterationCreating = false">取消</el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>

  <!-- 工作项编辑表单 -->
  <WorkItemForm ref="workItemFormRef" @success="getPlanningData" />
  <!-- 工作项详情 -->
  <WorkItemDetail ref="workItemDetailRef" @success="getPlanningData" />
  <IterationForm ref="iterationFormRef" @success="getPlanningData" />
  <IterationStartForm ref="iterationStartFormRef" @success="getPlanningData" />
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as IterationApi from '@/api/pms/pm/iteration'
import * as WorkItemApi from '@/api/pms/pm/workitem'
import { formatDate } from '@/utils/formatTime'
import {
  PmsIterationStatus,
  PmsWorkItemDefectType,
  PmsWorkItemPriority,
  PmsWorkItemType
} from '@/views/pms/pm/utils/constants'
import { getAllPageItems } from '@/utils/page'
import WorkItemDetail from '@/views/pms/pm/workitem/detail/WorkItemDetail.vue'
import WorkItemForm from '@/views/pms/pm/workitem/form/WorkItemForm.vue'
import IterationForm from '@/views/pms/pm/iteration/components/IterationForm.vue'
import IterationStartForm from '@/views/pms/pm/iteration/components/IterationStartForm.vue'
import {
  getIterationStatusName,
  getIterationStatusTagType,
  getPriorityColor,
  getPriorityName,
  getWorkItemStatusTagType
} from '@/views/pms/pm/utils/format'

defineOptions({ name: 'PmsPlanningBoard' })

const props = defineProps<{
  projectId: number
  projectType: number
  editable: boolean
}>()

const message = useMessage() // 消息弹窗
const loading = ref(true) // 加载中
const saving = ref(false) // 拖拽排序保存中
const creatingKey = ref('') // 快速创建中的区域标识
const searchKeyword = ref('') // 事项搜索关键字
const layoutMode = ref<'double' | 'single'>('double') // 规划布局
const backlogCreating = ref(false) // 是否正在 Backlog 新建事项
const creatingIterationId = ref<number>() // 正在新建事项的迭代编号
const iterationCreating = ref(false) // 是否正在新建迭代
const expandedIterationIds = new Set<number>() // 缓存已展开的迭代
interface QuickWorkItemDraft {
  name: string
  type: number
}
type PlanningIteration = Omit<IterationApi.PmsIterationVO, 'id' | 'status'> & {
  id: number
  status: number
  expanded: boolean
  list: WorkItemApi.PmsWorkItemVO[]
}
const iterationList = ref<PlanningIteration[]>([]) // 规划中的迭代列表
const unplannedWorkItems = ref<WorkItemApi.PmsWorkItemVO[]>([]) // 待规划工作项列表
const backlogDraft = reactive<QuickWorkItemDraft>({ name: '', type: PmsWorkItemType.TASK }) // Backlog 快速创建草稿
const iterationDrafts = reactive<Record<number, QuickWorkItemDraft>>({}) // 各迭代快速创建草稿
const quickIterationName = ref('') // 快速创建迭代名称
const workItemFormRef = ref<InstanceType<typeof WorkItemForm>>() // 工作项弹窗 Ref
const workItemDetailRef = ref<InstanceType<typeof WorkItemDetail>>() // 工作项详情 Ref
const iterationFormRef = ref<InstanceType<typeof IterationForm>>() // 迭代表单 Ref
const iterationStartFormRef = ref<InstanceType<typeof IterationStartForm>>() // 开始迭代表单 Ref
const draggedWorkItemId = ref<number>() // 当前拖拽工作项编号

/** 查询迭代规划数据 */
async function getPlanningData() {
  loading.value = true
  try {
    // 并行加载页面所需数据
    const [plannedIterations, activeIterations, fetchedUnplannedWorkItems] = await Promise.all([
      getIterationList(PmsIterationStatus.PLANNED),
      getIterationList(PmsIterationStatus.ACTIVE),
      getWorkItemList({
        projectId: props.projectId,
        unplannedOnly: true,
        name: searchKeyword.value.trim() || undefined
      })
    ])
    // 逐个加载迭代内工作项，并初始化快速创建草稿
    const projectIterations = [...activeIterations, ...plannedIterations]
    iterationList.value = await Promise.all(
      projectIterations.map(async (iteration) => {
        const iterationId = iteration.id!
        iterationDrafts[iterationId] ||= { name: '', type: PmsWorkItemType.TASK }
        return {
          ...iteration,
          id: iterationId,
          status: iteration.status!,
          expanded: expandedIterationIds.has(iterationId),
          list: await getWorkItemList({
            projectId: props.projectId,
            iterationId,
            name: searchKeyword.value.trim() || undefined
          })
        }
      })
    )
    unplannedWorkItems.value = fetchedUnplannedWorkItems
  } finally {
    loading.value = false
  }
}

/** 查询指定状态的迭代列表 */
async function getIterationList(status: number) {
  return getAllPageItems<IterationApi.PmsIterationVO>((pageNo, pageSize) => {
    const params = {
      pageNo,
      pageSize,
      projectId: props.projectId,
      status
    }
    return IterationApi.getIterationPage(params)
  })
}

/** 查询规划视图的工作项列表 */
async function getWorkItemList(params: {
  projectId: number
  iterationId?: number
  unplannedOnly?: boolean
  name?: string
}) {
  return getAllPageItems<WorkItemApi.PmsWorkItemVO>((pageNo, pageSize) => {
    const queryParams = {
      ...params,
      planningOnly: true,
      pageNo,
      pageSize
    }
    return WorkItemApi.getWorkItemPage(queryParams)
  })
}

/** 展开或折叠迭代，并保留刷新前的状态 */
function toggleIteration(iteration: PlanningIteration) {
  iteration.expanded = !iteration.expanded
  if (iteration.expanded) {
    expandedIterationIds.add(iteration.id)
  } else {
    expandedIterationIds.delete(iteration.id)
  }
}

/** 处理工作项更多操作 */
function handleWorkItemCommand(command: string, workItem: WorkItemApi.PmsWorkItemVO) {
  if (command === 'edit') {
    workItemFormRef.value?.open('update', workItem.id)
  } else if (command === 'recycle') {
    handleRecycleWorkItem(workItem)
  }
}

/** 将工作项移入回收站 */
async function handleRecycleWorkItem(workItem: WorkItemApi.PmsWorkItemVO) {
  try {
    await message.delConfirm(`确认将事项“${workItem.name}”移入回收站吗？`)
    await WorkItemApi.recycleWorkItem(workItem.id!)
    message.success('已移入回收站')
    await getPlanningData()
  } catch {}
}

/** 处理迭代操作 */
function handleIterationCommand(command: string, iteration: PlanningIteration) {
  if (command === 'start') {
    iterationStartFormRef.value?.open(iteration)
  } else if (command === 'complete') {
    handleCompleteIteration(iteration)
  } else if (command === 'edit') {
    iterationFormRef.value?.open('update', props.projectId, iteration.id)
  } else if (command === 'delete') {
    handleDeleteIteration(iteration)
  }
}

/** 完成迭代 */
async function handleCompleteIteration(iteration: PlanningIteration) {
  try {
    await message.confirm(`确认完成迭代“${iteration.name}”吗？`)
    await IterationApi.completeIteration(iteration.id)
    expandedIterationIds.delete(iteration.id)
    message.success('迭代已完成')
    await getPlanningData()
  } catch {}
}

/** 删除迭代 */
async function handleDeleteIteration(iteration: PlanningIteration) {
  try {
    await message.delConfirm(`确认删除迭代“${iteration.name}”吗？`)
    await IterationApi.deleteIteration(iteration.id)
    expandedIterationIds.delete(iteration.id)
    message.success('删除成功')
    await getPlanningData()
  } catch {}
}

/** 记录当前拖拽工作项，支持投放到折叠迭代标题 */
function handlePlanningDragStart(event: { item?: HTMLElement }) {
  const workItemId = event.item?.dataset.workItemId
  draggedWorkItemId.value = workItemId ? Number(workItemId) : undefined
}

/** 将工作项投放到折叠的迭代标题 */
async function handleCollapsedIterationDrop(iteration: PlanningIteration) {
  const workItemId = draggedWorkItemId.value
  if (iteration.expanded || !workItemId || iteration.list.some((item) => item.id === workItemId))
    return
  saving.value = true
  try {
    await WorkItemApi.updateWorkItemIteration(workItemId, iteration.id)
    await WorkItemApi.updateWorkItemPlanningSort(props.projectId, iteration.id, [
      ...iteration.list.map((item) => item.id!),
      workItemId
    ])
    message.success(`已规划到“${iteration.name}”`)
    await getPlanningData()
  } catch {
    await getPlanningData()
  } finally {
    saving.value = false
    draggedWorkItemId.value = undefined
  }
}

/** 打开工作项详情 */
function openWorkItem(workItem: WorkItemApi.PmsWorkItemVO) {
  workItemDetailRef.value?.open(workItem.id!)
}

/** 拖拽工作项到迭代 */
async function handlePlanDrop(iteration: PlanningIteration, event: { newIndex: number }) {
  // 获得拖入目标迭代的工作项
  const workItem = iteration.list[event.newIndex]
  if (!workItem) return
  // 更新所属迭代和迭代内排序
  saving.value = true
  try {
    await WorkItemApi.updateWorkItemIteration(workItem.id!, iteration.id)
    await WorkItemApi.updateWorkItemPlanningSort(
      props.projectId,
      iteration.id,
      iteration.list.map((item) => item.id!)
    )
    message.success(`已规划到“${iteration.name}”`)
  } catch {
    await getPlanningData()
  } finally {
    saving.value = false
  }
}

/** 拖拽工作项回待规划 */
async function handleUnplanDrop(event: { newIndex: number }) {
  // 获得拖回待规划区域的工作项
  const workItem = unplannedWorkItems.value[event.newIndex]
  if (!workItem) return
  // 清空所属迭代并保存待规划列表排序
  saving.value = true
  try {
    await WorkItemApi.updateWorkItemIteration(workItem.id!)
    await WorkItemApi.updateWorkItemPlanningSort(
      props.projectId,
      undefined,
      unplannedWorkItems.value.map((item) => item.id!)
    )
    message.success('已移回待规划')
  } catch {
    await getPlanningData()
  } finally {
    saving.value = false
  }
}

/** 保存规划列表排序 */
async function handlePlanningSort(
  iterationId: number | undefined,
  list: WorkItemApi.PmsWorkItemVO[],
  event: { oldIndex?: number; newIndex?: number; from?: HTMLElement; to?: HTMLElement }
) {
  // 跨列表拖拽由对应的规划方法处理，这里只保存当前列表内排序
  if (event.from !== event.to || event.oldIndex === event.newIndex || saving.value) return
  saving.value = true
  try {
    await WorkItemApi.updateWorkItemPlanningSort(
      props.projectId,
      iterationId,
      list.map((item) => item.id!)
    )
    message.success('排序已保存')
  } catch {
    await getPlanningData()
  } finally {
    saving.value = false
  }
}

/** 快速创建工作项 */
async function createQuickWorkItem(draft: QuickWorkItemDraft, iterationId?: number) {
  // 校验工作项标题
  const name = draft.name.trim()
  if (!name) {
    message.warning('请输入事项标题')
    return
  }
  // 创建工作项
  creatingKey.value = iterationId ? `iteration-${iterationId}` : 'backlog'
  try {
    const data: WorkItemApi.PmsWorkItemVO = {
      projectId: props.projectId,
      type: draft.type,
      name,
      priority: PmsWorkItemPriority.MEDIUM,
      memberUserIds: [],
      defectType:
        draft.type === PmsWorkItemType.DEFECT ? PmsWorkItemDefectType.FUNCTION : undefined,
      iterationId,
      fileUrls: [],
      labelIds: []
    }
    await WorkItemApi.createWorkItem(data)
    // 清空草稿并刷新规划数据
    draft.name = ''
    backlogCreating.value = false
    creatingIterationId.value = undefined
    message.success('事项创建成功')
    await getPlanningData()
  } finally {
    creatingKey.value = ''
  }
}

/** 快速创建迭代 */
async function createQuickIteration() {
  // 校验迭代名称
  const name = quickIterationName.value.trim()
  if (!name) {
    message.warning('请输入迭代名称')
    return
  }
  // 创建待开始迭代
  creatingKey.value = 'iteration'
  try {
    const data: IterationApi.PmsIterationVO = {
      projectId: props.projectId,
      name
    }
    await IterationApi.createIteration(data)
    // 清空草稿并刷新规划数据
    quickIterationName.value = ''
    iterationCreating.value = false
    message.success('迭代创建成功')
    await getPlanningData()
  } finally {
    creatingKey.value = ''
  }
}

defineExpose({ refresh: getPlanningData })

/** 初始化 */
onMounted(() => {
  getPlanningData()
})
</script>
