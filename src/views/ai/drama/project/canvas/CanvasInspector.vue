<!-- AI 短剧画布：右侧的节点编辑 -->
<template>
  <div
    class="h-full w-360px flex flex-col border-l border-l-[var(--el-border-color-lighter)] border-l-solid bg-[var(--el-bg-color)]"
  >
    <div
      class="flex items-center justify-between border-b border-b-[var(--el-border-color-lighter)] border-b-solid px-16px py-12px"
    >
      <span class="text-14px font-600">{{ DRAMA_CANVAS_LABELS[node.kind] }}节点</span>
      <el-button link @click="emit('close')"><Icon icon="ep:close" /></el-button>
    </div>
    <el-scrollbar class="flex-1">
      <el-form label-position="top" class="px-16px pt-12px">
        <el-form-item label="名称">
          <el-input v-model="node.data.title" maxlength="60" />
        </el-form-item>
        <el-form-item v-if="node.kind === 'image'" label="用途">
          <el-radio-group v-model="node.data.purpose" :disabled="!!node.data.business">
            <el-radio-button
              v-for="item in DRAMA_IMAGE_PURPOSES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="node.kind !== 'group'" :label="CONTENT_LABELS[node.kind]">
          <el-input
            v-model="node.data.content"
            type="textarea"
            :rows="node.kind === 'script' ? 12 : 4"
          />
        </el-form-item>
        <el-form-item v-if="PROMPT_LABELS[node.kind]" :label="PROMPT_LABELS[node.kind]">
          <el-input v-model="node.data.prompt" type="textarea" :rows="3" />
          <div v-if="node.kind === 'audio'" class="text-12px text-[var(--el-text-color-secondary)]">
            声音描述写入角色，生成镜头视频时加入提示词；语音合成只按音色标识，不支持按描述设计音色
          </div>
        </el-form-item>
        <el-form-item v-if="node.kind === 'image'" label="参考图">
          <UploadImg v-model="node.data.url" height="96px" width="96px" :file-size="10" />
        </el-form-item>
        <el-form-item v-if="modelOptions.length" label="模型">
          <el-select v-model="node.data.modelId" filterable clearable class="!w-full">
            <el-option
              v-for="item in modelOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="node.kind === 'audio'" label="音色标识">
          <el-input
            v-model="node.data.voice"
            placeholder="服务商的音色标识，例如 longxiaochun"
            maxlength="128"
          />
        </el-form-item>
        <template v-if="node.kind === 'video'">
          <el-form-item v-if="resolutions.length" label="分辨率">
            <el-select v-model="node.data.resolution" clearable class="!w-full">
              <el-option v-for="item in resolutions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="镜头顺序">
            <el-input-number
              v-model="node.data.order"
              :min="1"
              :max="999"
              controls-position="right"
            />
          </el-form-item>
        </template>

        <!-- 输入节点 -->
        <el-form-item v-if="inputs.length" label="输入">
          <div class="w-full">
            <div
              v-for="item in inputs"
              :key="item.edge.id"
              class="flex items-center justify-between py-2px text-13px"
            >
              <span class="truncate"
                >{{ DRAMA_CANVAS_LABELS[item.node.kind] }} · {{ item.node.data.title }}</span
              >
              <el-button link type="danger" @click="emit('remove-edge', item.edge.id)">
                断开
              </el-button>
            </div>
          </div>
        </el-form-item>

        <!-- 候选图：选用后写入角色形象、场景 -->
        <el-form-item v-if="candidates.length" label="候选图">
          <div class="flex flex-wrap gap-8px">
            <el-image
              v-for="(url, index) in candidates"
              :key="url"
              :src="url"
              fit="cover"
              class="h-72px w-72px cursor-pointer rounded-4px"
              :class="
                index === selectedIndex ? 'outline outline-2 outline-[var(--el-color-primary)]' : ''
              "
              @click="emit('select-image', index)"
            />
          </div>
        </el-form-item>
        <el-form-item v-if="errorMessage" label="失败原因">
          <span class="text-12px text-[var(--el-color-danger)]">{{ errorMessage }}</span>
        </el-form-item>
      </el-form>
    </el-scrollbar>
    <div
      v-if="node.kind !== 'text' && node.kind !== 'group'"
      class="border-t border-t-[var(--el-border-color-lighter)] border-t-solid p-12px"
    >
      <el-button
        v-if="node.kind === 'previs'"
        type="primary"
        class="w-full"
        @click="emit('open-director')"
      >
        打开 3D 导演
      </el-button>
      <template v-else>
        <!-- 「保存到项目」写回节点关联的业务数据；画布布局在顶部「保存画布」 -->
        <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
          「保存到项目」写回{{ BUSINESS_LABELS[node.kind] }}，不发起生成；画布在顶部保存
        </div>
        <div class="flex justify-end gap-8px">
          <el-button v-if="node.kind === 'script'" :disabled="busy" @click="emit('plan')">
            拆分分镜
          </el-button>
          <el-button :disabled="busy" @click="emit('sync')">保存到项目</el-button>
          <el-button
            v-if="node.data.purpose !== 'frame'"
            type="primary"
            :loading="busy"
            @click="emit('generate')"
          >
            {{ generateLabel }}
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelVO } from '@/api/ai/model/model'
import type { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { AiDramaStatusEnum } from '@/views/ai/utils/constants'
import { getVideoModelCapability } from '@/views/ai/utils/video'
import {
  DRAMA_CANVAS_LABELS,
  DRAMA_IMAGE_PURPOSES,
  DramaCanvasDocument,
  DramaCanvasKind,
  DramaCanvasNode
} from './canvas'

/** AI 短剧画布：节点编辑 */
defineOptions({ name: 'AiDramaCanvasInspector' })

const props = defineProps<{
  node: DramaCanvasNode
  doc: DramaCanvasDocument
  detail: DramaProjectDetailVO
  imageModels: ModelVO[]
  videoModels: ModelVO[]
  voiceModels: ModelVO[]
  busy: boolean
}>()
const emit = defineEmits<{
  close: []
  sync: []
  generate: []
  plan: []
  'select-image': [index: number]
  'remove-edge': [id: string]
  'open-director': []
}>()

const CONTENT_LABELS: Record<DramaCanvasKind, string> = {
  text: '内容',
  script: '剧本正文',
  image: '备注',
  video: '画面描述',
  audio: '样音文本',
  previs: '预演说明',
  group: ''
}
const PROMPT_LABELS: Partial<Record<DramaCanvasKind, string>> = {
  script: '打磨意见',
  image: '图片描述',
  video: '视频提示词',
  audio: '声音描述'
}
const GENERATE_LABELS: Partial<Record<DramaCanvasKind, string>> = {
  script: '保存并打磨剧本',
  image: '保存并生成图片',
  video: '保存并生成视频',
  audio: '保存并合成样音'
}

const BUSINESS_LABELS: Partial<Record<DramaCanvasKind, string>> = {
  script: '项目剧本',
  image: '项目资产',
  video: '项目镜头',
  audio: '角色声音'
}
/** 执行按钮：已保存为镜头的视频节点，再次生成即生成新版本 */
const generateLabel = computed(() =>
  props.node.kind === 'video' && props.node.data.business
    ? '生成新版本'
    : GENERATE_LABELS[props.node.kind]
)

const modelOptions = computed(() => {
  if (props.node.kind === 'image' && props.node.data.purpose !== 'frame') {
    return props.imageModels
  }
  if (props.node.kind === 'video') {
    return props.videoModels
  }
  return props.node.kind === 'audio' ? props.voiceModels : []
})

const resolutions = computed(() => {
  const model = props.videoModels.find((item) => item.id === props.node.data.modelId)
  return model ? getVideoModelCapability(model.platform, model.model).resolutions : []
})

const inputs = computed(() =>
  props.doc.edges
    .filter((edge) => edge.target === props.node.id)
    .map((edge) => ({ edge, node: props.doc.nodes.find((item) => item.id === edge.source)! }))
    .filter((item) => item.node)
)

/** 关联的角色形象、场景：候选图、选用、失败原因 */
const businessImage = computed(() => {
  const business = props.node.data.business
  if (props.node.kind !== 'image' || !business) {
    return undefined
  }
  if (business.type === 'character') {
    return props.detail.characters
      .find((item) => item.id === business.id)
      ?.appearances.find((item) => item.id === business.appearanceId)
  }
  if (business.type === 'location') {
    return props.detail.locations.find((item) => item.id === business.id)
  }
  return undefined
})
const candidates = computed(() => businessImage.value?.imageUrls || [])
const selectedIndex = computed(() => businessImage.value?.selectedIndex)
/** 失败原因：仅关联的任务为已失败时展示；镜头按视频状态，其它按图片状态 */
const errorMessage = computed(() => {
  const business = props.node.data.business
  if (business?.type === 'storyboard') {
    const storyboard = props.detail.storyboards.find((item) => item.id === business.id)
    return storyboard?.videoStatus === AiDramaStatusEnum.FAIL ? storyboard.errorMessage : undefined
  }
  if (business?.type === 'prop') {
    const asset = props.detail.visualAssets.find((item) => item.id === business.id)
    return asset?.status === AiDramaStatusEnum.FAIL ? asset.errorMessage : undefined
  }
  const image = businessImage.value
  return image?.status === AiDramaStatusEnum.FAIL ? image.errorMessage : undefined
})
// DONE @AI：unocss 下？简化下；（根容器改为 UnoCSS，去掉样式块）
</script>
