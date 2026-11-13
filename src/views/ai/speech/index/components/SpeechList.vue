<!-- AI 语音：我的语音列表 -->
<template>
  <div v-loading="loading" class="min-h-200px">
    <el-empty v-if="!loading && list.length === 0" description="还没有语音，在左侧开始合成吧" />
    <div
      v-for="item in list"
      :key="item.id"
      class="mb-12px flex gap-12px rounded-8px border border-solid border-[var(--el-border-color-lighter)] p-12px"
      :class="{ '!border-[var(--el-color-primary)]': item.id === currentId }"
    >
      <!-- 播放：点击播放 / 暂停 -->
      <div
        class="h-56px w-56px flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--el-fill-color)]"
        :class="{
          'cursor-pointer hover:bg-[var(--el-color-primary-light-9)]': canPlaySpeech(item)
        }"
        @click="canPlaySpeech(item) && emit('play', item)"
      >
        <Icon
          v-if="isSpeechRunning(item)"
          icon="ep:loading"
          :size="22"
          class="is-loading text-[var(--el-color-primary)]"
        />
        <Icon
          v-else-if="canPlaySpeech(item)"
          :icon="item.id === currentId && playing ? 'ep:video-pause' : 'ep:video-play'"
          :size="26"
          class="text-[var(--el-color-primary)]"
        />
        <Icon v-else icon="ep:mute" :size="22" class="text-[var(--el-text-color-placeholder)]" />
      </div>

      <!-- 信息与操作 -->
      <div class="min-w-0 flex flex-1 flex-col">
        <div
          class="line-clamp-2 cursor-pointer break-all text-14px leading-22px hover:text-[var(--el-color-primary)]"
          :title="item.inputText"
          @click="emit('detail', item)"
        >
          {{ item.inputText }}
        </div>
        <div class="mt-6px flex flex-wrap items-center gap-6px">
          <el-tag size="small" type="info">{{ item.model }}</el-tag>
          <el-tag size="small" type="info">{{ getSpeechVoiceLabel(item) }}</el-tag>
          <el-tag size="small" type="info">{{ getSpeechFormatLabel(item.format) }}</el-tag>
          <el-tag size="small" type="info">{{ formatSpeechSpeed(item.speed) }}</el-tag>
        </div>

        <!-- 状态 -->
        <div class="mt-6px flex-1 text-12px">
          <div
            v-if="isSpeechRunning(item)"
            class="flex items-center gap-6px text-[var(--el-color-primary)]"
          >
            <el-tag size="small">生成中</el-tag>
            <span class="text-[var(--el-text-color-placeholder)]">完成后自动刷新</span>
          </div>
          <div
            v-else-if="item.status === AiSpeechStatusEnum.FAIL"
            class="line-clamp-2 break-all text-[var(--el-color-danger)]"
            :title="item.errorMessage"
          >
            <Icon icon="ep:warning-filled" class="mr-2px" />
            {{ item.errorMessage || '生成失败' }}
          </div>
          <div v-else class="text-[var(--el-text-color-secondary)]">
            {{ formatSpeechSize(item.audioSize) }}
            <span class="ml-8px">{{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }}</span>
          </div>
        </div>

        <!-- 操作：右下角 -->
        <div class="mt-6px flex flex-wrap items-center justify-end gap-x-12px gap-y-4px">
          <template v-if="canPlaySpeech(item)">
            <el-button link type="primary" @click="emit('play', item)">
              <Icon
                :icon="item.id === currentId && playing ? 'ep:video-pause' : 'ep:video-play'"
                class="mr-2px"
              />
              {{ item.id === currentId && playing ? '暂停' : '播放' }}
            </el-button>
            <el-button link type="primary" @click="downloadSpeech(item)">
              <Icon icon="ep:download" class="mr-2px" /> 下载
            </el-button>
          </template>
          <el-button link type="primary" @click="emit('detail', item)">
            <Icon icon="ep:document" class="mr-2px" /> 详情
          </el-button>
          <el-button link type="primary" @click="emit('again', item)">
            <Icon icon="ep:refresh-right" class="mr-2px" /> 再次生成
          </el-button>
          <el-button
            link
            type="danger"
            :disabled="isSpeechRunning(item)"
            :title="isSpeechRunning(item) ? '生成中，暂不能删除' : ''"
            @click="emit('delete', item)"
          >
            <Icon icon="ep:delete" class="mr-2px" /> 删除
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { SpeechVO } from '@/api/ai/speech'
import {
  AiSpeechStatusEnum,
  canPlaySpeech,
  downloadSpeech,
  formatSpeechSize,
  formatSpeechSpeed,
  getSpeechFormatLabel,
  getSpeechVoiceLabel,
  isSpeechRunning
} from '@/views/ai/utils/speech'

/** AI 语音：我的语音列表 */
defineOptions({ name: 'AiSpeechList' })

defineProps<{
  list: SpeechVO[] // 语音列表
  loading: boolean // 加载中
  currentId?: number // 播放器当前的语音
  playing: boolean // 播放器是否播放中
}>()

const emit = defineEmits<{
  play: [item: SpeechVO]
  detail: [item: SpeechVO]
  again: [item: SpeechVO]
  delete: [item: SpeechVO]
}>()
</script>
