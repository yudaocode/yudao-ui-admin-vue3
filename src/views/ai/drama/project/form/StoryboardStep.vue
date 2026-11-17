<!-- AI 短剧：第 4 步，分镜与成片 -->
<template>
  <!-- 成片：放在最上方，镜头较多时也能直接看到 -->
  <ContentWrap>
    <div class="mb-12px flex flex-wrap items-center gap-12px">
      <span class="text-16px font-500">成片</span>
      <dict-tag
        v-if="project.composeStatus"
        :type="DICT_TYPE.AI_DRAMA_STATUS"
        :value="project.composeStatus"
      />
      <span v-if="project.composeDuration" class="text-12px text-[var(--el-text-color-secondary)]">
        时长 {{ formatDramaDuration(project.composeDuration) }}
      </span>
      <span
        v-if="project.composeStoryboardCount"
        class="text-12px text-[var(--el-text-color-secondary)]"
      >
        画幅 {{ project.composeAspectRatio }} · {{ project.composeStoryboardCount }} 个镜头
      </span>
      <div class="flex-1"></div>
      <template
        v-if="project.composeFileUrl && project.composeStatus === AiDramaStatusEnum.SUCCESS"
      >
        <el-tag v-if="project.publicStatus" type="success">已公开</el-tag>
        <el-button link type="primary" @click="handleDownload"> 下载 </el-button>
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
    <div
      v-if="project.composeStatus === AiDramaStatusEnum.FAIL"
      class="text-12px text-[var(--el-color-danger)] break-all"
    >
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
    <el-alert
      v-if="scriptChanged"
      type="warning"
      :closable="false"
      show-icon
      class="mb-12px"
      title="剧本已修改，请重新分析资产并从剧本生成分镜后，再生成关键帧和视频"
    />
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
      <el-button @click="planReviewRef.open()">规划审阅</el-button>
      <el-dropdown
        :disabled="!detail.storyboards.length || !!generatingDetail"
        @command="(command) => handleGenerateDetail(command)"
      >
        <el-button :loading="!!generatingDetail">
          {{ generatingDetail || '生成镜头设计' }} <Icon icon="ep:arrow-down" class="ml-4px" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="photography">摄影规则</el-dropdown-item>
            <el-dropdown-item command="acting">表演指导</el-dropdown-item>
            <el-dropdown-item command="frame">关键帧规划</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-divider direction="vertical" />
      <span class="text-14px">绘画模型</span>
      <el-select v-model="imageModelId" placeholder="请选择绘画模型" filterable class="!w-200px">
        <el-option v-for="item in imageModels" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button :disabled="!imageModelId || scriptChanged" @click="frameBatchRef.open()">
        批量关键帧
      </el-button>
      <el-tooltip
        content="未设置视频模型的镜头使用此模型；镜头的视频模型见视频列，可在编辑中清空"
        placement="top"
      >
        <span class="text-14px">默认视频模型</span>
      </el-tooltip>
      <el-select v-model="videoModelId" placeholder="请选择视频模型" filterable class="!w-200px">
        <el-option v-for="item in videoModels" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-select
        v-if="resolutions.length"
        v-model="resolution"
        placeholder="分辨率"
        class="!w-110px"
      >
        <el-option v-for="item in resolutions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button
        type="primary"
        plain
        :disabled="!videoModelId || scriptChanged"
        :loading="generatingBatch"
        @click="handleGenerateBatch"
      >
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
    <el-empty
      v-if="!detail.storyboards.length"
      description="暂无镜头，可从剧本生成分镜或手动新增"
    />
    <el-table v-else :data="detail.storyboards" row-key="id">
      <el-table-column label="镜头" prop="sceneNo" width="70" align="center" />
      <el-table-column label="内容" min-width="260">
        <template #default="{ row }">
          <div class="flex items-center gap-6px">
            <span class="font-500">{{ row.title || '未命名镜头' }}</span>
            <dict-tag
              v-if="row.sceneType"
              :type="DICT_TYPE.AI_DRAMA_SCENE_TYPE"
              :value="row.sceneType"
            />
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{
              [row.shotType, row.cameraMove, row.duration ? `${row.duration} 秒` : '']
                .filter(Boolean)
                .join(' · ')
            }}
          </div>
          <div class="mt-4px line-clamp-3 text-12px">{{ row.sceneText || row.videoPrompt }}</div>
          <div
            v-for="(dialogue, index) in row.dialogues || []"
            :key="index"
            class="text-12px text-[var(--el-color-primary)]"
          >
            {{ getCharacterName(dialogue.characterId) }}：{{ dialogue.line }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="资产" min-width="180">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-4px">
            <el-tag v-for="name in getAssetNames(row)" :key="name" size="small" type="info">{{
              name
            }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="关键帧" width="150" align="center">
        <template #default="{ row }">
          <div class="flex flex-col items-center gap-4px">
            <AssetImage
              :url="getFrame(row.id)?.imageUrl"
              :status="getFrame(row.id)?.status"
              :error-message="getFrame(row.id)?.errorMessage"
              size="72px"
            />
            <el-tooltip
              v-if="row.continuity?.manualStartFrame?.url"
              content="已设置手动起始帧，生成视频时优先使用"
              placement="top"
            >
              <el-tag size="small" type="warning">手动起始帧</el-tag>
            </el-tooltip>
            <div>
              <el-button
                link
                type="primary"
                :disabled="
                  !imageModelId || scriptChanged || isAiDramaRunning(getFrame(row.id)?.status)
                "
                @click="handleGenerateFrame(row)"
              >
                {{ getFrame(row.id) ? '重新生成' : '生成' }}
              </el-button>
              <el-button
                v-if="getFrame(row.id)?.imageUrl"
                link
                type="primary"
                :disabled="
                  !imageModelId || scriptChanged || isAiDramaRunning(getFrame(row.id)?.status)
                "
                @click="handleReviseFrame(row)"
              >
                修正
              </el-button>
              <el-button
                v-if="
                  getFrame(row.id) && hasDramaArchive(detail.visualAssets, getFrame(row.id)!.id)
                "
                link
                type="primary"
                :disabled="isAiDramaRunning(getFrame(row.id)?.status)"
                @click="handleUndoFrame(getFrame(row.id)!.id)"
              >
                撤销
              </el-button>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="视频" width="220" align="center">
        <template #default="{ row }">
          <!-- 重新生成时保留上次的视频，同时展示本次的状态与失败原因 -->
          <video
            v-if="row.videoUrl"
            :src="row.videoUrl"
            controls
            preload="metadata"
            class="max-h-120px w-200px rounded-4px"
          ></video>
          <div
            v-if="row.videoStatus && row.videoStatus !== AiDramaStatusEnum.SUCCESS"
            :class="{ 'mt-4px': row.videoUrl }"
          >
            <dict-tag :type="DICT_TYPE.AI_DRAMA_STATUS" :value="row.videoStatus" />
            <el-tooltip
              v-if="row.videoStatus === AiDramaStatusEnum.FAIL && row.errorMessage"
              :content="row.errorMessage"
              placement="top"
            >
              <div class="mt-4px line-clamp-2 text-12px text-[var(--el-color-danger)]">{{
                row.errorMessage
              }}</div>
            </el-tooltip>
          </div>
          <span v-else-if="!row.videoUrl" class="text-12px text-[var(--el-text-color-secondary)]"
            >未生成</span
          >
          <div
            v-if="row.videoModelId"
            class="mt-4px text-12px text-[var(--el-text-color-secondary)]"
          >
            本镜模型：{{ getVideoModelText(row) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center" fixed="right">
        <template #default="{ row, $index }">
          <el-button
            link
            type="primary"
            :disabled="!videoModelId || scriptChanged || isAiDramaRunning(row.videoStatus)"
            @click="handleGenerateVideo(row)"
          >
            {{ row.videoStatus ? '重新生成' : '生成视频' }}
          </el-button>
          <el-button
            v-if="row.continuity?.materialUrls?.length"
            link
            type="primary"
            :disabled="isAiDramaRunning(row.videoStatus)"
            @click="handleRenderMaterial(row.id)"
          >
            素材成片
          </el-button>
          <el-button
            v-if="$index > 0"
            link
            type="primary"
            :disabled="isAiDramaRunning(row.videoStatus)"
            @click="handleUsePreviousLastFrame(row.id)"
          >
            承接上一镜
          </el-button>
          <el-button
            link
            type="primary"
            :disabled="isAiDramaRunning(row.videoStatus)"
            @click="formRef.open(row)"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            :disabled="isAiDramaRunning(row.videoStatus)"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
          <el-dropdown
            class="ml-12px align-middle"
            @command="(command) => handleCommand(command, row)"
          >
            <el-button link type="primary"
              >更多 <Icon icon="ep:arrow-down" class="ml-2px"
            /></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="submission">提交记录</el-dropdown-item>
                <el-dropdown-item command="voice">镜头声音</el-dropdown-item>
                <el-dropdown-item
                  command="importVideo"
                  :disabled="isAiDramaRunning(row.videoStatus)"
                >
                  导入视频
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 配乐、参考音频：指定使用的镜头；参考音频随镜头视频提交，配乐用于成片 -->
  <ContentWrap>
    <div class="mb-12px flex items-center">
      <span class="text-16px font-500">配乐与参考音频</span>
      <div class="flex-1"></div>
      <el-button @click="musicRef.open()">
        <Icon icon="ep:headset" class="mr-4px" /> AI 配乐
      </el-button>
      <el-button @click="audioFormRef.open()">
        <Icon icon="ep:plus" class="mr-4px" /> 新增音频
      </el-button>
    </div>
    <el-empty v-if="!placementAudios.length" description="暂无配乐或参考音频" :image-size="60" />
    <el-table v-else :data="placementAudios" row-key="id">
      <el-table-column label="类型" width="90" align="center">
        <template #default="{ row }">
          {{ row.type === AiDramaAudioTypeEnum.BGM ? '配乐' : '参考音频' }}
        </template>
      </el-table-column>
      <el-table-column label="名称" prop="name" min-width="140" />
      <el-table-column label="音频" min-width="240">
        <template #default="{ row }">
          <audio :src="row.fileUrl" controls preload="none" class="h-32px w-full"></audio>
        </template>
      </el-table-column>
      <el-table-column label="使用的镜头" min-width="140">
        <template #default="{ row }">
          {{ row.storyboardIds?.length ? getSceneNos(row.storyboardIds) : '候选，未使用' }}
        </template>
      </el-table-column>
      <el-table-column label="音量" prop="volume" width="70" align="center" />
      <el-table-column label="起始偏移（秒）" prop="startOffset" width="120" align="center" />
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="audioFormRef.open(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDeleteAudio(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 动作参考：镜头的动作参考视频可从这里选用；3D 导演导出的白模预演也可加入 -->
  <ContentWrap>
    <div class="mb-12px flex items-center">
      <span class="text-16px font-500">动作参考</span>
      <div class="flex-1"></div>
      <el-button @click="motionFormRef.open()">
        <Icon icon="ep:plus" class="mr-4px" /> 添加动作参考
      </el-button>
    </div>
    <el-empty
      v-if="!detail.motionReferences?.length"
      description="暂无动作参考视频"
      :image-size="60"
    />
    <div v-else class="flex flex-wrap gap-12px">
      <div v-for="item in detail.motionReferences" :key="item.id" class="w-200px">
        <video
          :src="item.fileUrl"
          controls
          preload="metadata"
          class="h-120px w-200px rounded-4px bg-black"
        ></video>
        <div class="flex items-center text-12px">
          <span class="flex-1 truncate">{{ item.name }}</span>
          <span v-if="item.duration" class="mr-8px text-[var(--el-text-color-secondary)]"
            >{{ item.duration.toFixed(1) }} 秒</span
          >
          <el-button link type="danger" @click="handleDeleteMotion(item.id)">删除</el-button>
        </div>
      </div>
    </div>
  </ContentWrap>

  <StoryboardForm ref="formRef" :detail="detail" @success="emit('refresh')" />
  <PlanReviewDialog
    ref="planReviewRef"
    :detail="detail"
    :chat-model-id="chatModelId"
    @success="emit('refresh')"
  />
  <FrameBatchForm
    ref="frameBatchRef"
    :project-id="project.id"
    :model-id="imageModelId"
    @success="emit('refresh')"
  />
  <VideoSubmissionDialog ref="submissionRef" @success="emit('refresh')" />
  <VoiceDialog ref="voiceRef" :detail="detail" @success="emit('refresh')" />
  <ImportVideoForm ref="importVideoRef" @success="emit('refresh')" />
  <MusicDialog ref="musicRef" :detail="detail" @success="emit('refresh')" />
  <MotionReferenceForm ref="motionFormRef" :project-id="project.id" @success="emit('refresh')" />
  <ComposeForm ref="composeRef" :detail="detail" @success="emit('refresh')" />
  <AudioForm ref="audioFormRef" :detail="detail" @success="emit('refresh')" />
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { DICT_TYPE } from '@/utils/dict'
import {
  AiDramaAudioTypeEnum,
  AiDramaProjectStatusEnum,
  AiDramaStatusEnum,
  AiModelTypeEnum,
  AiPlatformEnum,
  AiVideoTypeEnum,
  isAiDramaRunning
} from '@/views/ai/utils/constants'
import { getVideoModelCapability, isVideoModelOfType } from '@/views/ai/utils/video'
import {
  formatDramaDuration,
  getDramaProps,
  getDramaStoryboardFrame,
  hasDramaArchive
} from '@/views/ai/utils/drama'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'
import AssetImage from '../../components/AssetImage.vue'
import StoryboardForm from './StoryboardForm.vue'
import ComposeForm from './ComposeForm.vue'
import AudioForm from './AudioForm.vue'
import PlanReviewDialog from './storyboard/PlanReviewDialog.vue'
import FrameBatchForm from './storyboard/FrameBatchForm.vue'
import VideoSubmissionDialog from './storyboard/VideoSubmissionDialog.vue'
import VoiceDialog from './storyboard/VoiceDialog.vue'
import ImportVideoForm from './storyboard/ImportVideoForm.vue'
import MusicDialog from './storyboard/MusicDialog.vue'
import MotionReferenceForm from './storyboard/MotionReferenceForm.vue'
import { generateUUID } from '@/utils'

/** AI 短剧：分镜与成片 */
defineOptions({ name: 'AiDramaStoryboardStep' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: [] }>()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const formRef = ref()
const composeRef = ref()
const audioFormRef = ref()
const planReviewRef = ref()
const frameBatchRef = ref()
const submissionRef = ref()
const voiceRef = ref()
const importVideoRef = ref()
const musicRef = ref()
const motionFormRef = ref()
const generatingDetail = ref('') // 生成中的镜头设计名称
const chatModelId = ref<number>()
const imageModels = ref<ModelVO[]>([])
const imageModelId = ref<number>()
const videoModels = ref<ModelVO[]>([])
const videoModelId = ref<number>()
const resolution = ref<string>()
const generatingStoryboards = ref(false)
const generatingBatch = ref(false)

const project = computed(() => props.detail.project)
/** 剧本已修改：分镜可能已过期，不能生成关键帧、视频 */
const scriptChanged = computed(
  () => project.value.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED
)
const successCount = computed(
  () =>
    props.detail.storyboards.filter(
      (item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl
    ).length
)
const placementAudios = computed(() =>
  props.detail.audios.filter((item) =>
    [AiDramaAudioTypeEnum.BGM, AiDramaAudioTypeEnum.REFERENCE].includes(item.type)
  )
)

/** 视频模型可选的分辨率：与 AI 视频一致，第一个为默认；为空表示不传 */
const resolutions = computed(() => {
  const model = videoModels.value.find((item) => item.id === videoModelId.value)
  return model ? getVideoModelCapability(model.platform, model.model).resolutions : []
})
watch(resolutions, (list) => {
  if (!list.includes(resolution.value!)) {
    resolution.value = list[0]
  }
})

/** 镜头的视频模型：生成时固定使用；名称取模型列表，已删除时取快照 */
const getVideoModelText = (storyboard: DramaStoryboardVO) => {
  const name =
    videoModels.value.find((item) => item.id === storyboard.videoModelId)?.name ||
    storyboard.videoModel ||
    `#${storyboard.videoModelId}`
  return storyboard.videoResolution ? `${name} · ${storyboard.videoResolution}` : name
}

const getCharacterName = (characterId?: number) =>
  props.detail.characters.find((item) => item.id === characterId)?.name || '旁白'

const getFrame = (storyboardId: number) =>
  getDramaStoryboardFrame(props.detail.visualAssets, storyboardId)

const getSceneNos = (storyboardIds: number[]) =>
  props.detail.storyboards
    .filter((item) => storyboardIds.includes(item.id))
    .map((item) => `#${item.sceneNo}`)
    .join('、')

/** 镜头引用的角色形象（含站位）、场景、道具名称；未指定道具时，按道具关联的镜头序号 */
const getAssetNames = (storyboard: DramaStoryboardVO) => {
  const names: string[] = []
  storyboard.characters?.forEach((ref) => {
    props.detail.characters.forEach((character) => {
      const appearance = character.appearances.find((item) => item.id === ref.appearanceId)
      if (appearance) {
        names.push(
          `${character.name}·形象${appearance.appearanceIndex}${ref.slot ? `（${ref.slot}）` : ''}`
        )
      }
    })
  })
  const location = props.detail.locations.find((item) => item.id === storyboard.locationId)
  if (location) {
    names.push(location.name)
  }
  getDramaProps(props.detail.visualAssets)
    .filter((item) =>
      storyboard.visualAssetIds
        ? storyboard.visualAssetIds.includes(item.id)
        : item.referenceImages?.shotNumbers?.includes(storyboard.sceneNo!)
    )
    .forEach((item) => names.push(item.title || '未命名道具'))
  return names
}

/** 从剧本生成分镜：会替换已有镜头 */
const handleGenerateStoryboards = async () => {
  try {
    if (props.detail.storyboards.length) {
      await message.confirm('重新生成会替换现有的全部镜头（包括已生成的关键帧、视频），是否继续？')
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
      videoModelId.value!,
      resolution.value
    )
    message.success(count ? `已提交 ${count} 个镜头` : '没有需要生成的镜头')
    emit('refresh')
  } finally {
    generatingBatch.value = false
  }
}

/** 生成视频：每次点击一个请求编号，服务端据此识别重复提交 */
const handleGenerateVideo = async (storyboard: DramaStoryboardVO) => {
  await DramaStoryboardApi.generateStoryboardVideo(
    storyboard.id,
    videoModelId.value!,
    resolution.value,
    generateUUID()
  )
  message.success('已提交生成')
  emit('refresh')
}

/** 生成镜头设计：摄影规则、表演指导、关键帧规划，覆盖当前剧本全部镜头的对应内容 */
const DETAIL_GENERATORS: Record<
  string,
  { name: string; api: (projectId: number, modelId?: number) => Promise<any> }
> = {
  photography: { name: '摄影规则', api: DramaScriptApi.generatePhotographyRules },
  acting: { name: '表演指导', api: DramaScriptApi.generateActingNotes },
  frame: { name: '关键帧规划', api: DramaScriptApi.planFrameList }
}
const handleGenerateDetail = async (command: string) => {
  const generator = DETAIL_GENERATORS[command]
  try {
    await message.confirm(`为当前剧本的全部镜头生成${generator.name}，会覆盖已有的内容，是否继续？`)
  } catch {
    return
  }
  generatingDetail.value = `${generator.name}生成中`
  try {
    await generator.api(project.value.id, chatModelId.value)
    message.success(`${generator.name}已生成`)
    emit('refresh')
  } finally {
    generatingDetail.value = ''
  }
}

const handleCommand = (command: string, row: DramaStoryboardVO) => {
  if (command === 'submission') {
    submissionRef.value.open(row)
  } else if (command === 'voice') {
    voiceRef.value.open(row)
  } else {
    importVideoRef.value.open(row)
  }
}

// ========== 关键帧 ==========

const handleGenerateFrame = async (storyboard: DramaStoryboardVO) => {
  await DramaStoryboardApi.generateStoryboardFrame(storyboard.id, imageModelId.value!)
  message.success('已提交生成关键帧')
  emit('refresh')
}

/** 修正构图：以当前关键帧为参考，按修正说明重新生成 */
const handleReviseFrame = async (storyboard: DramaStoryboardVO) => {
  let revisePrompt: string
  try {
    const { value } = await message.prompt('请输入修正说明，例如：人物移到画面左侧', '修正构图')
    revisePrompt = value?.trim()
  } catch {
    return
  }
  if (!revisePrompt) {
    message.warning('修正说明不能为空')
    return
  }
  await DramaStoryboardApi.generateStoryboardFrame(storyboard.id, imageModelId.value!, revisePrompt)
  message.success('已提交修正构图')
  emit('refresh')
}

const handleUndoFrame = async (id: number) => {
  try {
    await message.confirm('撤销后恢复为上一版关键帧，是否继续？')
  } catch {
    return
  }
  await DramaAssetApi.undoVisualAssetImage(id)
  message.success('已撤销')
  emit('refresh')
}

/** 承接上一镜：上一镜视频的尾帧作为本镜的手动起始帧 */
const handleUsePreviousLastFrame = async (id: number) => {
  await DramaStoryboardApi.usePreviousLastFrame(id)
  message.success('已使用上一镜的尾帧作为起始帧')
  emit('refresh')
}

/** 素材成片：素材图片直接渲染为镜头视频，不调用视频模型 */
const handleRenderMaterial = async (id: number) => {
  await DramaStoryboardApi.renderStoryboardMaterial(id)
  message.success('已开始渲染素材')
  emit('refresh')
}

const handleDownload = () => {
  window.open(project.value.composeFileUrl, '_blank')
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm('删除镜头会一并删除其关键帧，是否继续？')
    await DramaStoryboardApi.deleteStoryboard(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

// ========== 配乐、参考音频、动作参考 ==========

const handleDeleteMotion = async (id: number) => {
  try {
    await message.delConfirm('删除后，已选用它的镜头仍保留视频地址，是否继续？')
    await DramaAssetApi.deleteMotionReference(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

const handleDeleteAudio = async (id: number) => {
  try {
    await message.delConfirm()
    await DramaAssetApi.deleteAudio(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

onMounted(async () => {
  // Midjourney 不支持，不展示
  imageModels.value = (await ModelApi.getModelSimpleList(AiModelTypeEnum.IMAGE)).filter(
    (item: ModelVO) => item.platform !== AiPlatformEnum.MIDJOURNEY
  )
  imageModelId.value = imageModels.value[0]?.id
  videoModels.value = (await ModelApi.getModelSimpleList(AiModelTypeEnum.VIDEO)).filter((item) =>
    isVideoModelOfType(AiVideoTypeEnum.GENERATE, item.platform, item.model)
  )
  videoModelId.value = videoModels.value[0]?.id
})
</script>
