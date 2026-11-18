<!-- AI 短剧画布：节点卡片 -->
<template>
  <div
    v-if="node.kind === 'group'"
    class="rounded-12px border border-dashed bg-[rgb(64_158_255/4%)] px-18px py-14px"
    :class="
      selected ? 'border-[var(--el-color-primary)]' : 'border-[var(--el-border-color-darker)]'
    "
    :style="{ width: `${node.data.width || 650}px`, height: `${node.data.height || 430}px` }"
  >
    <span class="text-13px font-600">{{ node.data.title }}</span>
  </div>
  <div
    v-else
    class="w-280px overflow-hidden rounded-8px border border-solid bg-[var(--el-bg-color)] shadow-[var(--el-box-shadow-lighter)]"
    :class="selected ? 'border-[var(--el-color-primary)]' : 'border-[var(--el-border-color)]'"
  >
    <Handle v-if="node.kind !== 'text'" type="target" :position="Position.Left" />
    <div
      class="flex items-center justify-between px-12px pt-10px text-12px text-[var(--el-text-color-secondary)]"
    >
      <span class="flex items-center gap-4px">
        <Icon :icon="ICONS[node.kind]" />
        {{ DRAMA_CANVAS_LABELS[node.kind] }}
        <template v-if="node.kind === 'image'">· {{ purposeLabel }}</template>
      </span>
      <dict-tag v-if="status !== undefined" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="status" />
      <span v-else>{{ node.data.business ? '已保存到项目' : '草稿' }}</span>
    </div>
    <div class="truncate px-12px py-8px text-14px font-600">{{ node.data.title }}</div>
    <div v-if="node.kind === 'image'" class="canvas-media">
      <el-image v-if="imageUrl" :src="imageUrl" fit="cover" class="h-full w-full" />
      <span v-else>上传图片或填写描述</span>
    </div>
    <div v-else-if="node.kind === 'video'" class="canvas-media">
      <video v-if="videoUrl" :src="videoUrl" class="h-full w-full object-cover" muted></video>
      <span v-else>{{
        node.data.business ? '已保存为镜头' : '填写画面，连接角色、场景、道具'
      }}</span>
    </div>
    <div v-else-if="node.kind === 'previs'" class="canvas-media">
      <span>白模调度 · 动作 · 运镜，双击打开 3D 导演</span>
    </div>
    <p
      class="m-[8px_12px_12px] line-clamp-4 whitespace-pre-wrap text-12px leading-[1.6] text-[var(--el-text-color-secondary)]"
    >
      {{
        (node.kind === 'image' || node.kind === 'video' ? node.data.prompt : node.data.content) ||
        PLACEHOLDERS[node.kind]
      }}
    </p>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { DICT_TYPE } from '@/utils/dict'
import {
  DRAMA_CANVAS_ICONS as ICONS,
  DRAMA_CANVAS_LABELS,
  DRAMA_IMAGE_PURPOSES,
  DramaCanvasKind,
  DramaCanvasNode
} from './canvas'

/** AI 短剧画布：节点卡片 */
defineOptions({ name: 'AiDramaCanvasNodeCard' })

const props = defineProps<{
  node: DramaCanvasNode
  selected?: boolean
  status?: number // 关联业务数据的生成状态
  imageUrl?: string
  videoUrl?: string
}>()

const PLACEHOLDERS: Record<DramaCanvasKind, string> = {
  text: '写下故事、对白或制作笔记',
  script: '编写剧本，或连接文本节点',
  image: '填写图片描述',
  video: '填写视频提示词',
  audio: '填写样音文本',
  previs: '在 3D 导演中设计白模动作与机位',
  group: ''
}

const purposeLabel = computed(
  () => DRAMA_IMAGE_PURPOSES.find((item) => item.value === props.node.data.purpose)?.label
)
// DONE @AI：unocss 简化下？（卡片、分组、描述改为 UnoCSS；媒体区复用 3 处，保留）
</script>

<style lang="scss" scoped>
.canvas-media {
  display: flex;
  height: 150px;
  margin: 0 8px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  border-radius: 6px;
  align-items: center;
  justify-content: center;
}
</style>
