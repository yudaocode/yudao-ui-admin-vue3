<!-- AI 短剧：第 1 步，故事想法；没有项目时为新建。左侧填写想法，右侧生成剧本，与剧本审阅的布局一致 -->
<template>
  <div class="flex gap-16px">
    <ContentWrap class="min-w-0 flex-1">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="项目简介" prop="description">
          <el-input v-model="formData.description" maxlength="500" show-word-limit />
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
        <el-form-item label="画风" prop="style">
          <el-radio-group v-model="formData.style">
            <el-radio-button
              v-for="dict in getIntDictOptions(DICT_TYPE.AI_DRAMA_STYLE)"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
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
        <el-form-item label="画幅" prop="composeAspectRatio">
          <el-radio-group v-model="formData.composeAspectRatio">
            <el-radio-button v-for="item in DRAMA_ASPECT_RATIOS" :key="item" :value="item">
              {{ item }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <div class="w-full flex justify-end">
            <!-- 保存、生成剧本互斥：新建时两者都会创建项目，避免重复创建 -->
            <el-button type="primary" :loading="saving" :disabled="generating" @click="handleSave">
              保存
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <div class="w-340px flex-shrink-0">
      <ContentWrap>
        <div class="mb-8px font-500">生成剧本</div>
        <div class="mb-8px text-12px text-[var(--el-text-color-secondary)]">
          按故事想法、画风生成剧名、叙事基调、剧情大纲与剧本正文；会先保存左侧的修改
        </div>
        <div class="mb-8px">
          <ModelSelect
            v-model="chatModelId"
            :type="AiModelTypeEnum.CHAT"
            placeholder="默认对话模型"
            clearable
            class="!w-full"
          />
        </div>
        <el-button
          type="primary"
          class="w-full"
          :loading="generating"
          :disabled="saving"
          @click="handleGenerate"
        >
          {{ detail?.script?.content ? '重新生成剧本' : '生成剧本' }}
        </el-button>
        <el-button
          v-if="detail?.script?.content"
          class="!ml-0 mt-8px w-full"
          @click="emit('next', AiDramaStepEnum.SCRIPT)"
        >
          查看剧本，进入剧本审阅
        </el-button>
      </ContentWrap>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { DramaProjectApi, DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { SkillApi, SkillVO } from '@/api/ai/skill'
import { AiDramaStepEnum, AiDramaStyleEnum, AiModelTypeEnum } from '@/views/ai/utils/constants'
import { DRAMA_ASPECT_RATIOS } from '@/views/ai/utils/drama'
import ModelSelect from '@/views/ai/model/model/components/ModelSelect.vue'

/** AI 短剧：故事想法 */
defineOptions({ name: 'AiDramaIdeaStep' })

const props = defineProps<{ detail?: DramaProjectDetailVO }>()
const emit = defineEmits<{ refresh: []; next: [step: number]; created: [id: number] }>()
const message = useMessage() // 消息弹窗

const formRef = ref()
const project = props.detail?.project
const formData = reactive({
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
  name: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
  idea: [{ required: true, message: '故事想法不能为空', trigger: 'blur' }]
})
const skillList = ref<SkillVO[]>([]) // 启用的技能
const chatModelId = ref<number>()
const saving = ref(false)
const generating = ref(false)

let createdId: number | undefined // 新建页已创建的项目编号：进入该项目前再次保存时，修改它，不再重复创建

/** 保存：没有项目时新建，返回项目编号 */
const save = async (): Promise<number> => {
  await formRef.value.validate()
  const id = project?.id ?? createdId
  if (id) {
    await DramaProjectApi.updateProjectMy({ id, ...formData })
    return id
  }
  createdId = await DramaProjectApi.createProject(formData)
  return createdId!
}

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

/** 生成剧本：先保存想法；同步调用对话模型，可能需要数十秒 */
const handleGenerate = async () => {
  if (props.detail?.script?.content) {
    try {
      await message.confirm('重新生成会覆盖当前剧本，是否继续？')
    } catch {
      return
    }
  }
  generating.value = true
  let id: number | undefined
  try {
    id = await save()
    await DramaScriptApi.generateScript(id, chatModelId.value)
    message.success('剧本已生成')
    if (project) {
      emit('next', AiDramaStepEnum.SCRIPT)
    } else {
      emit('created', id)
    }
  } catch {
    // 新建时项目已创建、剧本生成失败：进入该项目，避免再次点击时重复创建
    if (!project && id) {
      emit('created', id)
    }
  } finally {
    generating.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  skillList.value = await SkillApi.getSkillSimpleList()
})
</script>
