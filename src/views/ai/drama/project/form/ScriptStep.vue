<!-- AI 短剧：第 2 步，剧本审阅 -->
<template>
  <div class="flex gap-16px">
    <ContentWrap class="min-w-0 flex-1">
      <el-form :model="formData" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="剧名">
              <el-input v-model="formData.title" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="叙事基调">
              <el-input v-model="formData.tone" maxlength="255" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="剧情大纲">
          <el-input v-model="formData.outline" type="textarea" :rows="4" maxlength="5000" show-word-limit />
        </el-form-item>
        <el-form-item label="剧本正文">
          <el-input v-model="formData.content" type="textarea" :rows="18" placeholder="可直接编写，或在上一步生成" />
        </el-form-item>
        <el-form-item>
          <div class="w-full flex justify-end">
            <el-button :loading="saving" type="primary" @click="handleSave">保存剧本</el-button>
          </div>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <div class="w-340px flex-shrink-0">
      <ContentWrap>
        <div class="mb-8px font-500">AI 打磨</div>
        <div class="mb-8px">
          <ModelSelect
            v-model="chatModelId"
            :type="AiModelTypeEnum.CHAT"
            placeholder="默认对话模型"
            clearable
            class="!w-full"
          />
        </div>
        <el-input
          v-model="note"
          type="textarea"
          :rows="4"
          placeholder="修改意见，例如：结尾加一个反转；台词更口语化"
          maxlength="1000"
        />
        <el-button
          class="mt-8px w-full"
          type="primary"
          plain
          :loading="polishing"
          :disabled="!note.trim() || !detail.script?.content"
          @click="handlePolish"
        >
          按意见打磨
        </el-button>
        <el-timeline v-if="detail.script?.revisionNotes?.length" class="mt-16px !pl-2px">
          <el-timeline-item
            v-for="(item, index) in [...detail.script.revisionNotes].reverse()"
            :key="index"
            :timestamp="formatDate(item.time)"
            placement="top"
          >
            <span class="break-all">{{ item.note }}</span>
          </el-timeline-item>
        </el-timeline>
      </ContentWrap>
      <ContentWrap>
        <div class="mb-8px font-500">下一步</div>
        <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
          从剧本提取角色、场景、道具；已有同名的不会重复添加
        </div>
        <el-button
          type="primary"
          class="w-full"
          :loading="analyzing"
          :disabled="!detail.script?.content"
          @click="handleAnalyze"
        >
          分析资产，进入资产配置
        </el-button>
        <el-button class="!ml-0 mt-8px w-full" @click="emit('next', AiDramaStepEnum.ASSET)">
          跳过分析，直接配置资产
        </el-button>
      </ContentWrap>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { AiDramaStepEnum, AiModelTypeEnum } from '@/views/ai/utils/constants'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'

/** AI 短剧：剧本审阅 */
defineOptions({ name: 'AiDramaScriptStep' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: []; next: [step: number] }>()
const message = useMessage() // 消息弹窗

const formData = reactive({ title: '', tone: '', outline: '', content: '' })
const chatModelId = ref<number>()
const note = ref('')
const saving = ref(false)
const polishing = ref(false)
const analyzing = ref(false)

/** 剧本内容变化（保存、打磨）时，同步到表单；生成中的轮询返回的剧本未变，不覆盖正在编辑的内容 */
watch(
  [
    () => props.detail.script?.title,
    () => props.detail.script?.tone,
    () => props.detail.script?.outline,
    () => props.detail.script?.content
  ],
  ([title, tone, outline, content]) => {
    formData.title = title || ''
    formData.tone = tone || ''
    formData.outline = outline || ''
    formData.content = content || ''
  },
  { immediate: true }
)

const save = async () => {
  await DramaScriptApi.updateScript({ projectId: props.detail.project.id, ...formData })
}

const handleSave = async () => {
  saving.value = true
  try {
    await save()
    message.success('保存成功')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

/** 打磨：先保存当前修改，再按意见打磨 */
const handlePolish = async () => {
  polishing.value = true
  try {
    await save()
    await DramaScriptApi.polishScript(props.detail.project.id, note.value.trim(), chatModelId.value)
    note.value = ''
    message.success('打磨完成')
    emit('refresh')
  } finally {
    polishing.value = false
  }
}

const handleAnalyze = async () => {
  analyzing.value = true
  try {
    await save()
    await DramaScriptApi.analyzeAssetList(props.detail.project.id, chatModelId.value)
    message.success('资产分析完成')
    emit('next', AiDramaStepEnum.ASSET)
  } finally {
    analyzing.value = false
  }
}
</script>
