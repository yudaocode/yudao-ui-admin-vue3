<template>
  <Dialog v-model="dialogVisible" title="管理分组" width="760px" @closed="handleClosed">
    <!-- 分组说明与操作 -->
    <div class="mb-16px flex items-center justify-between">
      <div class="text-13px text-[var(--el-text-color-secondary)]">
        项目分组是个人视图，不会影响其他项目成员
      </div>
      <el-button
        v-hasPermi="['pms:pm:project-group:create']"
        plain
        type="primary"
        @click="openForm('create')"
      >
        新增分组
      </el-button>
    </div>

    <!-- 分组列表 -->
    <el-table ref="tableRef" v-loading="loading" :data="groupList" max-height="440" row-key="id">
      <el-table-column align="center" width="60">
        <template #default>
          <el-tooltip content="拖动排序" placement="top">
            <Icon
              class="drag-handle cursor-move text-[var(--el-text-color-secondary)]"
              icon="ep:rank"
            />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="分组名称" min-width="220" prop="name" />
      <el-table-column align="center" label="分组类型" width="130">
        <template #default="scope">{{ getProjectGroupTypeName(scope.row.type) }}</template>
      </el-table-column>
      <el-table-column align="center" label="项目数量" prop="projectCount" width="130" />
      <el-table-column align="center" label="操作" width="140">
        <template #default="scope">
          <template v-if="scope.row.type === PmsProjectGroupType.CUSTOM">
            <el-button
              v-hasPermi="['pms:pm:project-group:update']"
              link
              type="primary"
              @click="openForm('update', scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPermi="['pms:pm:project-group:delete']"
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button
        v-hasPermi="['pms:pm:project-group:update']"
        :disabled="!sortChanged"
        :loading="sortLoading"
        type="primary"
        @click="handleSaveSort"
      >
        保存排序
      </el-button>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </Dialog>

  <!-- 新建或修改项目分组 -->
  <ProjectGroupForm ref="formRef" @success="handleGroupChanged" />
</template>
<script lang="ts" setup>
import Sortable from 'sortablejs'
import { checkPermi } from '@/utils/permission'
import * as ProjectGroupApi from '@/api/pms/pm/project/group'
import { PmsProjectGroupType } from '@/views/pms/pm/utils/constants'
import { getProjectGroupTypeName } from '@/views/pms/pm/utils/format'
import ProjectGroupForm from './ProjectGroupForm.vue'

defineOptions({ name: 'PmsProjectGroupList' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(true) // 列表的加载中
const sortLoading = ref(false) // 保存排序的加载中
const sortChanged = ref(false) // 分组排序是否发生变化
const groupList = ref<ProjectGroupApi.PmsProjectGroupVO[]>([]) // 项目分组列表
const tableRef = ref() // 表格 Ref
const formRef = ref<InstanceType<typeof ProjectGroupForm>>() // 项目分组表单 Ref
let sortable: Sortable | undefined // 表格拖拽实例

/** 打开弹窗 */
function open() {
  dialogVisible.value = true
  getGroupList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询项目分组列表 */
async function getGroupList() {
  loading.value = true
  try {
    groupList.value = await ProjectGroupApi.getProjectGroupList()
    sortChanged.value = false
    await nextTick()
    initSortable()
  } finally {
    loading.value = false
  }
}

/** 项目分组发生变化 */
async function handleGroupChanged() {
  await getGroupList()
  emit('success')
}

/** 打开项目分组表单 */
function openForm(type: string, group?: ProjectGroupApi.PmsProjectGroupVO) {
  formRef.value?.open(type, group)
}

/** 初始化表格拖拽排序 */
function initSortable() {
  sortable?.destroy()
  const tableBody = tableRef.value?.$el.querySelector('.el-table__body-wrapper tbody')
  if (!tableBody) return
  sortable = Sortable.create(tableBody, {
    animation: 150,
    disabled: !checkPermi(['pms:pm:project-group:update']),
    handle: '.drag-handle',
    onEnd: ({ newIndex, oldIndex }) => {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      groupList.value.splice(newIndex, 0, groupList.value.splice(oldIndex, 1)[0])
      sortChanged.value = true
    }
  })
}

/** 保存排序按钮操作 */
async function handleSaveSort() {
  sortLoading.value = true
  try {
    // 提交项目分组排序
    await ProjectGroupApi.updateProjectGroupSort(
      groupList.value.map((group, index) => ({ id: group.id!, sort: index }))
    )
    // 提示成功并关闭弹窗
    message.success('保存排序成功')
    emit('success')
    dialogVisible.value = false
  } finally {
    sortLoading.value = false
  }
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProjectGroupApi.deleteProjectGroup(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getGroupList()
    emit('success')
  } catch {}
}

/** 弹窗关闭后销毁拖拽实例 */
function handleClosed() {
  sortable?.destroy()
  sortable = undefined
}

/** 销毁 */
onBeforeUnmount(() => sortable?.destroy())

const emit = defineEmits(['success']) // 定义 success 事件，用于项目分组发生变化后的回调
</script>
