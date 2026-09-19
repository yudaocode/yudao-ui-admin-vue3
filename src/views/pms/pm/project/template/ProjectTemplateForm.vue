<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1100px" @closed="handleClosed">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="96px"
    >
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 模板基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="模板名称" prop="name">
                <el-input
                  v-model="formData.name"
                  maxlength="100"
                  placeholder="请输入模板名称"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目类型" prop="projectType">
                <el-select
                  v-model="formData.projectType"
                  class="!w-100%"
                  placeholder="请选择项目类型"
                  @change="handleProjectTypeChange"
                >
                  <el-option label="通用项目" :value="PmsProjectType.GENERAL" />
                  <el-option label="敏捷开发项目" :value="PmsProjectType.AGILE" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="模板状态" prop="status">
                <el-radio-group v-model="formData.status">
                  <el-radio
                    v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                    :key="dict.value"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示顺序" prop="sort">
                <el-input-number v-model="formData.sort" :min="0" class="!w-100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="模板描述" prop="description">
            <el-input
              v-model="formData.description"
              :rows="4"
              maxlength="500"
              placeholder="请输入模板适用场景"
              show-word-limit
              type="textarea"
            />
          </el-form-item>
        </el-tab-pane>

        <!-- 启用的事项类型 -->
        <el-tab-pane :label="`事项类型（${formData.itemTypes.length}）`" name="itemType">
          <div class="mb-20px">
            <el-alert
              :closable="false"
              description="项目创建时会根据这里的事项类型初始化可用能力；取消事项类型会同步移除其状态和看板"
              title="事项类型是模板的全局关系；项目创建后不提供项目级维护"
              type="info"
            />
          </div>
          <el-form-item class="!mb-0px" label="事项类型" prop="itemTypes">
            <el-checkbox-group v-model="formData.itemTypes" @change="handleItemTypesChange">
              <el-checkbox
                v-for="item in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE)"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-tab-pane>

        <!-- 工作项状态 -->
        <el-tab-pane :label="`状态（${formData.statuses.length}）`" name="status">
          <div class="mb-16px flex items-center gap-16px">
            <el-alert
              :closable="false"
              class="flex-1"
              title="拖拽调整状态顺序；每种事项类型必须且只能配置一个初始状态"
              type="info"
            />
            <el-button type="primary" @click="addStatus">
              <Icon icon="ep:plus" />新增状态
            </el-button>
          </div>
          <div class="space-y-16px">
            <div v-for="group in statusGroups" :key="group.value">
              <div class="mb-8px flex items-center gap-8px text-14px font-500">
                <span>{{ group.label }}</span>
                <span class="text-[var(--el-text-color-secondary)]"
                  >（{{ group.statuses.length }}）</span
                >
              </div>
              <el-table
                :ref="(table) => setStatusTableRef(group.value, table)"
                :data="group.statuses"
                max-height="430px"
                row-key="code"
              >
                <el-table-column align="center" width="44">
                  <template #default>
                    <el-tooltip content="拖动排序" placement="top">
                      <Icon
                        class="status-drag-handle cursor-move text-[var(--el-text-color-secondary)]"
                        icon="ep:rank"
                      />
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column label="编码" min-width="150">
                  <template #default="scope">
                    <el-input v-model="scope.row.code" placeholder="如 task_todo" />
                  </template>
                </el-table-column>
                <el-table-column label="名称" min-width="130">
                  <template #default="scope">
                    <el-input v-model="scope.row.name" placeholder="请输入状态名称" />
                  </template>
                </el-table-column>
                <el-table-column label="事项类型" min-width="130">
                  <template #default="scope">
                    <el-select v-model="scope.row.workItemType" @change="handleStatusTypeChange">
                      <el-option
                        v-for="item in enabledWorkItemTypeOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="语义状态" min-width="130">
                  <template #default="scope">
                    <el-select v-model="scope.row.statusType">
                      <el-option
                        v-for="item in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE)"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column align="center" label="初始" width="80">
                  <template #default="scope">
                    <el-radio
                      :model-value="scope.row.defaultStatus"
                      :value="true"
                      class="!mr-0px"
                      @change="handleDefaultStatusChange(scope.row)"
                    >
                      初始
                    </el-radio>
                  </template>
                </el-table-column>
                <el-table-column align="center" fixed="right" label="操作" width="70">
                  <template #default="scope">
                    <el-button
                      link
                      type="danger"
                      @click="removeStatusByItem(group.statuses[scope.$index])"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 看板列 -->
        <el-tab-pane :label="`看板（${formData.boards.length}）`" name="board">
          <div class="mb-16px flex items-center gap-16px">
            <el-alert
              :closable="false"
              class="flex-1"
              title="拖拽调整看板列顺序；同一状态只能归属一个看板列"
              type="info"
            />
            <el-button type="primary" @click="addBoard"
              ><Icon icon="ep:plus" />新增看板列</el-button
            >
          </div>
          <el-table ref="boardTableRef" :data="formData.boards" max-height="430px">
            <el-table-column align="center" width="44">
              <template #default>
                <el-tooltip content="拖动排序" placement="top">
                  <Icon
                    class="board-drag-handle cursor-move text-[var(--el-text-color-secondary)]"
                    icon="ep:rank"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="编码" min-width="140">
              <template #default="scope">
                <el-input v-model="scope.row.code" placeholder="如 todo" />
              </template>
            </el-table-column>
            <el-table-column label="名称" min-width="130">
              <template #default="scope">
                <el-input v-model="scope.row.name" placeholder="请输入看板列名称" />
              </template>
            </el-table-column>
            <el-table-column label="事项类型" min-width="130">
              <template #default="scope">
                <el-select v-model="scope.row.workItemType" @change="scope.row.statusCodes = []">
                  <el-option
                    v-for="item in enabledWorkItemTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="关联状态" min-width="260">
              <template #default="scope">
                <el-select
                  v-model="scope.row.statusCodes"
                  class="!w-100%"
                  multiple
                  placeholder="请选择关联状态"
                >
                  <el-option
                    v-for="status in getStatusOptions(scope.row.workItemType, scope.row.code)"
                    :key="status.code"
                    :label="status.name || status.code"
                    :value="status.code"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column align="center" fixed="right" label="操作" width="70">
              <template #default="scope">
                <el-button link type="danger" @click="removeBoard(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import type { ComponentPublicInstance } from 'vue'
import Sortable from 'sortablejs'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as ProjectTemplateApi from '@/api/pms/pm/project/template'
import {
  PmsProjectType,
  PmsWorkItemStatusType,
  PmsWorkItemType
} from '@/views/pms/pm/utils/constants'
import { getWorkItemTypeCode } from '@/views/pms/pm/utils/format'

defineOptions({ name: 'PmsProjectTemplateForm' })

type ProjectTemplateTab = 'basic' | 'itemType' | 'status' | 'board'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const formType = ref('') // 表单类型
const activeTab = ref<ProjectTemplateTab>('basic') // 当前页签
const previousProjectType = ref<number>(PmsProjectType.GENERAL) // 切换前的项目类型
const formData = ref<ProjectTemplateApi.PmsProjectTemplateVO>(getDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择模板状态', trigger: 'change' }],
  sort: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }],
  itemTypes: [{ required: true, message: '请选择事项类型', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref
const statusTableRefs = ref<Record<number, HTMLElement | null>>({}) // 状态分组表格 Ref
const boardTableRef = ref() // 看板表格 Ref
const statusSortables = new Map<number, Sortable>() // 状态分组拖拽实例
let boardSortable: Sortable | undefined // 看板拖拽实例
const emit = defineEmits<{ success: [] }>() // 操作成功事件
const enabledWorkItemTypeOptions = computed(() =>
  getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE).filter((item) =>
    formData.value.itemTypes.includes(item.value)
  )
) // 已启用的事项类型选项
const statusGroups = computed(() =>
  enabledWorkItemTypeOptions.value
    .map((item) => ({
      ...item,
      statuses: formData.value.statuses.filter((status) => status.workItemType === item.value)
    }))
    .filter((group) => group.statuses.length > 0)
) // 按事项类型分组的状态列表

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  activeTab.value = 'basic'
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProjectTemplateApi.getProjectTemplate(id)
      previousProjectType.value = formData.value.projectType
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 切换项目类型时恢复对应的默认配置 */
async function handleProjectTypeChange(projectType: number) {
  const previousConfig = getDefaultCollaborationConfig(previousProjectType.value)
  const customized =
    JSON.stringify(formData.value.itemTypes) !== JSON.stringify(previousConfig.itemTypes) ||
    JSON.stringify(formData.value.statuses) !== JSON.stringify(previousConfig.statuses) ||
    JSON.stringify(formData.value.boards) !== JSON.stringify(previousConfig.boards)
  if (customized) {
    try {
      await message.confirm('切换项目类型会恢复默认事项类型、状态和看板，确认继续吗？')
    } catch {
      formData.value.projectType = previousProjectType.value
      return
    }
  }
  const config = getDefaultCollaborationConfig(projectType)
  formData.value.itemTypes = config.itemTypes
  formData.value.statuses = config.statuses
  formData.value.boards = config.boards
  previousProjectType.value = projectType
}

/** 切换事项类型时同步对应的状态和看板 */
function handleItemTypesChange() {
  const itemTypeSet = new Set(formData.value.itemTypes)
  formData.value.statuses = formData.value.statuses.filter((status) =>
    itemTypeSet.has(status.workItemType)
  )
  formData.value.boards = formData.value.boards.filter((board) =>
    itemTypeSet.has(board.workItemType)
  )
  formData.value.itemTypes.forEach((workItemType) => {
    if (formData.value.statuses.some((status) => status.workItemType === workItemType)) return
    const config = getDefaultWorkItemTypeConfig(workItemType)
    formData.value.statuses.push(...config.statuses)
    formData.value.boards.push(...config.boards)
  })
  updateStatusSort()
  updateBoardSort()
}

/** 切换页签时初始化对应的拖拽排序 */
async function handleTabChange(tab: string | number) {
  await nextTick()
  if (tab === 'status') {
    initStatusSortable()
  } else if (tab === 'board') {
    initBoardSortable()
  }
}

/** 初始化状态表格拖拽排序 */
function initStatusSortable() {
  statusSortables.forEach((sortable) => sortable.destroy())
  statusSortables.clear()
  statusGroups.value.forEach((group) => {
    const tableBody = statusTableRefs.value[group.value]?.querySelector(
      '.el-table__body-wrapper tbody'
    )
    if (!tableBody) return
    const sortable = Sortable.create(tableBody, {
      animation: 150,
      handle: '.status-drag-handle',
      onEnd: ({ newIndex, oldIndex }) => {
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        const movedStatus = group.statuses[oldIndex]
        const targetStatus = group.statuses[newIndex]
        const oldGlobalIndex = formData.value.statuses.indexOf(movedStatus)
        const targetGlobalIndex = formData.value.statuses.indexOf(targetStatus)
        if (oldGlobalIndex < 0 || targetGlobalIndex < 0) return
        formData.value.statuses.splice(oldGlobalIndex, 1)
        formData.value.statuses.splice(targetGlobalIndex, 0, movedStatus)
        updateStatusSort()
      }
    })
    statusSortables.set(group.value, sortable)
  })
}

/** 保存状态表格组件引用 */
function setStatusTableRef(value: number, table: Element | ComponentPublicInstance | null) {
  const element = table && '$el' in table ? table.$el : table
  statusTableRefs.value[value] = element instanceof HTMLElement ? element : null
}

/** 状态事项类型变化后重新绑定分组拖拽 */
async function handleStatusTypeChange() {
  await nextTick()
  initStatusSortable()
}

/** 初始化看板表格拖拽排序 */
function initBoardSortable() {
  boardSortable?.destroy()
  const tableBody = boardTableRef.value?.$el.querySelector('.el-table__body-wrapper tbody')
  if (!tableBody) return
  boardSortable = Sortable.create(tableBody, {
    animation: 150,
    handle: '.board-drag-handle',
    onEnd: ({ newIndex, oldIndex }) => {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      formData.value.boards.splice(newIndex, 0, formData.value.boards.splice(oldIndex, 1)[0])
      updateBoardSort()
    }
  })
}

/** 设置事项类型的初始状态 */
function handleDefaultStatusChange(status: ProjectTemplateApi.PmsProjectTemplateStatusVO) {
  formData.value.statuses.forEach((item) => {
    if (item.workItemType === status.workItemType) {
      item.defaultStatus = item === status
    }
  })
}

/** 按当前顺序更新状态排序值 */
function updateStatusSort() {
  formData.value.statuses.forEach((status, index) => (status.sort = (index + 1) * 10))
}

/** 按当前顺序更新看板排序值 */
function updateBoardSort() {
  formData.value.boards.forEach((board, index) => (board.sort = (index + 1) * 10))
}

/** 新增状态 */
function addStatus() {
  const workItemType = formData.value.itemTypes[0] || PmsWorkItemType.TASK
  formData.value.statuses.push({
    code: '',
    name: '',
    workItemType,
    statusType: PmsWorkItemStatusType.PENDING,
    defaultStatus: false,
    sort: formData.value.statuses.length * 10 + 10,
    boardCode: ''
  })
}

/** 删除状态 */
function removeStatus(index: number) {
  const statusCode = formData.value.statuses[index].code
  formData.value.statuses.splice(index, 1)
  formData.value.boards.forEach((board) => {
    board.statusCodes = board.statusCodes.filter((code) => code !== statusCode)
  })
  updateStatusSort()
}

/** 删除分组中的状态 */
function removeStatusByItem(status: ProjectTemplateApi.PmsProjectTemplateStatusVO) {
  const index = formData.value.statuses.indexOf(status)
  if (index >= 0) removeStatus(index)
}

/** 新增看板列 */
function addBoard() {
  formData.value.boards.push({
    code: '',
    name: '',
    workItemType: formData.value.itemTypes[0] || PmsWorkItemType.TASK,
    sort: formData.value.boards.length * 10 + 10,
    statusCodes: []
  })
}

/** 删除看板列 */
function removeBoard(index: number) {
  formData.value.boards.splice(index, 1)
  updateBoardSort()
}

/** 获得看板列可关联的状态选项 */
function getStatusOptions(workItemType: number, currentBoardCode: string) {
  const selectedStatusCodes = new Set(
    formData.value.boards
      .filter((board) => board.code !== currentBoardCode)
      .flatMap((board) => board.statusCodes)
  )
  return formData.value.statuses.filter(
    (status) => status.workItemType === workItemType && !selectedStatusCodes.has(status.code)
  )
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (fields) {
    activeTab.value = Object.prototype.hasOwnProperty.call(fields, 'itemTypes')
      ? 'itemType'
      : 'basic'
    return
  }
  // 校验状态和看板配置
  if (!validateCollaborationConfig()) return
  // 提交请求
  const data = buildSubmitData()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ProjectTemplateApi.createProjectTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProjectTemplateApi.updateProjectTemplate(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 校验事项类型、状态和看板的页签配置 */
function validateCollaborationConfig() {
  const statusCodeSet = new Set<string>()
  for (const status of formData.value.statuses) {
    if (!status.code || !status.name || !formData.value.itemTypes.includes(status.workItemType)) {
      return warnAndSwitchTab('status', '请完整填写状态编码、名称和事项类型')
    }
    if (statusCodeSet.has(status.code)) {
      return warnAndSwitchTab('status', `状态编码“${status.code}”不能重复`)
    }
    statusCodeSet.add(status.code)
  }
  for (const workItemType of formData.value.itemTypes) {
    const defaultStatusCount = formData.value.statuses.filter(
      (status) => status.workItemType === workItemType && status.defaultStatus
    ).length
    if (defaultStatusCount !== 1) {
      return warnAndSwitchTab('status', '每种事项类型必须且只能配置一个初始状态')
    }
  }

  const boardCodeSet = new Set<string>()
  const assignedStatusCountMap = new Map<string, number>()
  for (const board of formData.value.boards) {
    if (!board.code || !board.name || !formData.value.itemTypes.includes(board.workItemType)) {
      return warnAndSwitchTab('board', '请完整填写看板编码、名称和事项类型')
    }
    if (boardCodeSet.has(board.code)) {
      return warnAndSwitchTab('board', `看板编码“${board.code}”不能重复`)
    }
    boardCodeSet.add(board.code)
    for (const statusCode of board.statusCodes) {
      const status = formData.value.statuses.find((item) => item.code === statusCode)
      if (!status || status.workItemType !== board.workItemType) {
        return warnAndSwitchTab('board', '看板只能关联相同事项类型的有效状态')
      }
      assignedStatusCountMap.set(statusCode, (assignedStatusCountMap.get(statusCode) || 0) + 1)
    }
  }
  if (formData.value.statuses.some((status) => assignedStatusCountMap.get(status.code) !== 1)) {
    return warnAndSwitchTab('board', '每个状态必须且只能归属一个看板列')
  }
  return true
}

/** 提示配置错误并切换到对应页签 */
function warnAndSwitchTab(tab: ProjectTemplateTab, text: string) {
  activeTab.value = tab
  message.warning(text)
  return false
}

/** 构建提交数据，并同步状态所属的看板列编码 */
function buildSubmitData() {
  const data = structuredClone(toRaw(formData.value))
  const statusBoardMap = new Map<string, string>()
  data.boards.forEach((board) => {
    board.statusCodes.forEach((statusCode) => statusBoardMap.set(statusCode, board.code))
  })
  data.statuses.forEach((status) => {
    status.boardCode = statusBoardMap.get(status.code) || ''
  })
  return data
}

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData()
  previousProjectType.value = formData.value.projectType
  formRef.value?.resetFields()
}

/** 弹窗关闭后销毁拖拽实例 */
function handleClosed() {
  statusSortables.forEach((sortable) => sortable.destroy())
  statusSortables.clear()
  boardSortable?.destroy()
  boardSortable = undefined
}

/** 组件卸载时销毁拖拽实例 */
onBeforeUnmount(handleClosed)

/** 获得默认表单数据 */
function getDefaultFormData(): ProjectTemplateApi.PmsProjectTemplateVO {
  const projectType = PmsProjectType.GENERAL
  return {
    id: undefined,
    name: '',
    description: '',
    projectType,
    status: CommonStatusEnum.ENABLE,
    sort: 0,
    ...getDefaultCollaborationConfig(projectType)
  }
}

/** 获得项目类型对应的默认协作配置 */
function getDefaultCollaborationConfig(projectType: number) {
  const itemTypes =
    projectType === PmsProjectType.AGILE
      ? [PmsWorkItemType.REQUIREMENT, PmsWorkItemType.TASK, PmsWorkItemType.DEFECT]
      : [PmsWorkItemType.TASK]
  const configs = itemTypes.map((workItemType) => getDefaultWorkItemTypeConfig(workItemType))
  const statuses = configs.flatMap((config) => config.statuses)
  const boards = configs.flatMap((config) => config.boards)
  return { itemTypes, statuses, boards }
}

/** 获得单个事项类型的默认状态和看板 */
function getDefaultWorkItemTypeConfig(workItemType: number) {
  const prefix = getWorkItemTypeCode(workItemType)
  return {
    statuses: [
      createStatus(
        `${prefix}_todo`,
        '待处理',
        workItemType,
        PmsWorkItemStatusType.PENDING,
        true,
        10
      ),
      createStatus(
        `${prefix}_doing`,
        '进行中',
        workItemType,
        PmsWorkItemStatusType.PROCESSING,
        false,
        20
      ),
      createStatus(
        `${prefix}_done`,
        '已完成',
        workItemType,
        PmsWorkItemStatusType.COMPLETED,
        false,
        30
      )
    ],
    boards: [
      createBoard(`${prefix}_todo`, '待处理', workItemType, 10, [`${prefix}_todo`]),
      createBoard(`${prefix}_doing`, '进行中', workItemType, 20, [`${prefix}_doing`]),
      createBoard(`${prefix}_done`, '已完成', workItemType, 30, [`${prefix}_done`])
    ]
  }
}

/** 创建默认状态 */
function createStatus(
  code: string,
  name: string,
  workItemType: number,
  statusType: number,
  defaultStatus: boolean,
  sort: number
): ProjectTemplateApi.PmsProjectTemplateStatusVO {
  return { code, name, workItemType, statusType, defaultStatus, sort, boardCode: code }
}

/** 创建默认看板列 */
function createBoard(
  code: string,
  name: string,
  workItemType: number,
  sort: number,
  statusCodes: string[]
): ProjectTemplateApi.PmsProjectTemplateBoardVO {
  return { code, name, workItemType, sort, statusCodes }
}
</script>
