<!-- AI 短剧：添加动作参考视频；可在镜头的动作参考视频中选用 -->
<template>
  <Dialog v-model="dialogVisible" title="添加动作参考" width="560px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="例如：转身挥手" maxlength="120" />
      </el-form-item>
      <el-form-item label="视频文件" prop="fileUrl">
        <UploadFile
          v-model="formData.fileUrl"
          :file-type="['mp4', 'mov']"
          :file-size="100"
          :limit="1"
        />
      </el-form-item>
    </el-form>
    <div class="text-12px leading-18px text-[var(--el-text-color-secondary)]">
      2 ~ 30 秒、24 ~ 60fps 的 H.264 / H.265 视频，宽高比 0.4 ~ 2.5，且不低于 480p；也可在 3D
      导演中导出白模预演后加入
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="saving" @click="submitForm">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaAssetApi } from '@/api/ai/drama/asset'

/** AI 短剧：添加动作参考视频 */
defineOptions({ name: 'AiDramaMotionReferenceForm' })

const props = defineProps<{ projectId: number }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const formData = reactive({ name: '', fileUrl: '' })
const formRules = reactive({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  fileUrl: [{ required: true, message: '请上传视频', trigger: 'change' }]
})

const open = () => {
  formData.name = ''
  formData.fileUrl = ''
  dialogVisible.value = true
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    await DramaAssetApi.createMotionReference({ projectId: props.projectId, ...formData })
    message.success('已添加')
    dialogVisible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
