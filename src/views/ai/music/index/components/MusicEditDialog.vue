<!-- AI 音乐：修改名称与封面 -->
<template>
  <Dialog v-model="dialogVisible" title="修改歌曲" width="500px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="90px"
      v-loading="formLoading"
    >
      <el-form-item label="歌曲名称" prop="title">
        <el-input v-model="formData.title" maxlength="100" show-word-limit clearable />
      </el-form-item>
      <el-form-item label="封面图片" prop="coverUrl">
        <UploadImg
          v-model="formData.coverUrl"
          :file-type="['image/jpeg', 'image/png']"
          height="100px"
          width="100px"
          :show-delete="false"
        />
        <div class="ml-12px text-12px leading-20px text-[var(--el-text-color-secondary)]">
          支持 png / jpg，上传至文件服务
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { MusicApi, MusicVO } from '@/api/ai/music'

/** AI 音乐：修改名称与封面 */
defineOptions({ name: 'AiMusicEditDialog' })

const emit = defineEmits(['success']) // 修改成功
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 提交中
const formData = reactive({ id: 0, title: '', coverUrl: '' })
const formRules = reactive({
  title: [{ required: true, message: '请输入歌曲名称', trigger: 'blur' }],
  coverUrl: [{ required: true, message: '请上传封面图片', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = (music: MusicVO) => {
  dialogVisible.value = true
  formData.id = music.id
  formData.title = music.title || ''
  formData.coverUrl = music.coverUrl || ''
  nextTick(() => formRef.value?.clearValidate())
}
defineExpose({ open })

/** 提交 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await MusicApi.updateMyMusic({
      id: formData.id,
      title: formData.title.trim(),
      coverUrl: formData.coverUrl
    })
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
