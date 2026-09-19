<template>
  <doc-alert title="【PMS】文档与协作" url="https://doc.iocoder.cn/pms/kb/document/" />

  <!-- 知识库工作区 -->
  <div
    v-loading="loading"
    class="knowledge-library-workspace grid min-h-[calc(100vh-120px)] grid-cols-[240px_minmax(0,1fr)] gap-16px max-[900px]:grid-cols-1"
  >
    <!-- 左侧导航与目录 -->
    <ContentWrap :body-style="{ padding: '0' }" class="!mb-0">
      <KnowledgeLibrarySidebar
        :active-view="activeView"
        :can-create-document="canCreateDocument"
        :can-create-folder="canCreateFolder"
        :current-node-key="currentNodeKey"
        :tree-data="treeData"
        :write-status="Boolean(tree?.writeStatus)"
        @create="handleCreateCommand"
        @home="handleHome"
        @node-click="handleNodeClick"
        @node-action="handleNodeAction"
        @recycle="handleRecycle"
      />
    </ContentWrap>

    <!-- 右侧业务内容 -->
    <ContentWrap :body-style="{ padding: '24px 32px' }" class="knowledge-library-main !mb-0">
      <KnowledgeRecyclePanel
        v-if="activeView === 'recycle'"
        :library-id="libraryId"
        @success="handleRecycleChanged"
      />
      <KnowledgeDocumentDetail
        v-else-if="activeView === 'document' && selectedDocument"
        :document="selectedDocument"
        :labels="selectedDocumentLabels"
        @collect="handleDocumentCollect"
        @delete="handleContentDeleted"
        @like="handleDocumentLike"
        @move="moveDialogRef?.open('document', selectedDocument)"
        @permission="permissionFormRef?.open(selectedDocument.permissionId)"
        @share="shareDialogRef?.open(selectedDocument.id)"
        @update="openDocumentUpdateForm"
      />
      <KnowledgeFolderDetail
        v-else-if="activeView === 'folder' && selectedFolder"
        :children="selectedFolderChildren"
        :folder="selectedFolder"
        @collect="handleFolderCollect"
        @delete="handleContentDeleted"
        @move="moveDialogRef?.open('folder', selectedFolder)"
        @node-click="handleNodeClick"
        @permission="permissionFormRef?.open(selectedFolder.permissionId)"
        @update="openFolderForm('update')"
      />
      <KnowledgeLibraryHome
        v-else
        :key="libraryId"
        :library="library"
        :tree-data="treeData"
        :favorite-items="favoriteItems"
        :favorite-loading="favoriteLoading"
        :write-status="Boolean(tree?.writeStatus)"
        @collect="handleLibraryCollect"
        @exit="handleExitLibrary"
        @member="memberFormRef?.open(libraryId)"
        @node-click="handleNodeClick"
        @search="handleLibrarySearch"
        @tab-change="handleLibraryTabChange"
      />
    </ContentWrap>
  </div>

  <!-- 内容管理弹窗 -->
  <KnowledgeFolderForm ref="folderFormRef" @success="handleContentChanged" />
  <KnowledgeDocumentCreateForm ref="documentCreateFormRef" @success="handleContentChanged" />
  <KnowledgeFileUploadForm ref="fileUploadFormRef" @success="handleContentChanged" />
  <KnowledgeDocumentUpdateForm ref="documentUpdateFormRef" @success="handleContentChanged" />
  <KnowledgeMemberForm ref="memberFormRef" @success="getPageData" />
  <KnowledgeDocumentShareDialog ref="shareDialogRef" />
  <KnowledgeContentPermissionForm ref="permissionFormRef" @success="handleContentChanged" />
  <KnowledgeContentMoveDialog ref="moveDialogRef" @success="handleMoveChanged" />
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentApi from '@/api/pms/kb/content/document'
import * as KnowledgeDocumentLabelApi from '@/api/pms/kb/content/document/label'
import * as KnowledgeFolderApi from '@/api/pms/kb/content/folder'
import * as KnowledgeFavoriteApi from '@/api/pms/kb/interaction/favorite'
import * as KnowledgeDocumentLikeApi from '@/api/pms/kb/interaction/like'
import * as KnowledgeLibraryApi from '@/api/pms/kb/library'
import * as KnowledgeLibraryMemberApi from '@/api/pms/kb/library/member'
import KnowledgeContentMoveDialog from './KnowledgeContentMoveDialog.vue'
import KnowledgeContentPermissionForm from './KnowledgeContentPermissionForm.vue'
import KnowledgeDocumentCreateForm from './KnowledgeDocumentCreateForm.vue'
import KnowledgeFileUploadForm from './KnowledgeFileUploadForm.vue'
import KnowledgeDocumentShareDialog from './KnowledgeDocumentShareDialog.vue'
import KnowledgeDocumentUpdateForm from './KnowledgeDocumentUpdateForm.vue'
import KnowledgeFolderForm from './KnowledgeFolderForm.vue'
import KnowledgeMemberForm from '../library/KnowledgeMemberForm.vue'
import KnowledgeDocumentDetail from './KnowledgeDocumentDetail.vue'
import KnowledgeFolderDetail from './KnowledgeFolderDetail.vue'
import KnowledgeLibraryHome from './KnowledgeLibraryHome.vue'
import KnowledgeLibrarySidebar from './KnowledgeLibrarySidebar.vue'
import KnowledgeRecyclePanel from './KnowledgeRecyclePanel.vue'
import type { KnowledgeContentView, KnowledgeTreeNode } from './types'
import { PmsKnowledgeObjectType, PmsKnowledgeRootId } from '@/views/pms/kb/utils/constants'
import { canEditKnowledgeContent } from '@/views/pms/kb/utils/permission'

defineOptions({ name: 'PmsKnowledgeLibraryDetail' })

const route = useRoute() // 当前路由
const router = useRouter() // 路由
const message = useMessage() // 消息弹窗
const libraryId = computed(() => Number(route.params.libraryId)) // 知识库编号
const loading = ref(false) // 页面加载中
const activeView = ref<KnowledgeContentView>('home') // 当前右侧内容
const library = ref<KnowledgeLibraryApi.PmsKnowledgeLibraryVO>() // 知识库详情
const tree = ref<KnowledgeFolderApi.PmsKnowledgeTreeVO>() // 目录树
const selectedFolder = ref<KnowledgeFolderApi.PmsKnowledgeFolderVO>() // 当前文件夹
const selectedDocument = ref<KnowledgeDocumentApi.PmsKnowledgeDocumentVO>() // 当前文档
const labelList = ref<KnowledgeDocumentLabelApi.PmsKnowledgeDocumentLabelVO[]>([]) // 文档标签列表
const favoriteItems = ref<KnowledgeFavoriteApi.PmsKnowledgeInteractionItemVO[]>([]) // 当前知识库关注内容
const favoriteLoading = ref(false) // 关注内容加载中
const favoriteTabActive = ref(false) // 是否正在查看关注页签
const folderFormRef = ref<InstanceType<typeof KnowledgeFolderForm>>() // 文件夹表单 Ref
const documentCreateFormRef = ref<InstanceType<typeof KnowledgeDocumentCreateForm>>() // 文档新增表单 Ref
const fileUploadFormRef = ref<InstanceType<typeof KnowledgeFileUploadForm>>() // 文件上传表单 Ref
const documentUpdateFormRef = ref<InstanceType<typeof KnowledgeDocumentUpdateForm>>() // 文档编辑表单 Ref
const memberFormRef = ref<InstanceType<typeof KnowledgeMemberForm>>() // 成员表单 Ref
const shareDialogRef = ref<InstanceType<typeof KnowledgeDocumentShareDialog>>() // 文档分享 Ref
const permissionFormRef = ref<InstanceType<typeof KnowledgeContentPermissionForm>>() // 内容协作权限 Ref
const moveDialogRef = ref<InstanceType<typeof KnowledgeContentMoveDialog>>() // 内容移动弹窗 Ref

const treeData = computed<KnowledgeTreeNode[]>(() => {
  if (!tree.value) return []
  return [
    ...tree.value.folders.map(buildFolderNode),
    ...tree.value.documents.map(buildDocumentNode)
  ]
}) // 目录树节点
const currentNodeKey = computed(() => {
  if (activeView.value === 'folder') return `folder-${selectedFolder.value?.id}`
  if (activeView.value === 'document') return `document-${selectedDocument.value?.id}`
  return undefined
}) // 当前目录节点标识
const selectedDocumentLabels = computed(() => {
  const labelIds = new Set(selectedDocument.value?.labelIds ?? [])
  return labelList.value.filter((label) => labelIds.has(label.id))
}) // 当前文档标签
const selectedFolderChildren = computed(() => {
  if (!selectedFolder.value) return []
  return findTreeNode(treeData.value, `folder-${selectedFolder.value.id}`)?.children ?? []
}) // 当前文件夹的直属内容
const canCreateFolder = computed(
  () =>
    Boolean(tree.value?.writeStatus) ||
    canEditKnowledgeContent(selectedFolder.value?.currentUserLevel)
) // 是否可新建文件夹
const canCreateDocument = computed(
  () =>
    Boolean(tree.value?.writeStatus) ||
    canEditKnowledgeContent(selectedFolder.value?.currentUserLevel) ||
    canEditKnowledgeContent(selectedDocument.value?.currentUserLevel)
) // 是否可新建文档

/** 查询知识库页面数据 */
async function getPageData() {
  loading.value = true
  try {
    // 并行加载页面所需数据
    const [libraryData, treeDataValue, fetchedLabels] = await Promise.all([
      KnowledgeLibraryApi.getKnowledgeLibrary(libraryId.value),
      KnowledgeFolderApi.getKnowledgeTree(libraryId.value),
      KnowledgeDocumentLabelApi.getKnowledgeDocumentLabelList()
    ])
    library.value = libraryData
    tree.value = treeDataValue
    labelList.value = fetchedLabels
    favoriteItems.value = []
    favoriteTabActive.value = false
    // 根据当前路由加载主页、文件夹或文档详情
    await getRouteContent()
  } finally {
    loading.value = false
  }
}

/** 根据路由加载知识库内容 */
async function getRouteContent() {
  // 切换知识库时，由页面数据查询统一加载内容
  if (library.value?.id !== libraryId.value) return
  // 打开指定文档
  const documentId = Number(route.params.documentId)
  if (Number.isFinite(documentId) && documentId > 0) {
    selectedDocument.value = await KnowledgeDocumentApi.getKnowledgeDocument(documentId, true)
    selectedFolder.value = undefined
    activeView.value = 'document'
    return
  }
  // 打开指定文件夹
  const folderId = Number(route.params.folderId)
  if (Number.isFinite(folderId) && folderId > 0) {
    selectedFolder.value = await KnowledgeFolderApi.getKnowledgeFolder(folderId, true)
    selectedDocument.value = undefined
    activeView.value = 'folder'
    return
  }
  // 默认打开知识库主页
  activeView.value = 'home'
  selectedFolder.value = undefined
  selectedDocument.value = undefined
}

/** 查询目录树 */
async function getTree() {
  tree.value = await KnowledgeFolderApi.getKnowledgeTree(libraryId.value)
}

/** 查询当前知识库的关注内容 */
async function getFavoriteItems() {
  favoriteLoading.value = true
  try {
    favoriteItems.value = await KnowledgeFavoriteApi.getKnowledgeFavoriteList(libraryId.value)
  } finally {
    favoriteLoading.value = false
  }
}

/** 切换知识库主页内容页签 */
async function handleLibraryTabChange(tab: 'all' | 'favorite') {
  favoriteTabActive.value = tab === 'favorite'
  if (favoriteTabActive.value) {
    await getFavoriteItems()
  }
}

/** 构建文件夹树节点 */
function buildFolderNode(folder: KnowledgeFolderApi.PmsKnowledgeFolderTreeNode): KnowledgeTreeNode {
  return {
    key: `folder-${folder.id}`,
    entityId: folder.id,
    kind: 'folder',
    label: folder.title,
    currentUserLevel: folder.currentUserLevel,
    children: [...folder.children.map(buildFolderNode), ...folder.documents.map(buildDocumentNode)]
  }
}

/** 构建文档树节点 */
function buildDocumentNode(
  document: KnowledgeDocumentApi.PmsKnowledgeDocumentTreeNode
): KnowledgeTreeNode {
  return {
    key: `document-${document.id}`,
    entityId: document.id,
    kind: 'document',
    label: document.title,
    currentUserLevel: document.currentUserLevel,
    type: document.type,
    children: document.children.map(buildDocumentNode)
  }
}

/** 打开目录节点 */
async function handleNodeClick(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') {
    await router.push(`/pms/kb/library/${libraryId.value}/folder/${node.entityId}`)
    return
  }
  await router.push(`/pms/kb/library/${libraryId.value}/document/${node.entityId}`)
}

/** 处理目录树节点快捷操作 */
async function handleNodeAction(node: KnowledgeTreeNode, command: string) {
  if (command === 'create-document' || command === 'create-folder' || command === 'upload') {
    if (command === 'create-document') {
      documentCreateFormRef.value?.open(libraryId.value, node.entityId, PmsKnowledgeRootId)
    } else if (command === 'create-folder') {
      folderFormRef.value?.open('create', libraryId.value, node.entityId)
    } else {
      fileUploadFormRef.value?.open(libraryId.value, node.entityId, PmsKnowledgeRootId)
    }
    return
  }
  if (node.kind === 'folder') {
    const folder = await KnowledgeFolderApi.getKnowledgeFolder(node.entityId)
    if (command === 'rename') {
      folderFormRef.value?.open('update', libraryId.value, folder.parentId, folder.id)
    } else if (command === 'move') {
      moveDialogRef.value?.open('folder', folder)
    } else if (command === 'delete') {
      await deleteFolder(folder)
    }
    return
  }
  const document = await KnowledgeDocumentApi.getKnowledgeDocument(node.entityId)
  if (command === 'rename') documentUpdateFormRef.value?.open(document.id)
  else if (command === 'move') moveDialogRef.value?.open('document', document)
  else if (command === 'delete') await deleteDocument(document)
}

/** 删除文件夹并刷新目录树 */
async function deleteFolder(folder: KnowledgeFolderApi.PmsKnowledgeFolderVO) {
  try {
    await message.delConfirm(`确认删除文件夹“${folder.title}”吗？`)
    await KnowledgeFolderApi.deleteKnowledgeFolder(folder.id)
    message.success('删除成功')
    await getTree()
  } catch {}
}

/** 删除文档并刷新目录树 */
async function deleteDocument(document: KnowledgeDocumentApi.PmsKnowledgeDocumentVO) {
  try {
    await message.delConfirm(`确认删除文档“${document.title}”吗？`)
    await KnowledgeDocumentApi.deleteKnowledgeDocument(document.id)
    message.success('删除成功')
    await getTree()
  } catch {}
}

/** 从知识库主页进入限定当前知识库的搜索 */
function handleLibrarySearch() {
  router.push({ path: '/pms/kb/search', query: { libraryId: String(libraryId.value) } })
}

/** 打开知识库主页 */
async function handleHome() {
  activeView.value = 'home'
  selectedFolder.value = undefined
  selectedDocument.value = undefined
  await router.push(`/pms/kb/library/${libraryId.value}`)
  if (favoriteTabActive.value) {
    await getFavoriteItems()
  }
}

/** 打开最近删除 */
function handleRecycle() {
  activeView.value = 'recycle'
  selectedFolder.value = undefined
  selectedDocument.value = undefined
}

/** 处理目录新建命令 */
function handleCreateCommand(command: 'document' | 'folder' | 'upload') {
  if (command === 'folder') {
    openFolderForm('create')
    return
  }
  if (command === 'upload') {
    openFileUploadForm()
    return
  }
  openDocumentCreateForm()
}

/** 打开文件夹表单 */
function openFolderForm(type: string) {
  folderFormRef.value?.open(
    type,
    libraryId.value,
    type === 'create' ? selectedFolder.value?.id || PmsKnowledgeRootId : PmsKnowledgeRootId,
    type === 'update' ? selectedFolder.value?.id : undefined
  )
}

/** 打开文档新增表单 */
function openDocumentCreateForm() {
  documentCreateFormRef.value?.open(
    libraryId.value,
    selectedFolder.value?.id || PmsKnowledgeRootId,
    selectedDocument.value?.id || PmsKnowledgeRootId
  )
}

/** 打开文件上传表单 */
function openFileUploadForm() {
  fileUploadFormRef.value?.open(
    libraryId.value,
    selectedFolder.value?.id || PmsKnowledgeRootId,
    selectedDocument.value?.id || PmsKnowledgeRootId
  )
}

/** 打开文档编辑表单 */
function openDocumentUpdateForm() {
  if (!selectedDocument.value) return
  documentUpdateFormRef.value?.open(selectedDocument.value.id)
}

/** 处理内容删除成功 */
async function handleContentDeleted() {
  await handleHome()
  await getTree()
}

/** 关注或取消关注知识库 */
async function handleLibraryCollect() {
  if (!library.value) return
  library.value.favoriteStatus = await toggleFavorite(
    PmsKnowledgeObjectType.LIBRARY,
    library.value.id,
    Boolean(library.value.favoriteStatus)
  )
}

/** 关注或取消关注文件夹 */
async function handleFolderCollect() {
  if (!selectedFolder.value) return
  selectedFolder.value.favoriteStatus = await toggleFavorite(
    PmsKnowledgeObjectType.FOLDER,
    selectedFolder.value.id,
    selectedFolder.value.favoriteStatus
  )
}

/** 关注或取消关注文档 */
async function handleDocumentCollect() {
  if (!selectedDocument.value) return
  selectedDocument.value.favoriteStatus = await toggleFavorite(
    selectedDocument.value.type,
    selectedDocument.value.id,
    selectedDocument.value.favoriteStatus
  )
}

/** 切换关注状态 */
async function toggleFavorite(type: number, entityId: number, favoriteStatus: boolean) {
  if (favoriteStatus) {
    await KnowledgeFavoriteApi.deleteKnowledgeFavorite(type, entityId)
    message.success('已取消关注')
    return false
  }
  await KnowledgeFavoriteApi.createKnowledgeFavorite({ type, entityId })
  message.success('关注成功')
  return true
}

/** 点赞或取消点赞文档 */
async function handleDocumentLike() {
  if (!selectedDocument.value) return
  if (selectedDocument.value.likeStatus) {
    await KnowledgeDocumentLikeApi.deleteKnowledgeDocumentLike(selectedDocument.value.id)
  } else {
    await KnowledgeDocumentLikeApi.createKnowledgeDocumentLike(selectedDocument.value.id)
  }
  selectedDocument.value = await KnowledgeDocumentApi.getKnowledgeDocument(
    selectedDocument.value.id
  )
}

/** 退出知识库 */
async function handleExitLibrary() {
  try {
    // 退出的二次确认
    await message.confirm(`确认退出知识库“${library.value?.name}”吗？退出后将无法访问私有内容。`)
    // 发起退出
    await KnowledgeLibraryMemberApi.exitKnowledgeLibrary(libraryId.value)
    message.success('已退出知识库')
    await router.push('/pms/kb/library')
  } catch {}
}

/** 内容变化后刷新目录与选中内容 */
async function handleContentChanged() {
  await getTree()
  if (selectedDocument.value) {
    selectedDocument.value = await KnowledgeDocumentApi.getKnowledgeDocument(
      selectedDocument.value.id
    )
  } else if (selectedFolder.value) {
    selectedFolder.value = await KnowledgeFolderApi.getKnowledgeFolder(selectedFolder.value.id)
  }
}

/** 最近删除变化后刷新目录 */
async function handleRecycleChanged() {
  await getTree()
}

/** 内容移动后返回主页并刷新目录 */
async function handleMoveChanged() {
  await handleHome()
  await getTree()
}

/** 按节点标识查找目录树节点 */
function findTreeNode(nodes: KnowledgeTreeNode[], key: string): KnowledgeTreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node
    const child = findTreeNode(node.children, key)
    if (child) return child
  }
}

/** 初始化 */
onMounted(() => {
  getPageData()
})

watch(libraryId, () => {
  getPageData()
})
watch([() => route.params.folderId, () => route.params.documentId], () => {
  getRouteContent()
})
</script>

<style lang="scss" scoped>
.knowledge-library-workspace :deep(.el-card) {
  height: 100%;
}

@media (max-width: 900px) {
  .knowledge-library-main :deep(.el-card__body) {
    padding-right: 16px !important;
    padding-left: 16px !important;
  }
}
</style>
