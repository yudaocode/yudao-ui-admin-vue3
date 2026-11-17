<!-- AI 短剧：导入外部视频为镜头视频 -->
<template>
  <Dialog v-model="dialogVisible" :title="`导入视频 · #${storyboard?.sceneNo ?? ''}`" width="520px">
    <el-form label-width="80px">
      <el-form-item label="视频文件">
        <UploadFile v-model="fileUrl" :file-type="['mp4', 'mov']" :file-size="200" :limit="1" />
      </el-form-item>
    </el-form>
    <div class="text-12px leading-18px text-[var(--el-text-color-secondary)]">
      导入后直接作为已完成的镜头视频，并截取尾帧供下一镜承接；宽、高不超过
      3840；原视频可在提交记录中恢复
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <!-- DONE @AI：不要折行；其它类似的，也检查下；（文字单独一行；drama 下同类按钮、标签一并调整） -->
      <el-button type="primary" :loading="saving" :disabled="!fileUrl" @click="submitForm">
        导 入
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'

/** AI 短剧：导入外部视频 */
defineOptions({ name: 'AiDramaImportVideoForm' })

const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const saving = ref(false)
const storyboard = ref<DramaStoryboardVO>()
const fileUrl = ref('')

const open = (row: DramaStoryboardVO) => {
  storyboard.value = row
  fileUrl.value = ''
  dialogVisible.value = true
}
defineExpose({ open })

const submitForm = async () => {
  saving.value = true
  try {
    await DramaStoryboardApi.importStoryboardVideo(storyboard.value!.id, fileUrl.value)
    message.success('已导入')
    dialogVisible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
