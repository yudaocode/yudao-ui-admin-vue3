<!-- AI 短剧：第 2 步，剧本审阅 -->
<template>
  <div class="flex gap-16px">
    <ContentWrap class="min-w-0 flex-1">
      <el-alert
        v-if="detail.project.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED"
        type="warning"
        :closable="false"
        show-icon
        title="剧本已修改：请重新分析资产、拆分分镜后，再生成关键帧和镜头视频；原有资产保留"
        class="mb-16px"
      />
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
          <el-input
            v-model="formData.outline"
            type="textarea"
            :rows="4"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="世界观">
          <el-input
            v-model="formData.worldbuilding"
            type="textarea"
            :rows="3"
            placeholder="时代、地点、规则等设定，生成、打磨剧本时沿用"
          />
        </el-form-item>
        <el-form-item label="原始素材">
          <el-input
            v-model="formData.sourceMaterial"
            type="textarea"
            :rows="3"
            placeholder="改编的小说片段、新闻等原始素材，可不填"
          />
        </el-form-item>
        <el-form-item label="剧本正文">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="18"
            placeholder="可直接编写，或在上一步生成"
          />
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
        <!-- 剧本版本：生成、打磨都会新增版本，新的在前；点击只读查看 -->
        <el-timeline v-if="versions.length > 1" class="mt-16px !pl-2px">
          <el-timeline-item
            v-for="item in versions"
            :key="item.id"
            :timestamp="formatDate(item.createTime)"
            placement="top"
          >
            <el-link :underline="false" class="!break-all" @click="openVersion(item)">
              {{ item.revisionNote || (item.id === detail.script?.id ? '当前版本' : '重新生成') }}
            </el-link>
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

  <!-- 剧本版本：只读查看 -->
  <Dialog
    v-model="versionVisible"
    :title="`剧本版本 · ${formatDate(version?.createTime)}${version?.id === detail.script?.id ? '（当前）' : ''}`"
    width="760px"
  >
    <el-descriptions v-if="version" :column="2" border>
      <el-descriptions-item label="剧名">{{ version.title }}</el-descriptions-item>
      <el-descriptions-item label="叙事基调">{{ version.tone }}</el-descriptions-item>
      <el-descriptions-item label="修订要求" :span="2">{{ version.revisionNote }}</el-descriptions-item>
      <el-descriptions-item label="剧情大纲" :span="2">
        <div class="whitespace-pre-wrap">{{ version.outline }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="世界观" :span="2">
        <div class="whitespace-pre-wrap">{{ version.worldbuilding }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="剧本正文" :span="2">
        <div class="max-h-400px overflow-auto whitespace-pre-wrap">{{ version.content }}</div>
      </el-descriptions-item>
    </el-descriptions>
    <!-- 该版本的镜头：只读；角色、场景、道具等资产为项目级，不随版本保存 -->
    <div class="mb-8px mt-16px font-500">镜头（{{ versionStoryboards.length }}）</div>
    <el-table
      v-loading="versionStoryboardLoading"
      :data="versionStoryboards"
      max-height="320"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="镜头" prop="sceneNo" width="60" align="center" />
      <el-table-column label="标题" prop="title" min-width="120" />
      <el-table-column label="时长" prop="duration" width="70" align="center" />
      <el-table-column label="画面描述" prop="sceneText" min-width="200" />
      <el-table-column label="视频" width="100" align="center" :show-overflow-tooltip="false">
        <template #default="{ row }">
          <el-link v-if="row.videoUrl" type="primary" :href="row.videoUrl" target="_blank">
            播放
          </el-link>
          <dict-tag
            v-else-if="row.videoStatus"
            :type="DICT_TYPE.AI_DRAMA_STATUS"
            :value="row.videoStatus"
          />
          <span v-else>未生成</span>
        </template>
      </el-table-column>
    </el-table>
  </Dialog>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi, DramaScriptVO } from '@/api/ai/drama/script'
import { DramaStoryboardApi, DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import {
  AiDramaProjectStatusEnum,
  AiDramaStepEnum,
  AiModelTypeEnum
} from '@/views/ai/utils/constants'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'

/** AI 短剧：剧本审阅 */
defineOptions({ name: 'AiDramaScriptStep' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: []; next: [step: number] }>()
const message = useMessage() // 消息弹窗

const formData = reactive({
  title: '',
  tone: '',
  outline: '',
  worldbuilding: '',
  sourceMaterial: '',
  content: ''
})
const versions = ref<DramaScriptVO[]>([]) // 剧本版本，新的在前
const versionVisible = ref(false)
const version = ref<DramaScriptVO>() // 只读查看的剧本版本
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
    () => props.detail.script?.worldbuilding,
    () => props.detail.script?.sourceMaterial,
    () => props.detail.script?.content
  ],
  ([title, tone, outline, worldbuilding, sourceMaterial, content]) => {
    formData.title = title || ''
    formData.tone = tone || ''
    formData.outline = outline || ''
    formData.worldbuilding = worldbuilding || ''
    formData.sourceMaterial = sourceMaterial || ''
    formData.content = content || ''
  },
  { immediate: true }
)

/** 剧本版本变化（生成、打磨）时，重新加载版本列表 */
watch(
  () => props.detail.script?.id,
  async (id) => {
    versions.value = id ? await DramaScriptApi.getScriptList(props.detail.project.id) : []
  },
  { immediate: true }
)

const versionStoryboards = ref<DramaStoryboardVO[]>([]) // 只读查看的剧本版本的镜头
const versionStoryboardLoading = ref(false)

const openVersion = async (item: DramaScriptVO) => {
  version.value = item
  versionVisible.value = true
  // 加载该版本的镜头：连续切换版本时，只保留最后打开的版本的结果
  versionStoryboards.value = []
  versionStoryboardLoading.value = true
  try {
    const list = await DramaStoryboardApi.getStoryboardList(item.id)
    if (version.value?.id === item.id) {
      versionStoryboards.value = list
    }
  } finally {
    if (version.value?.id === item.id) {
      versionStoryboardLoading.value = false
    }
  }
}

/** 保存当前剧本：没有剧本时新增 */
const save = async () => {
  await DramaScriptApi.updateScript({
    id: props.detail.script?.id,
    projectId: props.detail.project.id,
    ...formData
  })
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
