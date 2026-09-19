<template>
  <el-drawer
    v-model="drawerVisible"
    body-class="!p-0 !overflow-hidden"
    destroy-on-close
    size="76%"
    :with-header="false"
  >
    <div v-loading="loading" class="flex h-full min-w-900px flex-col bg-[var(--el-bg-color)]">
      <!-- 工作项标题与操作 -->
      <header class="flex shrink-0 items-start justify-between gap-24px px-28px py-20px">
        <div class="min-w-0 flex-1">
          <div class="mb-4px text-12px text-[var(--el-text-color-secondary)]">
            创建于 {{ formatDate(workItem?.createTime) }}
          </div>
          <div class="flex min-w-0 items-center gap-10px">
            <Icon class="shrink-0 text-[var(--el-color-primary)]" icon="ep:list" :size="22" />
            <h2 class="m-0 truncate text-22px font-600 leading-32px">
              #{{ workItem?.serialNumber }} {{ workItem?.name }}
            </h2>
          </div>
          <div class="mt-10px flex flex-wrap items-center gap-8px">
            <el-tag
              v-for="label in workItem?.labels || []"
              :key="label.id"
              :color="label.color"
              effect="dark"
              size="small"
            >
              {{ label.name }}
            </el-tag>
            <el-tooltip
              v-for="name in workItem?.memberUserNames || []"
              :key="name"
              :content="name"
              placement="top"
            >
              <el-avatar :size="26">{{ name.slice(0, 1) }}</el-avatar>
            </el-tooltip>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-8px">
          <el-dropdown v-if="editable" trigger="click" @command="handleMoreCommand">
            <el-button aria-label="更多操作"><Icon icon="ep:more-filled" /></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item v-if="canUpdate" command="archive">归档</el-dropdown-item>
                <el-dropdown-item v-if="canUpdate" command="recycle" divided>
                  移入回收站
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button aria-label="关闭" circle @click="drawerVisible = false">
            <Icon icon="ep:close" />
          </el-button>
        </div>
      </header>

      <div
        class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] border-t border-solid border-[var(--el-border-color-lighter)]"
      >
        <!-- 工作项内容与协作信息 -->
        <main class="min-w-0 overflow-y-auto px-32px py-24px">
          <section class="mb-28px">
            <div v-if="editable" class="mb-18px flex items-center gap-8px">
              <el-button v-if="editable" link type="primary" @click="openEditForm">
                <Icon class="mr-4px" icon="ep:edit" />编辑描述
              </el-button>
              <el-button link type="primary" @click="openEditForm">
                <Icon class="mr-4px" icon="ep:paperclip" />上传附件
              </el-button>
            </div>
            <h3 class="mb-12px mt-0 text-16px font-600">{{ workItemTypeName }}描述</h3>
            <div
              v-if="workItem?.description"
              v-dompurify-html="workItem.description"
              class="min-h-48px break-words text-14px leading-24px [&_img]:max-w-full [&_p]:my-8px"
            ></div>
            <div v-else class="py-8px text-13px text-[var(--el-text-color-secondary)]">
              暂无描述
            </div>
          </section>

          <section v-if="workItem?.fileUrls?.length" class="mb-28px">
            <h3 class="mb-12px mt-0 text-16px font-600">附件</h3>
            <div class="flex flex-wrap gap-10px">
              <el-link
                v-for="fileUrl in workItem.fileUrls"
                :key="fileUrl"
                class="rounded-4px border border-solid border-[var(--el-border-color)] px-10px py-6px"
                :href="fileUrl"
                target="_blank"
                type="primary"
              >
                <Icon class="mr-5px" icon="ep:paperclip" />{{ getFileNameFromUrl(fileUrl) }}
              </el-link>
            </div>
          </section>

          <!-- 评论、活动和扩展信息使用页签收敛，避免多个大表格纵向堆叠 -->
          <section v-if="workItem?.id">
            <h3 class="mb-8px mt-0 text-16px font-600">活动日志</h3>
            <el-tabs v-model="activeTab">
              <el-tab-pane label="评论" name="comment">
                <WorkItemComment
                  :editable="editable"
                  :show-title="false"
                  :work-item-id="workItem.id"
                  @changed="workItemActivityRef?.getWorkItemActivityList()"
                />
              </el-tab-pane>
              <el-tab-pane label="活动" name="activity">
                <WorkItemActivity
                  ref="workItemActivityRef"
                  :show-title="false"
                  :work-item-id="workItem.id"
                />
              </el-tab-pane>
              <el-tab-pane label="子工作项" name="subtask">
                <WorkItemSubtaskList
                  :editable="editable"
                  :parent-work-item="workItem"
                  :show-title="false"
                  @changed="handleExtensionChanged"
                />
              </el-tab-pane>
              <el-tab-pane label="工时记录" name="worklog">
                <WorkItemWorkLogList
                  :editable="editable"
                  :show-title="false"
                  :work-item-id="workItem.id"
                  @changed="handleExtensionChanged"
                />
              </el-tab-pane>
            </el-tabs>
          </section>
        </main>

        <!-- 工作项属性 -->
        <aside
          class="overflow-y-auto border-l border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] p-20px"
        >
          <el-collapse v-model="expandedPanels">
            <el-collapse-item name="basic" title="基础信息">
              <div class="flex flex-col gap-2px">
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">状态</span>
                  <WorkItemStatusSelect
                    v-if="workItem && canUpdate && isInlineEditing('statusId')"
                    v-model="workItem.statusId"
                    class="!w-100%"
                    :project-id="workItem.projectId"
                    :work-item-type="workItem.type"
                    @change="handleQuickStatusChange"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('statusId')"
                  >
                    {{ workItem.statusName }}
                  </el-button>
                  <el-tag v-else class="w-fit" :type="getWorkItemStatusTagType(workItem?.status)">
                    {{ workItem?.statusName }}
                  </el-tag>
                </div>
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">负责人</span>
                  <ProjectMemberSelect
                    v-if="workItem && canUpdate && isInlineEditing('assigneeUserId')"
                    v-model="workItem.assigneeUserId"
                    class="!w-100%"
                    clearable
                    :project-id="workItem.projectId"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('assigneeUserId')"
                  >
                    {{ workItem.assigneeUserName || '未分配' }}
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.assigneeUserName || '未分配' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">优先级</span>
                  <el-select
                    v-if="workItem && canUpdate && isInlineEditing('priority')"
                    v-model="workItem.priority"
                    class="!w-100%"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  >
                    <el-option
                      v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('priority')"
                  >
                    {{ getPriorityName(workItem?.priority) }}
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ getPriorityName(workItem?.priority) }}
                  </strong>
                </div>
                <div
                  v-if="projectType === PmsProjectType.AGILE"
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">所属迭代</span>
                  <IterationSelect
                    v-if="workItem && canUpdate && isInlineEditing('iterationId')"
                    v-model="workItem.iterationId"
                    class="!w-100%"
                    :project-id="workItem.projectId"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('iterationId')"
                  >
                    {{ workItem?.iterationName || '待规划' }}
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.iterationName || '待规划' }}
                  </strong>
                </div>
                <div
                  v-if="
                    projectType === PmsProjectType.AGILE &&
                    workItem?.type !== PmsWorkItemType.REQUIREMENT
                  "
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">关联需求</span>
                  <WorkItemSelect
                    v-if="workItem && canUpdate && isInlineEditing('relatedRequirementId')"
                    v-model="workItem.relatedRequirementId"
                    class="!w-100%"
                    clearable
                    placeholder="请选择关联需求"
                    :project-id="workItem.projectId"
                    :type="PmsWorkItemType.REQUIREMENT"
                    @update:model-value="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('relatedRequirementId')"
                  >
                    {{ workItem?.relatedRequirementName || '未关联' }}
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.relatedRequirementName || '未关联' }}
                  </strong>
                </div>
                <div
                  v-if="workItem?.type === PmsWorkItemType.DEFECT"
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">缺陷类型</span>
                  <strong class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]">
                    {{ getWorkItemDefectTypeName(workItem.defectType) }}
                  </strong>
                </div>
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">完成进度</span>
                  <el-input-number
                    v-if="workItem && canUpdate && isInlineEditing('progress')"
                    v-model="workItem.progress"
                    class="!w-100%"
                    :controls="false"
                    :max="100"
                    :min="0"
                    @change="saveInlineWorkItem"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('progress')"
                  >
                    {{ workItem?.progress || 0 }}%
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.progress || 0 }}%
                  </strong>
                </div>
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">预估工时</span>
                  <el-input-number
                    v-if="workItem && canUpdate && isInlineEditing('estimatedHours')"
                    v-model="workItem.estimatedHours"
                    class="!w-100%"
                    :min="0"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('estimatedHours')"
                  >
                    {{ workItem?.estimatedHours == null ? '-' : `${workItem.estimatedHours} 小时` }}
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ workItem?.estimatedHours == null ? '-' : `${workItem.estimatedHours} 小时` }}
                  </strong>
                </div>
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">开始时间</span>
                  <el-date-picker
                    v-if="workItem && canUpdate && isInlineEditing('startTime')"
                    v-model="workItem.startTime"
                    class="!w-100%"
                    clearable
                    placeholder="请选择开始时间"
                    type="datetime"
                    value-format="x"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('startTime')"
                  >
                    {{ formatDate(workItem?.startTime) || '-' }}
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ formatDate(workItem?.startTime) || '-' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">截止时间</span>
                  <el-date-picker
                    v-if="workItem && canUpdate && isInlineEditing('endTime')"
                    v-model="workItem.endTime"
                    class="!w-100%"
                    clearable
                    placeholder="请选择截止时间"
                    type="datetime"
                    value-format="x"
                    @change="saveInlineWorkItem"
                    @blur="cancelInlineEditing"
                    @keyup.esc.stop="cancelInlineEditing"
                  />
                  <el-button
                    v-else-if="workItem && canUpdate"
                    class="min-w-0 !justify-start !px-0 font-500"
                    link
                    @click="startInlineEditing('endTime')"
                  >
                    {{ formatDate(workItem?.endTime) || '-' }}
                  </el-button>
                  <strong
                    v-else
                    class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]"
                  >
                    {{ formatDate(workItem?.endTime) || '-' }}
                  </strong>
                </div>
                <div
                  class="grid min-h-42px grid-cols-[86px_minmax(0,1fr)] items-center gap-12px text-13px"
                >
                  <span class="text-[var(--el-text-color-secondary)]">创建时间</span>
                  <strong class="min-w-0 truncate font-500 text-[var(--el-text-color-regular)]">
                    {{ formatDate(workItem?.createTime) || '-' }}
                  </strong>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </aside>
      </div>
    </div>
  </el-drawer>

  <!-- 工作项编辑表单 -->
  <WorkItemForm ref="workItemFormRef" @success="handleFormSuccess" />
</template>

<script lang="ts" setup>
import * as ProjectApi from '@/api/pms/pm/project'
import * as WorkItemApi from '@/api/pms/pm/workitem'
import { checkPermi } from '@/utils/permission'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { getFileNameFromUrl } from '@/utils/file'
import {
  PmsProjectStatus,
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemType
} from '@/views/pms/pm/utils/constants'
import {
  getPriorityName,
  getWorkItemDefectTypeName,
  getWorkItemStatusTagType,
  getWorkItemTypeName
} from '@/views/pms/pm/utils/format'
import WorkItemStatusSelect from '../status/WorkItemStatusSelect.vue'
import IterationSelect from '../../iteration/components/IterationSelect.vue'
import ProjectMemberSelect from '../../project/components/ProjectMemberSelect.vue'
import WorkItemSelect from '../components/WorkItemSelect.vue'
import WorkItemWorkLogList from '../worklog/WorkItemWorkLogList.vue'
import WorkItemActivity from './WorkItemActivity.vue'
import WorkItemComment from './WorkItemComment.vue'
import WorkItemForm from '../form/WorkItemForm.vue'
import WorkItemSubtaskList from './WorkItemSubtaskList.vue'

defineOptions({ name: 'PmsWorkItemDetail' })

const message = useMessage() // 消息弹窗
const drawerVisible = ref(false) // 详情抽屉是否展示
const loading = ref(false) // 详情加载中
const editable = ref(false) // 是否允许编辑
const projectType = ref<number>(PmsProjectType.GENERAL) // 项目类型
const workItem = ref<WorkItemApi.PmsWorkItemVO>() // 工作项详情
const activeTab = ref('comment') // 当前协作信息页签
const expandedPanels = ref(['basic']) // 展开的属性面板
const workItemFormRef = ref<InstanceType<typeof WorkItemForm>>() // 工作项表单 Ref
const workItemActivityRef = ref<InstanceType<typeof WorkItemActivity>>() // 工作项动态 Ref
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于详情变更后的回调
const workItemTypeName = computed(() => getWorkItemTypeName(workItem.value?.type || 0)) // 工作项类型名称
const canUpdate = computed(() => editable.value && checkPermi(['pms:pm:work-item:update'])) // 是否允许更新工作项
type InlineEditField =
  | 'statusId'
  | 'assigneeUserId'
  | 'priority'
  | 'iterationId'
  | 'relatedRequirementId'
  | 'progress'
  | 'estimatedHours'
  | 'startTime'
  | 'endTime'
const inlineEditingField = ref<InlineEditField>() // 当前正在编辑的属性

/** 打开工作项详情 */
async function open(id: number) {
  drawerVisible.value = true
  activeTab.value = 'comment'
  inlineEditingField.value = undefined
  await getWorkItem(id)
}
defineExpose({ open }) // 提供 open 方法，用于打开详情

/** 开始编辑工作项属性 */
function startInlineEditing(field: InlineEditField) {
  if (canUpdate.value) {
    inlineEditingField.value = field
  }
}

/** 结束编辑工作项属性 */
function cancelInlineEditing() {
  inlineEditingField.value = undefined
}

/** 判断工作项属性是否处于编辑状态 */
function isInlineEditing(field: InlineEditField) {
  return inlineEditingField.value === field
}

/** 查询工作项详情 */
async function getWorkItem(id: number) {
  loading.value = true
  try {
    const currentWorkItem = await WorkItemApi.getWorkItem(id)
    const project = await ProjectApi.getProject(currentWorkItem.projectId)
    workItem.value = currentWorkItem
    projectType.value = project.type
    editable.value = Boolean(
      project.writeStatus &&
      project.status === PmsProjectStatus.ACTIVE &&
      currentWorkItem.lifecycleStatus === PmsWorkItemLifecycleStatus.ACTIVE
    )
  } finally {
    loading.value = false
  }
}

/** 打开工作项编辑表单 */
function openEditForm() {
  if (workItem.value?.id) {
    workItemFormRef.value?.open('update', workItem.value.id)
  }
}

/** 快速切换工作项状态 */
async function handleQuickStatusChange(statusId: number) {
  if (!workItem.value?.id) {
    return
  }
  cancelInlineEditing()
  await WorkItemApi.updateWorkItemStatus(workItem.value.id, statusId)
  await getWorkItem(workItem.value.id)
  message.success('状态已更新')
  workItemActivityRef.value?.getWorkItemActivityList()
  emit('success')
}

/** 就地保存工作项属性 */
async function saveInlineWorkItem() {
  if (!workItem.value?.id) {
    return
  }
  cancelInlineEditing()
  try {
    await WorkItemApi.updateWorkItem(workItem.value)
    await getWorkItem(workItem.value.id)
    workItemActivityRef.value?.getWorkItemActivityList()
    message.success('工作项已更新')
    emit('success')
  } catch {
    await getWorkItem(workItem.value.id)
  }
}

/** 处理扩展信息变化 */
function handleExtensionChanged() {
  workItemActivityRef.value?.getWorkItemActivityList()
  emit('success')
}

/** 处理工作项编辑成功 */
async function handleFormSuccess() {
  if (!workItem.value?.id) {
    return
  }
  await getWorkItem(workItem.value.id)
  emit('success')
}

/** 处理更多操作 */
function handleMoreCommand(command: 'edit' | 'archive' | 'recycle') {
  if (command === 'edit') {
    openEditForm()
    return
  }
  if (command === 'archive') {
    handleArchive()
    return
  }
  handleRecycle()
}

/** 归档工作项 */
async function handleArchive() {
  if (!workItem.value?.id) {
    return
  }
  try {
    await message.confirm(`确认归档${workItemTypeName.value}“${workItem.value.name}”吗？`)
    await WorkItemApi.archiveWorkItem(workItem.value.id)
    message.success('归档成功')
    drawerVisible.value = false
    emit('success')
  } catch {}
}

/** 将工作项移入回收站 */
async function handleRecycle() {
  if (!workItem.value?.id) {
    return
  }
  try {
    await message.delConfirm(
      `确认将${workItemTypeName.value}“${workItem.value.name}”移入回收站吗？`
    )
    await WorkItemApi.recycleWorkItem(workItem.value.id)
    message.success('已移入回收站')
    drawerVisible.value = false
    emit('success')
  } catch {}
}
</script>
