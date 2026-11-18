<!-- AI 短剧：画布。节点创建、连接、编辑后保存为项目的画布文档；节点执行调用剧本、资产、分镜接口；资源关系图按项目业务数据构建 -->
<template>
  <!-- 顶部：只放画布级操作；添加节点在左侧工具条，节点操作在右键菜单 -->
  <ContentWrap>
    <div class="flex flex-wrap items-center justify-between gap-8px">
      <el-radio-group v-model="mode">
        <el-radio-button value="workflow">工作流画布</el-radio-button>
        <el-radio-button value="resource">资源关系图</el-radio-button>
      </el-radio-group>
      <div class="flex flex-wrap items-center gap-8px">
        <el-dropdown v-if="mode === 'workflow'" @command="handleMore">
          <el-button>
            更多 <Icon icon="ep:arrow-down" class="ml-5px" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="compose">按画布顺序合成</el-dropdown-item>
              <el-dropdown-item command="reload">重新加载</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span
          class="text-12px"
          :class="
            autoSave.paused.value
              ? 'text-[var(--el-color-danger)]'
              : 'text-[var(--el-text-color-secondary)]'
          "
        >
          {{ saveStatus }}
        </span>
        <el-checkbox v-model="autoSave.enabled.value">自动保存</el-checkbox>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!dirty || loading || !loaded"
          @click="handleSave"
        >
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
          :pan-on-drag="tool === 'pan'"
          :selection-key-code="tool === 'select' ? true : 'Shift'"
          :is-valid-connection="isValidConnection"
          @nodes-initialized="handleInitialized"
          @connect="handleConnect"
          @connect-start="handleConnectStart"
          @connect-end="handleConnectEnd"
          @node-click="handleNodeClick"
          @node-double-click="({ node }) => handleDoubleClick(node.id)"
          @node-context-menu="handleNodeMenu"
          @edge-context-menu="handleEdgeMenu"
          @node-drag-stop="handleDragStop"
          @pane-click="handlePaneClick"
          @move-start="menu = undefined"
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
          description="从左侧工具条添加节点：文本、剧本、图片、视频、声音、3D 导演；从节点右侧圆点拖到另一节点建立连线，拖到空白处创建下游节点"
        />

        <!-- 左侧工具条：添加节点；选择、移动画布 -->
        <div v-if="loaded" class="canvas-toolbar left-12px top-12px flex-col">
          <el-tooltip
            v-for="item in DRAMA_CANVAS_ADD_KINDS"
            :key="item"
            :content="`添加${DRAMA_CANVAS_LABELS[item]}节点`"
            placement="right"
          >
            <button type="button" class="canvas-tool" @click="handleAdd(item)">
              <Icon :icon="DRAMA_CANVAS_ICONS[item]" :size="16" />
              <span>{{ DRAMA_CANVAS_LABELS[item] }}</span>
            </button>
          </el-tooltip>
          <el-divider class="!my-4px" />
          <el-tooltip content="拖动框选节点" placement="right">
            <button
              type="button"
              class="canvas-tool"
              :class="{ 'is-active': tool === 'select' }"
              @click="tool = 'select'"
            >
              <Icon icon="ep:pointer" :size="16" />
              <span>选择</span>
            </button>
          </el-tooltip>
          <el-tooltip content="拖动平移画布；按住 Shift 框选" placement="right">
            <button
              type="button"
              class="canvas-tool"
              :class="{ 'is-active': tool === 'pan' }"
              @click="tool = 'pan'"
            >
              <Icon icon="ep:rank" :size="16" />
              <span>移动</span>
            </button>
          </el-tooltip>
        </div>

        <!-- 左下：视图 -->
        <div v-if="loaded" class="canvas-toolbar bottom-12px left-12px items-center">
          <el-button link @click="zoomOut()"><Icon icon="ep:minus" /></el-button>
          <span class="w-40px text-center text-12px">{{ Math.round(viewport.zoom * 100) }}%</span>
          <el-button link @click="zoomIn()"><Icon icon="ep:plus" /></el-button>
          <el-button link @click="fitView({ padding: 0.2, maxZoom: 0.9 })">适应画布</el-button>
        </div>

        <!-- 选中多个节点或连线时的浮动操作 -->
        <div
          v-if="getSelectedNodes.length > 1 || getSelectedEdges.length"
          class="canvas-toolbar left-1/2 top-12px items-center -translate-x-1/2"
        >
          <span class="px-4px text-12px text-[var(--el-text-color-secondary)]">
            已选
            {{ getSelectedNodes.length ? `${getSelectedNodes.length} 个节点` : '' }}
            {{ getSelectedEdges.length ? `${getSelectedEdges.length} 条连线` : '' }}
          </span>
          <template v-if="getSelectedNodes.length">
            <el-button link @click="handleGroup(selectedNodeIds())">成组</el-button>
            <el-button link @click="handleClone(selectedNodeIds())">复制</el-button>
          </template>
          <el-button
            link
            type="danger"
            @click="handleDelete(selectedNodeIds(), getSelectedEdges.map((item) => item.id))"
          >
            移除
          </el-button>
        </div>

        <!-- 右键菜单：节点的编辑、复制、成组、移除；连线的移除；拖到空白处时选择下游节点 -->
        <div
          v-if="menu"
          class="canvas-menu"
          :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
          @contextmenu.prevent
        >
          <template v-if="menu.type === 'node'">
            <button
              v-if="menu.nodeIds.length === 1"
              type="button"
              @click="runMenu(() => handleDoubleClick(menu!.nodeIds[0]))"
            >
              <Icon icon="ep:edit" /> 编辑
            </button>
            <button type="button" @click="runMenu(() => handleClone(menu!.nodeIds))">
              <Icon icon="ep:copy-document" /> 复制
            </button>
            <button
              type="button"
              :disabled="!canGroup(menu.nodeIds)"
              @click="runMenu(() => handleGroup(menu!.nodeIds))"
            >
              <Icon icon="ep:folder-add" /> 成组
            </button>
            <button
              type="button"
              class="is-danger"
              @click="runMenu(() => handleDelete(menu!.nodeIds))"
            >
              <Icon icon="ep:delete" /> 移除
            </button>
          </template>
          <button
            v-else-if="menu.type === 'edge'"
            type="button"
            class="is-danger"
            @click="runMenu(() => handleDelete([], [menu!.edgeId!]))"
          >
            <Icon icon="ep:delete" /> 移除连线
          </button>
          <template v-else>
            <div class="px-10px py-4px text-12px text-[var(--el-text-color-secondary)]">
              创建下游节点
            </div>
            <button
              v-for="item in menu.kinds"
              :key="item"
              type="button"
              @click="runMenu(() => handleAddDownstream(item))"
            >
              <Icon :icon="DRAMA_CANVAS_ICONS[item]" /> {{ DRAMA_CANVAS_LABELS[item] }}
            </button>
          </template>
        </div>
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
  type EdgeMouseEvent,
  type NodeDragEvent,
  type NodeMouseEvent,
  type OnConnectStartParams
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
  DRAMA_CANVAS_ADD_KINDS,
  DRAMA_CANVAS_ICONS,
  DRAMA_CANVAS_LABELS,
  DramaCanvasDocument,
  DramaCanvasKind,
  DramaCanvasNode,
  cloneDramaCanvasNodes,
  emptyDramaCanvas,
  getDramaCanvasDownstreamKinds,
  getDramaConnectionIssue,
  getOrderedDramaCanvasVideos,
  groupDramaCanvasNodes,
  newDramaCanvasNode,
  removeDramaCanvasNodes
} from './canvas'
import { useCanvasExecution } from './useCanvasExecution'
import { useDramaAutoSave } from './useAutoSave'
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

const projectId = props.detail.project.id
const flowId = `drama-canvas-${projectId}`
const { fitView, setViewport, viewport, getSelectedNodes, getSelectedEdges, zoomIn, zoomOut } =
  useVueFlow(flowId)

const mode = ref<'workflow' | 'resource'>('workflow')
const tool = ref<'select' | 'pan'>('pan') // 左侧工具条：拖动时框选节点，或平移画布
const loading = ref(false)
const loaded = ref(false)
const saving = ref(false)
const doc = ref<DramaCanvasDocument>(emptyDramaCanvas())
const revision = ref(0)
const savedJson = ref('') // 上次保存（或加载）的文档，用于判断是否有未保存的修改
const docJson = computed(() => JSON.stringify(doc.value))
const dirty = computed(() => docJson.value !== savedJson.value)
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

/** 等待进行中的保存结束：多个等待者依次醒来时，重新检查，保证同一时间只有一次保存 */
const waitSaved = async () => {
  while (saving.value) {
    await until(saving).toBe(false)
  }
}

/** 加载代次：每次加载（包括重新加载）递增；保存的回包只在代次不变时写入修订号与保存基线 */
let generation = 0

const loadCanvas = async () => {
  const current = ++generation
  autoSave.cancel()
  loading.value = true
  try {
    // 先等在途的保存结束，再加载：加载结果的修订号不被旧的回包覆盖
    await waitSaved()
    const data = await DramaCanvasApi.getCanvas(projectId)
    if (current !== generation) {
      return
    }
    revision.value = data.revision
    doc.value = (data.document as DramaCanvasDocument) || emptyDramaCanvas()
    savedJson.value = JSON.stringify(doc.value)
    autoSave.reset()
    inspectorId.value = ''
    loaded.value = true
  } finally {
    // 只由最后一次加载结束遮罩：连续重新加载时，先返回的旧请求不提前解除
    if (current === generation) {
      loading.value = false
    }
  }
}

/**
 * 保存画布：修订号不一致时后端拒绝，提示重新加载
 *
 * 手动保存、自动保存、执行节点后的保存依次进行：上一次未结束时先等待，避免以同一修订号重复提交；
 * 调用时记录加载代次：等待期间开始了重新加载（或正在加载）时放弃保存，不以旧文档提交；
 * 保存期间重新加载了画布时，回包不再写入（以新加载的修订号与文档为准）
 */
const persist = async () => {
  const current = generation
  // 检查与占用在同一同步段内完成：多个等待者醒来时，只有第一个能占用，其余继续等待
  while (saving.value) {
    await until(saving).toBe(false)
  }
  // 只保存当前代次已加载成功的文档：加载中、加载失败（以重新加载重试）时不保存
  if (current !== generation || loading.value || !loaded.value) {
    return false
  }
  saving.value = true
  try {
    doc.value.viewport = { x: viewport.value.x, y: viewport.value.y, zoom: viewport.value.zoom }
    // 以本次提交的文档为保存基线：保存期间的后续修改仍为未保存
    const json = JSON.stringify(doc.value)
    const nextRevision = await DramaCanvasApi.saveCanvas({
      projectId,
      revision: revision.value,
      document: JSON.parse(json)
    })
    if (current === generation) {
      revision.value = nextRevision
      savedJson.value = json
    }
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
    autoSave.resume()
  }
}

/** 自动保存：默认关闭，勾选后编辑停顿时保存；失败后暂停，手动保存成功后恢复 */
const autoSave = useDramaAutoSave({
  storageKey: 'ai-drama-canvas-auto-save',
  snapshot: () => docJson.value,
  dirty,
  saving,
  ready: () => loaded.value && !loading.value && !saving.value,
  save: persist
})

const saveStatus = computed(() => {
  if (saving.value) {
    return '保存中…'
  }
  if (autoSave.paused.value && dirty.value) {
    return '自动保存失败，已暂停，请检查后手动保存'
  }
  if (dirty.value) {
    return '有未保存的修改'
  }
  return revision.value ? `已保存 · 修订 ${revision.value}` : '尚未保存'
})

const handleMore = (command: string) => {
  if (command === 'compose') {
    handleCompose()
  } else if (command === 'reload') {
    handleReload()
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

/** 添加节点：未指定位置时，放在当前视口的中间 */
const handleAdd = (kind: DramaCanvasKind, position?: DramaCanvasNode['position']) => {
  const width = flowRef.value?.clientWidth || 800
  const height = flowRef.value?.clientHeight || 600
  const { x, y, zoom } = viewport.value
  const offset = (doc.value.nodes.length % 5) * 24
  const node = newDramaCanvasNode(
    kind,
    position || {
      x: (width / 2 - x) / zoom - 140 + offset,
      y: (height / 2 - y) / zoom - 120 + offset
    }
  )
  if (kind === 'video') {
    node.data.order = doc.value.nodes.filter((item) => item.kind === 'video').length + 1
  }
  doc.value.nodes.push(node)
  inspectorId.value = node.id
  return node
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
  if (connecting) {
    connecting.connected = true
  }
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

// ========== 右键菜单；从连接点拖到空白处创建下游节点 ==========

interface CanvasMenu {
  type: 'node' | 'edge' | 'downstream'
  x: number // 菜单在画布容器内的位置
  y: number
  nodeIds: string[] // 节点菜单：操作的节点
  edgeId?: string // 连线菜单：操作的连线
  sourceId?: string // 下游菜单：上游节点
  position?: DramaCanvasNode['position'] // 下游菜单：新节点在画布中的位置
  kinds?: DramaCanvasKind[] // 下游菜单：可创建的节点种类
}
const menu = ref<CanvasMenu>()

/** 鼠标位置：画布容器内的位置，以及画布坐标 */
const getPointer = (event: MouseEvent | TouchEvent) => {
  const point = 'changedTouches' in event ? event.changedTouches[0] : event
  const rect = flowRef.value!.getBoundingClientRect()
  const { x, y, zoom } = viewport.value
  const left = point.clientX - rect.left
  const top = point.clientY - rect.top
  return {
    clientX: point.clientX,
    clientY: point.clientY,
    x: Math.min(left, rect.width - 160),
    y: Math.min(top, rect.height - 200),
    position: { x: (left - x) / zoom, y: (top - y) / zoom }
  }
}

/** 菜单项：先执行（执行时读取菜单的参数），再关闭菜单 */
const runMenu = (action: () => unknown) => {
  action()
  menu.value = undefined
}

const selectedNodeIds = () => getSelectedNodes.value.map((item) => item.id)

/** 节点右键：右键的节点在多选中时，操作全部选中的节点；否则只操作该节点 */
const handleNodeMenu = ({ event, node }: NodeMouseEvent) => {
  event.preventDefault()
  const selected = selectedNodeIds()
  const pointer = getPointer(event)
  menu.value = {
    type: 'node',
    x: pointer.x,
    y: pointer.y,
    nodeIds: selected.includes(node.id) ? selected : [node.id]
  }
}

const handleEdgeMenu = ({ event, edge }: EdgeMouseEvent) => {
  event.preventDefault()
  const pointer = getPointer(event)
  menu.value = { type: 'edge', x: pointer.x, y: pointer.y, nodeIds: [], edgeId: edge.id }
}

const handleNodeClick = ({ node }: NodeMouseEvent) => {
  inspectorId.value = node.id
  menu.value = undefined
}

/**
 * 拖线松开在空白处后，浏览器会在同一次松开时向画布派发 click（按下的连接点与松开处的共同祖先是画布），
 * 而 vue-flow 此时已结束连线、会触发 pane-click：短时间内忽略，避免刚弹出的下游菜单被关闭
 */
let skipPaneClickUntil = 0

const handlePaneClick = () => {
  if (Date.now() < skipPaneClickUntil) {
    return
  }
  inspectorId.value = ''
  menu.value = undefined
}

/** 进行中的拖线：只记录从输出（右侧）连接点拖出的 */
let connecting: { sourceId: string; connected: boolean } | undefined
const handleConnectStart = ({ nodeId, handleType }: OnConnectStartParams) => {
  menu.value = undefined
  connecting =
    nodeId && handleType === 'source' ? { sourceId: nodeId, connected: false } : undefined
}

/** 拖线结束：没有连到节点、松开在空白处时，弹出可创建的下游节点 */
const handleConnectEnd = (event?: MouseEvent | TouchEvent) => {
  const state = connecting
  connecting = undefined
  if (!state || state.connected || !event || !flowRef.value) {
    return
  }
  const pointer = getPointer(event)
  const element = document.elementFromPoint(pointer.clientX, pointer.clientY)
  if (!element?.closest('.vue-flow__pane') || element.closest('.vue-flow__node')) {
    return
  }
  const source = doc.value.nodes.find((item) => item.id === state.sourceId)
  const kinds = source ? getDramaCanvasDownstreamKinds(source.kind) : []
  if (!kinds.length) {
    message.warning(
      source?.kind === 'previs'
        ? '预演不直接作为输入：请在 3D 导演中导出视频，加入动作参考后在镜头中选用'
        : '该节点没有可创建的下游节点'
    )
    return
  }
  skipPaneClickUntil = Date.now() + 300
  menu.value = {
    type: 'downstream',
    x: pointer.x,
    y: pointer.y,
    nodeIds: [],
    sourceId: state.sourceId,
    position: pointer.position,
    kinds
  }
}

/** 创建下游节点并连线：不满足连线规则（例如声音只能关联角色图片）时撤销 */
const handleAddDownstream = (kind: DramaCanvasKind) => {
  const { sourceId, position } = menu.value!
  const node = handleAdd(kind, { x: position!.x, y: position!.y - 60 })
  const issue = getDramaConnectionIssue(doc.value, sourceId!, node.id)
  if (issue) {
    removeDramaCanvasNodes(doc.value, [node.id])
    inspectorId.value = ''
    message.warning(issue)
    return
  }
  doc.value.edges.push({ id: crypto.randomUUID(), source: sourceId!, target: node.id })
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

/** 能否成组：分组不嵌套，至少有一个非分组节点 */
const canGroup = (ids: string[]) =>
  doc.value.nodes.some((item) => ids.includes(item.id) && item.kind !== 'group')

const handleGroup = (ids: string[]) => {
  if (!groupDramaCanvasNodes(doc.value, ids)) {
    message.warning('请选择要成组的节点')
  }
}

const handleClone = (ids: string[]) => {
  const nodes = cloneDramaCanvasNodes(doc.value, ids)
  message.success(`已复制 ${nodes.length} 个节点；副本不关联原业务数据，保存到项目时新建`)
}

/** 移除节点、连线：只移除画布中的，不删除已保存到项目的剧本、资产、分镜 */
const handleDelete = async (nodeIds: string[], edgeIds: string[] = []) => {
  if (nodeIds.length) {
    try {
      await message.confirm(`确认移除 ${nodeIds.length} 个节点？已保存到项目的数据不会删除`)
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

/**
 * 离开画布前（返回、切到分步、应用内跳转）：先处理打开的 3D 导演；开启自动保存时立即保存，保存成功后直接离开；
 * 手动保存模式、自动保存失败时仍有未保存的修改，确认后离开
 *
 * @return 是否可以离开
 */
const confirmLeave = async () => {
  if (directorRef.value && !(await directorRef.value.confirmLeave())) {
    return false
  }
  if (loaded.value && dirty.value && autoSave.enabled.value) {
    await autoSave.flush()
  }
  if (!dirty.value) {
    return true
  }
  try {
    await message.confirm('画布有未保存的修改，确认离开？')
    return true
  } catch {
    return false
  }
}

/** 关闭、刷新页面前：浏览器只能弹出原生确认；开启自动保存时尽量先发起保存 */
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  const directorDirty = !!directorRef.value?.dirty
  if (!dirty.value && !directorDirty) {
    return
  }
  if (dirty.value && autoSave.enabled.value && !autoSave.paused.value) {
    autoSave.flush()
  }
  event.preventDefault()
  event.returnValue = ''
}
defineExpose({ dirty, confirmLeave })

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

<style lang="scss" scoped>
/* 悬浮在画布上的工具条：左侧添加节点、左下视图、选中后的浮动操作；复用 3 处 */
.canvas-toolbar {
  position: absolute;
  z-index: 5;
  display: flex;
  padding: 4px;
  gap: 2px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  box-shadow: var(--el-box-shadow-lighter);
}

.canvas-tool {
  display: flex;
  width: 52px;
  padding: 6px 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

/* 右键菜单、下游节点菜单 */
.canvas-menu {
  position: absolute;
  z-index: 10;
  display: flex;
  min-width: 140px;
  padding: 4px 0;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  flex-direction: column;

  button {
    display: flex;
    padding: 6px 12px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    text-align: left;
    cursor: pointer;
    background: none;
    border: none;
    align-items: center;
    gap: 6px;

    &:hover:not(:disabled) {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }

    &:disabled {
      color: var(--el-text-color-placeholder);
      cursor: not-allowed;
    }

    &.is-danger:not(:disabled) {
      color: var(--el-color-danger);
    }
  }
}
</style>
