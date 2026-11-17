<!-- AI 短剧画布：资源关系图。按项目的角色形象、场景、道具、角色声音与镜头构建；连线即镜头的引用，连接、断开直接保存到分镜 -->
<template>
  <VueFlow
    :id="`drama-resource-${detail.project.id}`"
    :nodes="nodes"
    :edges="edges"
    :min-zoom="0.1"
    :max-zoom="1.6"
    :delete-key-code="null"
    :nodes-draggable="true"
    :is-valid-connection="isValidConnection"
    @connect="handleConnect"
    @edge-click="({ edge }) => handleUnbind(edge.id)"
    @nodes-initialized="fitView({ padding: 0.15, maxZoom: 0.9 })"
  >
    <Background :gap="22" :size="1" />
    <template #node-resource="{ data }">
      <div
        class="flex items-center gap-8px border border-solid rounded-6px bg-[var(--el-bg-color)] px-10px py-8px"
        :class="
          data.kind === 'shot'
            ? 'w-300px border-[var(--el-color-primary-light-5)]'
            : 'w-240px border-[var(--el-border-color)]'
        "
      >
        <Handle v-if="data.kind === 'shot'" type="target" :position="Position.Left" />
        <el-image
          v-if="data.imageUrl"
          :src="data.imageUrl"
          fit="cover"
          class="h-48px w-48px shrink-0 rounded-4px"
        />
        <div class="min-w-0">
          <div class="text-12px text-[var(--el-text-color-secondary)]">{{
            DRAMA_RESOURCE_LABELS[data.kind]
          }}</div>
          <div class="truncate text-13px font-600">{{ data.title }}</div>
          <div class="truncate text-12px text-[var(--el-text-color-secondary)]">{{
            data.subtitle
          }}</div>
        </div>
        <Handle v-if="data.kind !== 'shot'" type="source" :position="Position.Right" />
      </div>
    </template>
  </VueFlow>
</template>

<script setup lang="ts">
import { Handle, MarkerType, Position, VueFlow, useVueFlow, type Connection } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import type { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaStoryboardApi } from '@/api/ai/drama/storyboard'
import { isAiDramaRunning } from '@/views/ai/utils/constants'
import {
  DRAMA_RESOURCE_LABELS,
  DramaResourceKind,
  bindDramaResource,
  buildDramaResourceGraph
} from './canvas'

/** AI 短剧画布：资源关系图 */
defineOptions({ name: 'AiDramaResourceGraph' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits(['refresh'])

const message = useMessage() // 消息弹窗
const { fitView } = useVueFlow(`drama-resource-${props.detail.project.id}`)

/** 资源列的横坐标：资源在左，镜头在右 */
const COLUMNS: Record<DramaResourceKind, number> = {
  character: 0,
  voice: 0,
  location: 300,
  prop: 300,
  shot: 700
}

const graph = computed(() => buildDramaResourceGraph(props.detail))

const nodes = computed(() => {
  const rows: Record<number, number> = {}
  return graph.value.resources.map((item) => {
    const x = COLUMNS[item.kind]
    rows[x] = (rows[x] ?? -1) + 1
    return { id: item.id, type: 'resource', position: { x, y: rows[x] * 90 }, data: item }
  })
})
const edges = computed(() =>
  graph.value.links.map((link) => ({
    ...link,
    markerEnd: MarkerType.ArrowClosed,
    interactionWidth: 16
  }))
)

const findResource = (id: string) => graph.value.resources.find((item) => item.id === id)

const isValidConnection = (connection: Connection) =>
  findResource(connection.source)?.kind !== 'shot' &&
  findResource(connection.target)?.kind === 'shot'

/** 保存镜头引用：连接或断开 */
const saveReference = async (sourceId: string, targetId: string, remove: boolean) => {
  const resource = findResource(sourceId)
  const storyboard = findResource(targetId)?.storyboard
  if (!resource || !storyboard) {
    return
  }
  if (isAiDramaRunning(storyboard.videoStatus)) {
    message.warning('镜头视频生成中，不能修改引用')
    return
  }
  await DramaStoryboardApi.updateStoryboard(
    bindDramaResource(props.detail, storyboard, resource, remove)
  )
  message.success(remove ? '已断开引用' : '已保存引用')
  emit('refresh')
}

const handleConnect = (connection: Connection) =>
  saveReference(connection.source, connection.target, false)

const handleUnbind = async (edgeId: string) => {
  const link = graph.value.links.find((item) => item.id === edgeId)
  if (!link) {
    return
  }
  try {
    await message.confirm(
      `确认断开「${findResource(link.source)?.title}」与「${findResource(link.target)?.title}」的引用？`
    )
  } catch {
    return
  }
  await saveReference(link.source, link.target, true)
}
// DONE @AI：unocss（资源卡片改为 UnoCSS，去掉样式块）
</script>
