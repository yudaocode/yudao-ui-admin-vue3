<!-- AI 短剧：第 4 步，分镜与成片 -->
<template>
  <!-- 成片：紧凑条放在最上方，默认收起；展开后播放成片、设置合成 -->
  <ComposeBar :detail="detail" @refresh="emit('refresh')" />

  <ContentWrap>
    <el-alert
      v-if="scriptChanged"
      type="warning"
      :closable="false"
      show-icon
      class="mb-12px"
      title="剧本已修改，请重新分析资产并从剧本生成分镜后，再生成关键帧和视频"
    />
    <!-- 工具栏：高频的「从剧本生成分镜」在前，对话模型在旁；其它入口收进「更多」「默认模型」「批量」 -->
    <div class="flex flex-wrap items-center gap-8px">
      <el-button type="primary" @click="handleGenerateStoryboards">
        <Icon icon="ep:magic-stick" class="mr-4px" /> 从剧本生成分镜
      </el-button>
      <ModelSelect
        v-model="chatModelId"
        :type="AiModelTypeEnum.CHAT"
        placeholder="默认对话模型"
        clearable
        class="!w-240px"
      />
      <el-dropdown :disabled="!!generatingDetail" @command="handleMoreCommand">
        <el-button :loading="!!generatingDetail">
          {{ generatingDetail || '更多' }} <Icon icon="ep:arrow-down" class="ml-4px" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="photography" :disabled="!detail.storyboards.length">
              生成摄影规则
            </el-dropdown-item>
            <el-dropdown-item command="acting" :disabled="!detail.storyboards.length">
              生成表演指导
            </el-dropdown-item>
            <el-dropdown-item command="frame" :disabled="!detail.storyboards.length">
              生成关键帧规划
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div class="flex-1"></div>
      <el-popover placement="bottom-end" :width="320" trigger="click">
        <template #reference>
          <el-button>
            默认模型：{{ defaultModelText }} <Icon icon="ep:arrow-down" class="ml-4px" />
          </el-button>
        </template>
        <el-form label-width="90px">
          <el-form-item label="绘画模型">
            <el-select v-model="imageModelId" placeholder="请选择绘画模型" filterable>
              <el-option
                v-for="item in imageModels"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="视频模型">
            <el-select v-model="videoModelId" placeholder="请选择视频模型" filterable>
              <el-option
                v-for="item in videoModels"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="resolutions.length" label="分辨率">
            <el-select v-model="resolution" placeholder="分辨率">
              <el-option v-for="item in resolutions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <div class="text-12px leading-18px text-[var(--el-text-color-secondary)]">
            未设置视频模型的镜头使用此模型；镜头可在生成设置中单独指定
          </div>
        </el-form>
      </el-popover>
      <el-dropdown @command="handleBatchCommand">
        <el-button :loading="generatingBatch">
          批量 <Icon icon="ep:arrow-down" class="ml-4px" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="frame" :disabled="!imageModelId || scriptChanged">
              批量关键帧
            </el-dropdown-item>
            <el-dropdown-item command="video" :disabled="!videoModelId || scriptChanged">
              批量生成视频
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </ContentWrap>

  <!-- 工作台：左侧按场次切镜，右侧单镜编辑与原位播放；overflow 用 clip 保持裁剪，不截断内部的 sticky -->
  <ContentWrap class="!overflow-clip" :body-style="{ padding: '10px', overflow: 'clip' }">
    <el-empty v-if="!detail.storyboards.length" description="暂无镜头，可从剧本生成分镜或手动新增">
      <el-button @click="openCreate"><Icon icon="ep:plus" class="mr-4px" /> 新增镜头</el-button>
    </el-empty>
    <el-row v-else :gutter="16">
      <el-col :span="6">
        <div class="shot-nav">
          <ShotNavigator
            v-model="selectedId"
            :storyboards="detail.storyboards"
            :locations="detail.locations"
          />
        </div>
      </el-col>
      <el-col :span="18">
        <ShotEditor
          v-if="selected"
          :detail="detail"
          :storyboard="selected"
          :index="selectedIndex"
          :total="detail.storyboards.length"
          :image-model-id="imageModelId"
          :video-model-id="videoModelId"
          :resolution="resolution"
          :model-text="selected.videoModelId ? getVideoModelText(selected) : ''"
          :script-changed="scriptChanged"
          @select="(offset) => (selectedId = detail.storyboards[selectedIndex + offset]?.id)"
          @create="openCreate"
          @refresh="emit('refresh')"
        />
      </el-col>
    </el-row>
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

  <StoryboardForm ref="formRef" :detail="detail" @success="handleCreated" />
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
  <MusicDialog ref="musicRef" :detail="detail" @success="emit('refresh')" />
  <MotionReferenceForm ref="motionFormRef" :project-id="project.id" @success="emit('refresh')" />
  <AudioForm ref="audioFormRef" :detail="detail" @success="emit('refresh')" />
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import {
  AiDramaAudioTypeEnum,
  AiDramaProjectStatusEnum,
  AiModelTypeEnum,
  AiPlatformEnum,
  AiVideoTypeEnum
} from '@/views/ai/utils/constants'
import { getVideoModelCapability, isVideoModelOfType } from '@/views/ai/utils/video'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'
import StoryboardForm from './StoryboardForm.vue'
import AudioForm from './AudioForm.vue'
import ComposeBar from './storyboard/ComposeBar.vue'
import ShotNavigator from './storyboard/ShotNavigator.vue'
import ShotEditor from './storyboard/ShotEditor.vue'
import PlanReviewDialog from './storyboard/PlanReviewDialog.vue'
import FrameBatchForm from './storyboard/FrameBatchForm.vue'
import MusicDialog from './storyboard/MusicDialog.vue'
import MotionReferenceForm from './storyboard/MotionReferenceForm.vue'

/** AI 短剧：分镜与成片 */
defineOptions({ name: 'AiDramaStoryboardStep' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: [] }>()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const formRef = ref()
const audioFormRef = ref()
const planReviewRef = ref()
const frameBatchRef = ref()
const musicRef = ref()
const motionFormRef = ref()
const generatingDetail = ref('') // 生成中的镜头设计名称
const chatModelId = ref<number>()
const imageModels = ref<ModelVO[]>([])
const imageModelId = ref<number>()
const videoModels = ref<ModelVO[]>([])
const videoModelId = ref<number>()
const resolution = ref<string>()
const generatingBatch = ref(false)

const project = computed(() => props.detail.project)
/** 剧本已修改：分镜可能已过期，不能生成关键帧、视频 */
const scriptChanged = computed(
  () => project.value.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED
)
const placementAudios = computed(() =>
  props.detail.audios.filter((item) =>
    [AiDramaAudioTypeEnum.BGM, AiDramaAudioTypeEnum.REFERENCE].includes(item.type)
  )
)

// ========== 切镜 ==========

/** 选中的镜头：默认第一个；镜头被删除、重新生成分镜后，选中位置相近的镜头 */
const selectedId = ref<number>()
const selectedIndex = computed(() =>
  props.detail.storyboards.findIndex((item) => item.id === selectedId.value)
)
const selected = computed(() => props.detail.storyboards[selectedIndex.value])
let lastIndex = 0
watch(
  () => props.detail.storyboards,
  (list) => {
    if (list.some((item) => item.id === selectedId.value)) {
      return
    }
    selectedId.value = list[Math.min(lastIndex, list.length - 1)]?.id
  },
  { immediate: true }
)
watch(selectedIndex, (index) => {
  if (index >= 0) {
    lastIndex = index
  }
})

/** 新增镜头：默认排在最后，保存后选中它 */
const openCreate = () => {
  const sceneNos = props.detail.storyboards.map((item) => item.sceneNo || 0)
  formRef.value.open(undefined, sceneNos.length ? Math.max(...sceneNos) + 1 : 1)
}
/** 镜头已新增：选中它并刷新 */
const handleCreated = (id: number) => {
  selectedId.value = id
  emit('refresh')
}

// ========== 模型 ==========

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

/** 默认模型的摘要：绘画模型 · 视频模型 · 分辨率 */
const defaultModelText = computed(
  () =>
    [
      imageModels.value.find((item) => item.id === imageModelId.value)?.name,
      videoModels.value.find((item) => item.id === videoModelId.value)?.name,
      resolution.value
    ]
      .filter(Boolean)
      .join(' · ') || '未选择'
)

/** 镜头的视频模型：生成时固定使用；名称取模型列表，已删除时取快照 */
const getVideoModelText = (storyboard: DramaStoryboardVO) => {
  const name =
    videoModels.value.find((item) => item.id === storyboard.videoModelId)?.name ||
    storyboard.videoModel ||
    `#${storyboard.videoModelId}`
  return storyboard.videoResolution ? `${name} · ${storyboard.videoResolution}` : name
}

const getSceneNos = (storyboardIds: number[]) =>
  props.detail.storyboards
    .filter((item) => storyboardIds.includes(item.id))
    .map((item) => `#${item.sceneNo}`)
    .join('、')

// ========== 分镜生成 ==========

/** 从剧本生成分镜：打开规划审阅并立即逐场规划；审阅后导入时才替换已有镜头，确认前原分镜保留 */
const handleGenerateStoryboards = () => {
  planReviewRef.value.open({ autoPlan: true })
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

/** 更多：生成镜头设计 */
const handleMoreCommand = (command: string) => {
  handleGenerateDetail(command)
}

/** 批量：批量关键帧、批量生成视频（未生成、已失败的镜头） */
const handleBatchCommand = async (command: string) => {
  if (command === 'frame') {
    frameBatchRef.value.open()
    return
  }
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

<style scoped lang="scss">
/* 镜头导航：随页面滚动时保持可见 */
.shot-nav {
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
}
</style>
