<!-- AI 音乐：作品详情抽屉 -->
<template>
  <el-drawer v-model="visible" title="作品详情" size="460px">
    <div v-loading="loading" class="min-h-200px">
      <template v-if="detail">
        <div class="flex gap-16px">
          <el-image
            :src="detail.coverUrl"
            :preview-src-list="detail.coverUrl ? [detail.coverUrl] : []"
            preview-teleported
            fit="cover"
            class="h-120px w-120px flex-shrink-0 rounded-8px bg-[var(--el-fill-color)]"
          >
            <template #error>
              <div class="h-full w-full flex items-center justify-center">
                <Icon icon="ep:headset" :size="32" />
              </div>
            </template>
          </el-image>
          <div class="min-w-0 flex-1">
            <div class="break-all text-20px font-bold">{{ getMusicTitle(detail.title) }}</div>
            <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
              {{ detail.tags || detail.prompt || '' }}
            </div>
            <div class="mt-8px text-13px">{{ detail.userNickname || '' }}</div>
            <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
              {{ formatDate(detail.createTime, 'YYYY-MM-DD HH:mm') }} · {{ detail.model }} ·
              {{ formatMusicDuration(detail.duration) }}
            </div>
            <div class="mt-10px flex flex-wrap gap-8px">
              <el-button
                type="primary"
                size="small"
                :disabled="!canPlay"
                @click="emit('play', detail)"
              >
                <Icon icon="ep:video-play" class="mr-4px" /> 播放 {{ detail.playCount || 0 }}
              </el-button>
              <el-button size="small" @click="copyLink">复制链接</el-button>
              <el-button
                v-if="canPlay"
                size="small"
                tag="a"
                :href="detail.audioUrl"
                download
                target="_blank"
              >
                下载
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="detail.status !== AiMusicStatusEnum.SUCCESS" class="mt-16px">
          <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="detail.status" />
          <span
            v-if="detail.status === AiMusicStatusEnum.FAIL"
            class="ml-8px text-12px text-[var(--el-color-danger)]"
          >
            {{ detail.errorMessage }}
          </span>
        </div>

        <div class="mb-8px mt-20px font-bold">歌词</div>
        <div
          class="max-h-420px overflow-y-auto whitespace-pre-wrap rounded-4px bg-[var(--el-fill-color-light)] p-14px text-13px leading-22px"
        >
          {{ detail.lyric || (detail.makeInstrumental ? '纯音乐，无歌词' : '暂无歌词') }}
        </div>

        <div class="mb-6px mt-20px font-bold">来源</div>
        <div class="text-12px text-[var(--el-text-color-secondary)]">{{ sourceText }}</div>

        <template v-if="detail.videoUrl">
          <div class="mb-8px mt-20px font-bold">视频</div>
          <el-button
            size="small"
            type="primary"
            plain
            tag="a"
            :href="detail.videoUrl"
            target="_blank"
          >
            <Icon icon="ep:video-play" class="mr-4px" /> 在线查看
          </el-button>
          <el-button size="small" tag="a" :href="detail.videoUrl" download target="_blank">
            下载视频
          </el-button>
        </template>
      </template>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { MusicApi, MusicVO } from '@/api/ai/music'
import { AiMusicGenerateModeEnum, AiMusicStatusEnum } from '@/views/ai/utils/constants'
import { formatMusicDuration, getMusicTitle } from '@/views/ai/utils/utils'

/** AI 音乐：作品详情抽屉 */
defineOptions({ name: 'AiMusicDetailDrawer' })

const emit = defineEmits<{
  play: [item: MusicVO]
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const visible = ref(false) // 是否展示
const loading = ref(false) // 加载中
const detail = ref<MusicVO>() // 详情

const canPlay = computed(
  () => detail.value?.status === AiMusicStatusEnum.SUCCESS && !!detail.value?.audioUrl
)
const sourceText = computed(() => {
  const item = detail.value
  if (!item) {
    return ''
  }
  const mode = getDictLabel(DICT_TYPE.AI_GENERATE_MODE, item.generateMode) || '-'
  if (item.generateMode === AiMusicGenerateModeEnum.EXTEND && item.refMusicId) {
    const start = formatMusicDuration(item.extendSeconds)
    return `${mode} · 续写自 #${item.refMusicId}，从 ${start} 起`
  }
  if (item.generateMode === AiMusicGenerateModeEnum.CONCAT && item.refMusicId) {
    return `${mode} · 由续写作品 #${item.refMusicId} 与原曲合并`
  }
  return mode
})

/** 打开：本人或已公开的作品；无权查看时后端返回“音乐不存在” */
const open = async (id: number) => {
  visible.value = true
  detail.value = undefined
  loading.value = true
  try {
    detail.value = await MusicApi.getMusicDetail(id)
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

/** 复制链接：当前页面地址 + ?id= */
const copyLink = async () => {
  if (!detail.value) {
    return
  }
  const url = new URL(window.location.href)
  url.search = `?id=${detail.value.id}`
  url.hash = ''
  const { copy, copied, isSupported } = useClipboard({ legacy: true, source: url.toString() })
  if (!isSupported) {
    message.error(t('common.copyError'))
    return
  }
  await copy()
  if (unref(copied)) {
    message.success(t('common.copySuccess'))
  }
}
</script>
