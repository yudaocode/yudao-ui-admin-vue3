<!-- AI 语音：详情抽屉 -->
<template>
  <el-drawer v-model="visible" title="语音详情" size="480px">
    <div v-loading="loading" class="min-h-200px">
      <template v-if="detail">
        <div class="flex flex-wrap items-center gap-8px">
          <el-tag :type="statusTagType">{{ AiSpeechStatusLabels[detail.status] || '-' }}</el-tag>
          <el-button
            type="primary"
            size="small"
            :disabled="!canPlaySpeech(detail)"
            @click="emit('play', detail)"
          >
            <Icon icon="ep:video-play" class="mr-4px" /> 播放
          </el-button>
          <el-button
            size="small"
            :disabled="!canPlaySpeech(detail)"
            @click="downloadSpeech(detail)"
          >
            <Icon icon="ep:download" class="mr-4px" /> 下载
          </el-button>
          <el-button size="small" @click="handleAgain">
            <Icon icon="ep:refresh-right" class="mr-4px" /> 再次生成
          </el-button>
        </div>
        <div
          v-if="detail.status === AiSpeechStatusEnum.FAIL"
          class="mt-10px break-all text-12px text-[var(--el-color-danger)]"
        >
          <Icon icon="ep:warning-filled" class="mr-2px" />
          {{ detail.errorMessage || '生成失败' }}
        </div>

        <el-descriptions :column="1" border size="small" class="mt-16px">
          <el-descriptions-item label="平台">
            {{ getDictLabel(DICT_TYPE.AI_PLATFORM, detail.platform) || detail.platform }}
          </el-descriptions-item>
          <el-descriptions-item label="模型">{{ detail.model }}</el-descriptions-item>
          <el-descriptions-item label="音色">
            {{ getSpeechVoiceLabel(detail) }}
          </el-descriptions-item>
          <el-descriptions-item label="音频格式">
            {{ getSpeechFormatLabel(detail.format) }}
          </el-descriptions-item>
          <el-descriptions-item label="语速">{{
            formatSpeechSpeed(detail.speed)
          }}</el-descriptions-item>
          <el-descriptions-item label="音频大小">
            {{ formatSpeechSize(detail.audioSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(detail.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ detail.finishTime ? formatDate(detail.finishTime) : '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="mb-8px mt-20px flex items-center justify-between">
          <span class="font-bold">朗读文本</span>
          <el-button link type="primary" @click="copyText">
            <Icon icon="ep:copy-document" class="mr-2px" /> 复制
          </el-button>
        </div>
        <div
          class="max-h-420px overflow-y-auto whitespace-pre-wrap break-all rounded-4px bg-[var(--el-fill-color-light)] p-14px text-13px leading-22px"
        >
          {{ detail.inputText }}
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
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

/** AI 语音：详情抽屉 */
defineOptions({ name: 'AiSpeechDetailDrawer' })

const emit = defineEmits<{
  play: [item: SpeechVO]
  again: [item: SpeechVO]
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const visible = ref(false) // 是否展示
const loading = ref(false) // 加载中
const detail = ref<SpeechVO>() // 详情

const statusTagType = computed(() => {
  switch (detail.value?.status) {
    case AiSpeechStatusEnum.SUCCESS:
      return 'success'
    case AiSpeechStatusEnum.FAIL:
      return 'danger'
    default:
      return 'primary'
  }
})

/** 打开：只能查看本人的语音 */
const open = async (id: number) => {
  visible.value = true
  detail.value = undefined
  loading.value = true
  try {
    detail.value = await SpeechApi.getSpeechMy(id)
  } catch {
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 列表轮询拿到新结果时，同步更新详情 */
const update = (item: SpeechVO) => {
  if (visible.value && detail.value?.id === item.id) {
    detail.value = item
  }
}

/** 删除后：正在查看的关闭 */
const closeIf = (id: number) => {
  if (detail.value?.id === id) {
    visible.value = false
  }
}
defineExpose({ open, update, closeIf })

const handleAgain = () => {
  if (detail.value) {
    emit('again', detail.value)
    visible.value = false
  }
}

const copyText = async () => {
  if (!detail.value) {
    return
  }
  const { copy, copied, isSupported } = useClipboard({
    legacy: true,
    source: detail.value.inputText
  })
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
