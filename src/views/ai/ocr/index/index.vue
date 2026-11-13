<!-- AI 文字识别：图片转文字工作台 -->
<template>
  <!-- 高度占满可视区域（与 AI 绘图、infra/build 等页面一致）：左侧输入、右侧识别结果撑满剩余高度，结果编辑框随之拉高 -->
  <div
    class="h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding))] flex flex-col overflow-hidden"
  >
    <doc-alert title="OCR 文字识别" url="https://doc.iocoder.cn/ai/ocr/" />
    <div class="min-h-0 flex flex-1 gap-16px">
      <!-- 左：输入（识别服务、图片、开始识别） -->
      <ContentWrap
        class="h-full w-460px flex-shrink-0 !mb-0"
        :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
      >
        <div class="mb-16px flex items-center justify-between gap-8px">
          <span class="whitespace-nowrap text-16px font-bold">OCR 文字识别</span>
          <el-link type="primary" :underline="false" @click="historyRef?.open()">
            <Icon icon="ep:clock" class="mr-4px" /> 识别记录
          </el-link>
        </div>

        <div class="mb-8px whitespace-nowrap text-14px">
          <span class="mr-4px text-[var(--el-color-danger)]">*</span>识别服务
        </div>
        <el-select
          v-model="modelId"
          placeholder="请选择识别服务"
          class="mb-16px !w-full"
          :loading="modelLoading"
          :disabled="recognizing"
          no-data-text="暂无可用的识别服务，请联系管理员配置"
        >
          <el-option v-for="model in models" :key="model.id" :label="model.name" :value="model.id">
            <div class="flex items-center justify-between gap-12px">
              <span>{{ model.name }}</span>
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                {{ getDictLabel(DICT_TYPE.AI_PLATFORM, model.platform) || model.platform }}
              </span>
            </div>
          </el-option>
        </el-select>

        <OcrImagePane
          ref="imagePaneRef"
          :src="imageSrc"
          :file-name="fileName"
          :disabled="recognizing"
          @select="selectFile"
        />

        <el-button
          type="primary"
          size="large"
          class="mt-16px !w-full"
          :loading="recognizing"
          :disabled="!file || !modelId"
          @click="recognize"
        >
          {{ recognizing ? '识别中' : record || requestError ? '重新识别' : '开始识别' }}
        </el-button>
      </ContentWrap>

      <!-- 右：识别结果 -->
      <ContentWrap
        class="h-full min-w-0 flex-1 !mb-0"
        :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
      >
        <!-- 第一行：标题、状态、识别服务与耗时 -->
        <div class="mb-12px min-w-0 flex items-center gap-8px">
          <span class="whitespace-nowrap text-16px font-bold">识别结果</span>
          <template v-if="record && phase === 'success'">
            <el-tag v-if="dirty" type="warning" size="small">未保存</el-tag>
            <el-tag v-else-if="isEdited" type="success" size="small">已保存修订</el-tag>
            <span class="truncate text-12px text-[var(--el-text-color-secondary)]">
              {{ resultMeta }}
            </span>
          </template>
        </div>
        <!-- 第二行：修订操作在左，导出操作在右 -->
        <div
          v-if="phase === 'success'"
          class="mb-12px flex flex-wrap items-center justify-between gap-8px"
        >
          <div class="flex flex-wrap items-center gap-8px">
            <el-button size="small" :disabled="text === originalText" @click="restoreOriginal">
              恢复原文
            </el-button>
            <el-button size="small" :disabled="!dirty" @click="text = savedText">
              撤销修改
            </el-button>
            <el-button
              size="small"
              type="primary"
              :loading="saving"
              :disabled="!dirty"
              @click="save"
            >
              保存修订
            </el-button>
          </div>
          <div class="flex flex-wrap items-center gap-8px">
            <el-button size="small" @click="handleCopy">
              <Icon icon="ep:document-copy" class="mr-4px" /> 复制
            </el-button>
            <el-button size="small" @click="handleDownload">
              <Icon icon="ep:download" class="mr-4px" /> 下载 TXT
            </el-button>
          </div>
        </div>

        <div class="min-h-0 flex flex-1 flex-col">
          <!-- 空状态 -->
          <el-empty
            v-if="phase === 'empty'"
            class="h-full"
            description="在左侧选择识别服务、上传图片后，点击「开始识别」"
          />
          <!-- 待识别：识别按钮统一在左侧底部 -->
          <el-empty
            v-else-if="phase === 'ready'"
            class="h-full"
            :description="file ? '图片已就绪，点击左侧「开始识别」' : '请在左侧重新上传图片后再识别'"
          />
          <!-- 识别中 -->
          <div
            v-else-if="phase === 'recognizing'"
            class="h-full flex flex-col items-center justify-center gap-12px text-[var(--el-text-color-secondary)]"
          >
            <Icon icon="ep:loading" :size="32" class="is-loading text-[var(--el-color-primary)]" />
            <span>正在识别，请稍候…</span>
          </div>
          <!-- 识别失败：失败原因按纯文本展示 -->
          <el-result v-else-if="phase === 'fail'" icon="error" title="识别失败" class="h-full">
            <template #sub-title>
              <div class="max-w-480px whitespace-pre-wrap break-all text-13px">
                {{ record?.errorMessage || requestError }}
              </div>
            </template>
            <template #extra>
              <el-button v-if="file" type="primary" :disabled="!modelId" @click="recognize">
                重试
              </el-button>
              <el-button v-else type="primary" @click="imagePaneRef?.chooseFile()">
                重新上传图片
              </el-button>
            </template>
          </el-result>
          <!-- 识别成功：纯文本编辑 -->
          <template v-else>
            <el-input
              v-model="text"
              type="textarea"
              resize="none"
              class="ocr-text min-h-0 flex-1"
              placeholder="图片中没有识别到文字，可以在这里手动输入"
              :maxlength="AiOcrTextMaxLength"
            />
            <div
              class="mt-8px flex justify-between text-12px text-[var(--el-text-color-secondary)]"
            >
              <span>共 {{ text.length }} 字</span>
              <span>重新识别会新增一条记录，不覆盖已保存的修订</span>
            </div>
          </template>
        </div>
      </ContentWrap>
    </div>

    <!-- 识别记录 -->
    <OcrHistoryDrawer
      ref="historyRef"
      :current-id="record?.id"
      @open="openRecord"
      @deleted="handleDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { useClipboard, useEventListener } from '@vueuse/core'
import type { UploadRequestOptions } from 'element-plus'
import { onBeforeRouteLeave } from 'vue-router'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { OcrApi, OcrModelVO, OcrVO } from '@/api/ai/ocr'
import { AiOcrStatusEnum, AiOcrTextMaxLength } from '@/views/ai/utils/constants'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import OcrImagePane from './components/OcrImagePane.vue'
import OcrHistoryDrawer from './components/OcrHistoryDrawer.vue'

/** AI 文字识别：图片转文字工作台 */
defineOptions({ name: 'AiOcr' })

const message = useMessage() // 消息弹窗

const imagePaneRef = ref<InstanceType<typeof OcrImagePane>>()
const historyRef = ref<InstanceType<typeof OcrHistoryDrawer>>()

// ========== 识别服务 ==========

const modelLoading = ref(false)
const models = ref<OcrModelVO[]>([]) // 可用的识别服务：后端已按启用、密钥、平台过滤并排序
const modelId = ref<number>()

const getModelList = async () => {
  modelLoading.value = true
  try {
    models.value = await OcrApi.getOcrModelList()
    if (!models.value.some((model) => model.id === modelId.value)) {
      modelId.value = models.value[0]?.id
    }
  } finally {
    modelLoading.value = false
  }
}

// ========== 工作台状态 ==========

const file = ref<File>() // 当前图片文件：只有本次上传的图片可以直接重试；切换图片、打开记录后，旧的识别结果不再覆盖
const fileUrl = ref<string>() // 当前图片上传到文件服务后的地址
const objectUrl = ref<string>() // 本地预览地址，切换图片时释放
const fileName = ref<string>() // 文件名
const record = ref<OcrVO>() // 当前识别记录
const text = ref('') // 编辑中的文本
const savedText = ref('') // 已保存的文本：修订文本，未修订时为原文
const recognizing = ref(false) // 识别中
const requestError = ref<string>() // 请求失败（未生成识别记录）的提示
const saving = ref(false) // 保存修订中

/** 预览图：本地文件优先，否则使用记录的图片地址 */
const imageSrc = computed(() => objectUrl.value || record.value?.imageUrl)

/** 当前阶段 */
const phase = computed(() => {
  if (recognizing.value) {
    return 'recognizing'
  }
  if (record.value) {
    return record.value.status === AiOcrStatusEnum.SUCCESS ? 'success' : 'fail'
  }
  if (requestError.value) {
    return 'fail'
  }
  return imageSrc.value ? 'ready' : 'empty'
})

const originalText = computed(() => record.value?.originalText ?? '')
/** 结果说明：识别服务、耗时 */
const resultMeta = computed(() => {
  const current = record.value
  if (!current) {
    return ''
  }
  const duration = current.duration ? ` · ${(current.duration / 1000).toFixed(1)} 秒` : ''
  return `${current.modelName || ''}${duration}`
})
/** 是否已保存过修订：null 表示未修订，空字符串也算已修订 */
const isEdited = computed(
  () => record.value?.editedText !== null && record.value?.editedText !== undefined
)
/** 是否有未保存的修改 */
const dirty = computed(() => phase.value === 'success' && text.value !== savedText.value)

/** 有未保存的修改时，确认是否放弃 */
const confirmDiscard = async (): Promise<boolean> => {
  if (!dirty.value) {
    return true
  }
  try {
    await message.confirm('当前修订尚未保存，确定放弃吗？')
    return true
  } catch {
    return false
  }
}

/** 释放本地预览地址 */
const revokeObjectUrl = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = undefined
  }
}

/** 应用识别记录：编辑区回到已保存的文本 */
const applyRecord = (data: OcrVO) => {
  record.value = data
  savedText.value = data.editedText ?? data.originalText ?? ''
  text.value = savedText.value
}

/** 重置结果区 */
const resetResult = () => {
  recognizing.value = false
  record.value = undefined
  requestError.value = undefined
  text.value = ''
  savedText.value = ''
}

// ========== 选择图片 ==========

const selectFile = async (newFile: File) => {
  if (!newFile.type.startsWith('image/')) {
    message.warning('请选择图片文件')
    return
  }
  if (!(await confirmDiscard())) {
    return
  }
  resetResult()
  revokeObjectUrl()
  file.value = newFile
  fileUrl.value = undefined
  fileName.value = newFile.name
  objectUrl.value = URL.createObjectURL(newFile)
}

/** 粘贴截图：只在页面激活、且焦点不在输入框时接管，不影响普通的文本粘贴 */
const active = ref(true)
onActivated(() => (active.value = true))
onDeactivated(() => (active.value = false))
useEventListener(document, 'paste', (event: ClipboardEvent) => {
  if (!active.value) {
    return
  }
  const target = event.target as HTMLElement | null
  if (target?.closest?.('input, textarea, [contenteditable=""], [contenteditable="true"]')) {
    return
  }
  const image = Array.from(event.clipboardData?.files || []).find((item) =>
    item.type.startsWith('image/')
  )
  if (!image) {
    return
  }
  event.preventDefault()
  selectFile(image)
})

// ========== 识别 ==========

/** 上传图片到文件服务：与其它模块一致，复用上传组件的逻辑（支持前端直传、后端上传） */
const { httpRequest: uploadFile } = useUpload()
const uploadImage = async (image: File): Promise<string> => {
  const res: any = await uploadFile({ file: image, filename: 'file' } as UploadRequestOptions)
  return res.data
}

const recognize = async () => {
  if (!file.value || !modelId.value) {
    return
  }
  const currentFile = file.value
  record.value = undefined
  requestError.value = undefined
  text.value = ''
  savedText.value = ''
  recognizing.value = true
  try {
    // 先上传：同一张图片重试时，复用已上传的地址
    if (!fileUrl.value) {
      const url = await uploadImage(currentFile)
      if (file.value !== currentFile) {
        return
      }
      fileUrl.value = url
    }
    const data = await OcrApi.recognizeOcr({ modelId: modelId.value, fileUrl: fileUrl.value })
    // 识别期间切换了图片或打开了记录，不覆盖当前内容
    if (file.value !== currentFile) {
      return
    }
    applyRecord(data)
  } catch {
    if (file.value === currentFile) {
      requestError.value = '识别请求失败，请检查图片和识别服务后重试'
    }
  } finally {
    if (file.value === currentFile) {
      recognizing.value = false
    }
  }
}

// ========== 修订、复制、下载 ==========

/** 恢复原文：只改编辑区，保存后才生效 */
const restoreOriginal = () => {
  text.value = originalText.value
}

/** 保存修订：空字符串表示清空内容 */
const save = async () => {
  const current = record.value
  if (!current) {
    return
  }
  saving.value = true
  try {
    const data = await OcrApi.updateOcrMy({ id: current.id, editedText: text.value })
    // 保存期间切换了记录，不覆盖新的内容
    if (record.value?.id !== current.id) {
      return
    }
    record.value = data
    savedText.value = data.editedText ?? data.originalText ?? ''
    message.success('修订已保存')
  } finally {
    saving.value = false
  }
}

const { copy } = useClipboard({ legacy: true }) // 粘贴板

/** 复制当前文本（包括空字符串） */
const handleCopy = async () => {
  try {
    await copy(text.value)
    message.success('复制成功')
  } catch {
    message.error('复制失败，请手动选择文本复制')
  }
}

/** 下载当前文本为 TXT（包括空字符串） */
const handleDownload = () => {
  const name = (fileName.value || record.value?.fileName || 'ocr').replace(/\.[^.]+$/, '')
  const href = URL.createObjectURL(new Blob([text.value], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = href
  link.download = `${name}.txt`
  link.click()
  URL.revokeObjectURL(href)
}

// ========== 识别记录 ==========

/** 打开记录：恢复已保存的修订；没有本地文件，重新识别需要重新上传 */
const openRecord = async (item: OcrVO) => {
  if (item.id === record.value?.id) {
    historyRef.value?.close()
    return
  }
  if (!(await confirmDiscard())) {
    return
  }
  resetResult()
  revokeObjectUrl()
  file.value = undefined
  fileUrl.value = undefined
  fileName.value = item.fileName
  applyRecord(item)
  historyRef.value?.close()
}

/** 删除的是当前记录时，结果区回到待识别 */
const handleDeleted = (id: number) => {
  if (record.value?.id !== id) {
    return
  }
  resetResult()
  if (!file.value) {
    fileName.value = undefined
  }
}

// ========== 离开保护 ==========

onBeforeRouteLeave(async () => {
  return await confirmDiscard()
})
useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
})

onMounted(() => {
  getModelList()
})
onBeforeUnmount(() => {
  revokeObjectUrl()
})
</script>

<style lang="scss" scoped>
.ocr-text {
  :deep(.el-textarea__inner) {
    height: 100%;
    font-family: var(--el-font-family);
    line-height: 1.7;
  }
}
</style>
