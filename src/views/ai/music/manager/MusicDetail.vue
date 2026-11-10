<!-- AI 音乐管理：详情弹窗 -->
<template>
  <Dialog v-model="dialogVisible" title="音乐详情" width="800px" @closed="stopPlay">
    <el-descriptions v-loading="loading" :column="2" :label-width="120" border>
      <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="用户">{{ detail.userNickname || '-' }}</el-descriptions-item>
      <el-descriptions-item label="音乐状态">
        <dict-tag
          v-if="detail.status !== undefined"
          :type="DICT_TYPE.AI_MUSIC_STATUS"
          :value="detail.status"
        />
        <span v-else>-</span>
        <span
          v-if="isAiMusicRunning(detail.status)"
          class="ml-8px text-[var(--el-text-color-secondary)]"
        >
          {{ detail.progress || 0 }}%
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="生成模式">
        <dict-tag
          v-if="detail.generateMode !== undefined"
          :type="DICT_TYPE.AI_GENERATE_MODE"
          :value="detail.generateMode"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="模型">{{ detail.model || '-' }}</el-descriptions-item>
      <el-descriptions-item label="API 密钥">{{ detail.apiKeyName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="任务编号">{{ detail.taskId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="歌曲编号(clip)">
        {{ detail.clipId || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="时长">
        {{ formatMusicDuration(detail.duration) }}
      </el-descriptions-item>
      <el-descriptions-item label="播放次数">{{ detail.playCount ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="是否公开">
        {{ detail.publicStatus ? '是' : '否' }}
      </el-descriptions-item>
      <el-descriptions-item label="来源作品">
        <template v-if="detail.refMusicId">
          {{ detail.refMusicId }}
          <span v-if="detail.extendSeconds !== undefined && detail.extendSeconds !== null">
            （从 {{ formatMusicDuration(detail.extendSeconds) }} 续写）
          </span>
        </template>
        <template v-else>-</template>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detail.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="完成时间">
        {{ detail.finishTime ? formatDate(detail.finishTime) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="detail.status === AiMusicStatusEnum.FAIL"
        label="失败原因"
        :span="2"
      >
        <span class="text-[var(--el-color-danger)]">{{ detail.errorMessage || '-' }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="封面" :span="2">
        <el-image
          v-if="detail.coverUrl"
          :src="detail.coverUrl"
          :preview-src-list="[detail.coverUrl]"
          preview-teleported
          fit="cover"
          class="h-80px w-80px rounded-4px"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="描述 / 风格" :span="2">
        <div v-if="detail.prompt">{{ detail.prompt }}</div>
        <div v-if="detail.tags">{{ detail.tags }}</div>
        <span v-if="!detail.prompt && !detail.tags">-</span>
      </el-descriptions-item>
      <el-descriptions-item label="歌词" :span="2">
        <div
          v-if="detail.lyric"
          class="max-h-200px overflow-y-auto whitespace-pre-wrap leading-20px"
        >
          {{ detail.lyric }}
        </div>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="音频" :span="2">
        <div
          v-if="detail.audioUrl && detail.status === AiMusicStatusEnum.SUCCESS"
          class="flex items-center gap-12px"
        >
          <el-button type="primary" size="small" @click="togglePlay">
            <Icon :icon="playing ? 'ep:video-pause' : 'ep:video-play'" class="mr-4px" />
            {{ playing ? '暂停' : '播放' }}
          </el-button>
          <el-link type="primary" :href="detail.audioUrl" download target="_blank">下载</el-link>
          <span class="text-[var(--el-text-color-secondary)]">
            {{ formatMusicDuration(detail.duration) }}
          </span>
        </div>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="视频" :span="2">
        <template v-if="detail.videoUrl">
          <el-link type="primary" :href="detail.videoUrl" target="_blank">在线查看</el-link>
          <el-link type="primary" :href="detail.videoUrl" download target="_blank" class="ml-12px">
            下载视频
          </el-link>
        </template>
        <span v-else>-</span>
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
    <audio ref="audioRef" class="hidden" @play="playing = true" @pause="playing = false"></audio>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { MusicApi, MusicVO } from '@/api/ai/music'
import { AiMusicStatusEnum, isAiMusicRunning } from '@/views/ai/utils/constants'
import { formatMusicDuration } from '@/views/ai/utils/utils'

/** AI 音乐管理：详情弹窗 */
defineOptions({ name: 'AiMusicDetail' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 加载中
const detail = ref<Partial<MusicVO>>({}) // 详情数据

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  detail.value = {}
  loading.value = true
  try {
    const data = await MusicApi.getMusic(id)
    // 打开期间被删除时，后端返回空
    if (!data) {
      message.warning('音乐不存在或已删除')
      dialogVisible.value = false
      return
    }
    detail.value = data
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 播放 / 暂停 */
const audioRef = ref<HTMLAudioElement>()
const playing = ref(false) // 是否播放中
const togglePlay = () => {
  const audio = audioRef.value
  if (!audio || !detail.value.audioUrl) {
    return
  }
  if (playing.value) {
    audio.pause()
    return
  }
  if (audio.src !== detail.value.audioUrl) {
    audio.src = detail.value.audioUrl
  }
  audio.play().catch(() => message.error('音频加载失败'))
}
const stopPlay = () => {
  audioRef.value?.pause()
}
</script>
