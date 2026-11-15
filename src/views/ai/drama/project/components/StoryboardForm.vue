<!-- AI 短剧：新增 / 编辑分镜 -->
<template>
  <Dialog v-model="dialogVisible" :title="formData.id ? '编辑镜头' : '新增镜头'" width="760px">
    <el-form :model="formData" label-width="90px">
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="场次">
            <el-input-number v-model="formData.sceneNo" :min="1" controls-position="right" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="镜头标题">
            <el-input v-model="formData.title" maxlength="128" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="景别">
            <el-input v-model="formData.shotType" placeholder="例如：中景" maxlength="32" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="运镜">
            <el-input v-model="formData.cameraMove" placeholder="例如：缓慢推进" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="时长（秒）">
            <el-input-number v-model="formData.duration" :min="1" :max="60" controls-position="right" class="!w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="画面描述">
        <el-input v-model="formData.videoPrompt" type="textarea" :rows="4" maxlength="2000" show-word-limit />
      </el-form-item>
      <el-form-item label="台词">
        <div class="w-full">
          <div v-for="(dialogue, index) in formData.dialogues" :key="index" class="mb-6px flex gap-6px">
            <el-select v-model="dialogue.characterId" placeholder="旁白" clearable class="!w-140px">
              <el-option v-for="item in detail.characters" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-input v-model="dialogue.line" placeholder="台词" class="flex-1" />
            <el-button link type="danger" @click="formData.dialogues.splice(index, 1)">删除</el-button>
          </div>
          <el-button link type="primary" @click="formData.dialogues.push({ line: '' })">+ 添加台词</el-button>
        </div>
      </el-form-item>
      <el-form-item label="出场角色">
        <el-select v-model="formData.appearanceIds" multiple placeholder="选择角色形象" class="!w-full">
          <el-option-group v-for="character in detail.characters" :key="character.id" :label="character.name">
            <el-option
              v-for="appearance in character.appearances"
              :key="appearance.id"
              :label="`${character.name} · 形象 ${appearance.appearanceIndex}`"
              :value="appearance.id"
            />
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="场景">
        <el-select v-model="formData.locationId" placeholder="选择场景" clearable class="!w-full">
          <el-option v-for="item in detail.locations" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="道具">
        <el-select v-model="formData.visualAssetIds" multiple placeholder="选择道具" class="!w-full">
          <el-option v-for="item in detail.visualAssets" :key="item.id" :label="item.title" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="起始帧">
        <div>
          <UploadImg v-model="formData.firstFrameUrl" height="96px" width="96px" :file-size="10" />
          <div v-if="assetImages.length" class="mt-6px flex flex-wrap items-center gap-6px">
            <span class="text-12px text-[var(--el-text-color-secondary)]">使用资产图：</span>
            <el-image
              v-for="url in assetImages"
              :key="url"
              :src="url"
              fit="cover"
              class="h-40px w-40px cursor-pointer rounded-4px"
              @click="formData.firstFrameUrl = url"
            />
          </div>
        </div>
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
import { DramaStoryboardApi, DramaDialogueVO, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { getSelectedCandidateUrl } from '@/views/ai/utils/drama'

/** AI 短剧：分镜表单 */
defineOptions({ name: 'AiDramaStoryboardForm' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const saving = ref(false)
const formData = reactive({
  id: undefined as number | undefined,
  sceneNo: undefined as number | undefined,
  title: '',
  shotType: '',
  cameraMove: '',
  duration: 5,
  videoPrompt: '',
  dialogues: [] as DramaDialogueVO[],
  appearanceIds: [] as number[],
  locationId: undefined as number | undefined,
  visualAssetIds: [] as number[],
  firstFrameUrl: ''
})

/** 已选的角色形象、场景的选用图，可作为起始帧 */
const assetImages = computed(() => {
  const urls: (string | undefined)[] = []
  props.detail.characters.forEach((character) =>
    character.appearances
      .filter((item) => formData.appearanceIds.includes(item.id))
      .forEach((item) => urls.push(getSelectedCandidateUrl(item.candidates, item.selectedIndex)))
  )
  const location = props.detail.locations.find((item) => item.id === formData.locationId)
  urls.push(getSelectedCandidateUrl(location?.candidates, location?.selectedIndex))
  return urls.filter((url): url is string => !!url)
})

const open = (storyboard?: DramaStoryboardVO) => {
  dialogVisible.value = true
  formData.id = storyboard?.id
  formData.sceneNo = storyboard?.sceneNo
  formData.title = storyboard?.title || ''
  formData.shotType = storyboard?.shotType || ''
  formData.cameraMove = storyboard?.cameraMove || ''
  formData.duration = storyboard?.duration || 5
  formData.videoPrompt = storyboard?.videoPrompt || ''
  formData.dialogues = (storyboard?.dialogues || []).map((item) => ({ ...item }))
  formData.appearanceIds = [...(storyboard?.appearanceIds || [])]
  formData.locationId = storyboard?.locationId
  formData.visualAssetIds = [...(storyboard?.visualAssetIds || [])]
  formData.firstFrameUrl = storyboard?.firstFrameUrl || ''
}
defineExpose({ open })

const submitForm = async () => {
  const data = {
    id: formData.id,
    projectId: props.detail.project.id,
    sceneNo: formData.sceneNo,
    title: formData.title,
    shotType: formData.shotType,
    cameraMove: formData.cameraMove,
    duration: formData.duration,
    videoPrompt: formData.videoPrompt,
    dialogues: formData.dialogues.filter((item) => item.line?.trim()),
    appearanceIds: formData.appearanceIds,
    locationId: formData.locationId,
    visualAssetIds: formData.visualAssetIds,
    firstFrameUrl: formData.firstFrameUrl
  }
  saving.value = true
  try {
    if (formData.id) {
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
