<!-- AI 图片生成：统一创作工作台 -->
<template>
  <!-- 高度占满可视区域（与 infra/build 等页面一致）：左侧表单、右侧作品各自滚动，生成按钮与分页始终可见 -->
  <div
    class="h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding))] flex gap-16px overflow-hidden"
  >
    <!-- 左：模型 + 创作表单（纵向 flex：创作表单占满剩余高度，参数区自己滚动，生成按钮在底部一行） -->
    <ContentWrap
      class="h-full w-420px flex-shrink-0 !mb-0"
      :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
    >
      <div class="mb-16px">
        <div class="text-16px font-bold">AI 图片生成</div>
        <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          选择模型后，表单按模型能力显示可用的参数
        </div>
      </div>
      <el-form label-position="top">
        <el-form-item label="模型">
          <el-select v-model="modelId" placeholder="请选择绘图模型" filterable class="!w-full">
            <el-option-group v-for="group in modelGroups" :key="group.label" :label="group.label">
              <el-option
                v-for="item in group.models"
                :key="item.model.id"
                :label="item.model.name"
                :value="item.model.id"
                :disabled="!!item.disabledReason"
              >
                <div class="flex items-center justify-between gap-8px">
                  <span class="truncate">{{ item.model.name }}</span>
                  <span class="flex flex-shrink-0 items-center gap-4px">
                    <el-tag v-if="item.disabledReason" type="info" size="small">不可用</el-tag>
                    <el-tag v-else-if="item.legacy" type="warning" size="small">legacy</el-tag>
                    <el-tag v-else-if="item.unregistered" type="info" size="small">
                      未登记 · 仅文生图
                    </el-tag>
                    <el-tag v-for="tag in item.tags" :key="tag" size="small" effect="plain">
                      {{ tag }}
                    </el-tag>
                  </span>
                </div>
              </el-option>
            </el-option-group>
          </el-select>
          <div v-if="modelsError" class="text-12px text-[var(--el-color-danger)]">
            模型列表加载失败
            <el-button link type="primary" size="small" @click="loadModels">重试</el-button>
          </div>
          <div
            v-else-if="modelsLoaded && modelGroups.length === 0"
            class="text-12px text-[var(--el-color-warning)]"
          >
            没有可用的绘图模型，请先在「模型配置」启用绘图模型
          </div>
          <div
            v-for="item in disabledModels"
            :key="item.model.id"
            class="text-12px text-[var(--el-text-color-secondary)] leading-18px"
          >
            {{ item.model.name }}：{{ item.disabledReason }}
          </div>
        </el-form-item>
      </el-form>
      <ImageMidjourneyForm
        v-if="selectedModel && isMidjourney"
        ref="midjourneyFormRef"
        :model="selectedModel"
        @submitted="handleSubmitted"
      />
      <ImageDrawForm
        v-else-if="selectedModel && selectedCapability"
        ref="drawFormRef"
        :key="selectedModel.id"
        :model="selectedModel"
        :capability="selectedCapability"
        @submitted="handleSubmitted"
      />
    </ContentWrap>

    <!-- 右：我的作品 / 公开画廊 -->
    <ImageWorks ref="worksRef" class="h-full min-w-0 flex-1" @regenerate="handleRegenerate" />
  </div>
</template>

<script setup lang="ts">
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { ImageVO } from '@/api/ai/image'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'
import {
  AiImagePlatformEnum,
  DOU_BAO_UNREGISTERED,
  IMAGE_MODEL_CAPABILITIES,
  getImageModelCapability,
  isImagePlatform
} from '../constants/imageCapabilities'
import ImageDrawForm from './components/ImageDrawForm.vue'
import ImageMidjourneyForm from './components/ImageMidjourneyForm.vue'
import ImageWorks from './components/ImageWorks.vue'

/** AI 绘图：统一创作工作台 */
defineOptions({ name: 'AiImage' })

const message = useMessage() // 消息弹窗

interface ModelItem {
  model: ModelVO
  disabledReason?: string // 不可选的原因
  legacy?: boolean
  unregistered?: boolean // 未登记：按平台保守能力
  tags: string[] // 能力标签
}

const models = ref<ModelItem[]>([]) // 绘图模型列表
const modelsLoaded = ref(false)
const modelsError = ref(false) // 模型列表加载失败：提示重试
const modelId = ref<number>() // 选中的模型编号
const selectedModel = computed(
  () => models.value.find((item) => item.model.id === modelId.value)?.model
)
const isMidjourney = computed(
  () => selectedModel.value?.platform === AiImagePlatformEnum.MIDJOURNEY
)
const selectedCapability = computed(() =>
  selectedModel.value
    ? getImageModelCapability(selectedModel.value.platform, selectedModel.value.model)
    : null
)

/** 模型下拉：按 通用模型 / Seedream / Midjourney 分组 */
const modelGroups = computed(() => {
  const groups = [
    {
      label: '通用模型',
      models: models.value.filter(
        (item) =>
          item.model.platform !== AiImagePlatformEnum.BYTEDANCE &&
          item.model.platform !== AiImagePlatformEnum.MIDJOURNEY
      )
    },
    {
      label: 'Seedream',
      models: models.value.filter((item) => item.model.platform === AiImagePlatformEnum.BYTEDANCE)
    },
    {
      label: 'Midjourney',
      models: models.value.filter((item) => item.model.platform === AiImagePlatformEnum.MIDJOURNEY)
    }
  ]
  return groups.filter((group) => group.models.length > 0)
})
const disabledModels = computed(() => models.value.filter((item) => item.disabledReason))

/** 构建模型的下拉项：能力标签、不可选原因 */
const buildModelItem = (model: ModelVO): ModelItem => {
  if (model.platform === AiImagePlatformEnum.MIDJOURNEY) {
    return { model, tags: ['五种模式', '按钮动作'] }
  }
  const capability = getImageModelCapability(model.platform, model.model)
  if (!capability) {
    return { model, disabledReason: DOU_BAO_UNREGISTERED, tags: [] }
  }
  const tags: string[] = []
  if (capability.reference.max > 0) {
    tags.push(`参考图 ≤${capability.reference.max}`)
  }
  if (capability.sizeMode === 'tier') {
    tags.push(capability.tiers!.join(' / '))
  } else if (capability.custom) {
    tags.push('自定义宽高')
  }
  return {
    model,
    disabledReason: capability.status?.blocked,
    legacy: !!capability.status?.legacy,
    unregistered: !IMAGE_MODEL_CAPABILITIES[`${model.platform}:${model.model}`],
    tags
  }
}

/** 提交成功：回到我的作品第 1 页 */
const worksRef = ref<InstanceType<typeof ImageWorks>>()
const handleSubmitted = () => {
  worksRef.value?.refreshMine()
}

/** 重新生成：切换到原模型，回填参数 */
const drawFormRef = ref<InstanceType<typeof ImageDrawForm>>()
const midjourneyFormRef = ref<InstanceType<typeof ImageMidjourneyForm>>()
const handleRegenerate = async (image: ImageVO) => {
  const item =
    models.value.find((item) => item.model.id === image.modelId) ||
    models.value.find(
      (item) => item.model.platform === image.platform && item.model.model === image.model
    )
  if (!item || item.disabledReason) {
    message.warning('原模型已不可用，请重新选择模型')
    return
  }
  modelId.value = item.model.id
  await nextTick()
  if (isMidjourney.value) {
    midjourneyFormRef.value?.setValues(image)
  } else {
    drawFormRef.value?.setValues(image)
  }
}

/** 加载绘图模型：默认选中第一个可用模型 */
const loadModels = async () => {
  modelsError.value = false
  try {
    const list: ModelVO[] = await ModelApi.getModelSimpleList(AiModelTypeEnum.IMAGE)
    models.value = list.filter((model) => isImagePlatform(model.platform)).map(buildModelItem)
    if (!models.value.some((item) => item.model.id === modelId.value)) {
      modelId.value = models.value.find((item) => !item.disabledReason)?.model.id
    }
  } catch {
    modelsError.value = true
  } finally {
    modelsLoaded.value = true
  }
}

/** 初始化 */
onMounted(() => {
  loadModels()
})
</script>
