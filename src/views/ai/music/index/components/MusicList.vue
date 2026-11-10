<!-- AI 音乐：作品列表（我的作品、音乐广场共用） -->
<template>
  <div v-loading="loading" class="min-h-200px">
    <el-empty
      v-if="!loading && list.length === 0"
      :description="square ? '还没有公开的作品' : '还没有作品，在左侧开始创作吧'"
    />
    <div
      v-for="item in list"
      :key="item.id"
      class="mb-12px flex gap-12px rounded-8px border border-solid border-[var(--el-border-color-lighter)] p-12px"
      :class="{ '!border-[var(--el-color-primary)]': item.id === currentId }"
    >
      <!-- 封面：点击播放 -->
      <div
        class="relative h-88px w-88px flex-shrink-0 overflow-hidden rounded-6px bg-[var(--el-fill-color)]"
        :class="{ 'cursor-pointer': canPlay(item) }"
        @click="canPlay(item) && emit('play', item)"
      >
        <el-image v-if="item.coverUrl" :src="item.coverUrl" fit="cover" class="h-full w-full" />
        <div v-else class="h-full w-full flex items-center justify-center text-24px">
          <Icon icon="ep:headset" :size="28" class="text-[var(--el-text-color-placeholder)]" />
        </div>
        <div
          v-if="isAiMusicRunning(item.status)"
          class="absolute inset-0 flex items-center justify-center bg-white/70"
        >
          <Icon icon="ep:loading" :size="22" class="is-loading text-[var(--el-color-primary)]" />
        </div>
        <div
          v-else-if="canPlay(item)"
          class="absolute inset-0 flex items-center justify-center bg-black/20 text-white"
        >
          <Icon
            :icon="item.id === currentId && playing ? 'ep:video-pause' : 'ep:video-play'"
            :size="28"
          />
        </div>
      </div>

      <!-- 信息与操作 -->
      <div class="min-w-0 flex flex-1 flex-col">
        <div class="flex items-center gap-6px">
          <span
            class="cursor-pointer truncate text-15px font-bold hover:text-[var(--el-color-primary)]"
            :title="getMusicTitle(item.title)"
            @click="emit('detail', item)"
          >
            {{ getMusicTitle(item.title) }}
          </span>
          <el-tag size="small" type="info" class="flex-shrink-0">{{ item.model }}</el-tag>
          <el-tag
            v-if="getModeTag(item)"
            size="small"
            :type="getModeTag(item)!.type"
            class="flex-shrink-0"
          >
            {{ getModeTag(item)!.label }}
          </el-tag>
          <el-tag v-if="item.makeInstrumental" size="small" type="info" class="flex-shrink-0">
            纯音乐
          </el-tag>
          <el-tag
            v-if="!square && item.publicStatus"
            size="small"
            type="success"
            class="flex-shrink-0"
          >
            已公开
          </el-tag>
        </div>
        <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
          {{ getDescription(item) }}
        </div>

        <!-- 状态 -->
        <div class="mt-6px flex-1 text-12px">
          <template v-if="isAiMusicRunning(item.status)">
            <div class="flex items-center gap-8px">
              <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="item.status" />
              <el-progress
                :percentage="item.progress || 0"
                :stroke-width="6"
                class="max-w-240px flex-1"
              />
            </div>
            <div class="mt-4px text-[var(--el-text-color-placeholder)]">
              {{
                item.status === AiMusicStatusEnum.SAVING
                  ? '正在保存封面与音频，完成后即可播放'
                  : '通常 1~3 分钟完成'
              }}
            </div>
          </template>
          <div
            v-else-if="item.status === AiMusicStatusEnum.FAIL"
            class="line-clamp-2 text-[var(--el-color-danger)]"
            :title="item.errorMessage"
          >
            <Icon icon="ep:warning-filled" class="mr-2px" />
            {{ item.errorMessage || '生成失败' }}
          </div>
          <div v-else class="text-[var(--el-text-color-secondary)]">
            {{ formatMusicDuration(item.duration) }}
            <span class="ml-8px">
              <Icon icon="ep:headset" class="mr-2px" />{{ item.playCount || 0 }}
            </span>
            <span class="ml-8px">{{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }}</span>
          </div>
        </div>

        <!-- 操作：右下角 -->
        <div class="mt-6px flex flex-wrap items-center justify-end gap-x-12px gap-y-4px">
          <template v-if="item.status === AiMusicStatusEnum.SUCCESS">
            <el-button link type="primary" :disabled="!item.audioUrl" @click="emit('play', item)">
              <Icon
                :icon="item.id === currentId && playing ? 'ep:video-pause' : 'ep:video-play'"
                class="mr-2px"
              />
              {{ item.id === currentId && playing ? '暂停' : '播放' }}
            </el-button>
            <el-link
              v-if="item.audioUrl"
              type="primary"
              :underline="false"
              :href="item.audioUrl"
              download
              target="_blank"
            >
              <Icon icon="ep:download" class="mr-2px" /> 下载
            </el-link>
            <el-link
              v-if="item.videoUrl"
              type="primary"
              :underline="false"
              :href="item.videoUrl"
              target="_blank"
            >
              <Icon icon="ep:video-camera" class="mr-2px" /> 视频
            </el-link>
          </template>
          <template v-if="square">
            <el-button link type="primary" @click="emit('detail', item)">详情</el-button>
          </template>
          <template v-else>
            <template v-if="item.status === AiMusicStatusEnum.SUCCESS">
              <el-button
                v-if="item.generateMode === AiMusicGenerateModeEnum.EXTEND"
                link
                type="primary"
                @click="emit('concat', item)"
              >
                <Icon icon="ep:connection" class="mr-2px" /> 合并
              </el-button>
              <el-button link type="primary" @click="emit('extend', item)">
                <Icon icon="ep:d-arrow-right" class="mr-2px" /> 续写
              </el-button>
              <el-button link type="primary" @click="emit('edit', item)">
                <Icon icon="ep:edit" class="mr-2px" /> 编辑
              </el-button>
              <span class="inline-flex items-center text-12px text-[var(--el-text-color-regular)]">
                公开
                <el-switch
                  :model-value="item.publicStatus"
                  size="small"
                  class="ml-4px"
                  @change="(value) => emit('public', item, value as boolean)"
                />
              </span>
            </template>
            <el-button
              link
              type="danger"
              :disabled="isAiMusicRunning(item.status)"
              @click="emit('delete', item)"
            >
              <Icon icon="ep:delete" class="mr-2px" /> 删除
            </el-button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { MusicVO } from '@/api/ai/music'
import {
  AiMusicGenerateModeEnum,
  AiMusicStatusEnum,
  isAiMusicRunning
} from '@/views/ai/utils/constants'
import { formatMusicDuration, getMusicTitle } from '@/views/ai/utils/utils'

/** AI 音乐：作品列表 */
defineOptions({ name: 'AiMusicList' })

const props = withDefaults(
  defineProps<{
    list: MusicVO[]
    loading?: boolean
    square?: boolean // 是否音乐广场：只读，显示作者
    currentId?: number // 播放器当前的音乐编号
    playing?: boolean // 播放器是否播放中
  }>(),
  { loading: false, square: false }
)
const emit = defineEmits<{
  play: [item: MusicVO]
  detail: [item: MusicVO]
  extend: [item: MusicVO]
  concat: [item: MusicVO]
  edit: [item: MusicVO]
  delete: [item: MusicVO]
  public: [item: MusicVO, value: boolean]
}>()

/** 是否可播放：已完成且有音频 */
const canPlay = (item: MusicVO) => item.status === AiMusicStatusEnum.SUCCESS && !!item.audioUrl

/** 生成模式标签：续写、完整歌曲、用户上传 */
const getModeTag = (
  item: MusicVO
): { label: string; type: 'primary' | 'success' | 'warning' } | undefined => {
  switch (item.generateMode) {
    case AiMusicGenerateModeEnum.EXTEND:
      return { label: '续写', type: 'primary' }
    case AiMusicGenerateModeEnum.CONCAT:
      return { label: '完整歌曲', type: 'success' }
    case AiMusicGenerateModeEnum.UPLOAD:
      return { label: '用户上传', type: 'warning' }
    default:
      return undefined
  }
}

/** 描述行：续写来源 / 风格 / 描述；广场附作者 */
const getDescription = (item: MusicVO) => {
  let text: string
  if (item.generateMode === AiMusicGenerateModeEnum.EXTEND && item.refMusicId) {
    text = `续写自 #${item.refMusicId}，${formatMusicDuration(item.extendSeconds)} 起`
  } else if (item.generateMode === AiMusicGenerateModeEnum.CONCAT && item.refMusicId) {
    text = `合并：#${item.refMusicId} 与原曲`
  } else {
    text = item.tags || item.prompt || '-'
  }
  if (props.square && item.userNickname) {
    text += ` · by ${item.userNickname}`
  }
  return text
}
</script>
