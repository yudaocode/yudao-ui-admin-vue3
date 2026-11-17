<!-- AI 短剧：新增 / 编辑分镜 -->
<template>
  <Dialog v-model="dialogVisible" :title="formData.id ? '编辑镜头' : '新增镜头'" width="820px">
    <el-form :model="formData" label-width="100px">
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="镜头序号">
            <el-input-number
              v-model="formData.sceneNo"
              :min="1"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="镜头标题">
            <el-input v-model="formData.title" maxlength="128" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="场景类型">
            <el-select v-model="formData.sceneType" placeholder="请选择" clearable class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.AI_DRAMA_SCENE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="景别">
            <el-input v-model="formData.shotType" placeholder="例如：中景" maxlength="32" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="时长（秒）">
            <el-input-number
              v-model="formData.duration"
              :min="1"
              :max="60"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="运镜">
            <el-input v-model="formData.cameraMove" placeholder="例如：缓慢推进" maxlength="64" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="画面描述">
        <el-input
          v-model="formData.sceneText"
          type="textarea"
          :rows="3"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="关键帧提示词">
        <el-input
          v-model="formData.imagePrompt"
          type="textarea"
          :rows="2"
          placeholder="为空时使用画面描述"
          maxlength="2000"
        />
      </el-form-item>
      <el-form-item label="视频提示词">
        <el-input
          v-model="formData.videoPrompt"
          type="textarea"
          :rows="3"
          placeholder="为空时使用画面描述"
          maxlength="2000"
        />
      </el-form-item>
      <el-form-item label="台词">
        <div class="w-full">
          <div
            v-for="(dialogue, index) in formData.dialogues"
            :key="index"
            class="mb-6px flex gap-6px"
          >
            <el-select v-model="dialogue.characterId" placeholder="旁白" clearable class="!w-140px">
              <el-option
                v-for="item in detail.characters"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-input v-model="dialogue.line" placeholder="台词" class="flex-1" />
            <el-button link type="danger" @click="formData.dialogues.splice(index, 1)">
              删除
            </el-button>
          </div>
          <el-button link type="primary" @click="formData.dialogues.push({ line: '' })">
            + 添加台词
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="表演指导">
        <div class="w-full">
          <div
            v-for="(note, index) in formData.actingNotes"
            :key="index"
            class="mb-6px flex gap-6px"
          >
            <el-input v-model="note.name" placeholder="角色" class="!w-140px" />
            <el-input v-model="note.acting" placeholder="表演指令" class="flex-1" />
            <el-button link type="danger" @click="formData.actingNotes.splice(index, 1)">
              删除
            </el-button>
          </div>
          <el-button
            link
            type="primary"
            @click="formData.actingNotes.push({ name: '', acting: '' })"
          >
            + 添加表演指导
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="场景">
        <el-select v-model="formData.locationId" placeholder="选择场景" clearable class="!w-full">
          <el-option
            v-for="item in detail.locations"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="出场角色">
        <div class="w-full">
          <div
            v-for="(item, index) in formData.characters"
            :key="index"
            class="mb-6px flex gap-6px"
          >
            <el-select v-model="item.appearanceId" placeholder="选择角色形象" class="flex-1">
              <el-option-group
                v-for="character in detail.characters"
                :key="character.id"
                :label="character.name"
              >
                <el-option
                  v-for="appearance in character.appearances"
                  :key="appearance.id"
                  :label="`${character.name} · 形象 ${appearance.appearanceIndex}`"
                  :value="appearance.id"
                />
              </el-option-group>
            </el-select>
            <el-select
              v-model="item.slot"
              placeholder="站位"
              clearable
              filterable
              allow-create
              class="!w-160px"
            >
              <el-option v-for="slot in slots" :key="slot" :label="slot" :value="slot" />
            </el-select>
            <el-button link type="danger" @click="formData.characters.splice(index, 1)">
              删除
            </el-button>
          </div>
          <el-button link type="primary" @click="formData.characters.push({})">
            + 添加角色
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="道具">
        <div class="w-full">
          <el-checkbox v-model="propsAuto">按道具关联的镜头自动选择</el-checkbox>
          <el-select
            v-if="!propsAuto"
            v-model="formData.visualAssetIds"
            multiple
            placeholder="不选表示没有道具"
            class="!w-full"
          >
            <el-option
              v-for="item in propList"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </div>
      </el-form-item>
      <el-form-item label="起始帧">
        <div class="w-full">
          <div class="flex items-center gap-12px">
            <el-switch v-model="continuity.useFirstFrame" active-text="使用起始帧" />
            <el-switch v-model="continuity.includeLocation" active-text="参考图包含场景" />
          </div>
          <UploadImg
            v-model="manualStartFrameUrl"
            height="96px"
            width="96px"
            :file-size="10"
            class="mt-6px"
          />
          <div class="mt-6px text-12px leading-18px text-[var(--el-text-color-secondary)]">
            使用起始帧时，优先使用此处的手动起始帧，否则使用关键帧，按图生视频；不使用时，视频模型支持参考生视频则带上角色形象、场景、道具的选用图，以及发言角色的选用样音
          </div>
        </div>
      </el-form-item>
      <el-form-item label="动作参考视频">
        <el-select
          v-model="continuity.referenceVideoUrls"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="从动作参考中选择，或输入视频地址后回车"
          class="!w-full"
        >
          <el-option
            v-for="item in detail.motionReferences || []"
            :key="item.id"
            :label="item.name"
            :value="item.fileUrl"
          />
        </el-select>
      </el-form-item>
      <el-row :gutter="12">
        <el-col :span="16">
          <el-form-item label="视频模型">
            <ModelSelect
              v-model="formData.videoModelId"
              :type="AiModelTypeEnum.VIDEO"
              placeholder="不设置时使用生成时所选的视频模型"
              clearable
              class="!w-full"
              @loaded="(list) => (videoModels = list)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="分辨率">
            <el-select
              v-model="formData.videoResolution"
              :disabled="!formData.videoModelId"
              placeholder="不传"
              clearable
              class="!w-full"
            >
              <el-option v-for="item in resolutions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <div class="mb-12px ml-100px text-12px leading-18px text-[var(--el-text-color-secondary)]">
        设置后本镜生成视频固定使用此模型与分辨率；生成视频后会记为本次使用的模型，清空即恢复使用生成时所选的模型
      </div>
      <el-form-item label="素材图片">
        <UploadImgs v-model="continuity.materialUrls" height="80px" width="80px" :limit="9" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :loading="saving" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaContinuityVO, DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { ModelVO } from '@/api/ai/model/model'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'
import { getDramaProps } from '@/views/ai/utils/drama'
import { getVideoModelCapability } from '@/views/ai/utils/video'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'

/** 表单数据：分镜的字段；台词、表演、出场角色、道具编辑时不为空 */
type StoryboardFormData = Partial<DramaStoryboardVO> &
  Required<Pick<DramaStoryboardVO, 'dialogues' | 'actingNotes' | 'characters' | 'visualAssetIds'>>
/** 连续性设置：参考视频、素材图片编辑时不为空 */
type ContinuityFormData = DramaContinuityVO &
  Required<Pick<DramaContinuityVO, 'referenceVideoUrls' | 'materialUrls'>>

/** AI 短剧：分镜表单 */
defineOptions({ name: 'AiDramaStoryboardForm' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const saving = ref(false)
const formData = ref<StoryboardFormData>({
  dialogues: [],
  actingNotes: [],
  characters: [],
  visualAssetIds: []
})
// 连续性设置：未在表单编辑的规划字段原样保留
const continuity = ref<ContinuityFormData>({ referenceVideoUrls: [], materialUrls: [] })
const propsAuto = ref(true) // 道具按关联的镜头自动选择：提交时道具为空
const manualStartFrameUrl = ref('') // 手动起始帧：提交时转为连续性设置的 manualStartFrame
const videoModels = ref<ModelVO[]>([]) // 视频模型列表：用于取所选模型可选的分辨率

/** 所选视频模型可选的分辨率：与 AI 视频一致 */
const resolutions = computed(() => {
  const model = videoModels.value.find((item) => item.id === formData.value.videoModelId)
  return model ? getVideoModelCapability(model.platform, model.model).resolutions : []
})
/** 切换视频模型后，原分辨率不可选时改为该模型的默认分辨率 */
watch(resolutions, (list) => {
  const resolution = formData.value.videoResolution
  if (list.length && resolution && !list.includes(resolution)) {
    formData.value.videoResolution = list[0]
  }
})

const propList = computed(() => getDramaProps(props.detail.visualAssets))
/** 站位：取自所选场景的可站位置 */
const slots = computed(
  () =>
    props.detail.locations.find((item) => item.id === formData.value.locationId)?.availableSlots ||
    []
)

/** 打开表单：编辑时复制一份分镜（台词、表演、出场角色、道具、连续性设置），修改不影响列表 */
const open = (storyboard?: DramaStoryboardVO) => {
  dialogVisible.value = true
  resetForm()
  // DONE @AI：也是。。。（改为整个赋值，直接提交 formData；道具、手动起始帧为表单的辅助字段，提交时转换）
  if (!storyboard) {
    return
  }
  formData.value = {
    ...storyboard,
    duration: storyboard.duration || 5,
    dialogues: (storyboard.dialogues || []).map((item) => ({ ...item })),
    actingNotes: (storyboard.actingNotes || []).map((item) => ({ ...item })),
    characters: (storyboard.characters || []).map((item) => ({ ...item })),
    visualAssetIds: [...(storyboard.visualAssetIds || [])],
    videoResolution: storyboard.videoResolution || undefined
  }
  const value = storyboard.continuity || {}
  continuity.value = {
    ...value,
    useFirstFrame: value.useFirstFrame !== false,
    includeLocation: value.includeLocation !== false,
    referenceVideoUrls: [...(value.referenceVideoUrls || [])],
    materialUrls: [...(value.materialUrls || [])]
  }
  propsAuto.value = !storyboard.visualAssetIds
  manualStartFrameUrl.value = value.manualStartFrame?.url || ''
}
defineExpose({ open })

/** 重置表单：整体替换，不残留上次编辑的编号、字段 */
const resetForm = () => {
  formData.value = {
    duration: 5,
    dialogues: [],
    actingNotes: [],
    characters: [],
    visualAssetIds: []
  }
  continuity.value = {
    useFirstFrame: true,
    includeLocation: true,
    referenceVideoUrls: [],
    materialUrls: []
  }
  propsAuto.value = true
  manualStartFrameUrl.value = ''
}

const submitForm = async () => {
  const data = {
    ...formData.value,
    projectId: props.detail.project.id,
    dialogues: formData.value.dialogues.filter((item) => item.line?.trim()),
    actingNotes: formData.value.actingNotes.filter((item) => item.acting?.trim()),
    characters: formData.value.characters.filter((item) => item.appearanceId),
    // 为空表示按道具关联的镜头序号；空数组表示没有道具
    visualAssetIds: propsAuto.value ? undefined : formData.value.visualAssetIds,
    continuity: {
      ...continuity.value,
      manualStartFrame: manualStartFrameUrl.value ? { url: manualStartFrameUrl.value } : undefined
    },
    // 视频模型为空时清空，生成时使用所选的视频模型；分辨率空串表示不传
    videoResolution: formData.value.videoModelId ? formData.value.videoResolution || '' : ''
  }
  saving.value = true
  try {
    if (data.id) {
      await DramaStoryboardApi.updateStoryboard(data)
    } else {
      await DramaStoryboardApi.createStoryboard(data)
    }
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
