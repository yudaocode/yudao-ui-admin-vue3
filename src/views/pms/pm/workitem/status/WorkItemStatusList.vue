<template>
  <Dialog v-model="dialogVisible" :title="`${getWorkItemTypeName(type)}状态设置`" width="900px">
    <el-alert
      class="!mb-16px"
      :closable="false"
      :description="
        activeTab === 'status'
          ? '状态用于业务流转，初始状态用于新建工作项。'
          : '拖动状态到看板列；未放入看板的状态仍可用于工作项流转，但不会显示为看板列。'
      "
      type="info"
      show-icon
    />
    <el-tabs v-model="activeTab" v-loading="loading">
      <el-tab-pane label="状态管理" name="status">
        <el-form label-width="0">
          <draggable v-model="statusList" handle=".status-drag-handle" item-key="id">
            <template #item="{ element }">
              <div class="mb-12px flex items-center gap-12px">
                <Icon
                  class="status-drag-handle w-24px cursor-move text-[var(--el-text-color-secondary)]"
                  icon="ep:rank"
                />
                <el-input
                  v-model="element.name"
                  class="min-w-120px flex-1"
                  maxlength="50"
                  placeholder="状态名称"
                />
                <el-select v-model="element.statusType" class="!w-120px">
                  <el-option
                    v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-input
                  v-model="element.description"
                  class="min-w-150px flex-1"
                  maxlength="255"
                  placeholder="状态描述"
                />
                <el-radio v-model="defaultStatusId" class="!mr-0px !w-64px" :value="element.id">
                  初始
                </el-radio>
                <el-button
                  :disabled="element.id === defaultStatusId"
                  link
                  type="danger"
                  @click="handleDelete(element)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </draggable>
          <el-button class="mt-8px" plain type="primary" @click="handleAdd">添加状态</el-button>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="看板配置" name="board">
        <div class="mb-14px rounded-6px bg-[var(--el-fill-color-light)] p-12px">
          <div class="mb-8px text-13px font-600">未放入看板</div>
          <draggable
            v-model="unassignedStatuses"
            class="flex min-h-38px flex-wrap gap-8px"
            group="work-item-board-status"
            item-key="id"
          >
            <template #item="{ element }">
              <el-tag class="cursor-move" effect="plain">{{ element.name }}</el-tag>
            </template>
          </draggable>
        </div>
        <draggable v-model="boardList" handle=".board-drag-handle" item-key="id">
          <template #item="{ element, index }">
            <div
              class="mb-12px rounded-6px border border-solid border-[var(--el-border-color)] p-12px"
            >
              <div class="mb-10px flex items-center gap-10px">
                <Icon
                  class="board-drag-handle cursor-move text-[var(--el-text-color-secondary)]"
                  icon="ep:rank"
                />
                <el-input v-model="element.name" maxlength="50" placeholder="请输入看板列名称" />
                <el-button link type="danger" @click="handleDeleteBoard(index)">删除列</el-button>
              </div>
              <draggable
                v-model="element.statuses"
                class="flex min-h-38px flex-wrap gap-8px rounded-4px bg-[var(--el-fill-color-lighter)] p-8px"
                group="work-item-board-status"
                item-key="id"
              >
                <template #item="{ element: status }">
                  <el-tag class="cursor-move" effect="plain">{{ status.name }}</el-tag>
                </template>
              </draggable>
            </div>
          </template>
        </draggable>
        <el-button plain type="primary" @click="handleAddBoard">
          <Icon class="mr-4px" icon="ep:plus" />添加看板列
        </el-button>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button :disabled="loading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 删除状态并迁移工作项对话框 -->
  <WorkItemStatusDeleteForm ref="deleteFormRef" @success="handleDeleteSuccess" />
</template>

<script lang="ts" setup>
import draggable from 'vuedraggable'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as WorkItemStatusApi from '@/api/pms/pm/workitem/status'
import { PmsWorkItemStatusType, PmsWorkItemType } from '@/views/pms/pm/utils/constants'
import { getWorkItemTypeName } from '@/views/pms/pm/utils/format'
import WorkItemStatusDeleteForm from './WorkItemStatusDeleteForm.vue'

defineOptions({ name: 'PmsWorkItemStatusList' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 设置弹窗是否显示
const loading = ref(false) // 数据提交中
const projectId = ref(0) // 项目编号
const type = ref<number>(PmsWorkItemType.TASK) // 工作项类型
const statusList = ref<WorkItemStatusApi.PmsWorkItemStatusVO[]>([]) // 状态列表
const activeTab = ref<'status' | 'board'>('status') // 当前配置页签
const boardList = ref<WorkItemBoard[]>([]) // 看板列及其状态
const unassignedStatuses = ref<WorkItemStatusApi.PmsWorkItemStatusVO[]>([]) // 未放入看板的状态
const defaultStatusId = ref<number>() // 初始状态编号
const deleteFormRef = ref<InstanceType<typeof WorkItemStatusDeleteForm>>() // 删除状态表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

interface WorkItemBoard extends WorkItemStatusApi.PmsWorkItemBoardVO {
  statuses: WorkItemStatusApi.PmsWorkItemStatusVO[]
}

/** 打开设置弹窗 */
async function open(currentProjectId: number, currentType: number) {
  dialogVisible.value = true
  projectId.value = currentProjectId
  type.value = currentType
  activeTab.value = 'status'
  await getStatusList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询状态列表 */
async function getStatusList() {
  loading.value = true
  try {
    statusList.value = await WorkItemStatusApi.getWorkItemStatusList(projectId.value, type.value)
    defaultStatusId.value = statusList.value.find((status) => status.defaultStatus)?.id
    await getBoardConfig()
  } finally {
    loading.value = false
  }
}

/** 查询看板列和状态映射 */
async function getBoardConfig() {
  const config = await WorkItemStatusApi.getWorkItemBoardConfig(projectId.value, type.value)
  const statusMap = new Map(statusList.value.map((status) => [status.id, status]))
  boardList.value = config.boards.map((board) => ({
    ...board,
    statuses: board.statusIds.map((statusId) => statusMap.get(statusId)!).filter(Boolean)
  }))
  unassignedStatuses.value = config.unassignedStatusIds
    .map((statusId) => statusMap.get(statusId)!)
    .filter(Boolean)
}

/** 添加状态 */
function handleAdd() {
  statusList.value.push({
    id: -Date.now(),
    projectId: projectId.value,
    workItemType: type.value,
    name: '',
    statusType: PmsWorkItemStatusType.PROCESSING,
    defaultStatus: false,
    sort: statusList.value.length + 1
  })
  unassignedStatuses.value.push(statusList.value[statusList.value.length - 1])
}

/** 添加看板列 */
function handleAddBoard() {
  boardList.value.push({ id: -Date.now(), name: '', statusIds: [], statuses: [] })
}

/** 删除看板列，列内状态移回未放入看板区域 */
function handleDeleteBoard(index: number) {
  unassignedStatuses.value.push(...boardList.value[index].statuses)
  boardList.value.splice(index, 1)
}

/** 删除状态 */
function handleDelete(status: WorkItemStatusApi.PmsWorkItemStatusVO) {
  // 未保存的状态直接从列表移除
  if (status.id < 0) {
    statusList.value = statusList.value.filter((item) => item.id !== status.id)
    unassignedStatuses.value = unassignedStatuses.value.filter((item) => item.id !== status.id)
    boardList.value.forEach((board) => {
      board.statuses = board.statuses.filter((item) => item.id !== status.id)
    })
    return
  }
  // 已保存的状态需要迁移工作项后删除
  deleteFormRef.value?.open(status.id)
}

/** 删除状态成功 */
async function handleDeleteSuccess() {
  await getStatusList()
  emit('success')
}

/** 保存状态设置 */
async function submitForm() {
  // 校验状态名称、看板列名称和初始状态
  const names = statusList.value.map((status) => status.name.trim())
  const boardNames = boardList.value.map((board) => board.name.trim())
  if (names.some((name) => !name)) {
    message.warning('状态名称不能为空')
    return
  }
  if (new Set(names).size !== names.length) {
    message.warning('状态名称不能重复')
    return
  }
  if (boardNames.some((name) => !name)) {
    message.warning('看板列名称不能为空')
    return
  }
  if (new Set(boardNames).size !== boardNames.length) {
    message.warning('看板列名称不能重复')
    return
  }
  if (!defaultStatusId.value) {
    message.warning('请选择初始状态')
    return
  }

  // 创建或更新状态配置
  loading.value = true
  try {
    for (const status of statusList.value) {
      if (status.id < 0) {
        const oldId = status.id
        const data: WorkItemStatusApi.PmsWorkItemStatusVO = {
          id: status.id,
          projectId: projectId.value,
          workItemType: type.value,
          name: status.name.trim(),
          statusType: status.statusType,
          description: status.description,
          defaultStatus: status.defaultStatus,
          sort: status.sort
        }
        status.id = await WorkItemStatusApi.createWorkItemStatus(data)
        if (defaultStatusId.value === oldId) {
          defaultStatusId.value = status.id
        }
      } else {
        const data: WorkItemStatusApi.PmsWorkItemStatusVO = {
          id: status.id,
          projectId: status.projectId,
          workItemType: status.workItemType,
          name: status.name.trim(),
          statusType: status.statusType,
          description: status.description,
          defaultStatus: status.defaultStatus,
          sort: status.sort
        }
        await WorkItemStatusApi.updateWorkItemStatusConfig(data)
      }
    }
    // 更新初始状态和显示顺序
    await WorkItemStatusApi.updateDefaultWorkItemStatus(defaultStatusId.value)
    await WorkItemStatusApi.updateWorkItemStatusSort(statusList.value.map((status) => status.id))
    await WorkItemStatusApi.updateWorkItemBoardConfig(
      projectId.value,
      type.value,
      boardList.value.map((board) => ({
        id: board.id,
        name: board.name.trim(),
        statusIds: board.statuses.map((status) => status.id)
      }))
    )
    message.success('状态设置已保存')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
