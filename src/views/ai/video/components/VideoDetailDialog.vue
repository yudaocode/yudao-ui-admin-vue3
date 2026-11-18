<!-- AI 视频：作品详情；创作页与视频生成管理共用 -->
<template>
  <Dialog v-model="dialogVisible" :title="title" width="720px">
    <div v-loading="loading">
      <template v-if="detail">
        <video
          v-if="detail.status === AiVideoStatusEnum.SUCCESS && detail.videoUrl"
          :src="detail.videoUrl"
          :poster="detail.coverUrl"
          controls
          class="mb-12px max-h-400px w-full rounded-6px bg-black"
        ></video>
        <el-descriptions :column="2" border>
          <template v-if="scope === 'admin'">
            <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="用户">
              {{ detail.userNickname || detail.userId }}
            </el-descriptions-item>
          </template>
          <el-descriptions-item label="创作类型">
            <dict-tag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="detail.type" />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <dict-tag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="detail.status" />
          </el-descriptions-item>
          <el-descriptions-item label="服务商">
            <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="detail.platform" />
          </el-descriptions-item>
          <el-descriptions-item label="模型">{{ detail.model }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.mode" label="生成方式">
            {{ VIDEO_MODE_LABELS[detail.mode] || detail.mode }}
          </el-descriptions-item>
          <el-descriptions-item v-if="scope !== 'admin'" label="作者">
            {{ detail.userNickname || '-' }}
          </el-descriptions-item>
          <template v-if="scope === 'admin'">
            <el-descriptions-item label="API 密钥">
              {{ detail.apiKeyName || detail.apiKeyId || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="服务商任务" :span="2">
              <span class="break-all">{{ detail.taskId || '-' }}</span>
            </el-descriptions-item>
          </template>
          <el-descriptions-item label="提示词" :span="2">
            <span class="whitespace-pre-wrap break-all">{{ detail.prompt || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="参数" :span="2">
            <span class="break-all">{{ formatVideoOptions(detail) }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.inputUrls" label="输入文件" :span="2">
            <div v-for="(urls, role) in detail.inputUrls" :key="role" class="leading-22px">
              <span class="text-[var(--el-text-color-secondary)]">
                {{ VIDEO_ROLE_LABELS[role] || role }}：
              </span>
              <el-link
                v-for="(url, index) in urls"
                :key="index"
                :href="url"
                target="_blank"
                type="primary"
                class="mr-8px"
              >
                查看{{ urls.length > 1 ? index + 1 : '' }}
              </el-link>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.errorMessage" label="失败原因" :span="2">
            <span class="break-all text-[var(--el-color-danger)]">{{ detail.errorMessage }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(detail.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ detail.finishTime ? formatDate(detail.finishTime) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-empty v-else-if="!loading" description="视频不存在" />
    </div>
    <template v-if="scope !== 'admin'" #footer>
      <el-button v-if="detail?.videoUrl" @click="handleDownload">下载</el-button>
      <el-button type="primary" :disabled="!detail" @click="handleSame">做同款</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { VideoApi, VideoVO } from '@/api/ai/video'
import { AiVideoStatusEnum } from '@/views/ai/utils/constants'
import { VIDEO_MODE_LABELS, VIDEO_ROLE_LABELS, formatVideoOptions } from '@/views/ai/utils/video'

/** AI 视频：作品详情 */
defineOptions({ name: 'AiVideoDetailDialog' })

const emit = defineEmits<{ same: [item: VideoVO] }>()

const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<VideoVO | null>()
const scope = ref('mine') // 详情的来源：mine - 创作页（我的、公开作品）；admin - 视频生成管理
const title = computed(() => (scope.value === 'admin' ? '视频详情' : '作品详情'))

/** 打开详情：重新查询；创作页本人可见输入文件，视频生成管理额外展示用户、密钥与服务商任务 */
const open = async (id: number, detailScope = 'mine') => {
  dialogVisible.value = true
  scope.value = detailScope
  detail.value = undefined
  loading.value = true
  try {
    detail.value =
      detailScope === 'admin' ? await VideoApi.getVideo(id) : await VideoApi.getVideoDetail(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

const handleDownload = () => {
  window.open(detail.value!.videoUrl, '_blank')
}

const handleSame = () => {
  emit('same', detail.value!)
  dialogVisible.value = false
}
</script>
