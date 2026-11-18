<!-- AI 短剧：第 2 步，剧本审阅：一张表单读正文、提修改意见、看新版本；版本历史从工具栏打开 -->
<template>
  <ContentWrap>
    <el-alert
      v-if="detail.project.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED"
      type="warning"
      :closable="false"
      show-icon
      title="剧本已修改：请重新分析资产、拆分分镜后，再生成关键帧和镜头视频；原有资产保留"
      class="mb-16px"
    />
    <!-- 工具栏：当前版本，右侧版本历史 -->
    <div class="mb-16px flex items-center justify-between gap-12px">
      <span class="truncate text-13px text-[var(--el-text-color-secondary)]">
        <template v-if="detail.script">
          当前版本 · {{ formatDate(detail.script.createTime) }}
          <template v-if="detail.script.revisionNote">· 打磨：{{ detail.script.revisionNote }}</template>
        </template>
        <template v-else>尚无剧本：可直接编写正文后保存，或回到上一步生成</template>
      </span>
      <el-button link type="primary" :disabled="!versions.length" @click="historyVisible = true">
        <Icon icon="ep:clock" class="mr-4px" /> 版本历史（{{ versions.length }}）
      </el-button>
    </div>
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
          :rows="3"
          maxlength="5000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="剧本正文">
        <div class="w-full">
          <div class="mb-8px flex justify-end">
            <el-radio-group v-model="contentMode" size="small">
              <el-radio-button value="read">阅读</el-radio-button>
              <el-radio-button value="edit">编辑</el-radio-button>
            </el-radio-group>
          </div>
          <div
            v-if="contentMode === 'read'"
            class="max-h-560px min-h-120px overflow-auto whitespace-pre-wrap break-all border border-[var(--el-border-color)] rounded-4px border-solid px-12px py-8px text-14px leading-24px"
          >
            {{ formData.content || '暂无正文，切换到「编辑」直接编写' }}
          </div>
          <el-input
            v-else
            v-model="formData.content"
            type="textarea"
            :rows="18"
            placeholder="可直接编写，或在上一步生成"
          />
        </div>
      </el-form-item>
      <!-- 打磨剧本：在正文下方原位展开修改意见，重写后新增版本，留在本页查看 -->
      <template v-if="polishVisible">
        <el-form-item label="修改意见">
          <el-input
            v-model="note"
            type="textarea"
            :rows="3"
            placeholder="例如：结尾加一个反转；台词更口语化"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="对话模型">
          <ModelSelect
            v-model="chatModelId"
            :type="AiModelTypeEnum.CHAT"
            placeholder="默认对话模型"
            clearable
            class="!w-full"
          />
        </el-form-item>
      </template>
      <!-- 更多剧本信息：默认折叠 -->
      <el-collapse v-model="moreActive" class="mb-16px">
        <el-collapse-item name="more">
          <template #title>
            <span class="font-500">更多剧本信息</span>
            <span class="ml-12px text-12px text-[var(--el-text-color-secondary)]">
              世界观 · 原始素材
            </span>
          </template>
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
        </el-collapse-item>
      </el-collapse>
      <!-- 底部操作：左侧上一步，右侧打磨、保存、保存并分析 -->
      <div class="flex items-center justify-between gap-12px">
        <el-button :disabled="busy" @click="emit('next', AiDramaStepEnum.IDEA)">上一步</el-button>
        <div class="flex items-center">
          <el-button
            type="primary"
            plain
            :disabled="busy || !detail.script?.content"
            @click="polishVisible = !polishVisible"
          >
            {{ polishVisible ? '收起打磨' : '打磨剧本' }}
          </el-button>
          <el-button
            v-if="polishVisible"
            type="primary"
            plain
            :loading="polishing"
            :disabled="(busy && !polishing) || !note.trim()"
            @click="handlePolish"
          >
            按意见重写
          </el-button>
          <el-button :loading="saving" :disabled="busy && !saving" @click="handleSave">
            保存剧本
          </el-button>
          <el-button
            type="primary"
            :loading="analyzing"
            :disabled="(busy && !analyzing) || !formData.content.trim()"
            @click="handleAnalyze"
          >
            保存并分析资产
          </el-button>
        </div>
      </div>
    </el-form>
  </ContentWrap>

  <!-- 版本历史：生成、打磨都会新增版本，新的在前；点击只读查看 -->
  <el-drawer v-model="historyVisible" title="版本历史" size="360px">
    <el-timeline class="!pl-2px">
      <el-timeline-item
        v-for="item in versions"
        :key="item.id"
        :timestamp="formatDate(item.createTime)"
        :type="item.id === detail.script?.id ? 'primary' : undefined"
        placement="top"
      >
        <el-link :underline="false" class="!break-all" @click="openVersion(item)">
          {{ item.id === detail.script?.id ? '当前版本' : item.title || '剧本版本' }}
        </el-link>
        <div
          v-if="item.revisionNote"
          class="mt-4px break-all text-12px text-[var(--el-text-color-secondary)]"
        >
          打磨：{{ item.revisionNote }}
        </div>
      </el-timeline-item>
    </el-timeline>
  </el-drawer>

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

const formData = ref({
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
const historyVisible = ref(false) // 版本历史
const chatModelId = ref<number>()
const note = ref('')
const polishVisible = ref(false) // 是否展开打磨的修改意见
const moreActive = ref<string[]>([]) // 更多剧本信息：默认折叠
const contentMode = ref<'read' | 'edit'>(props.detail.script?.content ? 'read' : 'edit') // 正文：有正文时默认阅读
const saving = ref(false)
const polishing = ref(false)
const analyzing = ref(false)
const busy = computed(() => saving.value || polishing.value || analyzing.value) // 保存、打磨、分析互斥

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
    formData.value = {
      title: title || '',
      tone: tone || '',
      outline: outline || '',
      worldbuilding: worldbuilding || '',
      sourceMaterial: sourceMaterial || '',
      content: content || ''
    }
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

/** 打开剧本版本：只读查看正文与该版本的镜头 */
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
    ...formData.value
  })
}

/** 保存剧本 */
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

/** 打磨：先保存当前修改，再按意见重写为新版本；完成后收起修改意见，留在本页阅读新版本 */
const handlePolish = async () => {
  polishing.value = true
  try {
    await save()
    await DramaScriptApi.polishScript(props.detail.project.id, note.value.trim(), chatModelId.value)
    note.value = ''
    polishVisible.value = false
    contentMode.value = 'read'
    message.success('已生成新版本')
    emit('refresh')
  } finally {
    polishing.value = false
  }
}

/** 分析资产：先保存当前修改，再从剧本提取角色、场景、道具，完成后进入资产配置 */
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
