<template>
  <div
    class="w-320px flex flex-shrink-0 flex-col overflow-hidden rounded-6px border border-[var(--el-border-color-light)] border-solid"
  >
    <!-- 工具栏 -->
    <div
      class="flex items-center justify-between px-10px py-8px border-b border-b-[var(--el-border-color-lighter)] border-b-solid"
    >
      <span class="font-600">文件</span>
      <el-button-group>
        <el-tooltip content="新建文件" placement="top">
          <el-button v-hasPermi="['ai1:skill:update']" @click="handleCreate(false)">
            <Icon icon="ep:document-add" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="新建目录" placement="top">
          <el-button v-hasPermi="['ai1:skill:update']" @click="handleCreate(true)">
            <Icon icon="ep:folder-add" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="重命名" placement="top">
          <el-button
            :disabled="!selectedNode || selectedNode.locked"
            v-hasPermi="['ai1:skill:update']"
            @click="handleRename"
          >
            <Icon icon="ep:edit" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="删除" placement="top">
          <el-button
            :disabled="!selectedNode || selectedNode.locked"
            v-hasPermi="['ai1:skill:delete']"
            @click="handleDelete"
          >
            <Icon icon="ep:delete" />
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>
    <!-- 文件树 -->
    <div
      v-loading="loading"
      class="max-h-[calc(100vh-260px)] min-h-420px flex-1 overflow-auto px-6px py-8px"
    >
      <el-tree
        ref="treeRef"
        :data="treeData"
        node-key="id"
        :props="{ children: 'children', label: 'name' }"
        default-expand-all
        :expand-on-click-node="false"
        highlight-current
        :draggable="hasUpdatePermission"
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        @node-click="handleNodeClick"
        @node-drop="handleNodeDrop"
      >
        <template #default="{ data }">
          <span class="w-full flex items-center gap-4px overflow-hidden">
            <Icon :icon="isDirectory(data) ? 'ep:folder' : 'ep:document'" />
            <span class="truncate">{{ data.name }}</span>
            <el-tooltip v-if="data.locked" content="固定文件/目录不可删除、改名或移动">
              <Icon icon="ep:lock" class="ml-auto mr-8px text-[var(--el-color-warning)]" />
            </el-tooltip>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { AllowDropFunction, AllowDropType, NodeDropType, TreeInstance } from 'element-plus'
import { checkPermi } from '@/utils/permission'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import { SkillFileApi, SkillFile } from '@/api/ai1/skill'
import { Ai1SkillFileTypeEnum } from '@/views/ai1/utils/constants'

/** AI1 SKILL 文件树 */
defineOptions({ name: 'Ai1SkillFileTree' })

const props = defineProps<{
  skillId: number // SKILL 编号
}>()
const emit = defineEmits<{
  select: [node?: SkillFile] // 选中节点
}>()

/** el-tree 节点类型 */
type TreeNode = Parameters<AllowDropFunction>[1]

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const treeRef = ref<TreeInstance>() // 树组件 Ref
const loading = ref(false) // 树的加载中
const treeData = ref<SkillFile[]>([]) // 树的数据
const selectedNode = ref<SkillFile>() // 当前选中的节点
const hasUpdatePermission = checkPermi(['ai1:skill:update']) // 是否有修改权限

/** 是否为目录节点 */
const isDirectory = (node: SkillFile) => node.type === Ai1SkillFileTypeEnum.DIRECTORY

/** 查找节点 */
const findNode = (nodes: SkillFile[], id: number): SkillFile | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const child = node.children ? findNode(node.children, id) : undefined
    if (child) {
      return child
    }
  }
  return undefined
}

/** 加载文件树 */
const loadTree = async () => {
  loading.value = true
  try {
    const list = await SkillFileApi.getSkillFileList(props.skillId)
    treeData.value = handleTree(list)
  } finally {
    loading.value = false
  }
  const selectedId = selectedNode.value?.id
  selectedNode.value = selectedId ? findNode(treeData.value, selectedId) : undefined
  emit('select', selectedNode.value)
  await nextTick()
  treeRef.value?.setCurrentKey(selectedNode.value?.id)
}

/** 点击节点 */
const handleNodeClick = (data: SkillFile) => {
  selectedNode.value = data
  emit('select', data)
}

// ==================== 拖拽移动 ====================

/** 固定节点不可拖拽 */
const allowDrag = (node: TreeNode) => !node.data.locked

/** 是否允许放置：拖入内部时，目标必须是目录 */
const allowDrop = (_draggingNode: TreeNode, dropNode: TreeNode, type: AllowDropType) => {
  return type !== 'inner' || isDirectory(dropNode.data as SkillFile)
}

/** 拖拽完成 */
const handleNodeDrop = async (
  draggingNode: TreeNode,
  dropNode: TreeNode,
  dropType: NodeDropType
) => {
  const dragging = draggingNode.data as SkillFile
  // 计算新的父目录
  const parentId =
    dropType === 'inner'
      ? (dropNode.data as SkillFile).id
      : dropNode.level > 1 && dropNode.parent
        ? (dropNode.parent.data as SkillFile).id
        : 0
  if (parentId === dragging.parentId) {
    await loadTree()
    return
  }
  try {
    await SkillFileApi.moveSkillFile({ id: dragging.id, parentId })
    message.success('移动成功')
  } finally {
    // 刷新文件树
    await loadTree()
  }
}

// ==================== 新建 / 重命名 / 删除 ====================

/** 新建文件或目录 */
const handleCreate = async (directory: boolean) => {
  const node = selectedNode.value
  const parentId = node ? (isDirectory(node) ? node.id : node.parentId) : 0
  try {
    // 输入名称
    const { value } = await ElMessageBox.prompt(
      directory ? '请输入目录名称' : '请输入文件名（含扩展名，如 guide.md）',
      directory ? '新建目录' : '新建文件',
      { inputPattern: /\S/, inputErrorMessage: '名称不能为空' }
    )
    // 发起新建
    await SkillFileApi.createSkillFile({
      skillId: props.skillId,
      parentId,
      name: value.trim(),
      type: directory ? Ai1SkillFileTypeEnum.DIRECTORY : Ai1SkillFileTypeEnum.FILE
    })
    message.success(t('common.createSuccess'))
    // 刷新文件树
    await loadTree()
  } catch {}
}

/** 重命名 */
const handleRename = async () => {
  const node = selectedNode.value
  if (!node || node.locked) {
    return
  }
  try {
    // 输入新名称
    const { value } = await ElMessageBox.prompt('请输入新的名称', '重命名', {
      inputValue: node.name,
      inputPattern: /\S/,
      inputErrorMessage: '名称不能为空'
    })
    // 发起重命名
    await SkillFileApi.renameSkillFile({ id: node.id, name: value.trim() })
    message.success(t('common.updateSuccess'))
    // 刷新文件树
    await loadTree()
  } catch {}
}

/** 删除 */
const handleDelete = async () => {
  const node = selectedNode.value
  if (!node || node.locked) {
    return
  }
  const label = getDictLabel(DICT_TYPE.AI1_SKILL_FILE_TYPE, node.type)
  try {
    // 删除的二次确认
    await message.delConfirm(`是否确认删除${label}"${node.name}"？（目录将递归删除其全部内容）`)
    // 发起删除
    await SkillFileApi.deleteSkillFile(node.id)
    message.success(t('common.delSuccess'))
    // 刷新文件树
    await loadTree()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  loadTree()
})
</script>
