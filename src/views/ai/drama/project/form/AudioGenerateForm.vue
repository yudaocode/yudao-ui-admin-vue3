<!-- AI 短剧：使用语音模型生成音频；有角色时为样音，否则为旁白 -->
<template>
  <el-form :model="formData" label-width="70px" size="small">
    <el-form-item label="语音模型">
      <el-select v-model="formData.modelId" placeholder="请选择语音模型" filterable class="!w-full">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="音色">
      <el-input
        v-model="formData.voice"
        placeholder="服务商的音色标识，例如 longxiaochun"
        maxlength="128"
      />
    </el-form-item>
    <el-form-item label="语速">
      <el-input-number
        v-model="formData.speed"
        :min="0.5"
        :max="2"
        :step="0.1"
        :precision="1"
        controls-position="right"
      />
    </el-form-item>
    <el-form-item label="文本">
      <el-input
        v-model="formData.text"
        type="textarea"
        :rows="3"
        maxlength="2000"
        show-word-limit
      />
    </el-form-item>
    <el-form-item>
      <div class="w-full flex justify-end">
        <el-button
          type="primary"
          :loading="generating"
          :disabled="!formData.modelId || !formData.voice.trim() || !formData.text.trim()"
          @click="handleGenerate"
        >
          生成{{ characterId ? '样音' : '旁白' }}
        </el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { DramaAssetApi } from '@/api/ai/drama/asset'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'

/** AI 短剧：生成音频 */
defineOptions({ name: 'AiDramaAudioGenerateForm' })

const props = defineProps<{ projectId: number; characterId?: number; defaultText?: string }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const models = ref<ModelVO[]>([])
const generating = ref(false)
const formData = ref({
  modelId: undefined as number | undefined,
  voice: '',
  speed: 1,
  text: props.defaultText || ''
})

/** 同步合成，可能需要十几秒 */
const handleGenerate = async () => {
  generating.value = true
  try {
    // DONE @AI：可以直接 formData 提交么？可以额外补充下 props ；但是风格一致！（直接提交 formData，补充项目、角色；音色、文本去掉首尾空白）
    await DramaAssetApi.generateAudio({
      ...formData.value,
      projectId: props.projectId,
      characterId: props.characterId,
      voice: formData.value.voice.trim(),
      text: formData.value.text.trim()
    })
    message.success('生成成功')
    emit('success')
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  models.value = await ModelApi.getModelSimpleList(AiModelTypeEnum.VOICE)
  formData.value.modelId = models.value[0]?.id
})
</script>
