/**
 * AI 短剧画布：节点、连线规则，分组、复制，以及按项目业务数据构建的资源关系图
 *
 * 节点执行（保存剧本、出图、生成视频等）调用各自的业务接口，并把业务编号记在节点的 business 中；画布只保存文档
 */
import type { DramaProjectDetailVO } from '@/api/ai/drama/project'
import type { DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { getDramaProps, getDramaStoryboardFrame, getSelectedImageUrl } from '@/views/ai/utils/drama'

export type DramaCanvasKind = 'text' | 'script' | 'image' | 'video' | 'audio' | 'group' | 'previs'
export type DramaImagePurpose = 'character' | 'location' | 'prop' | 'frame'

export interface DramaCanvasData {
  title: string
  content: string // 文本、剧本正文；视频的画面描述；声音的样音文本；预演的说明
  prompt: string // 图片描述；视频提示词；声音描述；剧本的打磨意见
  url: string // 图片：上传或选用的图片
  modelId?: number // 图片、视频、声音的模型
  voice?: string // 声音：服务商的音色标识
  resolution?: string // 视频：分辨率
  startFrameUrl?: string // 视频：画布设置的手动起始帧，断开起始帧节点后据此清除
  purpose?: DramaImagePurpose // 图片的用途
  actorNodeId?: string // 声音：对应的角色图片节点
  order?: number // 视频：镜头顺序
  width?: number // 分组的宽、高
  height?: number
  directorSourceId?: string // 预演：复制来源的节点，用于复制 3D 导演工程
  // 关联的业务数据：剧本、角色（及形象）、场景、道具、分镜
  business?: {
    id: number
    type: 'script' | 'character' | 'location' | 'prop' | 'storyboard'
    appearanceId?: number
  }
}

export interface DramaCanvasNode {
  id: string
  kind: DramaCanvasKind
  position: { x: number; y: number }
  parentId?: string
  data: DramaCanvasData
}

export interface DramaCanvasEdge {
  id: string
  source: string
  target: string
}

export interface DramaCanvasDocument {
  schema: 1
  nodes: DramaCanvasNode[]
  edges: DramaCanvasEdge[]
  viewport?: { x: number; y: number; zoom: number }
}

export const DRAMA_CANVAS_LABELS: Record<DramaCanvasKind, string> = {
  text: '文本',
  script: '剧本',
  image: '图片',
  video: '视频',
  audio: '声音',
  previs: '3D 导演',
  group: '分组'
}

export const DRAMA_CANVAS_ICONS: Record<DramaCanvasKind, string> = {
  text: 'ep:edit-pen',
  script: 'ep:document',
  image: 'ep:picture',
  video: 'ep:video-camera',
  audio: 'ep:microphone',
  previs: 'ep:film',
  group: 'ep:folder'
}

/** 可从工具条添加的节点：分组由「成组」产生 */
export const DRAMA_CANVAS_ADD_KINDS: DramaCanvasKind[] = [
  'text',
  'script',
  'image',
  'video',
  'audio',
  'previs'
]

export const DRAMA_IMAGE_PURPOSES: { label: string; value: DramaImagePurpose }[] = [
  { label: '角色', value: 'character' },
  { label: '场景', value: 'location' },
  { label: '道具', value: 'prop' },
  { label: '起始帧', value: 'frame' }
]

/** 每种节点允许的输入节点 */
const CANVAS_INPUTS: Record<DramaCanvasKind, DramaCanvasKind[]> = {
  text: [],
  script: ['text'],
  image: ['text', 'script', 'image'],
  video: ['text', 'script', 'image', 'audio', 'video'],
  audio: ['text', 'image'],
  group: [],
  previs: ['text', 'script']
}

const newId = () => `n-${crypto.randomUUID()}`

export const emptyDramaCanvas = (): DramaCanvasDocument => ({ schema: 1, nodes: [], edges: [] })

export const newDramaCanvasNode = (
  kind: DramaCanvasKind,
  position: DramaCanvasNode['position']
): DramaCanvasNode => ({
  id: newId(),
  kind,
  position,
  data: {
    title: `${DRAMA_CANVAS_LABELS[kind]}节点`,
    content: '',
    prompt: '',
    url: '',
    ...(kind === 'image' ? { purpose: 'character' as DramaImagePurpose } : {}),
    ...(kind === 'group' ? { width: 650, height: 430 } : {})
  }
})

/** 连线的问题：为空表示可以连接 */
export const getDramaConnectionIssue = (
  doc: DramaCanvasDocument,
  source: string,
  target: string
): string => {
  const from = doc.nodes.find((item) => item.id === source)
  const to = doc.nodes.find((item) => item.id === target)
  if (!from || !to || source === target) {
    return '请连接两个不同的节点'
  }
  if (from.kind === 'previs') {
    return '预演不直接作为输入：请在 3D 导演中导出视频，加入动作参考后在镜头中选用'
  }
  if (!CANVAS_INPUTS[to.kind].includes(from.kind)) {
    return '这两种节点不能建立输入关系'
  }
  if (to.kind === 'audio' && from.kind === 'image') {
    if (from.data.purpose !== 'character') {
      return '声音只能关联角色图片'
    }
    const linked = doc.edges.some(
      (edge) =>
        edge.target === target &&
        doc.nodes.find((item) => item.id === edge.source)?.kind === 'image'
    )
    if (linked) {
      return '一个声音节点只能关联一个角色'
    }
  }
  if (doc.edges.some((edge) => edge.source === source && edge.target === target)) {
    return '连线已存在'
  }
  // 从 target 出发能回到 source，则形成循环
  const visited = new Set<string>()
  const reaches = (id: string): boolean => {
    if (id === source) {
      return true
    }
    if (visited.has(id)) {
      return false
    }
    visited.add(id)
    return doc.edges.filter((edge) => edge.source === id).some((edge) => reaches(edge.target))
  }
  return reaches(target) ? '连线不能形成循环' : ''
}

/** 可以作为该种节点下游的节点种类：从连接点拖到空白处时供选择 */
export const getDramaCanvasDownstreamKinds = (kind: DramaCanvasKind) =>
  DRAMA_CANVAS_ADD_KINDS.filter((item) => CANVAS_INPUTS[item].includes(kind))

/** 获得节点的输入节点 */
export const getDramaCanvasInputs = (doc: DramaCanvasDocument, id: string) =>
  doc.edges
    .filter((edge) => edge.target === id)
    .map((edge) => doc.nodes.find((item) => item.id === edge.source)!)
    .filter(Boolean)

/** 删除节点：删除分组时解散分组，组内节点保留 */
export const removeDramaCanvasNodes = (doc: DramaCanvasDocument, ids: string[]) => {
  const removed = new Set(ids)
  doc.nodes = doc.nodes
    .filter((item) => !removed.has(item.id))
    .map((item) =>
      item.parentId && removed.has(item.parentId) ? { ...item, parentId: undefined } : item
    )
  doc.edges = doc.edges.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target))
}

/**
 * 复制节点：选中分组时连同组内节点；复制品不关联业务数据（避免两个节点改同一份剧本、分镜），保留输入连线
 */
export const cloneDramaCanvasNodes = (doc: DramaCanvasDocument, selected: string[]) => {
  const ids = new Set(selected)
  doc.nodes
    .filter((item) => item.parentId && ids.has(item.parentId))
    .forEach((item) => ids.add(item.id))
  const idMap = new Map([...ids].map((id) => [id, newId()]))
  const nodes = doc.nodes
    .filter((item) => ids.has(item.id))
    .map((item) => {
      const clone: DramaCanvasNode = JSON.parse(JSON.stringify(item))
      clone.id = idMap.get(item.id)!
      clone.position = { x: item.position.x + 40, y: item.position.y + 40 }
      clone.parentId = item.parentId ? idMap.get(item.parentId) : undefined
      if (clone.data.actorNodeId) {
        clone.data.actorNodeId = idMap.get(clone.data.actorNodeId) || clone.data.actorNodeId
      }
      clone.data.title += ' · 副本'
      delete clone.data.business
      if (clone.kind === 'previs') {
        clone.data.directorSourceId = item.data.directorSourceId || item.id
      }
      return clone
    })
  const edges = doc.edges
    .filter((edge) => ids.has(edge.target))
    .map((edge) => ({
      id: crypto.randomUUID(),
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target)!
    }))
  doc.nodes.push(...nodes)
  doc.edges.push(...edges)
  return nodes
}

/** 选中的节点成组：分组不嵌套 */
export const groupDramaCanvasNodes = (doc: DramaCanvasDocument, ids: string[]) => {
  const children = doc.nodes.filter((item) => ids.includes(item.id) && item.kind !== 'group')
  if (!children.length) {
    return undefined
  }
  const minX = Math.min(...children.map((item) => item.position.x))
  const minY = Math.min(...children.map((item) => item.position.y))
  const group = newDramaCanvasNode('group', { x: minX - 30, y: minY - 52 })
  group.data.width = Math.max(...children.map((item) => item.position.x + 320)) - minX + 60
  group.data.height = Math.max(...children.map((item) => item.position.y + 270)) - minY + 85
  doc.nodes.unshift(group)
  children.forEach((item) => (item.parentId = group.id))
  return group
}

/** 视频节点的镜头顺序：优先按视频之间的连线，其余按填写的顺序 */
export const getOrderedDramaCanvasVideos = (doc: DramaCanvasDocument) => {
  const videos = doc.nodes
    .filter((item) => item.kind === 'video')
    .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  const result: DramaCanvasNode[] = []
  const pending = new Set(videos.map((item) => item.id))
  while (pending.size) {
    const next = videos.find(
      (item) =>
        pending.has(item.id) &&
        !doc.edges.some((edge) => edge.target === item.id && pending.has(edge.source))
    )
    if (!next) {
      break
    }
    result.push(next)
    pending.delete(next.id)
  }
  return result
}

// ========== 资源关系图：按项目业务数据构建，连线即镜头的引用 ==========

export type DramaResourceKind = 'character' | 'location' | 'prop' | 'voice' | 'shot'

export interface DramaResource {
  id: string
  kind: DramaResourceKind
  businessId: number // 角色形象、场景、道具的编号；声音为角色编号；镜头为分镜编号
  title: string
  subtitle: string
  imageUrl?: string
  storyboard?: DramaStoryboardVO
}

export interface DramaResourceLink {
  id: string
  source: string
  target: string
  label: string
}

export const DRAMA_RESOURCE_LABELS: Record<DramaResourceKind, string> = {
  character: '角色形象',
  location: '场景',
  prop: '道具',
  voice: '声音',
  shot: '镜头'
}

/** 构建资源关系图：角色形象、场景、道具、角色声音指向引用它们的镜头 */
export const buildDramaResourceGraph = (detail: DramaProjectDetailVO) => {
  const resources: DramaResource[] = []
  detail.characters.forEach((character) => {
    character.appearances.forEach((appearance) =>
      resources.push({
        id: `character:${appearance.id}`,
        kind: 'character',
        businessId: appearance.id,
        title: character.name,
        subtitle: `形象${appearance.appearanceIndex}${appearance.changeReason ? ` · ${appearance.changeReason}` : ''}`,
        imageUrl:
          getSelectedImageUrl(appearance.imageUrls, appearance.selectedIndex) ||
          appearance.referenceImageUrl
      })
    )
    if (character.sampleAudioId || character.voiceDescription) {
      resources.push({
        id: `voice:${character.id}`,
        kind: 'voice',
        businessId: character.id,
        title: character.name,
        subtitle: character.voiceDescription || '已选样音'
      })
    }
  })
  detail.locations.forEach((location) =>
    resources.push({
      id: `location:${location.id}`,
      kind: 'location',
      businessId: location.id,
      title: location.name,
      subtitle: location.description || '场景参考',
      imageUrl:
        getSelectedImageUrl(location.imageUrls, location.selectedIndex) ||
        location.referenceImageUrl
    })
  )
  const props = getDramaProps(detail.visualAssets)
  props.forEach((asset) =>
    resources.push({
      id: `prop:${asset.id}`,
      kind: 'prop',
      businessId: asset.id,
      title: asset.title || '道具',
      subtitle: asset.prompt || '道具参考',
      imageUrl: asset.imageUrl || asset.referenceImages?.referenceImageUrl
    })
  )
  detail.storyboards.forEach((storyboard) =>
    resources.push({
      id: `shot:${storyboard.id}`,
      kind: 'shot',
      businessId: storyboard.id,
      title: `#${storyboard.sceneNo} ${storyboard.title || ''}`,
      subtitle: storyboard.sceneText || '',
      imageUrl:
        storyboard.continuity?.manualStartFrame?.url ||
        getDramaStoryboardFrame(detail.visualAssets, storyboard.id)?.imageUrl,
      storyboard
    })
  )

  const links: DramaResourceLink[] = []
  const link = (source: string, target: string, label: string) => {
    if (resources.some((item) => item.id === source)) {
      links.push({ id: `${source}->${target}`, source, target, label })
    }
  }
  detail.storyboards.forEach((storyboard) => {
    const target = `shot:${storyboard.id}`
    storyboard.characters?.forEach((ref) =>
      link(`character:${ref.appearanceId}`, target, '角色参考')
    )
    if (storyboard.locationId) {
      link(`location:${storyboard.locationId}`, target, '场景参考')
    }
    // 未指定道具时，按道具关联的镜头序号
    const propIds =
      storyboard.visualAssetIds ??
      props
        .filter((asset) => asset.referenceImages?.shotNumbers?.includes(storyboard.sceneNo!))
        .map((asset) => asset.id)
    propIds.forEach((id) => link(`prop:${id}`, target, '道具参考'))
    storyboard.continuity?.voiceSpeakerIds?.forEach((id) => link(`voice:${id}`, target, '指定发言'))
  })
  return { resources, links }
}

/**
 * 资源连到镜头（或断开）后，镜头需要保存的引用；连线只改业务引用，不改图片、视频
 */
export const bindDramaResource = (
  detail: DramaProjectDetailVO,
  storyboard: DramaStoryboardVO,
  resource: DramaResource,
  remove = false
): DramaStoryboardVO => {
  const result: DramaStoryboardVO = JSON.parse(JSON.stringify(storyboard))
  if (resource.kind === 'character') {
    // 同一角色只保留一个形象
    const character = detail.characters.find((item) =>
      item.appearances.some((appearance) => appearance.id === resource.businessId)
    )
    const appearanceIds = character?.appearances.map((item) => item.id) || []
    const others = (result.characters || []).filter(
      (ref) => !appearanceIds.includes(ref.appearanceId!)
    )
    const previous = result.characters?.find((ref) => appearanceIds.includes(ref.appearanceId!))
    result.characters = remove
      ? others
      : [...others, { ...previous, appearanceId: resource.businessId }]
  } else if (resource.kind === 'location') {
    result.locationId = remove ? undefined : resource.businessId
  } else if (resource.kind === 'prop') {
    const ids = (
      result.visualAssetIds ??
      getDramaProps(detail.visualAssets)
        .filter((asset) => asset.referenceImages?.shotNumbers?.includes(storyboard.sceneNo!))
        .map((asset) => asset.id)
    ).filter((id) => id !== resource.businessId)
    result.visualAssetIds = remove ? ids : [...ids, resource.businessId]
  } else if (resource.kind === 'voice') {
    const ids = (result.continuity?.voiceSpeakerIds || []).filter(
      (id) => id !== resource.businessId
    )
    result.continuity = {
      ...result.continuity,
      voiceSpeakerIds: remove ? ids : [...ids, resource.businessId]
    }
  }
  return result
}
