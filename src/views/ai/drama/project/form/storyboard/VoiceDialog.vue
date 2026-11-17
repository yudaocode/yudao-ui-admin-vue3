<!-- AI 短剧：镜头声音；发言角色可手动指定，预览生成视频时带上的样音、参考音频 -->
<template>
  <Dialog v-model="dialogVisible" :title="`镜头声音 · #${storyboard?.sceneNo ?? ''}`" width="720px">
    <div v-loading="loading">
      <el-form label-width="100px">
        <el-form-item label="发言角色">
          <el-select
            v-model="speakerIds"
            multiple
            placeholder="为空时按台词自动识别"
            class="!w-full"
          >
            <el-option
              v-for="item in detail.characters"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{
              voice?.explicit ? '当前为手动指定' : '当前按台词自动识别'
            }}；按顺序对应参考音频的编号
          </div>
        </el-form-item>
      </el-form>
      <el-divider content-position="left">生成视频时使用</el-divider>
      <el-empty
        v-if="!voice?.speakers.length && !voice?.referenceAudios.length"
        description="没有发言角色和参考音频"
        :image-size="60"
      />
      <div v-for="item in voice?.speakers || []" :key="item.characterId" class="mb-8px">
        <span class="font-500">{{ item.name }}</span>
        <span class="ml-8px text-12px text-[var(--el-text-color-secondary)]">
          {{ item.voiceDescription || '未设置声音描述' }}
        </span>
        <el-tag v-if="!item.sampleAudioUrl" size="small" type="warning" class="ml-8px">
          未选用样音
        </el-tag>
      </div>
      <div
        v-for="item in voice?.referenceAudios || []"
        :key="item.url"
        class="mb-8px flex items-center gap-8px"
      >
        <span class="w-220px text-12px">{{ item.description }}</span>
        <audio :src="item.url" controls preload="none" class="h-32px flex-1"></audio>
      </div>
      <div class="text-12px leading-18px text-[var(--el-text-color-secondary)]">
        声音描述作为文字写入视频提示词（当前语音合成只支持选择音色，不支持按描述设计音色）；
        参考音频只在不使用起始帧、且视频模型支持参考生视频时提交，模型不支持时自动去掉
      </div>
    </div>
    <template #footer>
      <el-button @click="handleAuto">恢复自动识别</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保 存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import {
  DramaStoryboardApi,
  DramaStoryboardVO,
  DramaStoryboardVoiceVO
} from '@/api/ai/drama/storyboard'

/** AI 短剧：镜头声音 */
defineOptions({ name: 'AiDramaVoiceDialog' })

defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const storyboard = ref<DramaStoryboardVO>()
const voice = ref<DramaStoryboardVoiceVO>()
const speakerIds = ref<number[]>([])

const loadVoice = async () => {
  loading.value = true
  try {
    voice.value = await DramaStoryboardApi.getStoryboardVoice(storyboard.value!.id)
    speakerIds.value = voice.value.explicit
      ? voice.value.speakers.map((item) => item.characterId)
      : []
  } finally {
    loading.value = false
  }
}

const open = async (row: DramaStoryboardVO) => {
  storyboard.value = row
  voice.value = undefined
  dialogVisible.value = true
  await loadVoice()
}
defineExpose({ open })

const save = async (characterIds?: number[]) => {
  saving.value = true
  try {
    await DramaStoryboardApi.updateStoryboardSpeakers(storyboard.value!.id, characterIds)
    message.success('已保存')
    emit('success')
    await loadVoice()
  } finally {
    saving.value = false
  }
}

const handleSave = () => save(speakerIds.value.length ? speakerIds.value : undefined)

const handleAuto = () => {
  speakerIds.value = []
  save(undefined)
}
</script>
