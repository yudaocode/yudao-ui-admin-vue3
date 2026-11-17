<!-- AI 短剧：角色详情，基本信息、形象版本、样音 -->
<template>
  <el-drawer
    v-model="visible"
    :title="characterId ? `角色：${character?.name || ''}` : '新增角色'"
    size="640px"
  >
    <!-- 基本信息 -->
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="formData.name" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="别名">
            <el-input v-model="formData.aliases" placeholder="多个用逗号分隔" maxlength="255" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="角色等级">
            <el-select v-model="formData.roleLevel" clearable class="!w-full">
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.AI_DRAMA_CHARACTER_ROLE_LEVEL)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别">
            <el-select v-model="formData.sex" clearable class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="年龄段">
            <el-input v-model="formData.ageRange" placeholder="例如：25-30 岁" maxlength="32" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="服装档次">
            <el-select v-model="formData.costumeTier" clearable class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.AI_DRAMA_CHARACTER_COSTUME_TIER)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="性格标签">
        <el-select
          v-model="formData.personalityTags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入后回车添加"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="角色设定">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="年龄、外貌、性格、服装"
          maxlength="2000"
        />
      </el-form-item>
      <el-form-item label="出图提示词">
        <el-input
          v-model="formData.prompt"
          type="textarea"
          :rows="3"
          placeholder="为空时使用角色设定"
          maxlength="2000"
        />
      </el-form-item>
      <el-form-item label="参考图">
        <UploadImg v-model="formData.referenceImageUrl" height="96px" width="96px" :file-size="10">
          <template #tip>Seedream 出图时作为参考</template>
        </UploadImg>
      </el-form-item>
      <el-form-item label="声音描述">
        <el-input
          v-model="formData.voiceDescription"
          placeholder="例如：低沉、沙哑的中年男声"
          maxlength="500"
        />
      </el-form-item>
      <el-form-item label="样音文本">
        <el-input
          v-model="formData.sampleText"
          placeholder="生成样音时朗读的文本"
          maxlength="500"
        />
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
      <div
        v-for="appearance in character.appearances"
        :key="appearance.id"
        class="mb-16px rounded-6px border-1 border-[var(--el-border-color)] border-solid p-12px"
      >
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
            <el-button
              v-if="appearance.previousImageUrls"
              link
              type="primary"
              :disabled="isAiDramaRunning(appearance.status)"
              @click="handleUndoImage(appearance.id)"
            >
              撤销
            </el-button>
            <el-button link type="primary" @click="handleSaveAppearance(appearance)">
              保存设定
            </el-button>
            <el-button link type="danger" @click="handleDeleteAppearance(appearance.id)">
              删除
            </el-button>
          </div>
        </div>
        <el-input
          v-if="appearance.appearanceIndex > 0"
          v-model="appearanceForms[appearance.id].changeReason"
          placeholder="形象变化原因，例如：落水后换装"
          maxlength="255"
          class="mb-8px"
        />
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
            v-for="(url, index) in appearance.imageUrls || []"
            :key="url + index"
            class="relative cursor-pointer rounded-6px p-2px"
            :class="
              appearance.selectedIndex === index
                ? 'outline outline-2 outline-[var(--el-color-primary)]'
                : ''
            "
            @click="handleSelectCandidate(appearance, index)"
          >
            <AssetImage :url="url" size="88px" />
            <Icon
              icon="ep:circle-close-filled"
              class="absolute right-4px top-4px text-[var(--el-color-danger)]"
              @click.stop="handleDeleteCandidate(appearance, index)"
            />
          </div>
          <!-- 生成中、已失败：占位 -->
          <AssetImage
            v-if="
              isAiDramaRunning(appearance.status) || appearance.status === AiDramaStatusEnum.FAIL
            "
            :status="appearance.status"
            :error-message="appearance.errorMessage"
            size="88px"
          />
          <span
            v-else-if="!appearance.imageUrls?.length"
            class="text-12px text-[var(--el-text-color-secondary)]"
          >
            还没有候选图，选择绘画模型后点击「出图」
          </span>
        </div>
      </div>
      <el-button plain @click="handleCreateAppearance">
        <Icon icon="ep:plus" class="mr-4px" /> 新增形象
      </el-button>

      <!-- 样音 -->
      <el-divider content-position="left">样音</el-divider>
      <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
        选用的样音，会作为该角色台词的参考音频，用于支持参考音频的视频模型
      </div>
      <div
        v-for="audio in character.audios"
        :key="audio.id"
        class="mb-8px flex items-center gap-8px"
      >
        <audio :src="audio.fileUrl" controls class="h-32px flex-1"></audio>
        <el-tag v-if="audio.id === character.sampleAudioId" type="success" size="small">
          已选用
        </el-tag>
        <el-button v-else link type="primary" @click="handleSelectAudio(audio.id)">选用</el-button>
        <el-button link type="danger" @click="handleDeleteAudio(audio.id)">删除</el-button>
      </div>
      <div class="mb-12px flex items-start gap-8px">
        <UploadFile
          v-model="uploadAudioUrl"
          :file-type="['mp3', 'wav', 'm4a']"
          :file-size="20"
          :limit="1"
          :is-show-tip="false"
        />
        <el-button :disabled="!uploadAudioUrl" @click="handleUploadAudio">保存上传的样音</el-button>
      </div>
      <AudioGenerateForm
        :project-id="projectId"
        :character-id="character.id"
        :default-text="character.sampleText || '你好，很高兴认识你。'"
        @success="emit('refresh')"
      />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { DramaAssetApi, DramaAppearanceVO, DramaCharacterVO } from '@/api/ai/drama/asset'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import {
  AiDramaAudioTypeEnum,
  AiDramaStatusEnum,
  isAiDramaRunning
} from '@/views/ai/utils/constants'
import AssetImage from '../../components/AssetImage.vue'
import AudioGenerateForm from './AudioGenerateForm.vue'

/** AI 短剧：角色详情 */
defineOptions({ name: 'AiDramaCharacterDrawer' })

const props = defineProps<{
  projectId: number
  characters: DramaCharacterVO[]
  imageModelId?: number
}>()
const emit = defineEmits<{ refresh: [] }>()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const visible = ref(false)
const characterId = ref<number>()
const character = computed(() => props.characters.find((item) => item.id === characterId.value))
const formRef = ref()
const formData = ref<Partial<DramaCharacterVO>>({})
const formRules = reactive({
  name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }]
})
const saving = ref(false)
const uploadAudioUrl = ref('')

// 形象设定的编辑表单：按形象编号，轮询刷新时不覆盖正在编辑的内容
const appearanceForms = reactive<Record<number, { description?: string; changeReason?: string }>>(
  {}
)
watch(
  () => character.value?.appearances,
  (appearances) => {
    appearances?.forEach((item) => {
      if (!appearanceForms[item.id]) {
        appearanceForms[item.id] = {
          description: item.description,
          changeReason: item.changeReason
        }
      }
    })
  },
  { immediate: true }
)

/** 打开：不传编号时为新增；编辑时复制一份角色（含性格标签），修改不影响列表 */
const open = (id?: number) => {
  visible.value = true
  characterId.value = id
  resetForm()
  // DONE @AI：同别的模块提的；（改为整个赋值，直接提交 formData）
  const item = props.characters.find((c) => c.id === id)
  if (item) {
    formData.value = { ...item, personalityTags: [...(item.personalityTags || [])] }
  }
  uploadAudioUrl.value = ''
}
defineExpose({ open })

/** 保存角色：新增后抽屉不关闭，继续编辑形象、样音 */
const handleSave = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    const data = { ...formData.value, id: characterId.value, projectId: props.projectId }
    if (data.id) {
      await DramaAssetApi.updateCharacter(data)
    } else {
      characterId.value = await DramaAssetApi.createCharacter(data)
    }
    message.success('保存成功')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

/** 重置表单：整体替换，不残留上次编辑的字段 */
const resetForm = () => {
  formData.value = {
    name: '',
    aliases: '',
    roleLevel: undefined,
    sex: undefined,
    ageRange: '',
    personalityTags: [],
    costumeTier: undefined,
    description: '',
    prompt: '',
    referenceImageUrl: '',
    voiceDescription: '',
    sampleText: ''
  }
  formRef.value?.clearValidate()
}

// ========== 形象 ==========

const handleCreateAppearance = async () => {
  await DramaAssetApi.createAppearance({ characterId: characterId.value })
  emit('refresh')
}

const handleSaveAppearance = async (appearance: DramaAppearanceVO) => {
  await DramaAssetApi.updateAppearance({ id: appearance.id, ...appearanceForms[appearance.id] })
  message.success('保存成功')
  emit('refresh')
}

const handleSelectCandidate = async (appearance: DramaAppearanceVO, index: number) => {
  await DramaAssetApi.updateAppearance({
    id: appearance.id,
    ...appearanceForms[appearance.id],
    selectedIndex: index
  })
  emit('refresh')
}

/** 删除一张候选图：删除前的候选图记为上一版，可撤销 */
const handleDeleteCandidate = async (appearance: DramaAppearanceVO, index: number) => {
  try {
    await message.delConfirm('删除这张候选图后，可通过「撤销」恢复，是否继续？')
    await DramaAssetApi.deleteAppearanceCandidate(appearance.id, index)
    message.success(t('common.delSuccess'))
    emit('refresh')
  } catch {}
}

/** 撤销上次的候选图变更：恢复为上一版候选图 */
const handleUndoImage = async (id: number) => {
  await DramaAssetApi.undoAppearanceImage(id)
  message.success('已撤销')
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
