<!-- AI 短剧：公开项目详情 -->
<template>
  <Dialog v-model="dialogVisible" :title="detail?.name || '短剧详情'" width="760px">
    <div v-loading="loading" class="min-h-200px">
      <template v-if="detail">
        <video
          :src="detail.composeFileUrl"
          controls
          class="max-h-480px w-full rounded-6px bg-black"
        ></video>
        <el-descriptions :column="2" border label-width="90px" class="mt-12px">
          <el-descriptions-item label="作者">{{ detail.userNickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="时长">{{
            formatDramaDuration(detail.composeDuration)
          }}</el-descriptions-item>
          <el-descriptions-item label="画风">
            <dict-tag v-if="detail.style" :type="DICT_TYPE.AI_DRAMA_STYLE" :value="detail.style" />
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="画幅 / 镜头">
            {{ detail.aspectRatio || '-' }} /
            {{ detail.storyboardCount ? `${detail.storyboardCount} 个` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="剧情大纲" :span="2">
            <span class="whitespace-pre-wrap break-all">{{ detail.outline || '-' }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="detail.characters?.length" class="mt-12px">
          <div class="mb-8px font-500">角色</div>
          <div class="flex flex-wrap gap-12px">
            <div v-for="(item, index) in detail.characters" :key="index" class="w-80px text-center">
              <el-image
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :preview-src-list="[item.imageUrl]"
                preview-teleported
                fit="cover"
                class="h-80px w-80px rounded-6px"
              />
              <div
                v-else
                class="h-80px w-80px flex items-center justify-center rounded-6px bg-[var(--el-fill-color)]"
              >
                <Icon icon="ep:user" :size="28" />
              </div>
              <div class="mt-4px truncate text-12px">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
    <template #footer>
      <el-button v-if="detail" @click="handleDownload">下载</el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectApi, DramaPublicVO } from '@/api/ai/drama/project'
import { DICT_TYPE } from '@/utils/dict'
import { formatDramaDuration } from '@/views/ai/utils/drama'

/** AI 短剧：公开项目详情 */
defineOptions({ name: 'AiDramaPublicDetail' })

const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<DramaPublicVO>()

const open = async (id: number) => {
  dialogVisible.value = true
  detail.value = undefined
  loading.value = true
  try {
    detail.value = await DramaProjectApi.getProjectPublicDetail(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })

const handleDownload = () => {
  window.open(detail.value!.composeFileUrl, '_blank')
}
</script>
