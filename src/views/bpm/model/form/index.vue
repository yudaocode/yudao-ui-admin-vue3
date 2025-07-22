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
          <el-button v-if="actionType === 'update'" type="success" @click="handleDeploy">
            发 布
          </el-button>
          <el-button type="primary" @click="handleSave">
            <span v-if="actionType === 'definition'">恢 复</span>
            <span v-else>保 存</span>
          </el-button>
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
            :deptList="deptList"
            ref="basicInfoRef"
          />
        </div>

        <!-- 第二步：表单设计 -->
        <div v-if="currentStep === 1" class="mx-auto w-560px">
          <FormDesign v-model="formData" :formList="formList" ref="formDesignRef" />
        </div>

        <!-- 第三步：流程设计 -->
        <ProcessDesign v-if="currentStep === 2" v-model="formData" ref="processDesignRef" />

        <!-- 第四步：更多设置 -->
        <div v-show="currentStep === 3" class="mx-auto w-700px">
          <ExtraSettings
            ref="extraSettingsRef"   
            v-model="formData" 
            :model-form-id="formData.formId"/>
        </div>
      </div>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from '@/hooks/web/useMessage'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useUserStoreWithOut } from '@/store/modules/user'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import * as DefinitionApi from '@/api/bpm/definition'
import { BpmModelFormType, BpmModelType, BpmAutoApproveType } from '@/utils/constants'
import BasicInfo from './BasicInfo.vue'
import FormDesign from './FormDesign.vue'
import ProcessDesign from './ProcessDesign.vue'
import ExtraSettings from './ExtraSettings.vue'
import { useTagsView } from '@/hooks/web/useTagsView'

const router = useRouter()
const { delView } = useTagsViewStore() // 视图操作
const tagsView = useTagsView()
const route = useRoute()
const message = useMessage()
const userStore = useUserStoreWithOut()

// 组件引用
const basicInfoRef = ref()
const formDesignRef = ref()
const processDesignRef = ref()
const extraSettingsRef = ref()

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

const currentStep = ref(-1) // 步骤控制。-1 用于，一开始全部不展示等当前页面数据初始化完成

const steps = [
  { title: '基本信息', validator: validateBasic },
  { title: '表单设计', validator: validateForm },
  { title: '流程设计', validator: validateProcess },
  { title: '更多设置', validator: null }
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
  startUserIds: [],
  startDeptIds: [],
  managerUserIds: [],
  allowCancelRunningProcess: true,
  processIdRule: {
    enable: false,
    prefix: '',
    infix: '',
    postfix: '',
    length: 5
  },
  autoApprovalType: BpmAutoApproveType.NONE,
  titleSetting: {
    enable: false,
    title: ''
  },
  summarySetting: {
    enable: false,
    summary: []
  }
})

// 流程数据
const processData = ref<any>()

provide('processData', processData)
provide('modelData', formData)

// 数据列表
const formList = ref([])
const categoryList = ref<CategoryVO[]>([])
const userList = ref<UserApi.UserVO[]>([])
const deptList = ref<DeptApi.DeptVO[]>([])

/** 初始化数据 */
const actionType = route.params.type as string
const initData = async () => {
  if (actionType === 'definition') {
    // 情况一：流程定义场景（恢复）
    const definitionId = route.params.id as string
    const data = await DefinitionApi.getProcessDefinition(definitionId)
    // 将 definition => model，最终赋值
    data.type = data.modelType
    delete data.modelType
    data.id = data.modelId
    delete data.modelId
    if (data.simpleModel) {
      data.simpleModel = JSON.parse(data.simpleModel)
    }
    formData.value = data
    formData.value.startUserType =
      formData.value.startUserIds?.length > 0 ? 1 : formData.value?.startDeptIds?.length > 0 ? 2 : 0
  } else if (['update', 'copy'].includes(actionType)) {
    // 情况二：修改场景/复制场景
    const modelId = route.params.id as string
    formData.value = await ModelApi.getModel(modelId)
    formData.value.startUserType =
      formData.value.startUserIds?.length > 0 ? 1 : formData.value?.startDeptIds?.length > 0 ? 2 : 0

    // 特殊：复制场景
    if (route.params.type === 'copy') {
      delete formData.value.id
      if (formData.value.bpmnXml) {
        formData.value.bpmnXml = formData.value.bpmnXml.replaceAll(
          formData.value.name,
          formData.value.name + '副本'
        )
        formData.value.bpmnXml = formData.value.bpmnXml.replaceAll(
          formData.value.key,
          formData.value.key + '_copy'
        )
      }
      formData.value.name += '副本'
      formData.value.key += '_copy'
      tagsView.setTitle('复制流程')
    }
  } else {
    // 情况三：新增场景
    formData.value.startUserType = 0 // 全体
    formData.value.managerUserIds.push(userStore.getUser.id)
  }

  // 获取表单列表
  formList.value = await FormApi.getFormSimpleList()
  // 获取分类列表
  categoryList.value = await CategoryApi.getCategorySimpleList()
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 获取部门列表
  deptList.value = await DeptApi.getSimpleDeptList()

  // 最终，设置 currentStep 切换到第一步
  currentStep.value = 0

  // 兼容，以前未配置更多设置的流程
  extraSettingsRef.value.initData()
}

/** 根据类型切换流程数据 */
watch(
  async () => formData.value.type,
  () => {
    if (formData.value.type === BpmModelType.BPMN) {
      processData.value = formData.value.bpmnXml
    } else if (formData.value.type === BpmModelType.SIMPLE) {
      processData.value = formData.value.simpleModel
    }
    console.log('加载流程数据', processData.value)
  },
  {
    immediate: true
  }
)

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

    // 表单设计校验
    try {
      await validateForm()
    } catch (error) {
      currentStep.value = 1
      throw new Error('请完善自定义表单信息')
    }

    // 流程设计校验

    // 表单设计校验
    try {
      await validateProcess()
    } catch (error) {
      currentStep.value = 2
      throw new Error('请设计流程')
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

    if (actionType === 'definition') {
      // 情况一：流程定义场景（恢复）
      await ModelApi.updateModel(modelData)
      // 提示成功
      message.success('恢复成功，可点击【发布】按钮，进行发布模型')
    } else if (actionType === 'update') {
      // 修改场景
      await ModelApi.updateModel(modelData)
      // 提示成功
      message.success('修改成功，可点击【发布】按钮，进行发布模型')
    } else if (actionType === 'copy') {
      // 情况三：复制场景
      formData.value.id = await ModelApi.createModel(modelData)
      // 提示成功
      message.success('复制成功，可点击【发布】按钮，进行发布模型')
    } else {
      // 情况四：新增场景
      formData.value.id = await ModelApi.createModel(modelData)
      // 提示成功
      message.success('新建成功，可点击【发布】按钮，进行发布模型')
    }

    // 返回列表页（排除更新的情况）
    if (actionType !== 'update') {
      await router.push({ name: 'BpmModel' })
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
    if (index !== 0) {
      await validateBasic()
    }
    if (index !== 1) {
      await validateForm()
    }
    if (index !== 2) {
      await validateProcess()
    }

    // 切换步骤
    currentStep.value = index

    // 如果切换到流程设计步骤，等待组件渲染完成后刷新设计器
    if (index === 2) {
      await nextTick()
      // 等待更长时间确保组件完全初始化
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (processDesignRef.value?.refresh) {
        await processDesignRef.value.refresh()
      }
    }
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
