<!-- AI 短剧：新增 / 编辑配乐、参考音频 -->
<template>
  <Dialog v-model="dialogVisible" :title="formData.id ? '编辑音频' : '新增音频'" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type" :disabled="!!formData.id">
          <el-radio :value="AiDramaAudioTypeEnum.BGM">配乐</el-radio>
          <el-radio :value="AiDramaAudioTypeEnum.REFERENCE">参考音频</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" maxlength="64" />
      </el-form-item>
      <el-form-item v-if="!formData.id" label="音频文件" prop="fileUrl">
        <UploadFile
          v-model="formData.fileUrl"
          :file-type="['mp3', 'wav', 'm4a']"
          :file-size="20"
          :limit="1"
        />
      </el-form-item>
      <el-form-item label="使用的镜头">
        <el-select
          v-model="formData.storyboardIds"
          multiple
          placeholder="为空表示候选，暂不使用"
          class="!w-full"
        >
          <el-option
            v-for="item in detail.storyboards"
            :key="item.id"
            :label="`#${item.sceneNo} ${item.title || '未命名镜头'}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <template v-if="formData.id">
        <el-form-item label="音量">
          <el-input-number
            v-model="formData.volume"
            :min="0"
            :max="2"
            :step="0.1"
            :precision="2"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="起始偏移（秒）">
          <el-input-number
            v-model="formData.startOffset"
            :min="0"
            :step="0.5"
            :precision="1"
            controls-position="right"
          />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button type="primary" :loading="saving" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaAssetApi, DramaAudioVO } from '@/api/ai/drama/asset'
import { AiDramaAudioTypeEnum } from '@/views/ai/utils/constants'

/** AI 短剧：配乐、参考音频表单 */
defineOptions({ name: 'AiDramaAudioForm' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const formData = ref<Partial<DramaAudioVO> & Pick<DramaAudioVO, 'fileUrl'>>({ fileUrl: '' })
const formRules = reactive({
  fileUrl: [{ required: true, message: '音频文件不能为空', trigger: 'change' }]
})

/** 打开表单：编辑时复制一份音频（含使用的镜头），修改不影响列表 */
const open = (audio?: DramaAudioVO) => {
  dialogVisible.value = true
  resetForm()
  // DONE @AI：类似这种，是不是不要这么赋值？直接整个赋值？按照别的模块？（改为整个赋值）
  if (audio) {
    formData.value = {
      ...audio,
      storyboardIds: [...(audio.storyboardIds || [])],
      volume: audio.volume ?? 0.12, // 未设置时，合成按默认音量 0.12 混入
      startOffset: audio.startOffset ?? 0
    }
  }
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    // DONE @AI：类似这种，不是直接 formData 提交？类似别的模块；（改为直接提交 formData）
    const data = { ...formData.value, projectId: props.detail.project.id } as DramaAudioVO
    if (data.id) {
      await DramaAssetApi.updateAudio(data)
    } else {
      await DramaAssetApi.createAudio(data)
    }
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}

/** 重置表单：整体替换，不残留上次编辑的编号、字段 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    type: AiDramaAudioTypeEnum.BGM,
    name: '',
    fileUrl: '',
    storyboardIds: [],
    volume: 1,
    startOffset: 0
  }
  formRef.value?.clearValidate()
}
</script>
