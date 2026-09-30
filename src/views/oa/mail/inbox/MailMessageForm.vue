<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- 写信操作 -->
    <div
      class="flex items-center justify-between border-b border-b-solid border-[var(--el-border-color-light)] p-16px"
    >
      <span class="text-18px font-bold">{{ formData.draftId ? '编辑草稿' : '写信' }}</span>
      <div>
        <el-button type="primary" :loading="formLoading" @click="submitForm">发送</el-button>
        <el-button :disabled="formLoading" @click="handleSaveDraft">存草稿</el-button>
        <el-button
          v-if="formData.draftId"
          type="danger"
          plain
          :disabled="formLoading"
          @click="handleDelete"
        >
          删除
        </el-button>
        <el-button :disabled="formLoading" @click="handleClose">关闭</el-button>
      </div>
    </div>
    <!-- 写信表单 -->
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      label-width="80px"
      class="overflow-auto p-16px"
    >
      <el-form-item label="收件人" prop="recipients">
        <MailAddressSelect v-model="formData.recipients" />
      </el-form-item>
      <el-form-item label="抄送人" prop="ccs">
        <MailAddressSelect v-model="formData.ccs" />
      </el-form-item>
      <el-form-item label="主题" prop="subject">
        <el-input v-model="formData.subject" placeholder="请输入主题" maxlength="65535" />
      </el-form-item>
      <el-form-item label="附件">
        <div class="w-full">
          <div
            v-for="attachment in formData.attachments"
            :key="attachment.part"
            class="mb-8px flex items-center gap-8px"
          >
            <span>{{ attachment.name }}</span>
            <el-button
              link
              type="danger"
              :disabled="formLoading"
              @click="removeAttachment(attachment.part)"
            >
              移除
            </el-button>
          </div>
          <el-upload
            v-model:file-list="fileList"
            :auto-upload="false"
            multiple
            :disabled="formLoading"
          >
            <el-button :disabled="formLoading">添加附件</el-button>
            <template #tip>
              <div class="el-upload__tip">单个文件不超过 16 MB，总请求不超过 32 MB</div>
            </template>
          </el-upload>
        </div>
      </el-form-item>
      <el-form-item label="正文" prop="content">
        <div class="w-full">
          <div class="mb-8px text-right text-12px text-[var(--el-text-color-secondary)]">
            {{ wordCount }} 字
          </div>
          <Editor
            ref="editorRef"
            v-model="formData.content"
            height="360px"
            @change="handleEditorChange"
          />
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import type { UploadUserFile } from 'element-plus'
import type { IDomEditor } from '@wangeditor-next/editor'
import * as MessageApi from '@/api/oa/mail/message'
import MailAddressSelect from '../account/components/MailAddressSelect.vue'

defineOptions({ name: 'OaMailMessageForm' })

const props = defineProps<{ data: MessageApi.MailMessageVO }>()
const emit = defineEmits(['success', 'close']) // 定义成功和关闭事件
const message = useMessage() // 消息弹窗
const formLoading = ref(false) // 表单提交中
const fileList = ref<UploadUserFile[]>([]) // 本次新增附件
const formRef = ref() // 表单 Ref
const editorRef = ref() // 正文编辑器 Ref
const wordCount = ref(0) // 正文字数（不计空白字符）
const formData = ref<MessageApi.MailMessageVO>({ ...props.data }) // 表单数据

/** 更新正文字数 */
function handleEditorChange(editor: IDomEditor) {
  wordCount.value = Array.from(editor.getText().replace(/\s/g, '')).length
}

/** 移除草稿或转发邮件中不再保留的附件 */
function removeAttachment(part: string) {
  formData.value.attachments = formData.value.attachments?.filter((item) => item.part !== part)
  formData.value.attachmentParts = formData.value.attachments?.map((item) => item.part) || []
}

/** 正文与本次选择的文件一起提交，不预先上传到公共附件库 */
function buildFormData() {
  const data = new FormData()
  data.append('data', new Blob([JSON.stringify(formData.value)], { type: 'application/json' }))
  for (const file of fileList.value) {
    if (file.raw) data.append('files', file.raw, file.name)
  }
  return data
}

/** 发送邮件 */
async function submitForm() {
  // 校验表单
  const valid = await formRef.value.validate()
  if (!valid) return
  if (!formData.value.recipients?.length) {
    message.warning('请填写收件人')
    return
  }
  // 发送的二次确认
  await message.confirm('确认发送这封邮件？')
  // 提交请求
  formLoading.value = true
  try {
    const result = await MessageApi.sendMailMessage(buildFormData())
    message.alert(result)
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 保存草稿，保留返回编号供后续修改 */
async function handleSaveDraft() {
  // 提交草稿并保留编号，后续保存更新同一封草稿
  formLoading.value = true
  try {
    const draftId: number = await MessageApi.saveMailMessageDraft(buildFormData())
    formData.value.draftId = draftId
    fileList.value = []
    formData.value.attachmentParts = undefined
    formData.value = await MessageApi.getMailMessageCompose(draftId, 'draft')
    message.success('保存成功')
  } finally {
    formLoading.value = false
  }
}

/** 删除草稿 */
async function handleDelete() {
  if (!formData.value.draftId) return
  // 删除的二次确认
  await message.confirm('确认将这封草稿移至已删除？')
  formLoading.value = true
  try {
    await MessageApi.deleteMailMessage(formData.value.draftId)
    message.success('删除成功')
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 关闭前确认，避免丢失未保存内容 */
async function handleClose() {
  await message.confirm('确认关闭写信？未保存的内容将丢失。')
  emit('close')
}
/** 初始化正文字数 */
onMounted(async () => {
  const editor: IDomEditor = await editorRef.value.getEditorRef()
  handleEditorChange(editor)
})
</script>
