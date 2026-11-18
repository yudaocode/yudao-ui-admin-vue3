<!-- AI 短剧：合成设置，选择镜头、转场、画幅、旁白、水印；成片条内嵌，合成成片弹窗（画布）共用 -->
<template>
  <el-form :model="formData" label-width="70px">
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
        <el-checkbox-group v-model="formData.storyboardIds" class="flex flex-wrap gap-x-12px">
          <el-checkbox v-for="item in orderedStoryboards" :key="item.id" :value="item.id">
            镜 {{ item.sceneNo }} {{ item.title || '未命名镜头' }}
            <span class="text-12px text-[var(--el-text-color-secondary)]"
              >（{{ item.duration || '-' }} 秒）</span
            >
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </el-form-item>
    <el-form-item label="转场">
      <el-radio-group v-model="formData.transitionType">
        <el-radio-button v-for="item in DRAMA_TRANSITIONS" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
      <template v-if="formData.transitionType !== DRAMA_TRANSITION_NONE">
        <el-input-number
          v-model="formData.transitionDuration"
          :min="0.1"
          :max="2"
          :step="0.1"
          :precision="1"
          controls-position="right"
          class="ml-12px !w-110px"
        />
        <span class="ml-6px text-12px">秒，需短于每个镜头</span>
      </template>
    </el-form-item>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-form-item label="画幅">
          <el-select v-model="formData.aspectRatio" class="!w-full">
            <el-option
              v-for="item in DRAMA_ASPECT_RATIOS"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="水印">
          <el-input
            v-model="formData.watermarkText"
            placeholder="可选，显示在右下角"
            maxlength="32"
            clearable
          />
        </el-form-item>
      </el-col>
    </el-row>
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
              @success="emit('refresh')"
            />
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-form-item>
    <div class="flex items-center justify-end gap-8px">
      <span v-if="hint" class="text-12px text-[var(--el-color-warning)]">{{ hint }}</span>
      <span
        v-if="formData.storyboardIds.length < 2"
        class="text-12px text-[var(--el-text-color-secondary)]"
      >
        至少选择 2 个视频已完成的镜头
      </span>
      <el-button
        type="primary"
        :disabled="
          formData.storyboardIds.length < 2 || isAiDramaRunning(detail.project.composeStatus)
        "
        :loading="formLoading"
        @click="submitForm"
      >
        合成所选 {{ formData.storyboardIds.length }} 段
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { DramaComposeReqVO, DramaProjectApi, DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import {
  AiDramaAudioTypeEnum,
  AiDramaStatusEnum,
  isAiDramaRunning
} from '@/views/ai/utils/constants'
import {
  DRAMA_ASPECT_RATIOS,
  DRAMA_TRANSITION_NONE,
  DRAMA_TRANSITIONS
} from '@/views/ai/utils/drama'
import AudioGenerateForm from '../AudioGenerateForm.vue'

/** AI 短剧：合成设置 */
defineOptions({ name: 'AiDramaComposePanel' })

const props = defineProps<{
  detail: DramaProjectDetailVO
  hint?: string // 提交按钮旁的提示，例如「合成输入已变更」
}>()
// success：已提交合成；refresh：旁白有新增，需要刷新详情
const emit = defineEmits<{ success: []; refresh: [] }>()
const message = useMessage() // 消息弹窗

const formLoading = ref(false) // 表单的加载中：提交的按钮禁用
const uploadAudioUrl = ref('') // 待保存的上传旁白
const formData = ref<Omit<DramaComposeReqVO, 'projectId'>>({
  storyboardIds: [],
  aspectRatio: '9:16',
  transitionType: DRAMA_TRANSITION_NONE,
  transitionDuration: 0.5,
  narrationAudioId: undefined,
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
  () => narrations.value.find((item) => item.id === formData.value.narrationAudioId)?.fileUrl
)
/** 旁白默认文本：剧情大纲 */
const narrationText = computed(() => props.detail.script?.outline?.slice(0, 2000) || '')

/** 重置：默认选中当前版本里视频已完成的镜头；转场、画幅取上次合成的设置 */
const reset = (storyboardIds?: number[]) => {
  const project = props.detail.project
  playOrder.value = storyboardIds
  formData.value = {
    storyboardIds: orderedStoryboards.value.map((item) => item.id),
    aspectRatio: project.composeAspectRatio || '9:16',
    transitionType: project.composeTransitionType ?? DRAMA_TRANSITION_NONE,
    transitionDuration: project.composeTransitionDurationSeconds || 0.5,
    narrationAudioId: undefined,
    watermarkText: ''
  }
  uploadAudioUrl.value = ''
}

/** 刷新后：新完成的镜头补入选择；已不再完成的镜头移出；用户取消勾选的保持不选 */
watch(
  () => orderedStoryboards.value.map((item) => item.id),
  (ids, oldIds) => {
    const selectedIds = formData.value.storyboardIds
    const added = ids.filter((id) => !oldIds?.includes(id) && !selectedIds.includes(id))
    formData.value.storyboardIds = [...selectedIds.filter((id) => ids.includes(id)), ...added]
  }
)
defineExpose({ reset })

/** 全选、取消全选镜头 */
const handleCheckAll = (value: string | number | boolean) => {
  formData.value.storyboardIds = value ? orderedStoryboards.value.map((item) => item.id) : []
}

/** 保存上传的旁白 */
const handleUploadNarration = async () => {
  await DramaAssetApi.createAudio({
    projectId: props.detail.project.id,
    type: AiDramaAudioTypeEnum.NARRATION,
    fileUrl: uploadAudioUrl.value
  })
  uploadAudioUrl.value = ''
  message.success('旁白已保存')
  emit('refresh')
}

/** 提交合成 */
const submitForm = async () => {
  formLoading.value = true
  try {
    const { storyboardIds, transitionType, transitionDuration, watermarkText } = formData.value
    const data: DramaComposeReqVO = {
      ...formData.value,
      projectId: props.detail.project.id,
      // 按镜头顺序（或画布中的顺序）拼接，不按勾选顺序
      storyboardIds: orderedStoryboards.value
        .map((item) => item.id)
        .filter((id) => storyboardIds.includes(id)),
      // 无转场时不传时长；没有水印时不传
      transitionDuration: transitionType === DRAMA_TRANSITION_NONE ? undefined : transitionDuration,
      watermarkText: watermarkText || undefined
    }
    await DramaProjectApi.composeProject(data)
    message.success('已开始合成，完成后自动刷新')
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
