<!-- AI 短剧：第 3 步，资产配置（角色、场景、道具） -->
<template>
  <ContentWrap>
    <div class="flex flex-wrap items-center gap-12px">
      <span class="text-14px">绘画模型</span>
      <el-select v-model="imageModelId" placeholder="请选择绘画模型" filterable class="!w-240px">
        <el-option v-for="item in imageModels" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <el-button
        type="primary"
        plain
        :disabled="!imageModelId"
        :loading="generatingMissing"
        @click="handleGenerateMissing"
      >
        一键补齐图片
      </el-button>
      <span class="text-12px text-[var(--el-text-color-secondary)]">
        已出图：角色形象 {{ readiness.appearance }}，场景 {{ readiness.location }}，道具
        {{ readiness.prop }}
      </span>
      <div class="flex-1"></div>
      <el-button type="primary" @click="emit('next', AiDramaStepEnum.STORYBOARD)">
        下一步：分镜与成片 →
      </el-button>
    </div>
  </ContentWrap>

  <ContentWrap>
    <el-tabs v-model="activeTab">
      <!-- 角色 -->
      <el-tab-pane :label="`角色（${detail.characters.length}）`" name="character">
        <el-button class="mb-12px" @click="characterDrawerRef.open()">
          <Icon icon="ep:plus" class="mr-4px" /> 新增角色
        </el-button>
        <el-empty
          v-if="!detail.characters.length"
          description="暂无角色，可在剧本步骤「分析资产」自动提取"
        />
        <div class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-12px">
          <el-card v-for="character in detail.characters" :key="character.id" shadow="never">
            <div class="mb-8px flex items-center justify-between">
              <span class="font-500">{{ character.name }}</span>
              <div>
                <el-button link type="primary" @click="characterDrawerRef.open(character.id)">
                  详情
                </el-button>
                <el-button link type="danger" @click="handleDeleteCharacter(character.id)">
                  删除
                </el-button>
              </div>
            </div>
            <div class="mb-8px line-clamp-2 text-12px text-[var(--el-text-color-secondary)]">
              {{ character.description || '暂无设定' }}
            </div>
            <div class="flex flex-wrap gap-8px">
              <div
                v-for="appearance in character.appearances"
                :key="appearance.id"
                class="text-center"
              >
                <AssetImage
                  :url="getSelectedImageUrl(appearance.imageUrls, appearance.selectedIndex)"
                  :status="appearance.status"
                  :error-message="appearance.errorMessage"
                  size="80px"
                />
                <div class="mt-2px text-12px">
                  形象 {{ appearance.appearanceIndex }}
                  <el-button
                    link
                    type="primary"
                    size="small"
                    :disabled="!imageModelId || isAiDramaRunning(appearance.status)"
                    @click="handleGenerate('appearance', appearance.id)"
                  >
                    出图
                  </el-button>
                </div>
              </div>
            </div>
            <div class="mt-8px flex items-center gap-8px text-12px">
              <span class="text-[var(--el-text-color-secondary)]">样音</span>
              <audio
                v-if="getSelectedAudio(character)"
                :src="getSelectedAudio(character)"
                controls
                class="h-28px flex-1"
              ></audio>
              <span v-else class="text-[var(--el-text-color-secondary)]">未选用</span>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 场景 -->
      <el-tab-pane :label="`场景（${detail.locations.length}）`" name="location">
        <el-button class="mb-12px" @click="locationFormRef.open()">
          <Icon icon="ep:plus" class="mr-4px" /> 新增场景
        </el-button>
        <el-empty v-if="!detail.locations.length" description="暂无场景" />
        <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-12px">
          <el-card
            v-for="location in detail.locations"
            :key="location.id"
            shadow="never"
            :body-style="{ padding: '10px' }"
          >
            <AssetImage
              :url="getSelectedImageUrl(location.imageUrls, location.selectedIndex)"
              :status="location.status"
              :error-message="location.errorMessage"
              size="100%"
              class="aspect-square"
            />
            <div class="mt-6px truncate font-500">{{ location.name }}</div>
            <div class="mt-4px flex justify-end">
              <el-button
                link
                type="primary"
                :disabled="!imageModelId || isAiDramaRunning(location.status)"
                @click="handleGenerate('location', location.id)"
              >
                出图
              </el-button>
              <el-button
                v-if="location.previousImageUrls"
                link
                type="primary"
                :disabled="isAiDramaRunning(location.status)"
                @click="handleUndo('location', location.id)"
              >
                撤销
              </el-button>
              <el-button link type="primary" @click="locationFormRef.open(location)">
                编辑
              </el-button>
              <el-button link type="danger" @click="handleDeleteLocation(location.id)">
                删除
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 道具 -->
      <el-tab-pane :label="`道具（${propList.length}）`" name="prop">
        <el-button class="mb-12px" @click="propFormRef.open()">
          <Icon icon="ep:plus" class="mr-4px" /> 新增道具
        </el-button>
        <el-empty v-if="!propList.length" description="暂无道具" />
        <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-12px">
          <el-card
            v-for="asset in propList"
            :key="asset.id"
            shadow="never"
            :body-style="{ padding: '10px' }"
          >
            <AssetImage
              :url="asset.imageUrl"
              :status="asset.status"
              :error-message="asset.errorMessage"
              size="100%"
              class="aspect-square"
            />
            <div class="mt-6px truncate font-500">{{ asset.title }}</div>
            <div class="truncate text-12px text-[var(--el-text-color-secondary)]">
              镜头：{{ asset.referenceImages?.shotNumbers?.join('、') || '未关联' }}
            </div>
            <div class="mt-4px flex justify-end">
              <el-button
                v-if="hasDramaArchive(detail.visualAssets, asset.id)"
                link
                type="primary"
                :disabled="isAiDramaRunning(asset.status)"
                @click="handleUndo('visual_asset', asset.id)"
              >
                撤销
              </el-button>
              <el-button
                link
                type="primary"
                :disabled="!imageModelId || isAiDramaRunning(asset.status)"
                @click="handleGenerate('visual_asset', asset.id)"
              >
                出图
              </el-button>
              <el-button link type="primary" @click="propFormRef.open(asset)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteProp(asset.id)">删除</el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>

  <CharacterDrawer
    ref="characterDrawerRef"
    :project-id="detail.project.id"
    :characters="detail.characters"
    :image-model-id="imageModelId"
    @refresh="emit('refresh')"
  />

  <LocationForm
    ref="locationFormRef"
    :project-id="detail.project.id"
    :locations="detail.locations"
    @success="emit('refresh')"
  />
  <PropForm
    ref="propFormRef"
    :project-id="detail.project.id"
    :scene-nos="sceneNos"
    @success="emit('refresh')"
  />
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaAssetApi, DramaCharacterVO } from '@/api/ai/drama/asset'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import {
  AiDramaStepEnum,
  AiModelTypeEnum,
  AiPlatformEnum,
  isAiDramaRunning
} from '@/views/ai/utils/constants'
import { getDramaProps, getSelectedImageUrl, hasDramaArchive } from '@/views/ai/utils/drama'
import AssetImage from '../../components/AssetImage.vue'
import CharacterDrawer from './CharacterDrawer.vue'
import LocationForm from './LocationForm.vue'
import PropForm from './PropForm.vue'

/** AI 短剧：资产配置 */
defineOptions({ name: 'AiDramaAssetStep' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: []; next: [step: number] }>()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const activeTab = ref('character')
const characterDrawerRef = ref()
const locationFormRef = ref()
const propFormRef = ref()

// ========== 绘画模型、出图 ==========

const imageModels = ref<ModelVO[]>([])
const imageModelId = ref<number>()
const generatingMissing = ref(false)

/** 当前的道具：不含关键帧、历史版本 */
const propList = computed(() => getDramaProps(props.detail.visualAssets))

/** 当前分镜的镜头序号：道具关联镜头时选择 */
const sceneNos = computed(() =>
  props.detail.storyboards
    .filter((item) => item.scriptId === props.detail.script?.id && item.sceneNo)
    .map((item) => item.sceneNo!)
)

/** 已出图的数量 */
const readiness = computed(() => {
  const appearances = props.detail.characters.flatMap((item) => item.appearances)
  const count = <T,>(list: T[], done: (item: T) => boolean) =>
    `${list.filter(done).length}/${list.length}`
  return {
    appearance: count(appearances, (item) => !!item.imageUrls?.length),
    location: count(props.detail.locations, (item) => !!item.imageUrls?.length),
    prop: count(propList.value, (item) => !!item.imageUrl)
  }
})

const handleGenerate = async (type: 'appearance' | 'location' | 'visual_asset', id: number) => {
  const modelId = imageModelId.value!
  if (type === 'appearance') {
    await DramaAssetApi.generateAppearanceImage(id, modelId)
  } else if (type === 'location') {
    await DramaAssetApi.generateLocationImage(id, modelId)
  } else {
    await DramaAssetApi.generateVisualAssetImage(id, modelId)
  }
  message.success('已提交出图')
  emit('refresh')
}

/** 撤销上次出图：场景恢复上一版候选图，道具与最近的历史版本互换 */
const handleUndo = async (type: 'location' | 'visual_asset', id: number) => {
  try {
    await message.confirm('撤销后恢复为上一版图片，是否继续？')
  } catch {
    return
  }
  if (type === 'location') {
    await DramaAssetApi.undoLocationImage(id)
  } else {
    await DramaAssetApi.undoVisualAssetImage(id)
  }
  message.success('已撤销')
  emit('refresh')
}

const handleGenerateMissing = async () => {
  generatingMissing.value = true
  try {
    const count = await DramaAssetApi.generateMissingImages(
      props.detail.project.id,
      imageModelId.value!
    )
    message.success(count ? `已提交 ${count} 个出图任务` : '没有需要补齐的图片')
    emit('refresh')
  } finally {
    generatingMissing.value = false
  }
}

// ========== 角色 ==========

const getSelectedAudio = (character: DramaCharacterVO) =>
  character.audios.find((item) => item.id === character.sampleAudioId)?.fileUrl

const handleDeleteCharacter = async (id: number) => {
  try {
    await message.delConfirm('删除角色会一并删除其形象与样音，是否继续？')
    await DramaAssetApi.deleteCharacter(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

// ========== 场景 ==========

const handleDeleteLocation = async (id: number) => {
  try {
    await message.delConfirm()
    await DramaAssetApi.deleteLocation(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

// ========== 道具 ==========

const handleDeleteProp = async (id: number) => {
  try {
    await message.delConfirm()
    await DramaAssetApi.deleteVisualAsset(id)
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
})
</script>
