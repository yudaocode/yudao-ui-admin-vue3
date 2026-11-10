<!-- AI 音乐：左侧创作面板（灵感、自定义、续写、上传） -->
<!-- DONE @AI：需要有个 Music 前缀噢？（CreatePanel.vue 改名为 MusicCreatePanel.vue） -->
<template>
  <ContentWrap class="h-full w-full" :body-style="{ height: '100%', overflowY: 'auto' }">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      v-loading="uploading"
      element-loading-text="音频上传中..."
    >
      <!-- 续写来源 -->
      <template v-if="extendSource">
        <div class="mb-12px flex items-center justify-between">
          <span class="text-16px font-bold">续写歌曲</span>
          <el-button link type="primary" @click="cancelExtend">
            <Icon icon="ep:close" class="mr-4px" /> 取消续写
          </el-button>
        </div>
        <div
          class="mb-16px flex items-center gap-10px rounded-6px bg-[var(--el-fill-color-light)] p-10px"
        >
          <el-image
            :src="extendSource.coverUrl"
            fit="cover"
            class="h-48px w-48px flex-shrink-0 rounded-4px"
          >
            <template #error>
              <div class="h-full w-full flex items-center justify-center">
                <Icon icon="ep:headset" />
              </div>
            </template>
          </el-image>
          <div class="min-w-0 flex-1">
            <div class="truncate font-bold">{{ getMusicTitle(extendSource.title) }}</div>
            <div class="text-12px text-[var(--el-text-color-secondary)]">
              {{ extendSource.model }} · 时长 {{ formatMusicDuration(extendSource.duration) }}
            </div>
          </div>
        </div>
        <el-form-item label="续写起点（秒）" prop="extendSeconds">
          <el-input-number
            v-model="formData.extendSeconds"
            :min="0"
            :precision="0"
            controls-position="right"
            class="!w-full"
          />
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            从原曲该时间点开始续写，默认原曲结尾；模型与渠道沿用原曲
          </div>
        </el-form-item>
      </template>

      <!-- 创作模式、模型 -->
      <template v-else>
        <el-form-item label="创作模式" prop="generateMode">
          <el-radio-group v-model="formData.generateMode">
            <el-radio-button :value="AiMusicGenerateModeEnum.INSPIRATION">
              灵感模式
            </el-radio-button>
            <el-radio-button :value="AiMusicGenerateModeEnum.CUSTOM"> 自定义模式 </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="模型" prop="modelId">
          <ModelSelect
            v-model="formData.modelId"
            :type="AiModelTypeEnum.MUSIC"
            :platform="AiPlatformEnum.SUNO"
            placeholder="请选择音乐模型"
            class="!w-full"
            @loaded="handleModelLoaded"
          />
        </el-form-item>
        <el-form-item label="纯音乐" prop="makeInstrumental">
          <el-switch v-model="formData.makeInstrumental" />
          <span class="ml-8px text-12px text-[var(--el-text-color-secondary)]">
            开启后生成不带人声的音乐
          </span>
        </el-form-item>
      </template>

      <!-- 灵感模式：歌曲描述 -->
      <el-form-item v-if="isInspiration" label="歌曲描述" prop="prompt">
        <el-input
          v-model="formData.prompt"
          type="textarea"
          :rows="6"
          maxlength="1024"
          show-word-limit
          placeholder="描述想要的歌曲，例如：一首关于夏日海边的轻快流行歌，女声"
        />
      </el-form-item>

      <!-- 自定义、续写：歌词、风格、名称 -->
      <template v-else>
        <el-form-item v-if="!formData.makeInstrumental || extendSource" label="歌词" prop="lyric">
          <el-input
            v-model="formData.lyric"
            type="textarea"
            :rows="8"
            maxlength="1024"
            show-word-limit
            :placeholder="
              extendSource
                ? '输入续写部分的歌词，可留空'
                : '输入歌词，或输入一个主题后点「AI 生成歌词」'
            "
          />
          <el-button
            v-if="!extendSource"
            class="mt-8px"
            size="small"
            :loading="lyricLoading"
            @click="handleGenerateLyric"
          >
            <Icon icon="ep:magic-stick" class="mr-4px" /> AI 生成歌词
          </el-button>
        </el-form-item>
        <el-form-item label="音乐风格" prop="tags">
          <el-input
            v-model="formData.tags"
            maxlength="120"
            show-word-limit
            placeholder="例如：pop, female vocals, summer"
          />
          <div class="mt-8px flex flex-wrap gap-6px">
            <el-tag
              v-for="tag in MUSIC_PRESET_TAGS"
              :key="tag.value"
              class="cursor-pointer"
              :effect="hasTag(tag.value) ? 'dark' : 'plain'"
              @click="handleTagClick(tag.value)"
            >
              {{ tag.label }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="歌曲名称" prop="title">
          <el-input
            v-model="formData.title"
            maxlength="100"
            show-word-limit
            placeholder="请输入歌曲名称"
          />
        </el-form-item>
      </template>

      <el-button type="primary" class="!w-full" :loading="submitting" @click="handleSubmit">
        {{ extendSource ? '续写歌曲' : '开始创作' }}
      </el-button>

      <!-- 上传音频 -->
      <template v-if="!extendSource">
        <el-divider>或</el-divider>
        <el-upload
          :show-file-list="false"
          accept=".mp3,.wav"
          :http-request="httpRequest"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :disabled="uploading"
          class="w-full [&_.el-upload]:w-full"
        >
          <el-button class="!w-full" :disabled="uploading">
            <Icon icon="ep:upload" class="mr-4px" /> 上传音乐
          </el-button>
        </el-upload>
        <div class="mt-6px text-12px leading-18px text-[var(--el-text-color-secondary)]">
          支持 mp3 / wav；中转通常要求时长 6–60 秒、不含受版权保护的人声。
          上传完成后可作为续写来源。需中转支持 /suno/uploads/audio-url 扩展路径（官方 SunoAPI
          插件不支持）。
        </div>
      </template>
    </el-form>
  </ContentWrap>
</template>

<script setup lang="ts">
import type { FormRules, UploadRequestOptions } from 'element-plus'
import { MusicApi, MusicVO } from '@/api/ai/music'
import { ModelVO } from '@/api/ai/model/model'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'
import {
  AiModelTypeEnum,
  AiMusicGenerateModeEnum,
  AiPlatformEnum
} from '@/views/ai/utils/constants'
import { formatMusicDuration, getMusicTitle } from '@/views/ai/utils/utils'

/** AI 音乐：创作面板 */
defineOptions({ name: 'AiMusicCreatePanel' })

const emit = defineEmits<{
  submitted: [] // 提交成功，用于刷新作品列表
}>()

const message = useMessage() // 消息弹窗

/** 预置音乐风格：中文显示，英文写入（与 GeekAI 一致） */
const MUSIC_PRESET_TAGS = [
  { label: '女声', value: 'female vocals' },
  { label: '男声', value: 'male vocals' },
  { label: '流行', value: 'pop' },
  { label: '摇滚', value: 'rock' },
  { label: '硬摇滚', value: 'hard rock' },
  { label: '电音', value: 'electronic' },
  { label: '金属', value: 'metal' },
  { label: '重金属', value: 'heavy metal' },
  { label: '节拍', value: 'beat' },
  { label: '弱拍', value: 'upbeat' },
  { label: '合成器', value: 'synth' },
  { label: '吉他', value: 'guitar' },
  { label: '钢琴', value: 'piano' },
  { label: '小提琴', value: 'violin' },
  { label: '贝斯', value: 'bass' },
  { label: '嘻哈', value: 'hip hop' }
]

const formRef = ref() // 表单 Ref
const formData = reactive({
  generateMode: AiMusicGenerateModeEnum.INSPIRATION,
  modelId: undefined as number | undefined,
  makeInstrumental: false,
  prompt: '',
  lyric: '',
  tags: '',
  title: '',
  extendSeconds: undefined as number | undefined
})
const extendSource = ref<MusicVO>() // 续写来源；为空表示普通创作
const isInspiration = computed(
  () => !extendSource.value && formData.generateMode === AiMusicGenerateModeEnum.INSPIRATION
)

/** 续写起点：不能超过原曲时长。只在字段下提示，不弹全局消息 */
const validateExtendSeconds = (_rule: any, value: number | undefined, callback: any) => {
  if (value === undefined || value === null) {
    callback(new Error('请输入续写起点'))
    return
  }
  const duration = extendSource.value?.duration
  if (duration !== undefined && duration !== null && value > duration) {
    callback(new Error('续写起点不能超过原曲时长'))
    return
  }
  callback()
}
const formRules = computed<FormRules>(() => {
  if (extendSource.value) {
    return {
      extendSeconds: [{ validator: validateExtendSeconds, trigger: ['blur', 'change'] }],
      title: [{ required: true, message: '请输入歌曲名称', trigger: 'blur' }]
    }
  }
  if (isInspiration.value) {
    return {
      modelId: [{ required: true, message: '请选择模型', trigger: 'change' }],
      prompt: [{ required: true, message: '请输入歌曲描述', trigger: 'blur' }]
    }
  }
  return {
    modelId: [{ required: true, message: '请选择模型', trigger: 'change' }],
    lyric: formData.makeInstrumental
      ? []
      : [{ required: true, message: '请输入歌词', trigger: 'blur' }],
    title: [{ required: true, message: '请输入歌曲名称', trigger: 'blur' }]
  }
})

/** 模型加载完成：默认选中第一个 */
const handleModelLoaded = (list: ModelVO[]) => {
  if (!formData.modelId && list.length > 0) {
    formData.modelId = list[0].id
  }
}

/** 音乐风格：点选预置标签追加或移除 */
const splitTags = () =>
  formData.tags
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag)
const hasTag = (value: string) => splitTags().includes(value)
const handleTagClick = (value: string) => {
  const tags = splitTags()
  const index = tags.indexOf(value)
  if (index >= 0) {
    tags.splice(index, 1)
  } else {
    tags.push(value)
  }
  const joined = tags.join(', ')
  if (joined.length > 120) {
    message.warning('音乐风格不能超过 120 个字符')
    return
  }
  formData.tags = joined
}

/** AI 生成歌词：歌词框内容作为主题，返回的第一行作为名称 */
const lyricLoading = ref(false)
const handleGenerateLyric = async () => {
  const prompt = formData.lyric.trim()
  if (!prompt) {
    message.warning('请先在歌词框输入歌词主题')
    return
  }
  lyricLoading.value = true
  try {
    const data = await MusicApi.generateLyric(prompt)
    formData.lyric = (data.lyric || '').slice(0, 1024)
    if (data.title) {
      formData.title = data.title.slice(0, 100)
    }
    message.success('歌词生成成功')
  } finally {
    lyricLoading.value = false
  }
}

/** 提交创作或续写 */
const submitting = ref(false)
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (fields: any) {
    // 普通创作补一条全局提示；续写只在字段下提示
    if (!extendSource.value) {
      const first = Object.values(fields || {})[0] as any[] | undefined
      if (first?.[0]?.message) {
        message.error(first[0].message)
      }
    }
    return
  }
  submitting.value = true
  try {
    if (extendSource.value) {
      await MusicApi.extendMusic({
        id: extendSource.value.id,
        extendSeconds: formData.extendSeconds!,
        lyric: formData.lyric || undefined,
        tags: formData.tags || undefined,
        title: formData.title
      })
      message.success('续写任务已提交')
      cancelExtend()
    } else if (isInspiration.value) {
      await MusicApi.generateMusic({
        generateMode: AiMusicGenerateModeEnum.INSPIRATION,
        modelId: formData.modelId!,
        prompt: formData.prompt,
        makeInstrumental: formData.makeInstrumental
      })
      message.success('创作任务已提交')
    } else {
      await MusicApi.generateMusic({
        generateMode: AiMusicGenerateModeEnum.CUSTOM,
        modelId: formData.modelId!,
        lyric: formData.makeInstrumental ? undefined : formData.lyric,
        tags: formData.tags || undefined,
        title: formData.title,
        makeInstrumental: formData.makeInstrumental
      })
      message.success('创作任务已提交')
    }
    emit('submitted')
  } finally {
    submitting.value = false
  }
}

/** 设置续写来源：起点默认原曲时长，名称、风格沿用原曲 */
const setExtendSource = (music: MusicVO) => {
  extendSource.value = music
  formData.extendSeconds =
    music.duration !== undefined && music.duration !== null ? Math.floor(music.duration) : 0
  formData.lyric = ''
  formData.tags = music.tags ? music.tags.slice(0, 120) : ''
  formData.title = getMusicTitle(music.title).slice(0, 100)
  nextTick(() => formRef.value?.clearValidate())
}

/** 取消续写，回到普通创作 */
const cancelExtend = () => {
  extendSource.value = undefined
  formData.extendSeconds = undefined
  nextTick(() => formRef.value?.clearValidate())
}

defineExpose({ setExtendSource })

/** 上传音频：由后端存到文件服务，再提交上传任务 */
const uploading = ref(false)
const MAX_UPLOAD_MB = 50
const beforeUpload = (file: File) => {
  if (!formData.modelId) {
    message.warning('请先选择模型')
    return false
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'mp3' && ext !== 'wav') {
    message.error('只支持 mp3、wav 格式的音频')
    return false
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    message.error(`音频大小不能超过 ${MAX_UPLOAD_MB}MB`)
    return false
  }
  uploading.value = true
  return true
}
const httpRequest = (options: UploadRequestOptions) => {
  const name = options.file.name.replace(/\.[^.]+$/, '')
  return MusicApi.uploadMusic({
    modelId: formData.modelId!,
    file: options.file,
    title: name ? name.slice(0, 100) : undefined
  })
}
const handleUploadSuccess = () => {
  uploading.value = false
  message.success('歌曲上传成功，正在处理')
  emit('submitted')
}
const handleUploadError = () => {
  // 失败原因已由请求拦截器提示
  uploading.value = false
}
</script>
