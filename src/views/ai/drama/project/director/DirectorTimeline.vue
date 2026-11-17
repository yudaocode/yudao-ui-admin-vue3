<!-- AI 短剧 3D 导演：时间轴，摄影机与各对象的关键帧、动作片段 -->
<template>
  <div class="director-timeline">
    <div class="flex items-center justify-between py-6px">
      <div class="flex items-center gap-6px">
        <el-button size="small" @click="emit('seek', 0)"><Icon icon="ep:d-arrow-left" /></el-button>
        <el-button size="small" type="primary" plain @click="emit('play')">
          <Icon :icon="playing ? 'ep:video-pause' : 'ep:video-play'" class="mr-4px" />
          {{ playing ? '暂停' : '播放' }}
        </el-button>
        <el-button size="small" @click="emit('seek', end)"
          ><Icon icon="ep:d-arrow-right"
        /></el-button>
        <span class="ml-8px text-13px tabular-nums"
          >{{ (frame / 24).toFixed(2) }} / {{ document.duration.toFixed(2) }} 秒</span
        >
        <el-input-number
          v-model="frameInput"
          :min="0"
          :max="end"
          :precision="0"
          size="small"
          controls-position="right"
          class="!w-100px"
          @change="emit('seek', frameInput ?? 0)"
        />
        <span class="text-12px text-[var(--el-text-color-secondary)]">帧</span>
      </div>
      <el-button size="small" :disabled="!selected" @click="emit('add-key')">添加关键帧</el-button>
    </div>
    <div v-if="document.markers?.length" class="flex gap-4px overflow-auto pb-6px">
      <el-tag
        v-for="marker in document.markers"
        :key="`${marker.frame}-${marker.label}`"
        size="small"
        class="cursor-pointer"
        @click="emit('seek', marker.frame)"
      >
        {{ (marker.frame / 24).toFixed(2) }}s · {{ marker.label }}
      </el-tag>
    </div>
    <div class="flex items-center">
      <span class="w-140px shrink-0 text-12px text-[var(--el-text-color-secondary)]"
        >时间 / 24 fps</span
      >
      <el-slider
        :model-value="frame"
        :min="0"
        :max="end"
        :show-tooltip="false"
        class="flex-1 px-6px"
        @input="(value) => emit('seek', Number(value))"
      />
    </div>
    <el-scrollbar class="flex-1">
      <div
        v-for="track in tracks"
        :key="track.id"
        :class="{ 'is-selected': track.id === selected }"
      >
        <div class="director-track">
          <span class="director-track__name" @click="emit('select', track.id)">{{
            track.name
          }}</span>
          <div class="director-track__line" @click.self="handleTrackClick">
            <div class="director-track__playhead" :style="{ left: percent(frame) }"></div>
            <span
              v-for="key in track.keys"
              :key="key.frame"
              class="director-track__key"
              :style="{
                left: percent(
                  drag?.id === track.id && drag.from === key.frame ? drag.to : key.frame
                )
              }"
              :title="`${key.frame} 帧 · 拖动移动，按住 Alt 拖动复制`"
              @pointerdown.stop="handleKeyDown($event, track.id, key.frame)"
              @pointermove.stop="handleKeyMove"
              @pointerup.stop="handleKeyUp"
              @pointercancel="drag = undefined"
            ></span>
          </div>
        </div>
        <div v-if="track.clips.length" class="director-track">
          <span class="director-track__name pl-16px text-[var(--el-text-color-placeholder)]"
            >动作编排</span
          >
          <div class="director-track__line" @click.self="handleTrackClick">
            <div class="director-track__playhead" :style="{ left: percent(frame) }"></div>
            <span
              v-for="clip in track.clips"
              :key="clip.id"
              class="director-track__clip"
              :class="{ 'is-active': track.id === selected && clip.id === selectedClip }"
              :style="{
                left: `${(clip.start / (end + 1)) * 100}%`,
                width: `${((clip.end - clip.start) / (end + 1)) * 100}%`
              }"
              @click.stop="emit('clip', track.id, clip.id)"
            >
              {{ directorActions[clip.action] }}
            </span>
          </div>
        </div>
      </div>
    </el-scrollbar>
    <div v-if="drag" class="pb-4px text-12px text-[var(--el-color-primary)]">
      {{ drag.to }} 帧 · 松开{{
        drag.from === 0 ? '（第 0 帧请按住 Alt 复制）' : '移动，按住 Alt 复制'
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { directorActions, totalFrames, type DirectorDocument } from './director'

/** AI 短剧 3D 导演：时间轴 */
defineOptions({ name: 'AiDramaDirectorTimeline' })

const props = defineProps<{
  document: DirectorDocument
  frame: number
  selected: string
  selectedClip: string
  playing: boolean
}>()
const emit = defineEmits<{
  seek: [frame: number]
  play: []
  select: [id: string]
  'add-key': []
  clip: [objectId: string, id: string]
  'move-key': [id: string, from: number, to: number, copy: boolean]
}>()

const end = computed(() => totalFrames(props.document) - 1)

/** 帧号输入：双向绑定，change 时跳转；当前帧变化时同步 */
const frameInput = ref<number>(props.frame)
watch(
  () => props.frame,
  (value) => (frameInput.value = value)
)
const tracks = computed(() => [
  { id: 'camera', name: '摄影机 · 运镜', keys: props.document.camera.keys, clips: [] },
  ...props.document.objects.map((item) => ({
    id: item.id,
    name: item.name,
    keys: item.keys,
    clips: item.clips || []
  }))
])
const percent = (frame: number) => `${(frame / end.value) * 100}%`

/** 拖动关键帧：移动，按住 Alt 复制 */
const drag = ref<{ id: string; from: number; to: number; left: number; width: number; x: number }>()
const handleKeyDown = (event: PointerEvent, id: string, from: number) => {
  if (props.playing) {
    return
  }
  const target = event.currentTarget as HTMLElement
  const rect = target.parentElement!.getBoundingClientRect()
  target.setPointerCapture(event.pointerId)
  drag.value = { id, from, to: from, left: rect.left, width: rect.width, x: event.clientX }
}
const handleKeyMove = (event: PointerEvent) => {
  if (!drag.value || Math.abs(event.clientX - drag.value.x) < 4) {
    return
  }
  const to = Math.round(((event.clientX - drag.value.left) / drag.value.width) * end.value)
  drag.value = { ...drag.value, to: Math.max(0, Math.min(end.value, to)) }
}
const handleKeyUp = (event: PointerEvent) => {
  const value = drag.value
  if (!value) {
    return
  }
  drag.value = undefined
  if (value.to !== value.from) {
    emit('move-key', value.id, value.from, value.to, event.altKey)
  } else {
    emit('select', value.id)
    emit('seek', value.from)
  }
}

const handleTrackClick = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  emit('seek', Math.round(((event.clientX - rect.left) / rect.width) * end.value))
}
</script>

<style lang="scss" scoped>
.director-timeline {
  display: flex;
  height: 100%;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  flex-direction: column;
}

.director-track {
  display: flex;
  height: 26px;
  border-top: 1px solid var(--el-border-color-extra-light);
  align-items: center;

  &__name {
    width: 140px;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    flex-shrink: 0;
  }

  &__line {
    position: relative;
    height: 22px;
    cursor: crosshair;
    border-left: 1px solid var(--el-border-color-lighter);
    flex: 1;
  }

  &__playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    pointer-events: none;
    background: var(--el-color-primary);
  }

  &__key {
    position: absolute;
    top: 7px;
    width: 8px;
    height: 8px;
    cursor: ew-resize;
    background: var(--el-color-primary-light-5);
    border: 1px solid #fff;
    transform: translateX(-50%) rotate(45deg);
    touch-action: none;
  }

  &__clip {
    position: absolute;
    top: 2px;
    height: 18px;
    padding: 0 6px;
    overflow: hidden;
    font-size: 11px;
    line-height: 16px;
    color: var(--el-color-primary);
    white-space: nowrap;
    cursor: pointer;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 3px;
    box-sizing: border-box;

    &.is-active {
      border-color: var(--el-color-primary);
    }
  }
}

.is-selected {
  .director-track__name {
    color: var(--el-color-primary);
  }

  .director-track__key {
    background: var(--el-color-primary);
  }
}
</style>
