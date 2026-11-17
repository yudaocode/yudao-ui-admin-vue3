<!-- AI 短剧：合成成片，选择镜头、转场、旁白、水印 -->
<template>
  <Dialog v-model="dialogVisible" title="合成成片" width="720px">
    <el-form :model="formData" label-width="90px">
      <el-form-item label="镜头">
        <div class="w-full">
          <el-checkbox
            :model-value="formData.storyboardIds.length === orderedStoryboards.length"
            :indeterminate="
              formData.storyboardIds.length > 0 &&
              formData.storyboardIds.length < orderedStoryboards.length
            "
            @change="handleCheckAll"
          >
            全选（{{ playOrder ? '按画布中的镜头顺序拼接' : '按镜头顺序拼接' }}）
          </el-checkbox>
          <el-checkbox-group v-model="formData.storyboardIds" class="flex flex-col">
            <el-checkbox v-for="item in orderedStoryboards" :key="item.id" :value="item.id">
              {{ item.sceneNo }}. {{ item.title || '未命名镜头' }}
              <span class="text-12px text-[var(--el-text-color-secondary)]"
                >（{{ item.duration || '-' }} 秒）</span
              >
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-form-item>
      <el-form-item label="画幅">
        <el-radio-group v-model="formData.aspectRatio">
          <el-radio-button v-for="item in DRAMA_ASPECT_RATIOS" :key="item" :value="item">{{
            item
          }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="转场">
        <el-radio-group v-model="formData.transitionType">
          <el-radio-button v-for="item in DRAMA_TRANSITIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
        <el-input-number
          v-if="formData.transitionType !== DRAMA_TRANSITION_NONE"
          v-model="formData.transitionDuration"
          :min="0.1"
          :max="2"
          :step="0.1"
          :precision="1"
          controls-position="right"
          class="ml-12px !w-120px"
        />
        <span v-if="formData.transitionType !== DRAMA_TRANSITION_NONE" class="ml-6px text-12px"
          >秒，需短于每个镜头</span
        >
      </el-form-item>
      <el-form-item label="旁白">
        <div class="w-full">
          <el-select
            v-model="formData.narrationAudioId"
            placeholder="不使用旁白"
            clearable
            class="!w-full"
          >
            <el-option
              v-for="(item, index) in narrations"
              :key="item.id"
              :label="`旁白 ${index + 1}`"
              :value="item.id"
            />
          </el-select>
          <audio
            v-if="narrationUrl"
            :src="narrationUrl"
            controls
            class="mt-6px h-32px w-full"
          ></audio>
          <el-collapse class="mt-6px">
            <el-collapse-item title="上传或生成旁白" name="narration">
              <div class="mb-8px flex items-start gap-8px">
                <UploadFile
                  v-model="uploadAudioUrl"
                  :file-type="['mp3', 'wav', 'm4a']"
                  :file-size="20"
                  :limit="1"
                  :is-show-tip="false"
                />
                <el-button :disabled="!uploadAudioUrl" @click="handleUploadNarration">
                  保存上传的旁白
                </el-button>
              </div>
              <AudioGenerateForm
                :project-id="detail.project.id"
                :default-text="narrationText"
                @success="emit('success')"
              />
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-form-item>
      <el-form-item label="水印">
        <el-input
          v-model="formData.watermarkText"
          placeholder="可选，显示在画面右下角"
          maxlength="32"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button
        type="primary"
        :disabled="formData.storyboardIds.length < 2"
        :loading="submitting"
        @click="submitForm"
      >
        开始合成
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectApi, DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import { AiDramaAudioTypeEnum, AiDramaStatusEnum } from '@/views/ai/utils/constants'
import {
  DRAMA_ASPECT_RATIOS,
  DRAMA_TRANSITION_NONE,
  DRAMA_TRANSITIONS
} from '@/views/ai/utils/drama'
import AudioGenerateForm from './AudioGenerateForm.vue'

/** AI 短剧：合成成片 */
defineOptions({ name: 'AiDramaComposeForm' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const submitting = ref(false)
const uploadAudioUrl = ref('')
const formData = reactive({
  storyboardIds: [] as number[],
  aspectRatio: '9:16',
  transitionType: DRAMA_TRANSITION_NONE,
  transitionDuration: 0.5,
  narrationAudioId: undefined as number | undefined,
  watermarkText: ''
})

/** 视频已完成的镜头 */
const successStoryboards = computed(() =>
  props.detail.storyboards.filter(
    (item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl
  )
)
/** 拼接顺序：画布指定时按画布中视频节点的顺序，只含其中的镜头；否则按镜头顺序 */
const playOrder = ref<number[]>()
const orderedStoryboards = computed(() =>
  playOrder.value
    ? playOrder.value
        .map((id) => successStoryboards.value.find((item) => item.id === id)!)
        .filter(Boolean)
    : successStoryboards.value
)
const narrations = computed(() =>
  props.detail.audios.filter((item) => item.type === AiDramaAudioTypeEnum.NARRATION)
)
const narrationUrl = computed(
  () => narrations.value.find((item) => item.id === formData.narrationAudioId)?.fileUrl
)
/** 旁白默认文本：剧情大纲 */
const narrationText = computed(() => props.detail.script?.outline?.slice(0, 2000) || '')

const open = (storyboardIds?: number[]) => {
  const project = props.detail.project
  dialogVisible.value = true
  playOrder.value = storyboardIds
  formData.storyboardIds = orderedStoryboards.value.map((item) => item.id)
  formData.aspectRatio = project.composeAspectRatio || '9:16'
  formData.transitionType = project.composeTransitionType ?? DRAMA_TRANSITION_NONE
  formData.transitionDuration = project.composeTransitionDurationSeconds || 0.5
  formData.narrationAudioId = undefined
  formData.watermarkText = ''
  uploadAudioUrl.value = ''
}
defineExpose({ open })

const handleCheckAll = (value: string | number | boolean) => {
  formData.storyboardIds = value ? orderedStoryboards.value.map((item) => item.id) : []
}

const handleUploadNarration = async () => {
  await DramaAssetApi.createAudio({
    projectId: props.detail.project.id,
    type: AiDramaAudioTypeEnum.NARRATION,
    fileUrl: uploadAudioUrl.value
  })
  uploadAudioUrl.value = ''
  message.success('旁白已保存')
  emit('success')
}

const submitForm = async () => {
  submitting.value = true
  try {
    await DramaProjectApi.composeProject({
      projectId: props.detail.project.id,
      // 按镜头顺序（或画布中的顺序）拼接
      storyboardIds: orderedStoryboards.value
        .filter((item) => formData.storyboardIds.includes(item.id))
        .map((item) => item.id),
      aspectRatio: formData.aspectRatio,
      transitionType: formData.transitionType,
      transitionDuration:
        formData.transitionType === DRAMA_TRANSITION_NONE ? undefined : formData.transitionDuration,
      narrationAudioId: formData.narrationAudioId,
      watermarkText: formData.watermarkText || undefined
    })
    message.success('已开始合成，完成后自动刷新')
    dialogVisible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>
