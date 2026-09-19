<template>
  <Dialog
    v-model="dialogVisible"
    :title="`移动${contentKind === 'folder' ? '文件夹' : '文档'}`"
    width="560px"
  >
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="当前内容">
        <el-input :model-value="contentTitle" disabled />
      </el-form-item>
      <el-form-item label="目标知识库" prop="targetLibraryId">
        <KnowledgeLibrarySelect
          v-model="formData.targetLibraryId"
          class="!w-100%"
          placeholder="请选择目标知识库"
          @change="loadTargetTree"
        />
      </el-form-item>
      <el-form-item label="目标位置" prop="targetKey">
        <el-tree-select
          v-model="formData.targetKey"
          class="!w-100%"
          check-strictly
          :data="targetOptions"
          default-expand-all
          node-key="value"
          placeholder="请选择目标位置"
          :props="{ label: 'label', children: 'children', disabled: 'disabled' }"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="loading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentApi from '@/api/pms/kb/content/document'
import * as KnowledgeFolderApi from '@/api/pms/kb/content/folder'
import KnowledgeLibrarySelect from '@/views/pms/kb/library/components/KnowledgeLibrarySelect.vue'
import { PmsKnowledgeRootId } from '@/views/pms/kb/utils/constants'
import { canManageKnowledgeContent } from '@/views/pms/kb/utils/permission'

defineOptions({ name: 'PmsKnowledgeContentMoveDialog' })

interface TargetOption {
  value: string
  label: string
  kind: 'root' | 'folder' | 'document'
  entityId: number
  folderId: number
  disabled?: boolean
  children: TargetOption[]
}

const message = useMessage() // 消息弹窗
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const dialogVisible = ref(false) // 弹窗是否显示
const loading = ref(false) // 数据加载和提交中
const contentKind = ref<'folder' | 'document'>('document') // 内容类型
const contentId = ref(0) // 内容编号
const contentTitle = ref('') // 内容标题
const sourceLibraryId = ref(0) // 源知识库编号
const sourceParentId = ref(0) // 源父文件夹或父文档编号
const sourceFolderId = ref(0) // 源文档所属文件夹编号
const targetTree = ref<KnowledgeFolderApi.PmsKnowledgeTreeVO>() // 目标知识库目录树
const formData = reactive({
  targetLibraryId: undefined as number | undefined,
  targetKey: ''
}) // 表单数据
const formRules = reactive({
  targetLibraryId: [{ required: true, message: '请选择目标知识库', trigger: 'change' }],
  targetKey: [{ required: true, message: '请选择目标位置', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref

// 内容移动目标选项
const targetOptions = computed<TargetOption[]>(() => {
  if (!targetTree.value) return []
  const root: TargetOption = {
    value: 'root',
    label: '知识库根目录',
    kind: 'root',
    entityId: PmsKnowledgeRootId,
    folderId: PmsKnowledgeRootId,
    disabled: !targetTree.value.manageStatus,
    children: [
      ...targetTree.value.folders.map(buildFolderOption),
      ...(contentKind.value === 'document'
        ? targetTree.value.documents.map((document) => buildDocumentOption(document, 0))
        : [])
    ]
  }
  return [root]
})

/** 打开弹窗 */
async function open(
  kind: 'folder' | 'document',
  content: KnowledgeFolderApi.PmsKnowledgeFolderVO | KnowledgeDocumentApi.PmsKnowledgeDocumentVO
) {
  // 1. 初始化待移动内容
  dialogVisible.value = true
  contentKind.value = kind
  contentId.value = content.id
  contentTitle.value = content.title
  sourceLibraryId.value = content.libraryId
  sourceParentId.value = content.parentId
  sourceFolderId.value =
    kind === 'document'
      ? (content as KnowledgeDocumentApi.PmsKnowledgeDocumentVO).folderId
      : PmsKnowledgeRootId

  // 2. 重置目标位置表单
  formData.targetLibraryId = content.libraryId
  formData.targetKey = ''
  formRef.value?.resetFields()

  // 3. 加载目标知识库目录树
  loading.value = true
  try {
    await loadTargetTree()
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 加载目标目录树 */
async function loadTargetTree() {
  formData.targetKey = ''
  if (!formData.targetLibraryId) {
    targetTree.value = undefined
    return
  }
  targetTree.value = await KnowledgeFolderApi.getKnowledgeTree(formData.targetLibraryId)
}

/** 构建文件夹选项 */
function buildFolderOption(folder: KnowledgeFolderApi.PmsKnowledgeFolderTreeNode): TargetOption {
  const isSourceOrDescendant =
    contentKind.value === 'folder' &&
    formData.targetLibraryId === sourceLibraryId.value &&
    isSourceFolderOrDescendant(folder.id)
  return {
    value: `folder-${folder.id}`,
    label: folder.title,
    kind: 'folder',
    entityId: folder.id,
    folderId: folder.id,
    disabled: !canManageKnowledgeContent(folder.currentUserLevel) || isSourceOrDescendant,
    children: [
      ...folder.children.map(buildFolderOption),
      ...(contentKind.value === 'document'
        ? folder.documents.map((document) => buildDocumentOption(document, folder.id))
        : [])
    ]
  }
}

/** 构建文档选项 */
function buildDocumentOption(
  document: KnowledgeDocumentApi.PmsKnowledgeDocumentTreeNode,
  folderId: number
): TargetOption {
  const isSourceOrDescendant =
    formData.targetLibraryId === sourceLibraryId.value && isSourceDocumentOrDescendant(document.id)
  return {
    value: `document-${document.id}`,
    label: document.title,
    kind: 'document',
    entityId: document.id,
    folderId,
    disabled: !canManageKnowledgeContent(document.currentUserLevel) || isSourceOrDescendant,
    children: document.children.map((child) => buildDocumentOption(child, folderId))
  }
}

/** 判断目录树是否包含文件夹 */
function containsFolder(
  folder: KnowledgeFolderApi.PmsKnowledgeFolderTreeNode,
  id: number
): boolean {
  return folder.id === id || folder.children.some((child) => containsFolder(child, id))
}

/** 查找文件夹 */
function findFolder(
  folders: KnowledgeFolderApi.PmsKnowledgeFolderTreeNode[],
  id: number
): KnowledgeFolderApi.PmsKnowledgeFolderTreeNode | undefined {
  for (const folder of folders) {
    if (folder.id === id) return folder
    const child = findFolder(folder.children, id)
    if (child) return child
  }
  return undefined
}

/** 判断是否为源文件夹或其子文件夹 */
function isSourceFolderOrDescendant(targetId: number) {
  const sourceFolder = findFolder(targetTree.value?.folders || [], contentId.value)
  return sourceFolder ? containsFolder(sourceFolder, targetId) : false
}

/** 判断目录树是否包含文档 */
function containsDocument(
  document: KnowledgeDocumentApi.PmsKnowledgeDocumentTreeNode,
  id: number
): boolean {
  return document.id === id || document.children.some((child) => containsDocument(child, id))
}

/** 查找文档 */
function findDocument(
  documents: KnowledgeDocumentApi.PmsKnowledgeDocumentTreeNode[],
  id: number
): KnowledgeDocumentApi.PmsKnowledgeDocumentTreeNode | undefined {
  for (const document of documents) {
    if (document.id === id) return document
    const child = findDocument(document.children, id)
    if (child) return child
  }
  return undefined
}

/** 判断是否为源文档或其子文档 */
function isSourceDocumentOrDescendant(targetId: number) {
  const documents = [
    ...(targetTree.value?.documents || []),
    ...(targetTree.value?.folders.flatMap((folder) => collectFolderDocuments(folder)) || [])
  ]
  const sourceDocument = findDocument(documents, contentId.value)
  return sourceDocument ? containsDocument(sourceDocument, targetId) : false
}

/** 收集文件夹中的文档 */
function collectFolderDocuments(
  folder: KnowledgeFolderApi.PmsKnowledgeFolderTreeNode
): KnowledgeDocumentApi.PmsKnowledgeDocumentTreeNode[] {
  return [...folder.documents, ...folder.children.flatMap(collectFolderDocuments)]
}

/** 查找目标选项 */
function findTargetOption(options: TargetOption[], value: string): TargetOption | undefined {
  for (const option of options) {
    if (option.value === value) return option
    const child = findTargetOption(option.children, value)
    if (child) return child
  }
  return undefined
}

/** 提交表单 */
async function submitForm() {
  // 1.1 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  const target = findTargetOption(targetOptions.value, formData.targetKey)
  if (!target || !formData.targetLibraryId) return
  // 1.2 校验目标位置可编辑
  if (target.disabled) {
    message.warning('当前账号不能移动到该位置')
    return
  }
  loading.value = true
  try {
    // 3. 根据内容类型发起移动请求
    if (contentKind.value === 'folder') {
      if (
        formData.targetLibraryId === sourceLibraryId.value &&
        target.entityId === sourceParentId.value
      ) {
        message.warning('内容已在当前目录')
        return
      }
      await KnowledgeFolderApi.moveKnowledgeFolder({
        id: contentId.value,
        targetLibraryId: formData.targetLibraryId,
        targetParentId: target.entityId
      })
    } else {
      const targetFolderId = target.kind === 'folder' ? target.entityId : target.folderId
      const targetParentId = target.kind === 'document' ? target.entityId : PmsKnowledgeRootId
      if (
        formData.targetLibraryId === sourceLibraryId.value &&
        targetFolderId === sourceFolderId.value &&
        targetParentId === sourceParentId.value
      ) {
        message.warning('内容已在当前目录')
        return
      }
      await KnowledgeDocumentApi.moveKnowledgeDocument({
        id: contentId.value,
        targetLibraryId: formData.targetLibraryId,
        targetFolderId,
        targetParentId
      })
    }
    // 3. 关闭弹窗并通知父组件刷新
    message.success('移动成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
