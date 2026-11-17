<!-- AI 短剧 3D 导演：从参考视频提取动作。本地视频或项目已有视频 → 浏览器内 MediaPipe 识别姿态 → 可编辑的白模关键帧；不使用摄像头、麦克风，视频不上传 -->
<template>
  <Dialog
    v-model="dialogVisible"
    title="从参考视频提取动作"
    width="640px"
    :before-close="handleClose"
  >
    <el-alert
      type="info"
      :closable="false"
      class="mb-12px"
      title="选择单人视频，在浏览器中识别关节动作，生成可编辑的白模关键帧。遮挡、转身和近景中看不到的肢体需手动修正。"
    />
    <el-form label-width="90px">
      <el-form-item label="视频来源">
        <el-radio-group v-model="sourceType" :disabled="running">
          <el-radio-button value="local">本地视频</el-radio-button>
          <el-radio-button value="project">项目中的视频</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="sourceType === 'local'" label="本地视频">
        <el-upload
          :auto-upload="false"
          :show-file-list="false"
          accept="video/*"
          :disabled="running"
          :on-change="handleFileChange"
        >
          <el-button :disabled="running">选择视频</el-button>
        </el-upload>
        <span class="ml-8px truncate text-12px text-[var(--el-text-color-secondary)]">{{
          fileName || '不超过 200MB，只在本机读取'
        }}</span>
      </el-form-item>
      <el-form-item v-else label="项目视频">
        <el-select
          v-model="projectVideoUrl"
          placeholder="动作参考或已完成的镜头视频"
          filterable
          class="!w-full"
          :disabled="running"
          @change="handleProjectVideoChange"
        >
          <el-option
            v-for="item in projectVideos"
            :key="item.url"
            :label="item.label"
            :value="item.url"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="source" label="预览">
        <video
          :src="source"
          controls
          preload="metadata"
          class="max-h-220px w-full rounded-4px bg-black"
          :crossorigin="sourceType === 'project' ? 'anonymous' : undefined"
        ></video>
      </el-form-item>
      <el-form-item label="区间（秒）">
        <el-input-number
          v-model="start"
          :min="0"
          :step="0.1"
          :precision="1"
          controls-position="right"
          :disabled="running"
        />
        <span class="mx-8px">至</span>
        <el-input-number
          v-model="end"
          :min="2"
          :max="600"
          :step="0.1"
          :precision="1"
          controls-position="right"
          :disabled="running"
        />
        <div class="w-full text-12px text-[var(--el-text-color-secondary)]">
          2~60 秒，每秒采样 12 次，输出 24 fps；应用会替换当前导演工程，未保存的修改先下载备份
        </div>
      </el-form-item>
      <el-form-item v-if="running" label="进度">
        <el-progress :percentage="Math.round(progress * 100)" class="flex-1" />
        <el-button link class="ml-8px" @click="controller?.abort()">取消</el-button>
      </el-form-item>
      <el-form-item v-if="result" label="结果">
        <span class="text-13px">
          已识别 {{ result.detected }} / {{ result.samples }} 次采样；{{ result.document.duration }}
          秒，
          {{ result.document.objects[0]?.keys.length }}
          个可编辑关键帧。应用后请检查脚底、转体与遮挡部位
        </span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose()">取 消</el-button>
      <el-button :disabled="!source || running" :loading="running" @click="handleCapture">
        解析动作
      </el-button>
      <el-button type="primary" :disabled="!result || running" @click="handleApply">
        应用为导演工程
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import type { DramaProjectDetailVO } from '@/api/ai/drama/project'
import type { DirectorDocument } from './director'
import { captureVideo } from './directorCapture'

/** AI 短剧 3D 导演：提取参考视频的动作 */
defineOptions({ name: 'AiDramaDirectorCaptureDialog' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ import: [document: DirectorDocument] }>()
const message = useMessage() // 消息弹窗

const MAX_FILE_SIZE = 200 * 1024 * 1024

const dialogVisible = ref(false)
const sourceType = ref<'local' | 'project'>('local')
const source = ref('')
const fileName = ref('')
const projectVideoUrl = ref<string>()
const start = ref(0)
const end = ref(60)
const running = ref(false)
const progress = ref(0)
const result = ref<Awaited<ReturnType<typeof captureVideo>>>()
let controller: AbortController | undefined
let blobUrl = ''

/** 项目中已有的视频：动作参考、已完成的镜头视频 */
const projectVideos = computed(() => [
  ...(props.detail.motionReferences || []).map((item) => ({
    url: item.fileUrl,
    label: `动作参考 · ${item.name}`
  })),
  ...props.detail.storyboards
    .filter((item) => item.videoUrl)
    .map((item) => ({ url: item.videoUrl!, label: `镜头 #${item.sceneNo} ${item.title || ''}` }))
])

const release = () => {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl)
  }
  blobUrl = ''
}

const open = () => {
  dialogVisible.value = true
  result.value = undefined
  progress.value = 0
}
defineExpose({ open })

const handleFileChange = (file: UploadFile) => {
  if (!file.raw) {
    return
  }
  if (file.raw.size > MAX_FILE_SIZE) {
    message.warning('视频不能超过 200MB')
    return
  }
  release()
  blobUrl = URL.createObjectURL(file.raw)
  source.value = blobUrl
  fileName.value = file.name
  result.value = undefined
}

const handleProjectVideoChange = (url: string) => {
  release()
  source.value = url
  result.value = undefined
}

const handleCapture = async () => {
  running.value = true
  progress.value = 0
  result.value = undefined
  controller = new AbortController()
  try {
    result.value = await captureVideo(
      source.value,
      start.value,
      end.value,
      (value) => (progress.value = value),
      controller.signal
    )
  } catch (e) {
    message.error(e instanceof Error ? e.message : '动作解析失败')
  } finally {
    running.value = false
  }
}

const handleApply = () => {
  emit('import', result.value!.document)
  dialogVisible.value = false
}

const handleClose = (done?: () => void) => {
  controller?.abort()
  dialogVisible.value = false
  done?.()
}

onBeforeUnmount(() => {
  controller?.abort()
  release()
})
</script>
