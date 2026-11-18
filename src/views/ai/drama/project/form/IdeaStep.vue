<!-- AI 短剧：第 1 步，故事想法；没有项目时为新建。一套表单：名称、想法在前，模型与扩展设置收进默认折叠的高级设置，底部右侧保存想法、生成剧本 -->
<template>
  <!-- 新建：首次生成中，主区显示进度与实时正文；成功后进入剧本审阅，失败时回到表单，保留输入 -->
  <ContentWrap v-if="creating && createJob">
    <div class="mb-8px flex items-center gap-8px">
      <span class="text-15px font-500">正在生成剧本</span>
      <el-tag size="small">生成中</el-tag>
    </div>
    <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
      已用时 {{ formatSeconds(createElapsed) }} · 已接收 {{ createContent.length }} 字<template
        v-if="createJob.lastTime"
      >
        · 最近输出 {{ createIdle }} 秒前</template
      >
      · 模型正在撰写正文，完成后创建项目并打开剧本审阅
    </div>
    <el-alert
      v-if="createIdle >= 30 || (!createJob.lastTime && createElapsed >= 30)"
      type="info"
      :closable="false"
      show-icon
      title="仍在等待模型输出"
      class="mb-8px"
    />
    <div class="text-13px leading-22px">
      <div v-if="createTitle"><span class="font-500">剧名：</span>{{ createTitle }}</div>
      <div v-if="createTone"><span class="font-500">叙事基调：</span>{{ createTone }}</div>
      <div v-if="createOutline" class="whitespace-pre-wrap break-all">
        <span class="font-500">剧情大纲：</span>{{ createOutline }}
      </div>
      <el-divider v-if="createContent" content-position="left">剧本正文 · 实时追加</el-divider>
      <div class="max-h-560px overflow-auto whitespace-pre-wrap break-all">
        {{ createContent || (createTitle ? '' : '正在生成剧名、叙事基调与大纲…') }}
      </div>
    </div>
  </ContentWrap>

  <ContentWrap v-else>
    <!-- 新建：生成失败；连接中断时结果不确定，不断言项目未创建 -->
    <el-alert
      v-if="!project && createJob?.status === 'fail'"
      type="error"
      :closable="false"
      show-icon
      :title="createJob.interrupted ? '连接已中断' : `生成失败：${createJob.error}`"
      :description="
        createJob.interrupted ? createJob.error : '没有创建项目，已保留填写的内容，可修改后重新生成'
      "
      class="mb-16px"
    />
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="项目名称" prop="name">
        <el-input
          v-model="formData.name"
          maxlength="64"
          show-word-limit
          :placeholder="project ? '' : '生成时选填，留空使用生成的剧名；保存想法时必填'"
        />
      </el-form-item>
      <el-form-item label="故事想法" prop="idea">
        <el-input
          v-model="formData.idea"
          type="textarea"
          :rows="10"
          placeholder="一句话或一段话描述故事：人物、冲突、结局"
          maxlength="5000"
          show-word-limit
        />
      </el-form-item>
      <!-- 高级设置：默认折叠，标题显示当前取值 -->
      <el-collapse v-model="advancedActive" class="mb-16px">
        <el-collapse-item name="advanced">
          <template #title>
            <span class="font-500">高级设置</span>
            <span class="ml-12px truncate text-12px text-[var(--el-text-color-secondary)]">
              {{ advancedSummary }}
            </span>
          </template>
          <el-form-item label="对话模型">
            <ModelSelect
              v-model="chatModelId"
              :type="AiModelTypeEnum.CHAT"
              placeholder="默认对话模型"
              clearable
              class="!w-full"
            />
          </el-form-item>
          <el-form-item label="项目简介" prop="description">
            <el-input v-model="formData.description" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="画风" prop="style">
            <el-radio-group v-model="formData.style">
              <el-radio-button
                v-for="dict in styleOptions"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="画幅" prop="composeAspectRatio">
            <el-radio-group v-model="formData.composeAspectRatio">
              <el-radio-button v-for="item in DRAMA_ASPECT_RATIOS" :key="item" :value="item">
                {{ item }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="美学技能" prop="aestheticSkillId">
            <el-select
              v-model="formData.aestheticSkillId"
              placeholder="不使用"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in skillList"
                :key="item.id"
                :label="item.name"
                :value="item.id!"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="导演技能" prop="directorSkillId">
            <el-select
              v-model="formData.directorSkillId"
              placeholder="不使用"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in skillList"
                :key="item.id"
                :label="item.name"
                :value="item.id!"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分镜技能" prop="storyboardSkillIds">
            <el-select
              v-model="formData.storyboardSkillIds"
              placeholder="不使用；按选择的顺序生效"
              multiple
              class="!w-full"
            >
              <el-option
                v-for="item in skillList"
                :key="item.id"
                :label="item.name"
                :value="item.id!"
              />
            </el-select>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
      <div class="flex items-center justify-end gap-12px">
        <span class="text-12px text-[var(--el-text-color-secondary)]">
          {{
            !project
              ? '生成成功后保存项目和剧本'
              : detail?.script?.content
                ? '重新生成会新增剧本版本，先保存这里的修改'
                : '先保存这里的修改，再生成剧本'
          }}
        </span>
        <!-- 保存、生成互斥：新建时两者都会创建项目，避免重复创建 -->
        <el-button :loading="saving" :disabled="generating || creating" @click="handleSave">
          保存想法
        </el-button>
        <el-button
          type="primary"
          :loading="generating || creating"
          :disabled="saving"
          @click="handleGenerate"
        >
          {{ !project ? '生成草稿剧本' : detail?.script?.content ? '重新生成剧本' : '生成剧本' }}
        </el-button>
      </div>
    </el-form>
  </ContentWrap>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { DramaProjectApi, DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { SkillApi, SkillVO } from '@/api/ai/skill'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { AiDramaStepEnum, AiDramaStyleEnum, AiModelTypeEnum } from '@/views/ai/utils/constants'
import { DRAMA_ASPECT_RATIOS } from '@/views/ai/utils/drama'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'
import { readJsonField, useScriptCreate } from './useScriptCreate'

/** AI 短剧：故事想法 */
defineOptions({ name: 'AiDramaIdeaStep' })

const props = defineProps<{ detail?: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: []; next: [step: number]; created: [id: number] }>()
const message = useMessage() // 消息弹窗

const formRef = ref() // 表单 Ref
const project = props.detail?.project
const formData = ref({
  name: project?.name || '',
  description: project?.description,
  idea: project?.idea,
  style: project?.style ?? AiDramaStyleEnum.SCRIPT_TONE,
  aestheticSkillId: project?.aestheticSkillId,
  directorSkillId: project?.directorSkillId,
  storyboardSkillIds: project?.storyboardSkillIds || [],
  composeAspectRatio: project?.composeAspectRatio || '9:16'
})
const formRules = reactive({
  // 新建：生成草稿剧本时名称选填，保存想法时必填（见 save）
  name: [{ required: !!project, message: '项目名称不能为空', trigger: 'blur' }],
  idea: [{ required: true, message: '故事想法不能为空', trigger: 'blur' }]
})
// 新建：回到新建页时，恢复生成中、生成失败的表单
const {
  job: createJob,
  running: createRunning,
  start: startCreate,
  clear: clearCreate,
  watchJob
} = useScriptCreate()
// 首创生成中：只影响新建页；已有项目只看自身的生成状态，不因其它首创禁用保存、显示加载
const creating = computed(() => !project && createRunning.value)
const skillList = ref<SkillVO[]>([]) // 启用的技能
const chatModelList = ref<ModelVO[]>([]) // 对话模型：高级设置的标题显示所选模型的名称
const chatModelId = ref<number>()
if (!project && createJob.value) {
  const { modelId, ...form } = createJob.value.form
  Object.assign(formData.value, form)
  chatModelId.value = modelId
}
const saving = ref(false)
const generating = ref(false)

/** 高级设置：默认折叠，标题显示当前取值 */
const advancedActive = ref<string[]>([])
const styleOptions = computed(() => getIntDictOptions(DICT_TYPE.AI_DRAMA_STYLE))
const advancedSummary = computed(() => {
  const model = chatModelList.value.find((item) => item.id === chatModelId.value)
  const style = styleOptions.value.find((item) => item.value === formData.value.style)
  const skillCount =
    (formData.value.aestheticSkillId ? 1 : 0) +
    (formData.value.directorSkillId ? 1 : 0) +
    (formData.value.storyboardSkillIds?.length || 0)
  return [
    model?.name || '默认对话模型',
    style?.label,
    formData.value.composeAspectRatio,
    skillCount ? `技能：${skillCount} 个` : '技能：不使用'
  ]
    .filter(Boolean)
    .join(' · ')
})

let createdId: number | undefined // 新建页已创建的项目编号：进入该项目前再次保存时，修改它，不再重复创建

/** 保存：没有项目时新建，返回项目编号 */
const save = async (): Promise<number> => {
  await formRef.value.validate()
  if (!formData.value.name?.trim()) {
    message.warning('项目名称不能为空')
    throw new Error('项目名称不能为空')
  }
  const id = project?.id ?? createdId
  if (id) {
    await DramaProjectApi.updateProjectMy({ id, ...formData.value })
    return id
  }
  createdId = await DramaProjectApi.createProject(formData.value)
  return createdId!
}

/** 保存想法：只保存项目与想法，不调用模型；已有项目不改动剧本 */
const handleSave = async () => {
  saving.value = true
  try {
    const id = await save()
    if (project) {
      message.success('保存成功')
      emit('refresh')
    } else {
      message.success('创建成功')
      emit('created', id)
    }
  } finally {
    saving.value = false
  }
}

/** 新建：生成状态 */
const now = ref(Date.now())
const createText = computed(() => createJob.value?.text || '')
const createContent = computed(() => readJsonField(createText.value, 'content') || '')
const createTitle = computed(() => readJsonField(createText.value, 'title'))
const createTone = computed(() => readJsonField(createText.value, 'tone'))
const createOutline = computed(() => readJsonField(createText.value, 'outline'))
const createElapsed = computed(() =>
  createJob.value ? Math.max(0, Math.floor((now.value - createJob.value.startTime) / 1000)) : 0
)
const createIdle = computed(() =>
  createJob.value?.lastTime
    ? Math.max(0, Math.floor((now.value - createJob.value.lastTime) / 1000))
    : 0
)
/** 秒数显示为「1 分 12 秒」 */
const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes} 分 ${seconds % 60} 秒` : `${seconds} 秒`
}
let clock: ReturnType<typeof setInterval> | undefined
if (!project) {
  watchJob()
  onMounted(() => (clock = setInterval(() => (now.value = Date.now()), 1000)))
  onBeforeUnmount(() => clock && clearInterval(clock))
  // 生成成功：进入新项目的剧本审阅；离开新建页时只提示，不跳转（见 useScriptCreate）
  watch(
    () => createJob.value?.status,
    (status) => {
      const id = createJob.value?.projectId
      if (status === 'success' && id) {
        clearCreate()
        message.success('初版剧本已生成')
        emit('created', id)
      }
    }
  )
}

/** 新建：流式生成初版剧本，成功后才创建项目；项目名称选填 */
const handleCreate = async () => {
  await formRef.value.validateField('idea')
  startCreate({ ...formData.value, idea: formData.value.idea!, modelId: chatModelId.value })
}

/** 生成剧本：已有项目先保存想法，再同步调用对话模型新增剧本版本，可能需要数十秒 */
const handleGenerate = async () => {
  if (!project) {
    await handleCreate()
    return
  }
  if (props.detail?.script?.content) {
    try {
      await message.confirm('重新生成会新增剧本版本并作为当前剧本，是否继续？')
    } catch {
      return
    }
  }
  generating.value = true
  try {
    const id = await save()
    await DramaScriptApi.generateScript(id, chatModelId.value)
    message.success('剧本已生成')
    emit('next', AiDramaStepEnum.SCRIPT)
  } catch {
    // 错误已由请求统一提示
  } finally {
    generating.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  const [skills, models] = await Promise.all([
    SkillApi.getSkillSimpleList(),
    ModelApi.getModelSimpleList(AiModelTypeEnum.CHAT)
  ])
  skillList.value = skills
  chatModelList.value = models
})
</script>
