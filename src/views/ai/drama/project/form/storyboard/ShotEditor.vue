<!-- AI 短剧：单镜编辑区，编辑镜头字段、起始帧，原位查看视频结果；保存、重新生成只在底部出现一次 -->
<template>
  <div>
    <!-- 标题栏：切镜、删除、新增 -->
    <div class="mb-8px flex flex-wrap items-center gap-8px">
      <span class="text-16px font-500">镜 {{ storyboard.sceneNo }}</span>
      <el-button-group>
        <el-button size="small" :disabled="index <= 0" @click="emit('select', -1)">
          <Icon icon="ep:arrow-left" />
        </el-button>
        <el-button size="small" disabled>{{ index + 1 }} / {{ total }}</el-button>
        <el-button size="small" :disabled="index >= total - 1" @click="emit('select', 1)">
          <Icon icon="ep:arrow-right" />
        </el-button>
      </el-button-group>
      <span class="truncate text-14px">{{ storyboard.title || '未命名镜头' }}</span>
      <el-tag v-if="dirty" type="warning" size="small">未保存</el-tag>
      <div class="flex-1"></div>
      <el-button link type="danger" :disabled="running" @click="handleDelete">删除</el-button>
      <el-button @click="emit('create')"><Icon icon="ep:plus" class="mr-4px" /> 新增镜头</el-button>
    </div>

    <StoryboardFields ref="fieldsRef" :detail="detail" />

    <!-- 起始帧：关键帧的生成、修正、撤销，承接上一镜；操作即时生效 -->
    <el-divider content-position="left">起始帧</el-divider>
    <div class="flex flex-wrap items-start gap-12px">
      <AssetImage
        :url="frame?.imageUrl"
        :status="frame?.status"
        :error-message="frame?.errorMessage"
        size="96px"
      />
      <div class="flex flex-col gap-6px">
        <div>
          <el-tooltip
            v-if="storyboard.continuity?.manualStartFrame?.url"
            content="已设置手动起始帧，生成视频时优先使用"
            placement="top"
          >
            <el-tag size="small" type="warning">手动起始帧</el-tag>
          </el-tooltip>
        </div>
        <div>
          <el-button
            link
            type="primary"
            :disabled="!imageModelId || scriptChanged || isAiDramaRunning(frame?.status)"
            @click="handleGenerateFrame"
          >
            {{ frame ? '重新生成关键帧' : '生成关键帧' }}
          </el-button>
          <el-button
            v-if="frame?.imageUrl"
            link
            type="primary"
            :disabled="!imageModelId || scriptChanged || isAiDramaRunning(frame?.status)"
            @click="handleReviseFrame"
          >
            修正构图
          </el-button>
          <el-button
            v-if="frame && hasDramaArchive(detail.visualAssets, frame.id)"
            link
            type="primary"
            :disabled="isAiDramaRunning(frame.status)"
            @click="handleUndoFrame(frame.id)"
          >
            撤销
          </el-button>
          <el-button
            v-if="index > 0"
            link
            type="primary"
            :disabled="running"
            @click="handleUsePreviousLastFrame"
          >
            承接上一镜
          </el-button>
        </div>
      </div>
    </div>

    <el-divider />
    <ShotVideoResult :storyboard="storyboard" :model-text="modelText" @command="handleCommand" />

    <!-- 底部操作条：吸底，滚动时盖住下方内容 -->
    <div
      class="sticky bottom-0 z-1 mt-16px flex items-center justify-end gap-8px border-t border-t-solid border-t-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] pt-12px"
    >
      <span v-if="running" class="text-12px text-[var(--el-text-color-secondary)]">
        视频生成中，暂不能修改
      </span>
      <el-button
        :disabled="!videoModelId || scriptChanged || running"
        :loading="generating"
        @click="handleGenerateVideo"
      >
        {{ storyboard.videoStatus ? '重新生成视频' : '生成视频' }}
      </el-button>
      <el-button type="primary" :disabled="running" :loading="saving" @click="handleSave">
        保存镜头
      </el-button>
    </div>

    <VideoSubmissionDialog ref="submissionRef" @success="emit('refresh')" />
    <VoiceDialog ref="voiceRef" :detail="detail" @success="emit('refresh')" />
    <ImportVideoForm ref="importVideoRef" @success="emit('refresh')" />
  </div>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { isAiDramaRunning } from '@/views/ai/utils/constants'
import { getDramaStoryboardFrame, hasDramaArchive } from '@/views/ai/utils/drama'
import { generateUUID } from '@/utils'
import AssetImage from '../../../components/AssetImage.vue'
import StoryboardFields from './StoryboardFields.vue'
import ShotVideoResult from './ShotVideoResult.vue'
import VideoSubmissionDialog from './VideoSubmissionDialog.vue'
import VoiceDialog from './VoiceDialog.vue'
import ImportVideoForm from './ImportVideoForm.vue'
import type { StoryboardFieldsState } from './storyboardFields'

/** AI 短剧：单镜编辑区 */
defineOptions({ name: 'AiDramaShotEditor' })

const props = defineProps<{
  detail: DramaProjectDetailVO
  storyboard: DramaStoryboardVO
  index: number // 在当前镜头列表中的位置
  total: number
  imageModelId?: number // 绘画模型：生成关键帧
  videoModelId?: number // 默认视频模型
  resolution?: string // 默认分辨率
  modelText?: string // 本镜使用的视频模型
  scriptChanged: boolean // 剧本已修改：不能生成关键帧、视频
}>()
// select：切到上一镜（-1）、下一镜（1）；create：新增镜头
const emit = defineEmits<{ select: [offset: number]; create: []; refresh: [] }>()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const fieldsRef = ref()
const submissionRef = ref()
const voiceRef = ref()
const importVideoRef = ref()
const saving = ref(false)
const generating = ref(false)
/** 未保存的修改：切换镜头时暂存，切回时恢复；不弹确认 */
const drafts = new Map<number, StoryboardFieldsState>()

const running = computed(() => isAiDramaRunning(props.storyboard.videoStatus))
const frame = computed(() =>
  getDramaStoryboardFrame(props.detail.visualAssets, props.storyboard.id)
)
const dirty = computed<boolean>(() => !!fieldsRef.value?.dirty)

/**
 * 切换镜头时：暂存上一镜的未保存修改，加载本镜（有暂存时恢复）；
 * 同一镜头的轮询刷新：没有未保存的修改时重新加载，有时保留草稿，只由视频结果等区域展示最新状态
 */
watch(
  () => props.storyboard,
  async (storyboard, old) => {
    await nextTick()
    if (!fieldsRef.value) {
      return
    }
    if (old && old.id !== storyboard.id) {
      if (fieldsRef.value.dirty) {
        drafts.set(old.id, fieldsRef.value.getState())
      }
      fieldsRef.value.load(storyboard, drafts.get(storyboard.id))
      drafts.delete(storyboard.id)
      return
    }
    if (!old || !fieldsRef.value.dirty) {
      fieldsRef.value.load(storyboard)
    }
  },
  { immediate: true }
)

/** 组件已卸载：离开后迟到的回包不再写入表单 */
let disposed = false
onBeforeUnmount(() => (disposed = true))

/** 回包时是否仍在编辑发起操作的镜头：快速切镜、离开后迟到的回包不能写入其它镜头的表单 */
const isCurrent = (storyboardId: number) => !disposed && props.storyboard.id === storyboardId

/**
 * 保存镜头：按发起时的镜头与表单快照提交
 *
 * 1. 回包时仍在该镜头、且保存期间没有继续编辑：按保存的内容重新加载，之后的刷新取服务端结果
 * 2. 回包时仍在该镜头、但保存期间又有编辑：保留编辑，仍为未保存
 * 3. 回包时已切到其它镜头：不动当前表单；该镜头暂存的草稿与保存的内容一致时丢弃（已保存）
 *
 * @return 保存的镜头编号
 */
const save = async (): Promise<number> => {
  const storyboard = props.storyboard
  const data = { ...fieldsRef.value.buildData(), id: storyboard.id }
  const state = JSON.stringify(fieldsRef.value.getState())
  await DramaStoryboardApi.updateStoryboard(data)
  if (isCurrent(storyboard.id)) {
    if (JSON.stringify(fieldsRef.value.getState()) === state) {
      fieldsRef.value.load({ ...storyboard, ...data })
    }
  } else {
    const draft = drafts.get(storyboard.id)
    if (draft && JSON.stringify(draft) === state) {
      drafts.delete(storyboard.id)
    }
  }
  return storyboard.id
}

/** 保存镜头 */
const handleSave = async () => {
  saving.value = true
  try {
    await save()
    message.success('保存成功')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

/**
 * 生成视频：有未保存的修改时先保存，视频按保存后的镜头生成；镜头、模型、分辨率都取发起时的，回包期间切镜不影响；
 * 每次点击一个请求编号，服务端据此识别重复提交
 */
const handleGenerateVideo = async () => {
  const storyboardId = props.storyboard.id
  const videoModelId = props.videoModelId!
  const resolution = props.resolution
  generating.value = true
  try {
    const saved = fieldsRef.value.dirty
    if (saved) {
      await save()
    }
    await DramaStoryboardApi.generateStoryboardVideo(
      storyboardId,
      videoModelId,
      resolution,
      generateUUID()
    )
    message.success(saved ? '已保存镜头并提交生成' : '已提交生成')
    emit('refresh')
  } finally {
    generating.value = false
  }
}

/** 删除镜头：一并清掉它暂存的未保存修改 */
const handleDelete = async () => {
  const storyboardId = props.storyboard.id
  try {
    await message.delConfirm('删除镜头会一并删除其关键帧，是否继续？')
    await DramaStoryboardApi.deleteStoryboard(storyboardId)
    drafts.delete(storyboardId)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

/** 更多操作：提交记录、配音、导入视频、素材成片 */
const handleCommand = async (command: string) => {
  const storyboard = props.storyboard
  if (command === 'submission') {
    submissionRef.value.open(storyboard)
  } else if (command === 'voice') {
    voiceRef.value.open(storyboard)
  } else if (command === 'importVideo') {
    importVideoRef.value.open(storyboard)
  } else if (command === 'material') {
    // 素材成片：素材图片直接渲染为镜头视频，不调用视频模型
    await DramaStoryboardApi.renderStoryboardMaterial(storyboard.id)
    message.success('已开始渲染素材')
    emit('refresh')
  }
}

// ========== 关键帧 ==========

/** 生成关键帧 */
const handleGenerateFrame = async () => {
  await DramaStoryboardApi.generateStoryboardFrame(props.storyboard.id, props.imageModelId!)
  message.success('已提交生成关键帧')
  emit('refresh')
}

/** 修正构图：以当前关键帧为参考，按修正说明重新生成；镜头取发起时的，输入修正说明期间切镜不影响 */
const handleReviseFrame = async () => {
  const storyboardId = props.storyboard.id
  const imageModelId = props.imageModelId!
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
  await DramaStoryboardApi.generateStoryboardFrame(storyboardId, imageModelId, revisePrompt)
  message.success('已提交修正构图')
  emit('refresh')
}

/** 撤销关键帧：恢复为上一版 */
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

/** 承接上一镜：上一镜视频的尾帧作为本镜的手动起始帧；有未保存的修改时提示，避免保存时覆盖 */
const handleUsePreviousLastFrame = async () => {
  if (fieldsRef.value.dirty) {
    message.warning('请先保存本镜的修改，再承接上一镜')
    return
  }
  await DramaStoryboardApi.usePreviousLastFrame(props.storyboard.id)
  message.success('已使用上一镜的尾帧作为起始帧')
  emit('refresh')
}
</script>
