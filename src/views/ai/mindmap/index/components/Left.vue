<!-- AI 思维导图：左侧创作面板 -->
<template>
  <ContentWrap class="h-full w-full" :body-style="{ height: '100%', overflowY: 'auto' }">
    <div class="mb-16px">
      <div class="text-16px font-bold">思维导图创作中心</div>
      <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
        选择模型让 AI 生成导图，或粘贴已有 Markdown 直接渲染
      </div>
    </div>
    <el-tabs v-model="activeTab">
      <!-- AI 生成 -->
      <el-tab-pane label="AI 生成" name="ai">
        <el-form label-position="top" @submit.prevent>
          <el-form-item label="模型" required>
            <ModelSelect
              v-model="formData.modelId"
              :type="AiModelTypeEnum.CHAT"
              placeholder="请选择对话模型"
              class="!w-full"
              @loaded="handleModelLoaded"
            />
          </el-form-item>
          <el-form-item label="您的需求" required :error="promptError">
            <el-input
              v-model="formData.prompt"
              :rows="8"
              type="textarea"
              placeholder="输入主题，或粘贴文章、会议纪要等长文，让 AI 帮你整理成思维导图"
              @input="promptError = ''"
            />
            <div class="w-full text-right text-12px text-[var(--el-text-color-secondary)]">
              {{ formData.prompt.length }} 字
            </div>
          </el-form-item>
          <el-button
            class="!w-full"
            type="primary"
            :loading="isGenerating"
            :disabled="!formData.modelId"
            @click="handleSubmit"
          >
            智能生成思维导图
          </el-button>
        </el-form>
      </el-tab-pane>
      <!-- 已有 Markdown -->
      <el-tab-pane label="已有 Markdown" name="markdown">
        <el-form label-position="top" @submit.prevent>
          <el-form-item label="Markdown 内容">
            <el-input
              v-model="markdown"
              :rows="14"
              type="textarea"
              placeholder="请输入 Markdown 内容"
            />
            <div class="w-full text-right text-12px text-[var(--el-text-color-secondary)]">
              {{ markdown.length }} 字
            </div>
          </el-form-item>
          <el-button
            class="!w-full"
            type="primary"
            :disabled="isGenerating"
            @click="handleDirectGenerate"
          >
            直接生成
          </el-button>
          <div class="mt-8px text-12px text-[var(--el-text-color-secondary)]">
            只在本页面渲染，不调用模型、不保存记录
          </div>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import type { ModelVO } from '@/api/ai/model/model'
import { AiModelTypeEnum, MindMapContentExample } from '@/views/ai/utils/constants'
import type { AiMindMapGenerateReqVO } from '@/api/ai/mindmap'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'

defineProps<{
  isGenerating: boolean // 是否正在生成
}>()
const emits = defineEmits<{
  (e: 'submit', data: AiMindMapGenerateReqVO): void // AI 生成
  (e: 'directGenerate', content: string): void // 直接渲染已有 Markdown
}>()

const activeTab = ref<'ai' | 'markdown'>('ai')
const formData = reactive({
  modelId: undefined as number | undefined,
  prompt: ''
})
const promptError = ref('') // 需求输入框下方的错误
const markdown = ref(MindMapContentExample) // 已有 Markdown：首次进入为内置示例，只在当前页面内存

/** 模型加载完成：未选择时选中第一个（列表与系统默认模型同排序，首个即系统默认） */
const handleModelLoaded = (list: ModelVO[]) => {
  formData.modelId ??= list[0]?.id
}

/** AI 生成：判空，不截断 */
const handleSubmit = () => {
  if (!formData.modelId) {
    return
  }
  if (!formData.prompt.trim()) {
    promptError.value = '请输入你的需求'
    return
  }
  promptError.value = ''
  emits('submit', { prompt: formData.prompt, modelId: formData.modelId })
}

/** 直接渲染 */
const handleDirectGenerate = () => {
  emits('directGenerate', markdown.value)
}

defineExpose({
  /** 设置“已有 Markdown”：AI 生成成功时回填 */
  setMarkdown(content: string) {
    markdown.value = content
  }
})
</script>
