<!-- AI 短剧：单镜的视频结果，在镜头内原位播放；「放大观看」在弹窗中放大同一视频，关闭后回到原镜头 -->
<template>
  <div>
    <div class="mb-8px flex flex-wrap items-center gap-8px">
      <span class="text-14px font-500">视频结果</span>
      <dict-tag
        v-if="storyboard.videoStatus"
        :type="DICT_TYPE.AI_DRAMA_STATUS"
        :value="storyboard.videoStatus"
      />
      <span v-else class="text-12px text-[var(--el-text-color-secondary)]">未生成</span>
      <span v-if="modelText" class="text-12px text-[var(--el-text-color-secondary)]">
        本镜模型 {{ modelText }}
      </span>
    </div>
    <!-- 重新生成时保留上次的视频，同时展示本次的状态与失败原因 -->
    <video
      v-if="storyboard.videoUrl"
      ref="videoRef"
      :key="storyboard.videoUrl"
      :src="storyboard.videoUrl"
      controls
      preload="metadata"
      class="block max-h-480px w-full rounded-6px bg-black"
    ></video>
    <div
      v-else-if="isAiDramaRunning(storyboard.videoStatus)"
      class="flex h-120px items-center justify-center gap-6px rounded-6px bg-[var(--el-fill-color)] text-12px text-[var(--el-text-color-secondary)]"
    >
      <Icon icon="ep:loading" class="is-loading" /> 生成中，完成后自动刷新
    </div>
    <el-alert
      v-if="storyboard.videoStatus === AiDramaStatusEnum.FAIL"
      type="error"
      :closable="false"
      show-icon
      class="mt-8px"
      :title="storyboard.errorMessage || '生成失败'"
    />
    <div class="mt-8px flex items-center justify-end gap-4px">
      <el-button v-if="storyboard.videoUrl" link type="primary" @click="handleZoom">
        <Icon icon="ep:full-screen" class="mr-4px" /> 放大观看
      </el-button>
      <el-button v-if="storyboard.videoUrl" link type="primary" @click="handleDownload">
        下载
      </el-button>
      <el-dropdown class="ml-12px" @command="(command) => emit('command', command)">
        <el-button link type="primary">
          更多 <Icon icon="ep:arrow-down" class="ml-2px" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="submission">提交记录</el-dropdown-item>
            <el-dropdown-item command="voice">镜头声音</el-dropdown-item>
            <el-dropdown-item command="importVideo" :disabled="running">导入视频</el-dropdown-item>
            <el-dropdown-item
              v-if="storyboard.continuity?.materialUrls?.length"
              command="material"
              :disabled="running"
            >
              素材成片
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <el-dialog
      v-model="zoomVisible"
      :title="`镜 ${storyboard.sceneNo} · ${storyboard.title || '未命名镜头'}`"
      width="80%"
      append-to-body
      destroy-on-close
    >
      <video
        :src="storyboard.videoUrl"
        controls
        autoplay
        class="block max-h-75vh w-full rounded-6px bg-black"
      ></video>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { DICT_TYPE } from '@/utils/dict'
import { AiDramaStatusEnum, isAiDramaRunning } from '@/views/ai/utils/constants'

/** AI 短剧：单镜的视频结果 */
defineOptions({ name: 'AiDramaShotVideoResult' })

const props = defineProps<{
  storyboard: DramaStoryboardVO
  modelText?: string // 本镜使用的视频模型
}>()
// command：更多中的操作，submission 提交记录、voice 镜头声音、importVideo 导入视频、material 素材成片
const emit = defineEmits<{ command: [command: string] }>()

const videoRef = ref<HTMLVideoElement>()
const zoomVisible = ref(false)
const running = computed(() => isAiDramaRunning(props.storyboard.videoStatus))

/** 放大观看：暂停原位播放，避免两处同时出声 */
const handleZoom = () => {
  videoRef.value?.pause()
  zoomVisible.value = true
}

/** 下载镜头视频 */
const handleDownload = () => {
  window.open(props.storyboard.videoUrl, '_blank')
}
</script>
