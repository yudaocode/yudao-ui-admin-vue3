<!-- AI 短剧：画布。节点创建、连接、编辑后保存为项目的画布文档；节点执行调用剧本、资产、分镜接口；资源关系图按项目业务数据构建 -->
<template>
  <ContentWrap>
    <div class="flex flex-wrap items-center justify-between gap-8px">
      <div class="flex flex-wrap items-center gap-8px">
        <el-radio-group v-model="mode">
          <el-radio-button value="workflow">工作流画布</el-radio-button>
          <el-radio-button value="resource">资源关系图</el-radio-button>
        </el-radio-group>
        <template v-if="mode === 'workflow'">
          <el-dropdown @command="(command) => handleAdd(command)">
            <el-button type="primary" plain>
              <Icon icon="ep:plus" class="mr-5px" /> 添加节点
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in ADD_KINDS" :key="item" :command="item">
                  {{ DRAMA_CANVAS_LABELS[item] }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button :disabled="!getSelectedNodes.length" @click="handleGroup">成组</el-button>
          <el-button :disabled="!getSelectedNodes.length" @click="handleClone">复制</el-button>
          <el-button
            :disabled="!getSelectedNodes.length && !getSelectedEdges.length"
            @click="handleDelete"
          >
            删除
          </el-button>
          <el-button @click="fitView({ padding: 0.2, maxZoom: 0.9 })">适应画布</el-button>
          <el-button @click="handleCompose">按画布顺序合成</el-button>
        </template>
      </div>
      <div class="flex items-center gap-8px">
        <span class="text-12px text-[var(--el-text-color-secondary)]">
          {{ dirty ? '有未保存的修改' : revision ? `已保存 · 修订 ${revision}` : '尚未保存' }}
        </span>
        <el-button @click="handleReload">重新加载</el-button>
        <el-button type="primary" :loading="saving" :disabled="!dirty" @click="handleSave">
          保存画布
        </el-button>
      </div>
    </div>
  </ContentWrap>

  <div
    v-loading="loading"
    class="h-[calc(100vh-260px)] min-h-560px flex overflow-hidden border border-[var(--el-border-color-lighter)] rounded-4px border-solid bg-[var(--el-bg-color-page)]"
  >
    <template v-if="mode === 'workflow'">
      <div ref="flowRef" class="relative min-w-0 flex-1">
        <VueFlow
          v-if="loaded"
          :id="flowId"
          :nodes="flowNodes"
          :edges="flowEdges"
          :min-zoom="0.08"
          :max-zoom="2"
          :delete-key-code="null"
          :zoom-on-double-click="false"
          :multi-selection-key-code="['Control', 'Meta']"
          :is-valid-connection="isValidConnection"
          @nodes-initialized="handleInitialized"
          @connect="handleConnect"
          @node-click="({ node }) => (inspectorId = node.id)"
          @node-double-click="({ node }) => handleDoubleClick(node.id)"
          @node-drag-stop="handleDragStop"
          @pane-click="inspectorId = ''"
        >
          <Background :gap="22" :size="1" />
          <MiniMap pannable zoomable :width="150" :height="100" />
          <template #node-canvas="{ id, data, selected }">
            <CanvasNodeCard
              :node="data"
              :selected="selected || inspectorId === id"
              :status="getBusinessStatus(data)"
              :image-url="getImageUrl(data)"
              :video-url="getVideoUrl(data)"
            />
          </template>
        </VueFlow>
        <el-empty
          v-if="loaded && !doc.nodes.length"
          class="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2"
          description="从「添加节点」开始：文本、剧本、图片、视频、声音、3D 导演；拖动右侧圆点连接到下游节点"
        />
      </div>
      <CanvasInspector
        v-if="inspectorNode"
        :key="inspectorNode.id"
        :node="inspectorNode"
        :doc="doc"
        :detail="detail"
        :image-models="imageModels"
        :video-models="videoModels"
        :voice-models="voiceModels"
        :busy="execution.busy.value"
        @close="inspectorId = ''"
        @sync="handleRun(() => execution.sync(inspectorNode!.id), '已保存到项目')"
        @generate="
          handleRun(() => execution.generate(inspectorNode!.id), '已提交生成，完成后自动刷新')
        "
        @plan="handlePlan"
        @select-image="
          (index) => handleRun(() => execution.selectImage(inspectorNode!.id, index), '已选用')
        "
        @remove-edge="(id) => (doc.edges = doc.edges.filter((edge) => edge.id !== id))"
        @open-director="handleOpenDirector(inspectorNode!.id)"
      />
    </template>
    <ResourceGraph v-else :detail="detail" class="flex-1" @refresh="handleRefresh" />
  </div>

  <DirectorStudio
    v-if="directorVisible"
    ref="directorRef"
    :detail="detail"
    @saved="handleDirectorSaved"
    @refresh="handleRefresh"
  />
  <ComposeForm ref="composeRef" :detail="detail" @success="emit('refresh')" />
</template>

<script setup lang="ts">
import {
  MarkerType,
  VueFlow,
  useVueFlow,
  type Connection,
  type NodeDragEvent
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/minimap/dist/style.css'
import { DramaProjectApi, DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaCanvasApi } from '@/api/ai/drama/canvas'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { AiModelTypeEnum, AiPlatformEnum, AiVideoTypeEnum } from '@/views/ai/utils/constants'
import { isVideoModelOfType } from '@/views/ai/utils/video'
import { getSelectedImageUrl } from '@/views/ai/utils/drama'
import {
  DRAMA_CANVAS_LABELS,
  DramaCanvasDocument,
  DramaCanvasKind,
  DramaCanvasNode,
  cloneDramaCanvasNodes,
  emptyDramaCanvas,
  getDramaConnectionIssue,
  getOrderedDramaCanvasVideos,
  groupDramaCanvasNodes,
  newDramaCanvasNode,
  removeDramaCanvasNodes
} from './canvas'
import { useCanvasExecution } from './useCanvasExecution'
import CanvasNodeCard from './CanvasNodeCard.vue'
import CanvasInspector from './CanvasInspector.vue'
import ResourceGraph from './ResourceGraph.vue'
import ComposeForm from '../form/ComposeForm.vue'
import { until } from '@vueuse/core'

// 3D 导演：首次打开时再加载
const DirectorStudio = defineAsyncComponent(() => import('../director/index.vue'))

/** AI 短剧：画布 */
defineOptions({ name: 'AiDramaCanvas' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits(['refresh'])
const message = useMessage() // 消息弹窗

const ADD_KINDS: DramaCanvasKind[] = ['text', 'script', 'image', 'video', 'audio', 'previs']

const projectId = props.detail.project.id
const flowId = `drama-canvas-${projectId}`
const { fitView, setViewport, viewport, getSelectedNodes, getSelectedEdges } = useVueFlow(flowId)

const mode = ref<'workflow' | 'resource'>('workflow')
const loading = ref(false)
const loaded = ref(false)
const saving = ref(false)
const doc = ref<DramaCanvasDocument>(emptyDramaCanvas())
const revision = ref(0)
const savedJson = ref('') // 上次保存（或加载）的文档，用于判断是否有未保存的修改
const dirty = computed(() => JSON.stringify(doc.value) !== savedJson.value)
const inspectorId = ref('')
const inspectorNode = computed(() => doc.value.nodes.find((item) => item.id === inspectorId.value))
const flowRef = ref<HTMLElement>()
const directorVisible = ref(false) // 是否已打开过 3D 导演
const directorRef = ref()
const composeRef = ref()

const imageModels = ref<ModelVO[]>([])
const videoModels = ref<ModelVO[]>([])
const voiceModels = ref<ModelVO[]>([])

/** 项目详情：执行节点时需要即时的业务数据，自行加载；父页面的轮询结果同步过来 */
const detail = ref<DramaProjectDetailVO>(props.detail)
watch(
  () => props.detail,
  (value) => (detail.value = value)
)
const handleRefresh = async () => {
  detail.value = await DramaProjectApi.getProjectDetailMy(projectId)
  emit('refresh')
}

// ========== 文档：加载、保存 ==========

const loadCanvas = async () => {
  loading.value = true
  try {
    const data = await DramaCanvasApi.getCanvas(projectId)
    revision.value = data.revision
    doc.value = (data.document as DramaCanvasDocument) || emptyDramaCanvas()
    savedJson.value = JSON.stringify(doc.value)
    inspectorId.value = ''
    loaded.value = true
  } finally {
    loading.value = false
  }
}

/** 保存画布：修订号不一致时后端拒绝，提示重新加载 */
const persist = async () => {
  saving.value = true
  try {
    doc.value.viewport = { x: viewport.value.x, y: viewport.value.y, zoom: viewport.value.zoom }
    // 以本次提交的文档为保存基线：保存期间的后续修改仍为未保存
    const json = JSON.stringify(doc.value)
    revision.value = await DramaCanvasApi.saveCanvas({
      projectId,
      revision: revision.value,
      document: JSON.parse(json)
    })
    savedJson.value = json
    return true
  } catch {
    return false
  } finally {
    saving.value = false
  }
}

const handleSave = async () => {
  if (await persist()) {
    message.success('画布已保存')
  }
}

const handleReload = async () => {
  if (dirty.value) {
    try {
      await message.confirm('重新加载会丢弃未保存的修改，确认继续？')
    } catch {
      return
    }
  }
  loaded.value = false
  await loadCanvas()
}

/** 打开过的视口；首次没有时适应画布 */
const handleInitialized = async () => {
  if (doc.value.viewport) {
    await setViewport(doc.value.viewport)
  } else if (doc.value.nodes.length) {
    await fitView({ padding: 0.2, maxZoom: 0.9 })
  }
}

// ========== 节点、连线 ==========

const flowNodes = computed(() =>
  doc.value.nodes.map((item) => ({
    id: item.id,
    type: 'canvas',
    position: item.position,
    data: item,
    zIndex: item.kind === 'group' ? -1 : 1,
    connectable: item.kind !== 'group'
  }))
)
const flowEdges = computed(() =>
  doc.value.edges.map((edge) => ({
    ...edge,
    markerEnd: MarkerType.ArrowClosed,
    interactionWidth: 16
  }))
)

/** 新节点放在当前视口的中间 */
const handleAdd = (kind: DramaCanvasKind) => {
  const width = flowRef.value?.clientWidth || 800
  const height = flowRef.value?.clientHeight || 600
  const { x, y, zoom } = viewport.value
  const offset = (doc.value.nodes.length % 5) * 24
  const node = newDramaCanvasNode(kind, {
    x: (width / 2 - x) / zoom - 140 + offset,
    y: (height / 2 - y) / zoom - 120 + offset
  })
  if (kind === 'video') {
    node.data.order = doc.value.nodes.filter((item) => item.kind === 'video').length + 1
  }
  doc.value.nodes.push(node)
  inspectorId.value = node.id
}

/**
 * 连线校验：拖出新连线时按业务规则校验
 *
 * Vue Flow 写入 edges（例如重新加载、连线变化）时，也会用它校验每条已有连线；已在文档中的连线直接通过，
 * 否则会被判为“连线已存在”而丢弃
 */
const isValidConnection = (connection: Connection) =>
  ('id' in connection && doc.value.edges.some((edge) => edge.id === connection.id)) ||
  !getDramaConnectionIssue(doc.value, connection.source, connection.target)

const handleConnect = (connection: Connection) => {
  const issue = getDramaConnectionIssue(doc.value, connection.source, connection.target)
  if (issue) {
    message.warning(issue)
    return
  }
  doc.value.edges.push({
    id: crypto.randomUUID(),
    source: connection.source,
    target: connection.target
  })
}

/** 拖动结束：写回位置；拖动分组时，组内节点一起移动 */
const handleDragStop = ({ nodes }: NodeDragEvent) => {
  nodes.forEach((dragged) => {
    const node = doc.value.nodes.find((item) => item.id === dragged.id)
    if (!node) {
      return
    }
    const dx = dragged.position.x - node.position.x
    const dy = dragged.position.y - node.position.y
    node.position = { x: dragged.position.x, y: dragged.position.y }
    if (node.kind === 'group') {
      doc.value.nodes
        .filter((item) => item.parentId === node.id && !nodes.some((other) => other.id === item.id))
        .forEach((item) => (item.position = { x: item.position.x + dx, y: item.position.y + dy }))
    }
  })
}

const handleGroup = () => {
  if (
    !groupDramaCanvasNodes(
      doc.value,
      getSelectedNodes.value.map((item) => item.id)
    )
  ) {
    message.warning('请选择要成组的节点')
  }
}

const handleClone = () => {
  const nodes = cloneDramaCanvasNodes(
    doc.value,
    getSelectedNodes.value.map((item) => item.id)
  )
  message.success(`已复制 ${nodes.length} 个节点；副本不关联原业务数据，保存到项目时新建`)
}

/** 删除选中的节点、连线：只删除画布中的，不删除已保存到项目的剧本、资产、分镜 */
const handleDelete = async () => {
  const nodeIds = getSelectedNodes.value.map((item) => item.id)
  const edgeIds = getSelectedEdges.value.map((item) => item.id)
  if (nodeIds.length) {
    try {
      await message.confirm(`确认删除选中的 ${nodeIds.length} 个节点？已保存到项目的数据不会删除`)
    } catch {
      return
    }
    removeDramaCanvasNodes(doc.value, nodeIds)
  }
  doc.value.edges = doc.value.edges.filter((edge) => !edgeIds.includes(edge.id))
  if (nodeIds.includes(inspectorId.value)) {
    inspectorId.value = ''
  }
}

const handleDoubleClick = (id: string) => {
  const node = doc.value.nodes.find((item) => item.id === id)
  if (node?.kind === 'previs') {
    handleOpenDirector(id)
  } else {
    inspectorId.value = id
  }
}

// ========== 节点关联的业务数据：状态、图片、视频 ==========

const getBusinessStatus = (node: DramaCanvasNode) => {
  const business = node.data.business
  if (!business) {
    return undefined
  }
  if (business.type === 'character' && node.kind === 'image') {
    return detail.value.characters
      .find((item) => item.id === business.id)
      ?.appearances.find((item) => item.id === business.appearanceId)?.status
  }
  if (business.type === 'location') {
    return detail.value.locations.find((item) => item.id === business.id)?.status
  }
  if (business.type === 'prop') {
    return detail.value.visualAssets.find((item) => item.id === business.id)?.status
  }
  if (business.type === 'storyboard') {
    return detail.value.storyboards.find((item) => item.id === business.id)?.videoStatus
  }
  return undefined
}

/** 图片：选用的候选图，其次参考图 */
const getImageUrl = (node: DramaCanvasNode) => {
  const business = node.data.business
  if (node.kind !== 'image' || !business) {
    return node.data.url
  }
  if (business.type === 'character') {
    const appearance = detail.value.characters
      .find((item) => item.id === business.id)
      ?.appearances.find((item) => item.id === business.appearanceId)
    return getSelectedImageUrl(appearance?.imageUrls, appearance?.selectedIndex) || node.data.url
  }
  if (business.type === 'location') {
    const location = detail.value.locations.find((item) => item.id === business.id)
    return getSelectedImageUrl(location?.imageUrls, location?.selectedIndex) || node.data.url
  }
  return (
    detail.value.visualAssets.find((item) => item.id === business.id)?.imageUrl || node.data.url
  )
}

const getVideoUrl = (node: DramaCanvasNode) => {
  const business = node.data.business
  if (business?.type !== 'storyboard') {
    return undefined
  }
  return detail.value.storyboards.find((item) => item.id === business.id)?.videoUrl
}

// ========== 执行 ==========

const execution = useCanvasExecution({
  projectId,
  detail,
  doc,
  patch: (id, data) => {
    const node = doc.value.nodes.find((item) => item.id === id)
    if (node) {
      Object.assign(node.data, data)
    }
  },
  persist,
  refresh: async () => {
    detail.value = await DramaProjectApi.getProjectDetailMy(projectId)
  }
})

/** 执行节点：成功后保存画布（节点可能写入了业务编号、正文），并通知项目页刷新 */
const handleRun = async (action: () => Promise<boolean>, successText: string) => {
  try {
    if (!(await action())) {
      return
    }
    await persist()
    message.success(successText)
  } finally {
    emit('refresh')
  }
}

const handlePlan = async () => {
  try {
    await message.confirm('拆分分镜会先分析角色场景，再替换当前剧本的分镜，确认继续？')
  } catch {
    return
  }
  await handleRun(() => execution.plan(inspectorNode.value!.id), '已拆分分镜')
}

/** 打开 3D 导演：预演节点需已保存在画布中 */
const handleOpenDirector = async (id: string) => {
  if (dirty.value && !(await persist())) {
    return
  }
  const node = doc.value.nodes.find((item) => item.id === id)!
  // 首次打开时渲染并加载 3D 导演；加载完成后 ref 才指向组件
  directorVisible.value = true
  await until(() => !!directorRef.value).toBe(true)
  directorRef.value.open(id, node.data.title, node.data.directorSourceId)
}

/** 导演工程保存后，摘要写入预演节点的说明 */
const handleDirectorSaved = (id: string, summary: string) => {
  const node = doc.value.nodes.find((item) => item.id === id)
  if (node) {
    node.data.content = summary
  }
}

/** 按画布中视频节点的顺序合成成片 */
const handleCompose = () => {
  const storyboardIds = getOrderedDramaCanvasVideos(doc.value)
    .map((item) => item.data.business?.id)
    .filter((id): id is number => !!id)
  if (!storyboardIds.length) {
    message.warning('画布中还没有保存到项目的视频节点')
    return
  }
  composeRef.value.open(storyboardIds)
}

/** 离开前提示未保存的修改 */
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (dirty.value) {
    event.preventDefault()
  }
}
defineExpose({ dirty })

/** 初始化 **/
onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  await loadCanvas()
  // Midjourney 不支持，不展示
  imageModels.value = (await ModelApi.getModelSimpleList(AiModelTypeEnum.IMAGE)).filter(
    (item: ModelVO) => item.platform !== AiPlatformEnum.MIDJOURNEY
  )
  videoModels.value = (await ModelApi.getModelSimpleList(AiModelTypeEnum.VIDEO)).filter((item) =>
    isVideoModelOfType(AiVideoTypeEnum.GENERATE, item.platform, item.model)
  )
  voiceModels.value = await ModelApi.getModelSimpleList(AiModelTypeEnum.VOICE)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
// DONE @AI：unocss？（画布容器改为 UnoCSS，去掉样式块）
</script>
