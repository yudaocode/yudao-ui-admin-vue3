<!-- AI 短剧：配乐；复用 AI 音乐生成，选用已完成的音乐作为配乐 -->
<template>
  <Dialog v-model="dialogVisible" title="AI 配乐" width="1000px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
      <el-form-item label="音乐模型" prop="modelId">
        <ModelSelect
          v-model="formData.modelId"
          :type="AiModelTypeEnum.MUSIC"
          :platform="AiPlatformEnum.SUNO"
          placeholder="请选择音乐模型"
          class="!w-260px"
        />
        <el-checkbox v-model="formData.makeInstrumental" class="ml-12px">纯音乐</el-checkbox>
      </el-form-item>
      <el-form-item label="音乐描述" prop="prompt">
        <el-input
          v-model="formData.prompt"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
        <el-button link type="primary" class="mt-4px" @click="draftPrompt">按剧本起草</el-button>
      </el-form-item>
      <div class="flex justify-end">
        <el-button type="primary" :loading="generating" @click="handleGenerate">生成音乐</el-button>
      </div>
    </el-form>
    <el-divider content-position="left">我的 AI 音乐</el-divider>
    <el-form label-width="90px">
      <el-form-item label="使用的镜头">
        <el-select
          v-model="storyboardIds"
          multiple
          placeholder="选用时使用的镜头；为空表示候选"
          class="!w-full"
        >
          <el-option
            v-for="item in detail.storyboards"
            :key="item.id"
            :label="`#${item.sceneNo} ${item.title || '未命名镜头'}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="list" row-key="id" max-height="320px">
      <el-table-column label="名称" prop="title" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="试听" min-width="260">
        <template #default="{ row }">
          <audio
            v-if="row.audioUrl"
            :src="row.audioUrl"
            controls
            preload="none"
            class="h-32px w-full"
          ></audio>
          <span v-else-if="row.errorMessage" class="text-12px text-[var(--el-color-danger)]">{{
            row.errorMessage
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="时长" width="80" align="center">
        <template #default="{ row }">{{
          row.duration ? `${Math.round(row.duration)} 秒` : ''
        }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="row.status !== AiMusicStatusEnum.SUCCESS || !row.audioUrl"
            @click="handleUse(row)"
          >
            选用
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import { MusicApi, MusicVO } from '@/api/ai/music'
import { DICT_TYPE } from '@/utils/dict'
import {
  AiModelTypeEnum,
  AiMusicGenerateModeEnum,
  AiMusicStatusEnum,
  AiPlatformEnum,
  isAiMusicRunning
} from '@/views/ai/utils/constants'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'

/** AI 短剧：配乐 */
defineOptions({ name: 'AiDramaMusicDialog' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const POLL_INTERVAL = 5000 // 音乐生成中的轮询间隔（毫秒）

const dialogVisible = ref(false)
const loading = ref(false)
const generating = ref(false)
const list = ref<MusicVO[]>([])
const storyboardIds = ref<number[]>([])
const formRef = ref()
const formData = reactive({
  modelId: undefined as number | undefined,
  prompt: '',
  makeInstrumental: true
})
const formRules = reactive({
  modelId: [{ required: true, message: '请选择音乐模型', trigger: 'change' }],
  prompt: [{ required: true, message: '请输入音乐描述', trigger: 'blur' }]
})

const getList = async () => {
  loading.value = list.value.length === 0
  try {
    const data = await MusicApi.getMusicMyPage({ pageNo: 1, pageSize: 20 })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 按剧本起草：剧名、基调、大纲 */
const draftPrompt = () => {
  const script = props.detail.script
  formData.prompt = [
    `短剧《${script?.title || props.detail.project.name}》的配乐`,
    script?.tone ? `基调：${script.tone}` : '',
    script?.outline ? `剧情：${script.outline.slice(0, 300)}` : ''
  ]
    .filter(Boolean)
    .join('。')
}

const handleGenerate = async () => {
  await formRef.value.validate()
  generating.value = true
  try {
    await MusicApi.generateMusic({
      generateMode: AiMusicGenerateModeEnum.INSPIRATION,
      modelId: formData.modelId!,
      prompt: formData.prompt,
      makeInstrumental: formData.makeInstrumental
    })
    message.success('已提交生成，完成后可选用')
    await getList()
  } finally {
    generating.value = false
  }
}

const handleUse = async (row: MusicVO) => {
  await DramaAssetApi.createMusicAudio({
    projectId: props.detail.project.id,
    musicId: row.id,
    storyboardIds: storyboardIds.value
  })
  message.success('已加入配乐，可在配乐列表调整音量与起始偏移')
  emit('success')
}

// 有生成中的音乐时轮询
let timer: ReturnType<typeof setInterval> | undefined
const stopPolling = () => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}
watch(
  () => dialogVisible.value && list.value.some((item) => isAiMusicRunning(item.status)),
  (value) => {
    stopPolling()
    if (value) {
      timer = setInterval(getList, POLL_INTERVAL)
    }
  }
)
onBeforeUnmount(stopPolling)

const open = async () => {
  storyboardIds.value = []
  dialogVisible.value = true
  if (!formData.prompt) {
    draftPrompt()
  }
  await getList()
}
defineExpose({ open })
</script>
