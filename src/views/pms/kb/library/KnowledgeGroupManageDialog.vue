<template>
  <!-- 知识库分组管理弹窗 -->
  <Dialog v-model="dialogVisible" title="管理知识库分组" width="720px">
    <div class="mb-16px flex justify-between">
      <span class="text-13px text-[var(--el-text-color-secondary)]">
        知识库分组是个人视图，不会影响其他成员
      </span>
      <el-button
        v-hasPermi="['pms:kb:library:create']"
        type="primary"
        @click="groupFormRef?.open('create')"
      >
        新增分组
      </el-button>
    </div>
    <!-- 分组列表 -->
    <el-table ref="tableRef" v-loading="loading" :data="groupList" row-key="id">
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
      <el-table-column align="center" label="操作" width="140">
        <template #default="scope">
          <template v-if="scope.row.type === PmsKnowledgeGroupType.CUSTOM">
            <el-button
              v-hasPermi="['pms:kb:library:update']"
              link
              type="primary"
              @click="groupFormRef?.open('update', scope.row.id)"
            >
              编辑
            </el-button>
            <el-popconfirm
              v-hasPermi="['pms:kb:library:delete']"
              cancel-button-text="取消"
              confirm-button-text="确定"
              :title="`确认删除分组“${scope.row.name}”吗？知识库会回到未分组。`"
              width="260"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button
        v-hasPermi="['pms:kb:library:update']"
        :disabled="loading"
        type="primary"
        @click="handleSaveSort"
      >
        保存排序
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>

  <!-- 新增或修改知识库分组 -->
  <KnowledgeGroupForm ref="groupFormRef" @success="handleGroupChanged" />
</template>

<script lang="ts" setup>
import Sortable from 'sortablejs'
import * as KnowledgeGroupApi from '@/api/pms/kb/library/group'
import KnowledgeGroupForm from './KnowledgeGroupForm.vue'
import { PmsKnowledgeGroupType } from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeGroupManageDialog' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const loading = ref(false) // 列表加载中
const groupList = ref<KnowledgeGroupApi.PmsKnowledgeGroupVO[]>([]) // 分组列表
const tableRef = ref() // 表格 Ref
const groupFormRef = ref<InstanceType<typeof KnowledgeGroupForm>>() // 分组表单 Ref
let sortable: Sortable | undefined // 表格拖拽实例
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open() {
  dialogVisible.value = true
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    groupList.value = await KnowledgeGroupApi.getKnowledgeGroupList()
    await nextTick()
    initSortable()
  } finally {
    loading.value = false
  }
}

/** 初始化表格拖拽排序 */
function initSortable() {
  sortable?.destroy()
  const tableBody = tableRef.value?.$el.querySelector('.el-table__body-wrapper tbody')
  if (!tableBody) return
  sortable = Sortable.create(tableBody, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: ({ newIndex, oldIndex }) => {
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
      groupList.value.splice(newIndex, 0, groupList.value.splice(oldIndex, 1)[0])
    }
  })
}

/** 保存分组排序 */
async function handleSaveSort() {
  loading.value = true
  try {
    await KnowledgeGroupApi.updateKnowledgeGroupSort(
      groupList.value.map((group, index) => ({ id: group.id!, sort: index }))
    )
    message.success('排序保存成功')
    // 发送操作成功的事件
    emit('success')
    await getList()
  } finally {
    loading.value = false
  }
}

/** 删除知识库分组 */
async function handleDelete(group: KnowledgeGroupApi.PmsKnowledgeGroupVO) {
  // 发起删除
  await KnowledgeGroupApi.deleteKnowledgeGroup(group.id!)
  message.success('删除成功')
  // 刷新列表
  emit('success')
  await getList()
}

/** 处理分组数据变化 */
async function handleGroupChanged() {
  emit('success')
  await getList()
}

onBeforeUnmount(() => sortable?.destroy())
</script>
