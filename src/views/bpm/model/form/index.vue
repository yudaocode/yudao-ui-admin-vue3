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
          <el-button v-if="route.params.id" type="success" @click="handleDeploy">发 布</el-button>
          <el-button type="primary" @click="handleSave">保 存</el-button>
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
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from '@/hooks/web/useMessage'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { CategoryApi } from '@/api/bpm/category'
import * as UserApi from '@/api/system/user'
import { useUserStoreWithOut } from '@/store/modules/user'
import { BpmModelFormType, BpmModelType } from '@/utils/constants'
import BasicInfo from './BasicInfo.vue'
import FormDesign from './FormDesign.vue'
import ProcessDesign from './ProcessDesign.vue'
import { useTagsViewStore } from '@/store/modules/tagsView'

const router = useRouter()
const { delView } = useTagsViewStore() // 视图操作
const route = useRoute()
const message = useMessage()
const userStore = useUserStoreWithOut()

// 组件引用
const basicInfoRef = ref()
const formDesignRef = ref()
const processDesignRef = ref()

/** 步骤校验函数 */
const validateBasic = async () => {
  await basicInfoRef.value?.validate()
}

/** 表单设计校验 */
const validateForm = async () => {
  await formDesignRef.value?.validate()
}

/** 流程设计校验 */
const validateProcess = async () => {
  await processDesignRef.value?.validate()
}

const currentStep = ref(0) // 步骤控制
const steps = [
  { title: '基本信息', validator: validateBasic },
  { title: '表单设计', validator: validateForm },
  { title: '流程设计', validator: validateProcess }
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

/** 校验所有步骤数据是否完整 */
const validateAllSteps = async () => {
  try {
    // 基本信息校验
    await basicInfoRef.value?.validate()
    if (!formData.value.key || !formData.value.name || !formData.value.category) {
      currentStep.value = 0
      throw new Error('请完善基本信息')
    }

    // 表单设计校验
    await formDesignRef.value?.validate()
    if (formData.value.formType === 10 && !formData.value.formId) {
      currentStep.value = 1
      throw new Error('请选择流程表单')
    }
    if (
      formData.value.formType === 20 &&
      (!formData.value.formCustomCreatePath || !formData.value.formCustomViewPath)
    ) {
      currentStep.value = 1
      throw new Error('请完善自定义表单信息')
    }

    // 流程设计校验
    // 如果已经有流程数据，则不需要重新校验
    if (!formData.value.bpmnXml && !formData.value.simpleModel) {
      // 如果当前不在第三步，需要先保存当前步骤数据
      if (currentStep.value !== 2) {
        await steps[currentStep.value].validator()
        // 切换到第三步
        currentStep.value = 2
        // 等待组件渲染完成
        await nextTick()
      }

      // 校验流程设计
      await processDesignRef.value?.validate()
      const processData = await processDesignRef.value?.getProcessData()
      if (!processData) {
        throw new Error('请设计流程')
      }

      // 保存流程数据
      if (formData.value.type === BpmModelType.BPMN) {
        formData.value.bpmnXml = processData
        formData.value.simpleModel = null
      } else {
        formData.value.bpmnXml = null
        formData.value.simpleModel = processData
      }
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
    const modelData = {
      ...formData.value
    }

    // 如果当前在第三步，获取最新的流程设计数据
    if (currentStep.value === 2) {
      const processData = await processDesignRef.value?.getProcessData()
      if (processData) {
        if (formData.value.type === BpmModelType.BPMN) {
          modelData.bpmnXml = processData
          modelData.simpleModel = null
        } else {
          modelData.bpmnXml = null
          modelData.simpleModel = processData
        }
      }
    }

    if (formData.value.id) {
      // 修改场景
      await ModelApi.updateModel(modelData)
      // 询问是否发布流程
      try {
        await message.confirm('修改流程成功，是否发布流程？')
        // 用户点击确认，执行发布
        await handleDeploy()
      } catch {
        // 用户点击取消，停留在当前页面
      }
    } else {
      // 新增场景
      formData.value.id = await ModelApi.createModel(modelData)
      message.success('新增成功')
      try {
        await message.confirm('创建流程成功，是否继续编辑？')
        // 用户点击继续编辑，跳转到编辑页面
        await nextTick()
        // 先删除当前页签
        delView(unref(router.currentRoute))
        // 跳转到编辑页面
        await router.push({
          name: 'BpmModelUpdate',
          params: { id: formData.value.id }
        })
      } catch {
        // 先删除当前页签
        delView(unref(router.currentRoute))
        // 用户点击返回列表
        await router.push({ name: 'BpmModel' })
      }
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    message.warning(error.message || '请完善所有步骤的必填信息')
  }
}

/** 发布操作 */
const handleDeploy = async () => {
  try {
    // 修改场景下直接发布，新增场景下需要先确认
    if (!formData.value.id) {
      await message.confirm('是否确认发布该流程？')
    }

    // 校验所有步骤
    await validateAllSteps()

    // 更新表单数据
    const modelData = {
      ...formData.value
    }

    // 如果当前在第三步，获取最新的流程设计数据
    if (currentStep.value === 2) {
      const processData = await processDesignRef.value?.getProcessData()
      if (processData) {
        if (formData.value.type === BpmModelType.BPMN) {
          modelData.bpmnXml = processData
          modelData.simpleModel = null
        } else {
          modelData.bpmnXml = null
          modelData.simpleModel = processData
        }
      }
    }

    // 先保存所有数据
    if (formData.value.id) {
      await ModelApi.updateModel(modelData)
    } else {
      const result = await ModelApi.createModel(modelData)
      formData.value.id = result.id
    }

    // 发布
    await ModelApi.deployModel(formData.value.id)
    message.success('发布成功')
    // 返回列表页
    await router.push({ name: 'BpmModel' })
  } catch (error: any) {
    console.error('发布失败:', error)
    message.warning(error.message || '发布失败')
  }
}

/** 步骤切换处理 */
const handleStepClick = async (index: number) => {
  try {
    // 如果是切换到第三步（流程设计），需要校验key和name
    if (index === 2) {
      if (!formData.value.key || !formData.value.name) {
        message.warning('请先填写流程标识和流程名称')
        return
      }
    }

    // 保存当前步骤的数据
    if (currentStep.value === 2) {
      const processData = await processDesignRef.value?.getProcessData()
      if (processData) {
        if (formData.value.type === BpmModelType.BPMN) {
          formData.value.bpmnXml = processData
          formData.value.simpleModel = null
        } else {
          formData.value.bpmnXml = null
          formData.value.simpleModel = processData
        }
      }
    } else {
      // 只有在向后切换时才进行校验
      if (index > currentStep.value) {
        if (typeof steps[currentStep.value].validator === 'function') {
          await steps[currentStep.value].validator()
        }
      }
    }

    // 切换步骤
    currentStep.value = index

    // 如果切换到流程设计步骤，等待组件渲染完成后刷新设计器
    if (index === 2) {
      await nextTick()
      // 等待更长时间确保组件完全初始化
      await new Promise(resolve => setTimeout(resolve, 200))
      if (processDesignRef.value?.refresh) {
        await processDesignRef.value.refresh()
      }
    }
  } catch (error) {
    console.error('步骤切换失败:', error)
    message.warning('请先完善当前步骤必填信息')
  }
}

/** 处理设计器保存成功 */
const handleDesignSuccess = (bpmnXml?: string) => {
  if (bpmnXml) {
    formData.value.bpmnXml = bpmnXml
  }
}

/** 返回列表页 */
const handleBack = () => {
  // 先删除当前页签
  delView(unref(router.currentRoute))
  // 跳转到列表页
  router.push({ name: 'BpmModel' })
}

/** 初始化 */
onMounted(async () => {
  await initData()
})

// 添加组件卸载前的清理代码
onBeforeUnmount(() => {
  // 清理所有的引用
  basicInfoRef.value = null
  formDesignRef.value = null
  processDesignRef.value = null
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
