<template>
  <el-divider v-if="showTitle" content-position="left">子工作项</el-divider>
  <!-- 快速创建 -->
  <div v-if="editable" class="mb-12px flex gap-8px">
    <el-input
      v-model="newSubtaskName"
      maxlength="100"
      placeholder="输入子工作项标题，按回车保存"
      @keyup.enter="handleCreate"
    />
    <el-button :loading="creating" type="primary" @click="handleCreate">添加</el-button>
  </div>
  <!-- 子工作项列表 -->
  <el-table v-loading="loading" :data="subtaskList" size="small">
    <el-table-column align="center" label="完成" width="64">
      <template #default="scope">
        <el-checkbox
          :disabled="!editable || statusSavingId === scope.row.id"
          :model-value="scope.row.status === PmsWorkItemStatusType.COMPLETED"
          @change="handleStatusChange(scope.row, $event === true)"
        />
      </template>
    </el-table-column>
    <el-table-column label="标题" min-width="240">
      <template #default="scope">
        <div v-if="editingId === scope.row.id" class="flex gap-8px">
          <el-input
            v-model="editingName"
            maxlength="100"
            size="small"
            @keyup.enter="handleRename(scope.row)"
          />
          <el-button link type="primary" @click="handleRename(scope.row)">保存</el-button>
          <el-button link @click="editingId = undefined">取消</el-button>
        </div>
        <span v-else>{{ scope.row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="状态" prop="statusName" width="120" />
    <el-table-column label="负责人" prop="assigneeUserName" width="110" />
    <el-table-column v-if="editable" align="center" label="操作" width="120">
      <template #default="scope">
        <el-button link type="primary" @click="startRename(scope.row)">改名</el-button>
        <el-popconfirm
          cancel-button-text="取消"
          confirm-button-text="确定"
          :title="`确认删除子工作项“${scope.row.name}”吗？删除后可在回收站恢复。`"
          width="280"
          @confirm="handleRecycle(scope.row)"
        >
          <template #reference><el-button link type="danger">删除</el-button></template>
        </el-popconfirm>
      </template>
    </el-table-column>
  </el-table>
  <el-empty
    v-if="!loading && subtaskList.length === 0"
    :image-size="56"
    description="暂无子工作项"
  />
</template>

<script lang="ts" setup>
import * as WorkItemApi from '@/api/pms/pm/workitem'
import * as WorkItemStatusApi from '@/api/pms/pm/workitem/status'
import { PmsWorkItemLifecycleStatus, PmsWorkItemStatusType } from '@/views/pms/pm/utils/constants'
import { getAllPageItems } from '@/utils/page'

defineOptions({ name: 'PmsWorkItemSubtaskList' })

const props = withDefaults(
  defineProps<{
    parentWorkItem: WorkItemApi.PmsWorkItemVO
    editable: boolean
    showTitle?: boolean
  }>(),
  { showTitle: true }
)
const emit = defineEmits<{ changed: [] }>() // 定义 changed 事件，用于子工作项变化后的回调

const message = useMessage() // 消息弹窗
const loading = ref(false) // 子工作项列表加载中
const creating = ref(false) // 子工作项创建中
const statusSavingId = ref<number>() // 正在更新状态的子工作项编号
const subtaskList = ref<WorkItemApi.PmsWorkItemVO[]>([]) // 子工作项列表
const statusList = ref<WorkItemStatusApi.PmsWorkItemStatusVO[]>([]) // 工作项状态列表
const newSubtaskName = ref('') // 新子工作项标题
const editingId = ref<number>() // 正在改名的子工作项编号
const editingName = ref('') // 正在编辑的子工作项标题

/** 查询子工作项列表 */
async function getSubtaskList() {
  loading.value = true
  try {
    const params = {
      projectId: props.parentWorkItem.projectId,
      type: props.parentWorkItem.type,
      lifecycleStatus: PmsWorkItemLifecycleStatus.ACTIVE,
      parentId: props.parentWorkItem.id
    }
    // 并行加载页面所需数据
    const [page, fetchedStatuses] = await Promise.all([
      getAllPageItems<WorkItemApi.PmsWorkItemVO>((pageNo, pageSize) =>
        WorkItemApi.getWorkItemPage({ ...params, pageNo, pageSize })
      ),
      WorkItemStatusApi.getWorkItemStatusList(
        props.parentWorkItem.projectId,
        props.parentWorkItem.type
      )
    ])
    subtaskList.value = page
    statusList.value = fetchedStatuses
  } finally {
    loading.value = false
  }
}

/** 创建子工作项 */
async function handleCreate() {
  // 校验子工作项标题
  const name = newSubtaskName.value.trim()
  if (!name) {
    message.warning('请输入子工作项标题')
    return
  }
  // 继承父工作项的核心属性并创建子工作项
  creating.value = true
  try {
    const data: WorkItemApi.PmsWorkItemVO = {
      projectId: props.parentWorkItem.projectId,
      type: props.parentWorkItem.type,
      name,
      priority: props.parentWorkItem.priority,
      assigneeUserId: props.parentWorkItem.assigneeUserId,
      memberUserIds: props.parentWorkItem.memberUserIds,
      iterationId: props.parentWorkItem.iterationId,
      parentId: props.parentWorkItem.id,
      relatedRequirementId: props.parentWorkItem.relatedRequirementId,
      defectType: props.parentWorkItem.defectType,
      progress: 0,
      fileUrls: [],
      labelIds: []
    }
    await WorkItemApi.createWorkItem(data)
    // 清空输入并刷新子工作项列表
    newSubtaskName.value = ''
    message.success('子工作项创建成功')
    await getSubtaskList()
    emit('changed')
  } finally {
    creating.value = false
  }
}

/** 开始重命名 */
function startRename(workItem: WorkItemApi.PmsWorkItemVO) {
  editingId.value = workItem.id
  editingName.value = workItem.name
}

/** 提交重命名 */
async function handleRename(workItem: WorkItemApi.PmsWorkItemVO) {
  // 校验子工作项标题
  const name = editingName.value.trim()
  if (!name) {
    message.warning('请输入子工作项标题')
    return
  }
  // 更新标题并刷新列表
  await WorkItemApi.updateWorkItemName(workItem.id!, name)
  editingId.value = undefined
  message.success('子工作项名称已更新')
  await getSubtaskList()
  emit('changed')
}

/** 切换工作项状态 */
async function handleStatusChange(workItem: WorkItemApi.PmsWorkItemVO, completed: boolean) {
  // 查找目标语义对应的项目状态
  const targetType = completed ? PmsWorkItemStatusType.COMPLETED : PmsWorkItemStatusType.PENDING
  const targetStatus = statusList.value.find((status) => status.statusType === targetType)
  if (!targetStatus) {
    message.warning(completed ? '请先配置已完成状态' : '请先配置未开始状态')
    return
  }
  // 更新状态并刷新列表
  statusSavingId.value = workItem.id
  try {
    await WorkItemApi.updateWorkItemStatus(workItem.id!, targetStatus.id)
    await getSubtaskList()
    emit('changed')
  } finally {
    statusSavingId.value = undefined
  }
}

/** 移入回收站 */
async function handleRecycle(workItem: WorkItemApi.PmsWorkItemVO) {
  await WorkItemApi.recycleWorkItem(workItem.id!)
  message.success('子工作项已移入回收站')
  await getSubtaskList()
  emit('changed')
}

/** 监听父工作项变化并刷新子工作项 */
watch(
  () => props.parentWorkItem.id,
  () => getSubtaskList(),
  { immediate: true }
)
</script>
