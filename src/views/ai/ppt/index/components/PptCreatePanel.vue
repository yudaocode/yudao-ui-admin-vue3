<!-- AI PPT：左侧创建表单 -->
<template>
  <ContentWrap class="h-full w-full" :body-style="{ height: '100%', overflowY: 'auto' }">
    <div class="mb-16px">
      <div class="text-16px font-bold">创建 PPT</div>
      <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
        粘贴你的大纲，或上传材料一键生成分镜和配图
      </div>
    </div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
      <!-- 格式 -->
      <el-form-item label="格式" prop="mode">
        <div class="grid grid-cols-2 w-full gap-8px">
          <div
            v-for="item in MODE_OPTIONS"
            :key="item.value"
            class="flex cursor-pointer flex-col gap-4px border border-[var(--el-border-color)] rounded-6px border-solid p-10px leading-18px"
            :class="
              formData.mode === item.value
                ? '!border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
                : 'hover:border-[var(--el-border-color-darker)]'
            "
            @click="formData.mode = item.value"
          >
            <span class="font-bold">{{ item.label }}</span>
            <span class="text-12px text-[var(--el-text-color-secondary)]">
              {{ item.description }}
            </span>
          </div>
        </div>
      </el-form-item>
      <!-- 语言 -->
      <el-form-item label="选择语言" prop="language">
        <el-select v-model="formData.language" class="!w-full">
          <el-option label="中文" :value="AiPptLanguageEnum.ZH_CN" />
          <el-option label="English" :value="AiPptLanguageEnum.EN" />
        </el-select>
      </el-form-item>
      <!-- 时长、页数：时长只是页数的快捷设置 -->
      <div class="flex gap-16px">
        <el-form-item label="时长">
          <el-radio-group v-model="duration" @change="handleDurationChange">
            <el-radio-button value="short">短</el-radio-button>
            <el-radio-button value="default">默认</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="PPT 页数" prop="pageCount" class="flex-1">
          <el-input-number
            v-model="formData.pageCount"
            :min="3"
            :max="30"
            :precision="0"
            class="!w-full"
            @change="handlePageCountChange"
          />
        </el-form-item>
      </div>
      <!-- 绘图模型：只列出支持整页文生图的平台 -->
      <el-form-item label="绘图模型" prop="imageModelId">
        <el-select
          v-model="formData.imageModelId"
          placeholder="请选择绘图模型"
          filterable
          class="!w-full"
        >
          <el-option v-for="item in imageModels" :key="item.id" :label="item.name" :value="item.id">
            <span>{{ item.name }}</span>
            <span class="float-right text-12px text-[var(--el-text-color-secondary)]">
              {{ item.platform }}
            </span>
          </el-option>
        </el-select>
        <div
          v-if="imageModelsLoaded && imageModels.length === 0"
          class="text-12px text-[var(--el-color-warning)]"
        >
          没有可用的绘图模型，请先在「模型配置」启用 OpenAI、硅基流动或通义千问平台的绘图模型
        </div>
      </el-form-item>
      <!-- 素材：粘贴大纲、上传材料二选一；表单项按来源 v-if，只校验当前的素材 -->
      <el-tabs v-model="formData.source">
        <el-tab-pane label="粘贴大纲" :name="AiPptSourceEnum.PASTE">
          <el-form-item
            v-if="formData.source === AiPptSourceEnum.PASTE"
            label="把你的大纲或者内容粘贴在这里"
            prop="content"
          >
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="8"
              :maxlength="CONTENT_MAX_LENGTH"
              show-word-limit
              placeholder="添加一份概略提纲，或指定受众、风格和重点，例如：为新手用户创建一套演示文稿，采用大胆活泼的风格，注重分步说明。"
            />
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane label="上传材料" :name="AiPptSourceEnum.UPLOAD">
          <el-form-item
            v-if="formData.source === AiPptSourceEnum.UPLOAD"
            label="上传 PPT 材料（支持 PDF/Word/TXT/Markdown 格式）"
            prop="fileUrl"
          >
            <el-upload
              v-if="!uploadFile"
              drag
              :auto-upload="false"
              :show-file-list="false"
              :accept="FILE_ACCEPT"
              :on-change="handleFileChange"
              class="w-full [&_.el-upload]:w-full"
            >
              <Icon
                icon="ep:upload-filled"
                :size="32"
                class="text-[var(--el-text-color-placeholder)]"
              />
              <div class="text-14px">拖拽或<em>点击上传</em></div>
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                {{ AiPptFileTypes.join(' / ') }}，≤ {{ FILE_MAX_SIZE_MB }} MB
              </div>
            </el-upload>
            <div
              v-else
              class="w-full flex items-center gap-8px rounded-6px bg-[var(--el-fill-color-light)] px-10px py-6px"
            >
              <Icon
                :icon="getFileIcon(uploadFile.raw.name)"
                class="text-[var(--el-color-primary)]"
              />
              <span class="min-w-0 flex-1 truncate" :title="uploadFile.raw.name">
                {{ uploadFile.raw.name }}
              </span>
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                {{ uploadFile.uploading ? '上传中...' : formatFileSize(uploadFile.raw.size) }}
              </span>
              <el-button link type="danger" @click="handleFileRemove">移除</el-button>
            </div>
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
      <!-- 风格与设计要求 -->
      <el-form-item label="风格与设计要求（可选）" prop="prompt">
        <el-input
          v-model="formData.prompt"
          type="textarea"
          :rows="3"
          maxlength="1024"
          show-word-limit
          placeholder="例如：极简商务风、卡通手绘风"
        />
      </el-form-item>
      <el-button type="primary" class="!w-full" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '任务创建中...' : '生成' }}
      </el-button>
    </el-form>
    <div class="mt-16px text-12px leading-20px text-[var(--el-text-color-secondary)]">
      <div>小提示：</div>
      <ul class="m-0 pl-18px">
        <li>建议使用分层级的大纲（如 Markdown 标题）让分镜更加清晰</li>
        <li>页数会在生成分镜时作为约束，保证故事线完整</li>
        <li>每页是一张整页图，标题和要点由绘图模型画在图里；导出的 PPTX、PDF 每页也是一张图</li>
      </ul>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import type { FormRules, UploadFile } from 'element-plus'
import { PptApi } from '@/api/ai/ppt'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import { formatFileSize, getFileIcon } from '@/utils/file'
import {
  AiModelTypeEnum,
  AiPptFileTypes,
  AiPptImagePlatforms,
  AiPptLanguageEnum,
  AiPptModeEnum,
  AiPptSourceEnum
} from '@/views/ai/utils/constants'

/** AI PPT：创建表单 */
defineOptions({ name: 'AiPptCreatePanel' })

const emit = defineEmits<{
  submitted: [] // 提交成功，用于刷新列表
}>()

const message = useMessage() // 消息弹窗

/** 格式选项 */
const MODE_OPTIONS = [
  {
    label: '详细演示文稿',
    value: AiPptModeEnum.DETAILED,
    description: '一整套包含全文和详情的演示文稿，适合邮件发送或单独阅读。'
  },
  {
    label: '演示用幻灯片',
    value: AiPptModeEnum.SLIDES,
    description: '简洁直观的幻灯片，附带要点，为演讲提供支持。'
  }
]
const DURATION_PAGE_COUNTS = { short: 6, default: 10 } // 时长对应的页数
const CONTENT_MAX_LENGTH = 25000 // 大纲最大长度，与后端一致
const FILE_ACCEPT = AiPptFileTypes.map((type) => `.${type}`).join(',') // 上传可选的文件类型
const FILE_MAX_SIZE_MB = 10 // 材料最大大小

const formRef = ref() // 表单 Ref
const formData = reactive({
  mode: AiPptModeEnum.DETAILED,
  language: AiPptLanguageEnum.ZH_CN,
  pageCount: DURATION_PAGE_COUNTS.default,
  imageModelId: undefined as number | undefined,
  source: AiPptSourceEnum.PASTE,
  content: '',
  fileUrl: '',
  prompt: ''
})
const duration = ref<'short' | 'default' | undefined>('default') // 时长；页数不是 6 / 10 时为空
const formRules = reactive<FormRules>({
  imageModelId: [{ required: true, message: '请选择绘图模型', trigger: 'change' }],
  content: [{ required: true, whitespace: true, message: '请输入大纲内容', trigger: 'blur' }],
  fileUrl: [{ required: true, message: '请上传材料文件', trigger: 'change' }]
})

/** 时长：只是把页数设为 6 / 10，不提交后端 */
const handleDurationChange = (value: 'short' | 'default') => {
  formData.pageCount = DURATION_PAGE_COUNTS[value]
}

/** 页数变化：与时长对应时，同步选中时长 */
const handlePageCountChange = (value?: number) => {
  duration.value = (Object.keys(DURATION_PAGE_COUNTS) as Array<'short' | 'default'>).find(
    (key) => DURATION_PAGE_COUNTS[key] === value
  )
}

/** 绘图模型：默认选中第一个 */
const imageModels = ref<ModelVO[]>([]) // 可用的绘图模型
const imageModelsLoaded = ref(false) // 是否已加载：加载完仍为空时提示去配置
const getImageModels = async () => {
  const list: ModelVO[] = await ModelApi.getModelSimpleList(AiModelTypeEnum.IMAGE)
  imageModels.value = list.filter((item) => AiPptImagePlatforms.includes(item.platform))
  imageModelsLoaded.value = true
  if (!formData.imageModelId && imageModels.value.length > 0) {
    formData.imageModelId = imageModels.value[0].id
  }
}

/** 选择材料：校验后立即上传到文件服务，成功后记录 fileUrl */
const { httpRequest } = useUpload('ai/ppt')
const uploadFile = ref<{ raw: File; uploading: boolean }>() // 已选的材料
const handleFileChange = async (file: UploadFile) => {
  const raw = file.raw
  if (!raw) {
    return
  }
  const extension = raw.name.split('.').pop()?.toLowerCase() || ''
  if (!AiPptFileTypes.includes(extension)) {
    message.error(`仅支持 ${AiPptFileTypes.join(' / ')} 格式的文件`)
    return
  }
  if (raw.size > FILE_MAX_SIZE_MB * 1024 * 1024) {
    message.error(`材料文件不能超过 ${FILE_MAX_SIZE_MB} MB`)
    return
  }
  uploadFile.value = { raw, uploading: true }
  formData.fileUrl = ''
  try {
    const res: any = await httpRequest({ file: raw, filename: raw.name } as any)
    if (uploadFile.value?.raw !== raw) {
      return // 上传期间已移除
    }
    uploadFile.value.uploading = false
    formData.fileUrl = res.data
    formRef.value?.clearValidate('fileUrl')
  } catch {
    if (uploadFile.value?.raw === raw) {
      uploadFile.value = undefined
      message.error('材料上传失败，请重新上传')
    }
  }
}

/** 移除材料 */
const handleFileRemove = () => {
  uploadFile.value = undefined
  formData.fileUrl = ''
}

/** 提交生成：上传材料时，文件已先上传到文件服务，只提交地址 */
const submitting = ref(false) // 提交中
const handleSubmit = async () => {
  if (formData.source === AiPptSourceEnum.UPLOAD && uploadFile.value?.uploading) {
    message.warning('材料上传中，请稍候')
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    await PptApi.generatePpt(formData)
    message.success('任务已提交，正在生成分镜')
    emit('submitted')
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getImageModels()
})
</script>
