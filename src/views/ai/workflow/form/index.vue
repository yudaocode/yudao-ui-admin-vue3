<template>
  <ContentWrap>
    <div class="mx-auto">
      <!-- 头部导航栏 -->
      <div
        class="absolute top-0 left-0 right-0 h-50px bg-white border-bottom z-10 flex items-center px-20px"
      >
        <!-- 左侧标题 -->
        <div class="w-200px flex items-center overflow-hidden">
          <Icon icon="ep:arrow-left" class="cursor-pointer flex-shrink-0" @click="handleBack" />
          <span class="ml-10px text-16px truncate" :title="formData.name || '创建流程'">
            {{ formData.name || '创建流程' }}
          </span>
        </div>

        <!-- 步骤条 -->
        <div class="flex-1 flex items-center justify-center h-full">
          <div class="w-400px flex items-center justify-between h-full">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="flex items-center cursor-pointer mx-15px relative h-full"
              :class="[
                currentStep === index
                  ? 'text-[#3473ff] border-[#3473ff] border-b-2 border-b-solid'
                  : 'text-gray-500'
              ]"
              @click="handleStepClick(index)"
            >
              <div
                class="w-28px h-28px rounded-full flex items-center justify-center mr-8px border-2 border-solid text-15px"
                :class="[
                  currentStep === index
                    ? 'bg-[#3473ff] text-white border-[#3473ff]'
                    : 'border-gray-300 bg-white text-gray-500'
                ]"
              >
                {{ index + 1 }}
              </div>
              <span class="text-16px font-bold whitespace-nowrap">{{ step.title }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧按钮 -->
        <div class="w-200px flex items-center justify-end gap-2">
          <el-button type="primary" @click="handleSave"> 保 存 </el-button>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="mt-50px">
        <!-- 第一步：基本信息 -->
        <div v-if="currentStep === 0" class="mx-auto w-560px">
          <BasicInfo v-model="formData" ref="basicInfoRef" />
        </div>

        <!-- 第二步：工作流设计 -->
        <WorkflowDesign
          v-if="currentStep === 1"
          v-model="formData"
          :provider="llmProvider"
          ref="workflowDesignRef"
        />
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { useTagsViewStore } from '@/store/modules/tagsView'
import { CommonStatusEnum } from '@/utils/constants'
import * as WorkflowApi from '@/api/ai/workflow'
import BasicInfo from './BasicInfo.vue'
import WorkflowDesign from './WorkflowDesign.vue'
import { ModelApi } from '@/api/ai/model/model'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'

const router = useRouter()
const { delView } = useTagsViewStore()
const route = useRoute()
const message = useMessage()

const basicInfoRef = ref()
const workflowDesignRef = ref()

const validateBasic = async () => {
  await basicInfoRef.value?.validate()
}
const validateWorkflow = async () => {
  await workflowDesignRef.value?.validate()
}

const currentStep = ref(-1)
const steps = [
  { title: '基本信息', validator: validateBasic },
  { title: '工作流设计', validator: validateWorkflow }
]

const formData: any = ref({
  id: undefined,
  name: '',
  code: '',
  remark: '',
  graph: '',
  status: CommonStatusEnum.ENABLE
})
const llmProvider = ref<any>([])
const workflowData = ref<any>({})
provide('workflowData', workflowData)

/** 初始化数据 */
const actionType = route.params.type as string
const initData = async () => {
  // 编辑情况下，需要加载工作流配置
  if (actionType === 'update') {
    const workflowId = route.params.id as string
    formData.value = await WorkflowApi.getWorkflow(workflowId)
    workflowData.value = JSON.parse(formData.value.graph)
  }

  // 加载模型列表
  const models = await ModelApi.getModelSimpleList(AiModelTypeEnum.CHAT)
  llmProvider.value = {
    llm: () =>
      models.map(({ id, name }) => ({
        value: id,
        label: name
      })),
    knowledge: () => [],
    internal: () => []
  }
  // TODO @lesan：知识库（可以看下 knowledge）
  // TODO @lesan：搜索引擎（这个之前有个 pr 搞了，，，可能来接下）

  // 设置当前步骤
  currentStep.value = 0
}

/** 校验所有步骤数据是否完整 */
const validateAllSteps = async () => {
  try {
    // 基本信息校验
    try {
      await validateBasic()
    } catch (error) {
      currentStep.value = 0
      throw new Error('请完善基本信息')
    }

    // 工作流设计校验
    try {
      await validateWorkflow()
    } catch (error) {
      currentStep.value = 1
      throw new Error('请完善工作流信息')
    }
    return true
  } catch (error) {
    throw error
  }
}

/** 保存操作 */
const handleSave = async () => {
  try {
    // 保存前校验所有步骤的数据
    await validateAllSteps()

    // 更新表单数据
    const data = {
      ...formData.value,
      graph: JSON.stringify(workflowData.value)
    }
    if (actionType === 'update') {
      await WorkflowApi.updateWorkflow(data)
    } else {
      await WorkflowApi.createWorkflow(data)
    }

    // 保存成功，提示并跳转到列表页
    message.success('保存成功')
    delView(unref(router.currentRoute))
    await router.push({ name: 'AiWorkflow' })
  } catch (error: any) {
    console.error('保存失败:', error)
    message.warning(error.message || '请完善所有步骤的必填信息')
  }
}

/** 步骤切换处理 */
const handleStepClick = async (index: number) => {
  try {
    if (index !== 0) {
      await validateBasic()
    }
    if (index !== 1) {
      await validateWorkflow()
    }

    // 切换步骤
    currentStep.value = index
  } catch (error) {
    console.error('步骤切换失败:', error)
    message.warning('请先完善当前步骤必填信息')
  }
}

/** 返回列表页 */
const handleBack = () => {
  // 先删除当前页签
  delView(unref(router.currentRoute))
  // 跳转到列表页
  router.push({ name: 'AiWorkflow' })
}

/** 初始化 */
onMounted(async () => {
  await initData()
})
</script>

<!-- TODO @lesan：可以用 cursor 搞成 unocss 哈 -->
<style lang="scss" scoped>
.border-bottom {
  border-bottom: 1px solid #dcdfe6;
}

.text-primary {
  color: #3473ff;
}

.bg-primary {
  background-color: #3473ff;
}

.border-primary {
  border-color: #3473ff;
}
</style>
