<!-- AI 语音管理：详情弹窗；只查看，不提供再次生成 -->
<template>
  <Dialog v-model="dialogVisible" title="语音详情" width="800px" @closed="stopPlay">
    <el-descriptions v-loading="loading" :column="2" :label-width="120" border>
      <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="用户">{{ detail.userNickname || '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        {{ detail.status !== undefined ? AiSpeechStatusLabels[detail.status] || '-' : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="平台">
        <dict-tag v-if="detail.platform" :type="DICT_TYPE.AI_PLATFORM" :value="detail.platform" />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="模型">{{ detail.model || '-' }}</el-descriptions-item>
      <el-descriptions-item label="音色">
        {{ detail.platform ? getSpeechVoiceLabel(detail as SpeechVO) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="格式">{{ getSpeechFormatLabel(detail.format) }}</el-descriptions-item>
      <el-descriptions-item label="语速">{{ formatSpeechSpeed(detail.speed) }}</el-descriptions-item>
      <el-descriptions-item label="音频大小">
        {{ formatSpeechSize(detail.audioSize) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ detail.createTime ? formatDate(detail.createTime) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="完成时间">
        {{ detail.finishTime ? formatDate(detail.finishTime) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="detail.status === AiSpeechStatusEnum.FAIL"
        label="失败原因"
        :span="2"
      >
        <span class="text-[var(--el-color-danger)]">{{ detail.errorMessage || '-' }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="朗读文本" :span="2">
        <div
          v-if="detail.inputText"
          class="max-h-200px overflow-y-auto whitespace-pre-wrap leading-20px"
        >
          {{ detail.inputText }}
        </div>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="音频" :span="2">
        <div v-if="canPlaySpeech(detail as SpeechVO)" class="flex items-center gap-12px">
          <el-button type="primary" size="small" @click="togglePlay">
            <Icon :icon="playing ? 'ep:video-pause' : 'ep:video-play'" class="mr-4px" />
            {{ playing ? '暂停' : '播放' }}
          </el-button>
          <el-link type="primary" @click="downloadSpeech(detail as SpeechVO)">下载</el-link>
        </div>
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
import { SpeechApi, SpeechVO } from '@/api/ai/speech'
import {
  AiSpeechStatusEnum,
  AiSpeechStatusLabels,
  canPlaySpeech,
  downloadSpeech,
  formatSpeechSize,
  formatSpeechSpeed,
  getSpeechFormatLabel,
  getSpeechVoiceLabel
} from '@/views/ai/utils/speech'

/** AI 语音管理：详情弹窗 */
defineOptions({ name: 'AiSpeechDetail' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 加载中
const detail = ref<Partial<SpeechVO>>({}) // 详情数据

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  detail.value = {}
  loading.value = true
  try {
    const data = await SpeechApi.getSpeech(id)
    // 打开期间被删除时，后端返回空
    if (!data) {
      message.warning('语音不存在或已删除')
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
