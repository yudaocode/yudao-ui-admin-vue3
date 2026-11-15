<!-- AI 短剧：第 4 步，分镜与成片 -->
<template>
  <!-- 成片：放在最上方，镜头较多时也能直接看到 -->
  <ContentWrap>
    <div class="mb-12px flex flex-wrap items-center gap-12px">
      <span class="text-16px font-500">成片</span>
      <dict-tag v-if="project.composeStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="project.composeStatus" />
      <span v-if="project.composeDuration" class="text-12px text-[var(--el-text-color-secondary)]">
        时长 {{ formatDramaDuration(project.composeDuration) }}
      </span>
      <span v-if="project.composeAspectRatio" class="text-12px text-[var(--el-text-color-secondary)]">
        画幅 {{ project.composeAspectRatio }} · {{ project.composeStoryboardCount }} 个镜头
      </span>
      <div class="flex-1"></div>
      <template v-if="project.composeFileUrl && project.composeStatus === AiDramaStatusEnum.SUCCESS">
        <el-tag v-if="project.publicStatus" type="success">已公开</el-tag>
        <el-button link type="primary" @click="handleDownload">
          下载
        </el-button>
      </template>
      <el-button
        type="primary"
        :disabled="successCount < 2 || isAiDramaRunning(project.composeStatus)"
        @click="composeRef.open()"
      >
        {{ project.composeStatus ? '重新合成' : '合成成片' }}
      </el-button>
    </div>
    <div v-if="successCount < 2" class="text-12px text-[var(--el-text-color-secondary)]">
      至少需要 2 个视频已完成的镜头才能合成
    </div>
    <div v-if="project.composeStatus === AiDramaStatusEnum.FAIL" class="text-12px text-[var(--el-color-danger)] break-all">
      {{ project.composeErrorMessage || '合成失败' }}
    </div>
    <video
      v-if="project.composeFileUrl && project.composeStatus === AiDramaStatusEnum.SUCCESS"
      :src="project.composeFileUrl"
      controls
      preload="metadata"
      class="max-h-360px max-w-full rounded-6px"
    ></video>
  </ContentWrap>

  <ContentWrap>
    <div class="flex flex-wrap items-center gap-12px">
      <ModelSelect
        v-model="chatModelId"
        :type="AiModelTypeEnum.CHAT"
        placeholder="默认对话模型"
        clearable
        class="!w-260px"
      />
      <el-button :loading="generatingStoryboards" @click="handleGenerateStoryboards">
        <Icon icon="ep:magic-stick" class="mr-4px" /> 从剧本生成分镜
      </el-button>
      <el-divider direction="vertical" />
      <span class="text-14px">视频模型</span>
      <el-select v-model="videoModelId" placeholder="请选择视频模型" filterable class="!w-220px">
        <el-option v-for="item in videoModels" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button type="primary" plain :disabled="!videoModelId" :loading="generatingBatch" @click="handleGenerateBatch">
        批量生成视频
      </el-button>
      <span class="text-12px text-[var(--el-text-color-secondary)]">
        视频已完成 {{ successCount }} / {{ detail.storyboards.length }}
      </span>
      <div class="flex-1"></div>
      <el-button @click="formRef.open()"><Icon icon="ep:plus" class="mr-4px" /> 新增镜头</el-button>
    </div>
  </ContentWrap>

  <ContentWrap>
    <el-empty v-if="!detail.storyboards.length" description="暂无镜头，可从剧本生成分镜或手动新增" />
    <el-table v-else :data="detail.storyboards" row-key="id">
      <el-table-column label="场次" prop="sceneNo" width="70" align="center" />
      <el-table-column label="镜头" min-width="260">
        <template #default="{ row }">
          <div class="font-500">{{ row.title || '未命名镜头' }}</div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{ [row.shotType, row.cameraMove, row.duration ? `${row.duration} 秒` : ''].filter(Boolean).join(' · ') }}
          </div>
          <div class="mt-4px line-clamp-3 text-12px">{{ row.videoPrompt }}</div>
          <div v-for="(dialogue, index) in row.dialogues || []" :key="index" class="text-12px text-[var(--el-color-primary)]">
            {{ getCharacterName(dialogue.characterId) }}：{{ dialogue.line }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="资产" min-width="180">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-4px">
            <el-tag v-for="name in getAssetNames(row)" :key="name" size="small" type="info">{{ name }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="起始帧" width="90" align="center">
        <template #default="{ row }">
          <el-image
            v-if="row.firstFrameUrl"
            :src="row.firstFrameUrl"
            :preview-src-list="[row.firstFrameUrl]"
            preview-teleported
            fit="cover"
            class="h-56px w-56px rounded-4px"
          />
          <span v-else class="text-12px text-[var(--el-text-color-secondary)]">文生视频</span>
        </template>
      </el-table-column>
      <el-table-column label="视频" width="220" align="center">
        <template #default="{ row }">
          <!-- 重新生成时保留上次的视频，同时展示本次的状态与失败原因 -->
          <video v-if="row.videoUrl" :src="row.videoUrl" controls preload="metadata" class="max-h-120px w-200px rounded-4px"></video>
          <div v-if="row.videoStatus && row.videoStatus !== AiDramaStatusEnum.SUCCESS" :class="{ 'mt-4px': row.videoUrl }">
            <dict-tag :type="DICT_TYPE.AI_DRAMA_STATUS" :value="row.videoStatus" />
            <el-tooltip
              v-if="row.videoStatus === AiDramaStatusEnum.FAIL && row.errorMessage"
              :content="row.errorMessage"
              placement="top"
            >
              <div class="mt-4px line-clamp-2 text-12px text-[var(--el-color-danger)]">{{ row.errorMessage }}</div>
            </el-tooltip>
          </div>
          <span v-else-if="!row.videoUrl" class="text-12px text-[var(--el-text-color-secondary)]">未生成</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="!videoModelId || isAiDramaRunning(row.videoStatus)"
            @click="handleGenerateVideo(row)"
          >
            {{ row.videoStatus ? '重新生成' : '生成视频' }}
          </el-button>
          <el-button link type="primary" :disabled="isAiDramaRunning(row.videoStatus)" @click="formRef.open(row)">
            编辑
          </el-button>
          <el-button link type="danger" :disabled="isAiDramaRunning(row.videoStatus)" @click="handleDelete(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <StoryboardForm ref="formRef" :detail="detail" @success="emit('refresh')" />
  <ComposeForm ref="composeRef" :detail="detail" @success="emit('refresh')" />
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { DICT_TYPE } from '@/utils/dict'
import { AiDramaStatusEnum, AiModelTypeEnum, AiVideoTypeEnum, isAiDramaRunning } from '@/views/ai/utils/constants'
import { isVideoModelOfType } from '@/views/ai/utils/video'
import { formatDramaDuration } from '@/views/ai/utils/drama'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'
import StoryboardForm from '../components/StoryboardForm.vue'
import ComposeForm from '../components/ComposeForm.vue'

/** AI 短剧：分镜与成片 */
defineOptions({ name: 'AiDramaStoryboardStep' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: [] }>()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const formRef = ref()
const composeRef = ref()
const chatModelId = ref<number>()
const videoModels = ref<ModelVO[]>([])
const videoModelId = ref<number>()
const generatingStoryboards = ref(false)
const generatingBatch = ref(false)

const project = computed(() => props.detail.project)
const successCount = computed(
  () => props.detail.storyboards.filter((item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl).length
)

const getCharacterName = (characterId?: number) =>
  props.detail.characters.find((item) => item.id === characterId)?.name || '旁白'

/** 镜头引用的角色形象、场景、道具名称 */
const getAssetNames = (storyboard: DramaStoryboardVO) => {
  const names: string[] = []
  props.detail.characters.forEach((character) =>
    character.appearances
      .filter((item) => storyboard.appearanceIds?.includes(item.id))
      .forEach((item) => names.push(`${character.name}·形象${item.appearanceIndex}`))
  )
  const location = props.detail.locations.find((item) => item.id === storyboard.locationId)
  if (location) {
    names.push(location.name)
  }
  props.detail.visualAssets
    .filter((item) => storyboard.visualAssetIds?.includes(item.id))
    .forEach((item) => names.push(item.title))
  return names
}

/** 从剧本生成分镜：会替换已有镜头 */
const handleGenerateStoryboards = async () => {
  try {
    if (props.detail.storyboards.length) {
      await message.confirm('重新生成会替换现有的全部镜头（包括已生成的视频），是否继续？')
    }
    generatingStoryboards.value = true
    await DramaScriptApi.generateStoryboardList(project.value.id, chatModelId.value)
    message.success('分镜生成完成')
    emit('refresh')
  } catch {
  } finally {
    generatingStoryboards.value = false
  }
}

/** 批量生成：未生成、已失败的镜头 */
const handleGenerateBatch = async () => {
  generatingBatch.value = true
  try {
    const count = await DramaStoryboardApi.generateStoryboardVideoBatch(
      project.value.id,
      videoModelId.value!
    )
    message.success(count ? `已提交 ${count} 个镜头` : '没有需要生成的镜头')
    emit('refresh')
  } finally {
    generatingBatch.value = false
  }
}

const handleGenerateVideo = async (storyboard: DramaStoryboardVO) => {
  await DramaStoryboardApi.generateStoryboardVideo(storyboard.id, videoModelId.value!)
  message.success('已提交生成')
  emit('refresh')
}

const handleDownload = () => {
  window.open(project.value.composeFileUrl, '_blank')
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DramaStoryboardApi.deleteStoryboard(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

onMounted(async () => {
  videoModels.value = (await ModelApi.getModelSimpleList(AiModelTypeEnum.VIDEO)).filter((item) =>
    isVideoModelOfType(AiVideoTypeEnum.GENERATE, item.platform, item.model)
  )
  videoModelId.value = videoModels.value[0]?.id
})
</script>
