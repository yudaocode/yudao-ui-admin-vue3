<template>
  <ContentWrap>
    <div class="mx-auto">
      <!-- 头部导航栏 -->
      <div
        class="absolute top-0 left-0 right-0 h-50px bg-white border-bottom z-10 flex items-center px-20px"
      >
        <!-- 左侧标题 -->
        <div class="w-200px flex items-center overflow-hidden">
          <Icon icon="ep:arrow-left" class="cursor-pointer flex-shrink-0" @click="router.back()" />
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
          <el-button @click="handleSave">保 存</el-button>
          <el-button type="primary" @click="handleDeploy">发 布</el-button>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="mt-50px">
        <!-- 第一步：基本信息 -->
        <div v-if="currentStep === 0" class="mx-auto w-560px">
          <BasicInfo
            v-model="formData"
            :categoryList="categoryList"
            :userList="userList"
            ref="basicInfoRef"
          />
        </div>

        <!-- 第二步：表单设计 -->
        <div v-if="currentStep === 1" class="mx-auto w-560px">
          <FormDesign v-model="formData" :formList="formList" ref="formDesignRef" />
        </div>

        <!-- 第三步：流程设计 -->
        <ProcessDesign
          v-if="currentStep === 2"
          v-model="formData"
          ref="processDesignRef"
          @success="handleDesignSuccess"
        />
      </div>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from '@/hooks/web/useMessage'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { CategoryApi } from '@/api/bpm/category'
import * as UserApi from '@/api/system/user'
import { useUserStoreWithOut } from '@/store/modules/user'
import { BpmModelType, BpmModelFormType } from '@/utils/constants'
import BasicInfo from './BasicInfo.vue'
import FormDesign from './FormDesign.vue'
import ProcessDesign from './ProcessDesign.vue'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStoreWithOut()

// 组件引用
const basicInfoRef = ref()
const formDesignRef = ref()
const processDesignRef = ref()

/** 步骤校验函数 */
const validateStep1 = async () => {
  await basicInfoRef.value?.validate()
}

const validateStep2 = async () => {
  await formDesignRef.value?.validate()
}

const validateStep3 = async () => {
  await processDesignRef.value?.validate()
}

// 步骤控制
const currentStep = ref(0)
const steps = [
  { title: '基本信息', validator: validateStep1 },
  { title: '表单设计', validator: validateStep2 },
  { title: '流程设计', validator: validateStep3 }
]

// 表单数据
const formData: any = ref({
  id: undefined,
  name: '',
  key: '',
  category: undefined,
  icon: undefined,
  description: '',
  type: BpmModelType.BPMN,
  formType: BpmModelFormType.NORMAL,
  formId: '',
  formCustomCreatePath: '',
  formCustomViewPath: '',
  visible: true,
  startUserType: undefined,
  managerUserType: undefined,
  startUserIds: [],
  managerUserIds: []
})

// 数据列表
const formList = ref([])
const categoryList = ref([])
const userList = ref<UserApi.UserVO[]>([])

/** 初始化数据 */
const initData = async () => {
  const modelId = route.params.id as string
  if (modelId) {
    // 修改场景
    formData.value = await ModelApi.getModel(modelId)
  } else {
    // 新增场景
    formData.value.managerUserIds.push(userStore.getUser.id)
  }

  // 获取表单列表
  formList.value = await FormApi.getFormSimpleList()
  // 获取分类列表
  categoryList.value = await CategoryApi.getCategorySimpleList()
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
}

/** 保存操作 */
const handleSave = async () => {
  try {
    // 保存前确保所有步骤的数据都已经验证通过
    for (const step of steps) {
      if (step.validator) {
        await step.validator()
      }
    }

    // 如果是在第三步，需要先获取最新的流程设计数据
    if (currentStep.value === 2) {
      await nextTick()
      const bpmnXml = processDesignRef.value?.getXmlString()
      // 确保有XML数据
      if (!bpmnXml) {
        throw new Error('请设计流程')
      }
      formData.value.bpmnXml = bpmnXml
    }

    if (formData.value.id) {
      await ModelApi.updateModel(formData.value)
      message.success('修改成功')
    } else {
      const result = await ModelApi.createModel(formData.value)
      formData.value.id = result.id
      message.success('新增成功')
    }
  } catch (error) {
    console.error('保存失败:', error)
    message.error(error.message || '保存失败')
    throw error
  }
}

/** 发布操作 */
const handleDeploy = async () => {
  try {
    await message.confirm('是否确认发布该流程？')
    // 先保存所有数据
    await handleSave()
    // 发布
    await ModelApi.deployModel(formData.value.id)
    message.success('发布成功')
    router.push({ name: 'BpmModel' })
  } catch (error) {
    console.error('发布失败:', error)
    if (error instanceof Error) {
      // 校验失败时,跳转到对应步骤
      const failedStep = steps.findIndex((step) => {
        try {
          step.validator && step.validator()
          return false
        } catch {
          return true
        }
      })
      if (failedStep !== -1) {
        currentStep.value = failedStep
        message.warning('请完善必填信息')
      } else {
        message.error(error.message || '发布失败')
      }
    }
  }
}

/** 步骤切换处理 */
const handleStepClick = async (index: number) => {
  // 如果是切换到第三步（流程设计），需要校验key和name
  if (index === 2) {
    if (!formData.value.key || !formData.value.name) {
      message.warning('请先填写流程标识和流程名称')
      return
    }
  }
  
  // 只有在向后切换时才进行校验
  if (index > currentStep.value) {
    try {
      if (typeof steps[currentStep.value].validator === 'function') {
        await steps[currentStep.value].validator()
      }
      currentStep.value = index
    } catch (error) {
      message.warning('请先完善当前步骤必填信息')
    }
  } else {
    // 向前切换时直接切换
    currentStep.value = index
  }
}

/** 处理设计器保存成功 */
const handleDesignSuccess = (bpmnXml?: string) => {
  if (bpmnXml) {
    formData.value.bpmnXml = bpmnXml
  }
}

/** 初始化 */
onMounted(async () => {
  await initData()
})
</script>

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
