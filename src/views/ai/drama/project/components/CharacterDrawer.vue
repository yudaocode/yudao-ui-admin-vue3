<!-- AI 短剧：角色详情，基本信息、形象版本、样音 -->
<template>
  <el-drawer v-model="visible" :title="characterId ? `角色：${character?.name || ''}` : '新增角色'" size="640px">
    <!-- 基本信息 -->
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="formData.name" maxlength="64" />
      </el-form-item>
      <el-form-item label="角色设定">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="年龄、外貌、性格、服装" maxlength="2000" />
      </el-form-item>
      <el-form-item label="出图提示词">
        <el-input v-model="formData.prompt" type="textarea" :rows="3" placeholder="为空时使用角色设定" maxlength="2000" />
      </el-form-item>
      <el-form-item label="参考图">
        <UploadImg v-model="formData.referenceImageUrl" height="96px" width="96px" :file-size="10">
          <template #tip>Seedream 出图时作为参考</template>
        </UploadImg>
      </el-form-item>
      <el-form-item>
        <div class="w-full flex justify-end">
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </el-form-item>
    </el-form>

    <template v-if="character">
      <!-- 形象版本 -->
      <el-divider content-position="left">形象版本</el-divider>
      <div v-for="appearance in character.appearances" :key="appearance.id" class="mb-16px rounded-6px border-1 border-[var(--el-border-color)] border-solid p-12px">
        <div class="mb-8px flex items-center justify-between">
          <span class="font-500">形象 {{ appearance.appearanceIndex }}</span>
          <div>
            <el-button
              link
              type="primary"
              :disabled="!imageModelId || isAiDramaRunning(appearance.status)"
              @click="handleGenerateImage(appearance.id)"
            >
              {{ isAiDramaRunning(appearance.status) ? '生成中' : '出图' }}
            </el-button>
            <el-button link type="primary" @click="handleSaveAppearance(appearance)">保存设定</el-button>
            <el-button link type="danger" @click="handleDeleteAppearance(appearance.id)">删除</el-button>
          </div>
        </div>
        <el-input
          v-model="appearanceForms[appearance.id].description"
          type="textarea"
          :rows="2"
          placeholder="形象设定，例如：雨夜，湿透的风衣"
          maxlength="2000"
          class="mb-8px"
        />
        <div class="flex flex-wrap gap-8px">
          <div
            v-for="(candidate, index) in appearance.candidates || []"
            :key="index"
            class="cursor-pointer rounded-6px p-2px"
            :class="appearance.selectedIndex === index ? 'outline outline-2 outline-[var(--el-color-primary)]' : ''"
            @click="candidate.url && handleSelectCandidate(appearance, index)"
          >
            <AssetImage
              :url="candidate.url"
              :status="candidate.url ? undefined : appearance.status"
              :error-message="appearance.errorMessage"
              size="88px"
            />
          </div>
          <span v-if="!appearance.candidates?.length" class="text-12px text-[var(--el-text-color-secondary)]">
            还没有候选图，选择绘画模型后点击「出图」
          </span>
        </div>
      </div>
      <el-button plain @click="handleCreateAppearance"><Icon icon="ep:plus" class="mr-4px" /> 新增形象</el-button>

      <!-- 样音 -->
      <el-divider content-position="left">样音</el-divider>
      <div v-for="audio in character.audios" :key="audio.id" class="mb-8px flex items-center gap-8px">
        <audio :src="audio.fileUrl" controls class="h-32px flex-1"></audio>
        <el-tag v-if="audio.type === AiDramaAudioTypeEnum.SAMPLE_SELECTED" type="success" size="small">已选用</el-tag>
        <el-button v-else link type="primary" @click="handleSelectAudio(audio.id)">选用</el-button>
        <el-button link type="danger" @click="handleDeleteAudio(audio.id)">删除</el-button>
      </div>
      <div class="mb-12px flex items-start gap-8px">
        <UploadFile v-model="uploadAudioUrl" :file-type="['mp3', 'wav', 'm4a']" :file-size="20" :limit="1" :is-show-tip="false" />
        <el-button :disabled="!uploadAudioUrl" @click="handleUploadAudio">保存上传的样音</el-button>
      </div>
      <AudioGenerateForm :project-id="projectId" :character-id="character.id" default-text="你好，很高兴认识你。" @success="emit('refresh')" />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { DramaAssetApi, DramaAppearanceVO, DramaCharacterVO } from '@/api/ai/drama/asset'
import { AiDramaAudioTypeEnum, isAiDramaRunning } from '@/views/ai/utils/constants'
import AssetImage from './AssetImage.vue'
import AudioGenerateForm from './AudioGenerateForm.vue'

/** AI 短剧：角色详情 */
defineOptions({ name: 'AiDramaCharacterDrawer' })

const props = defineProps<{ projectId: number; characters: DramaCharacterVO[]; imageModelId?: number }>()
const emit = defineEmits<{ refresh: [] }>()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const visible = ref(false)
const characterId = ref<number>()
const character = computed(() => props.characters.find((item) => item.id === characterId.value))
const formRef = ref()
const formData = reactive({ name: '', description: '', prompt: '', referenceImageUrl: '' })
const formRules = reactive({ name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }] })
const saving = ref(false)
const uploadAudioUrl = ref('')

// 形象设定的编辑表单：按形象编号，轮询刷新时不覆盖正在编辑的内容
const appearanceForms = reactive<Record<number, { description?: string }>>({})
watch(
  () => character.value?.appearances,
  (appearances) => {
    appearances?.forEach((item) => {
      if (!appearanceForms[item.id]) {
        appearanceForms[item.id] = { description: item.description }
      }
    })
  },
  { immediate: true }
)

/** 打开：不传编号时为新增 */
const open = (id?: number) => {
  visible.value = true
  characterId.value = id
  const item = props.characters.find((c) => c.id === id)
  formData.name = item?.name || ''
  formData.description = item?.description || ''
  formData.prompt = item?.prompt || ''
  formData.referenceImageUrl = item?.referenceImageUrl || ''
  uploadAudioUrl.value = ''
}
defineExpose({ open })

const handleSave = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    if (characterId.value) {
      await DramaAssetApi.updateCharacter({ id: characterId.value, ...formData })
    } else {
      characterId.value = await DramaAssetApi.createCharacter({
        projectId: props.projectId,
        ...formData
      })
    }
    message.success('保存成功')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

// ========== 形象 ==========

const handleCreateAppearance = async () => {
  await DramaAssetApi.createAppearance({ characterId: characterId.value })
  emit('refresh')
}

const handleSaveAppearance = async (appearance: DramaAppearanceVO) => {
  await DramaAssetApi.updateAppearance({
    id: appearance.id,
    description: appearanceForms[appearance.id].description
  })
  message.success('保存成功')
  emit('refresh')
}

const handleSelectCandidate = async (appearance: DramaAppearanceVO, index: number) => {
  await DramaAssetApi.updateAppearance({
    id: appearance.id,
    description: appearanceForms[appearance.id].description,
    selectedIndex: index
  })
  emit('refresh')
}

const handleGenerateImage = async (id: number) => {
  await DramaAssetApi.generateAppearanceImage(id, props.imageModelId!)
  message.success('已提交出图')
  emit('refresh')
}

const handleDeleteAppearance = async (id: number) => {
  try {
    await message.delConfirm()
    await DramaAssetApi.deleteAppearance(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

// ========== 样音 ==========

const handleUploadAudio = async () => {
  await DramaAssetApi.createAudio({
    projectId: props.projectId,
    characterId: characterId.value,
    type: AiDramaAudioTypeEnum.SAMPLE,
    fileUrl: uploadAudioUrl.value
  })
  uploadAudioUrl.value = ''
  message.success('保存成功')
  emit('refresh')
}

const handleSelectAudio = async (id: number) => {
  await DramaAssetApi.selectAudio(id)
  emit('refresh')
}

const handleDeleteAudio = async (id: number) => {
  try {
    await message.delConfirm()
    await DramaAssetApi.deleteAudio(id)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}
</script>
