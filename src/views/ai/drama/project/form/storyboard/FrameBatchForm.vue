<!-- AI 短剧：批量生成关键帧；当前剧本中镜头序号在范围内、还没有关键帧的镜头 -->
<template>
  <Dialog v-model="dialogVisible" title="批量生成关键帧" width="480px">
    <el-form label-width="100px">
      <el-form-item label="镜头序号">
        <el-input-number
          v-model="formData.startSceneNo"
          :min="1"
          controls-position="right"
          class="!w-120px"
        />
        <span class="mx-8px">至</span>
        <el-input-number
          v-model="formData.endSceneNo"
          :min="formData.startSceneNo"
          controls-position="right"
          class="!w-120px"
        />
      </el-form-item>
      <el-form-item>
        <el-button link type="primary" @click="setOpening">开场 10 镜</el-button>
      </el-form-item>
    </el-form>
    <div class="text-12px leading-18px text-[var(--el-text-color-secondary)]">
      一次最多 40 个镜头；已有关键帧、出图中、镜头视频生成中的跳过，需要重画时请在镜头上单独生成
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="saving" @click="submitForm">生 成</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaStoryboardApi } from '@/api/ai/drama/storyboard'

/** AI 短剧：批量生成关键帧 */
defineOptions({ name: 'AiDramaFrameBatchForm' })

const props = defineProps<{ projectId: number; modelId?: number }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const saving = ref(false)
const formData = reactive({ startSceneNo: 1, endSceneNo: 10 })

const setOpening = () => {
  formData.startSceneNo = 1
  formData.endSceneNo = 10
}

const open = () => {
  setOpening()
  dialogVisible.value = true
}
defineExpose({ open })

const submitForm = async () => {
  saving.value = true
  try {
    const count = await DramaStoryboardApi.generateStoryboardFrameBatch({
      projectId: props.projectId,
      modelId: props.modelId!,
      ...formData
    })
    message.success(count ? `已提交 ${count} 个镜头` : '没有需要生成关键帧的镜头')
    dialogVisible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
