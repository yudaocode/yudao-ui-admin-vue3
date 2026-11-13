<!-- AI 写作：左侧创作面板 -->
<template>
  <ContentWrap
    class="h-full w-full"
    :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
  >
    <!-- 表单区域内部滚动，底部操作按钮固定可见 -->
    <div class="mb-12px flex items-center justify-between">
      <div class="text-16px font-bold">AI 写作翻译</div>
      <el-link type="primary" :underline="false" @click="example">
        <Icon icon="ep:question-filled" class="mr-4px" />示例
      </el-link>
    </div>
    <el-form label-position="top" class="min-h-0 flex-1 overflow-y-auto" @submit.prevent>
      <el-form-item label="场景">
        <Tag :model-value="formData.type" :tags="sceneOptions" @update:model-value="switchScene" />
      </el-form-item>
      <el-form-item label="模型" required>
        <ModelSelect
          v-model="modelId"
          :type="AiModelTypeEnum.CHAT"
          placeholder="请选择对话模型"
          class="!w-full"
          @loaded="handleModelLoaded"
        />
      </el-form-item>

      <!-- 原文类输入：回复、周报、润色 / 改写、文本翻译 -->
      <el-form-item v-if="originalLabel" :label="originalLabel" required>
        <el-input
          v-model="formData.originalContent"
          :rows="6"
          type="textarea"
          :placeholder="`请输入${originalLabel}`"
        />
        <div class="w-full text-right text-12px text-[var(--el-text-color-secondary)]">
          {{ formData.originalContent.length }} 字
        </div>
      </el-form-item>
      <!-- 主题 / 要求 / 补充说明 -->
      <el-form-item :label="promptLabel" :required="promptRequired">
        <el-input
          v-model="formData.prompt"
          :rows="promptRequired ? 5 : 3"
          type="textarea"
          :placeholder="promptRequired ? `请输入${promptLabel}` : '选填'"
        />
      </el-form-item>

      <!-- 周报 -->
      <template v-if="formData.type === AiWriteTypeEnum.WEEKLY_REPORT">
        <el-form-item label="周期">
          <el-input
            v-model="formData.sceneParams!.period"
            maxlength="50"
            placeholder="选填，如：本周"
          />
        </el-form-item>
        <el-form-item label="岗位 / 团队">
          <el-input v-model="formData.sceneParams!.role" maxlength="50" placeholder="选填" />
        </el-form-item>
      </template>
      <!-- 小红书 -->
      <template v-if="formData.type === AiWriteTypeEnum.XIAOHONGSHU">
        <el-form-item label="目标受众" required>
          <el-input
            v-model="formData.sceneParams!.audience"
            maxlength="100"
            placeholder="如：刚入职的程序员"
          />
        </el-form-item>
        <el-form-item label="风格" required>
          <Tag v-model="formData.sceneParams!.style" :tags="toOptions(AiWriteXhsStyles)" />
        </el-form-item>
        <el-form-item label="使用 emoji">
          <el-switch v-model="formData.sceneParams!.emoji" />
        </el-form-item>
        <el-form-item label="话题标签数">
          <el-input-number
            v-model="formData.sceneParams!.tagCount"
            :min="0"
            :max="10"
            :value-on-clear="5"
          />
        </el-form-item>
      </template>
      <!-- 润色 / 改写 -->
      <el-form-item v-if="formData.type === AiWriteTypeEnum.REWRITE" label="方式" required>
        <Tag v-model="formData.sceneParams!.mode" :tags="toOptions(AiWriteRewriteModes)" />
      </el-form-item>
      <!-- 文本翻译：目标语言必选且不同于源语言；不使用“输出语言” -->
      <template v-if="formData.type === AiWriteTypeEnum.TRANSLATE">
        <el-form-item label="源语言">
          <Tag v-model="formData.sceneParams!.sourceLanguage" :tags="sourceLanguageOptions" />
        </el-form-item>
        <el-form-item label="目标语言" required>
          <Tag v-model="formData.sceneParams!.targetLanguage" :tags="targetLanguageOptions" />
        </el-form-item>
        <el-form-item label="领域" required>
          <Tag v-model="formData.sceneParams!.domain" :tags="toOptions(AiWriteTranslateDomains)" />
        </el-form-item>
        <el-form-item label="保留格式（换行、列表、Markdown、代码、链接）">
          <el-switch v-model="formData.sceneParams!.preserveFormat" />
        </el-form-item>
      </template>

      <!-- 字典项：按场景显示 -->
      <el-form-item v-if="show.format" label="格式">
        <Tag v-model="formData.format" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_FORMAT)" />
      </el-form-item>
      <el-form-item v-if="show.tone" label="语气">
        <Tag v-model="formData.tone" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_TONE)" />
      </el-form-item>
      <el-form-item v-if="show.language" label="输出语言">
        <Tag v-model="formData.language" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_LANGUAGE)" />
      </el-form-item>
      <el-form-item v-if="show.length" label="长度">
        <Tag v-model="formData.length" :tags="getIntDictOptions(DICT_TYPE.AI_WRITE_LENGTH)" />
      </el-form-item>
    </el-form>
    <div class="mt-12px flex flex-shrink-0 gap-12px">
      <el-button class="flex-1" :disabled="isWriting" @click="reset">重置</el-button>
      <el-button
        class="flex-1"
        type="primary"
        :loading="isWriting"
        :disabled="!modelId"
        @click="submit"
      >
        生成
      </el-button>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import Tag from './Tag.vue'
import { omit } from 'lodash-es'
import type { ModelVO } from '@/api/ai/model/model'
import { WriteVO } from '@/api/ai/write'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import {
  AiModelTypeEnum,
  AiWriteOptionEnum,
  AiWriteOriginalLabels,
  AiWritePromptLabels,
  AiWriteRewriteModes,
  AiWriteTranslateDomains,
  AiWriteTypeEnum,
  AiWriteXhsStyles,
  WriteExample
} from '@/views/ai/utils/constants'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'

const message = useMessage() // 消息弹窗

defineProps<{
  isWriting: boolean
}>()

const emits = defineEmits<{
  (e: 'submit', params: WriteVO): void
  (e: 'example', type: AiWriteTypeEnum): void
  (e: 'reset'): void
}>()

/** 场景选项：字典 ai_write_type 中前端已支持（有示例）的场景 */
const sceneOptions = computed(() =>
  getIntDictOptions(DICT_TYPE.AI_WRITE_TYPE).filter((item) => item.value in WriteExample)
)
const sourceLanguageOptions = computed(() => getIntDictOptions(DICT_TYPE.AI_WRITE_LANGUAGE)) // 含“自动”检测
const targetLanguageOptions = computed(() =>
  getIntDictOptions(DICT_TYPE.AI_WRITE_LANGUAGE).filter(
    (item) => item.value !== AiWriteOptionEnum.AUTO
  )
)
const toOptions = (values: string[]) => values.map((value) => ({ label: value, value }))

/** 场景的初始表单：字典选项默认“自动”，周报语气默认“专业” */
const initData = (type: AiWriteTypeEnum): WriteVO => {
  const data: WriteVO = {
    type,
    prompt: '',
    originalContent: '',
    length: AiWriteOptionEnum.AUTO,
    format: AiWriteOptionEnum.AUTO,
    tone:
      type === AiWriteTypeEnum.WEEKLY_REPORT
        ? AiWriteOptionEnum.TONE_PROFESSIONAL
        : AiWriteOptionEnum.AUTO,
    language: AiWriteOptionEnum.AUTO,
    sceneParams: {}
  }
  if (type === AiWriteTypeEnum.XIAOHONGSHU) {
    data.sceneParams = { audience: '', style: AiWriteXhsStyles[0], emoji: true, tagCount: 5 }
  } else if (type === AiWriteTypeEnum.REWRITE) {
    data.sceneParams = { mode: AiWriteRewriteModes[0] }
  } else if (type === AiWriteTypeEnum.TRANSLATE) {
    data.sceneParams = {
      sourceLanguage: AiWriteOptionEnum.AUTO,
      targetLanguage: undefined,
      domain: AiWriteTranslateDomains[0],
      preserveFormat: true
    }
  }
  return data
}

const modelId = ref<number>() // 模型：各场景共用
const formData = ref<WriteVO>(initData(AiWriteTypeEnum.WRITING))
const recordFormData = {} as Record<AiWriteTypeEnum, WriteVO> // 切换场景时保留各场景已填的内容

/** 模型加载完成：未选择时选中第一个（列表与系统默认模型同排序，首个即系统默认） */
const handleModelLoaded = (list: ModelVO[]) => {
  modelId.value ??= list[0]?.id
}

/** 按场景显示的字段 */
const originalLabel = computed(() => AiWriteOriginalLabels[formData.value.type] || '')
const promptLabel = computed(() => AiWritePromptLabels[formData.value.type])
const promptRequired = computed(() =>
  [
    AiWriteTypeEnum.WRITING,
    AiWriteTypeEnum.REPLY,
    AiWriteTypeEnum.GENERAL,
    AiWriteTypeEnum.XIAOHONGSHU
  ].includes(formData.value.type)
)
const show = computed(() => {
  const type = formData.value.type
  const article = [AiWriteTypeEnum.WRITING, AiWriteTypeEnum.REPLY, AiWriteTypeEnum.GENERAL]
  // 润色保持原文语言、翻译使用目标语言：都不显示“输出语言”和长度
  const withLanguage = [...article, AiWriteTypeEnum.WEEKLY_REPORT, AiWriteTypeEnum.XIAOHONGSHU]
  return {
    format: article.includes(type),
    tone: type !== AiWriteTypeEnum.XIAOHONGSHU,
    language: withLanguage.includes(type),
    length: withLanguage.includes(type)
  }
})

/** 切换场景 */
const switchScene = (type: AiWriteTypeEnum) => {
  if (type === formData.value.type) {
    return
  }
  recordFormData[formData.value.type] = formData.value
  formData.value = recordFormData[type] || initData(type)
}

/** 示例：填入当前场景的示例表单 */
const example = () => {
  const type = formData.value.type
  const { sceneParams, ...form } = omit(WriteExample[type], ['data']) as Partial<WriteVO>
  const init = initData(type)
  formData.value = { ...init, ...form, sceneParams: { ...init.sceneParams, ...sceneParams } }
  emits('example', type)
}

/** 重置当前场景 */
const reset = () => {
  formData.value = initData(formData.value.type)
  emits('reset')
}

/** 前端校验：与服务端规则一致，服务端还会再校验 */
const validate = (): string | undefined => {
  const { type, prompt, originalContent, sceneParams } = formData.value
  if (originalLabel.value && !originalContent.trim()) {
    return `请输入${originalLabel.value}`
  }
  if (promptRequired.value && !prompt.trim()) {
    return `请输入${promptLabel.value}`
  }
  if (type === AiWriteTypeEnum.XIAOHONGSHU && !sceneParams?.audience?.trim()) {
    return '请输入目标受众'
  }
  if (type === AiWriteTypeEnum.TRANSLATE) {
    if (!sceneParams?.targetLanguage) {
      return '请选择目标语言'
    }
    if (sceneParams.targetLanguage === sceneParams.sourceLanguage) {
      return '目标语言不能与源语言相同'
    }
  }
  return undefined
}

/** 提交写作：不相关的字段由服务端按场景丢弃 */
const submit = () => {
  const error = validate()
  if (error) {
    message.warning(error)
    return
  }
  emits('submit', { ...formData.value, modelId: modelId.value })
}
</script>
