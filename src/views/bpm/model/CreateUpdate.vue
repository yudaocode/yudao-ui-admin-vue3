<template>
  <!-- 头部导航栏 -->
  <div
    class="absolute top-0 left-0 right-0 h-50px bg-white border-bottom z-10 flex items-center px-20px"
  >
    <!-- 左侧标题，固定宽度 -->
    <div class="w-200px flex items-center overflow-hidden">
      <Icon icon="ep:arrow-left" class="cursor-pointer flex-shrink-0" @click="router.back()" />
      <span class="ml-10px text-16px truncate" :title="formData.name || '创建流程'">
        {{ formData.name || '创建流程' }}
      </span>
    </div>

    <!-- 步骤条，固定在中间 -->
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

    <!-- 右侧按钮，固定宽度 -->
    <div class="w-200px flex items-center justify-end gap-2">
      <el-button @click="handleSave">保 存</el-button>
      <el-button type="primary" @click="handleDeploy">发 布</el-button>
    </div>
  </div>

  <!-- 主体内容 -->
  <ContentWrap class="mt-50px">
    <!-- 第一步：基本信息 -->
    <div v-show="currentStep === 0">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="mt-20px"
        :class="{ 'w-600px': currentStep === 0 }"
      >
        <el-form-item label="流程标识" prop="key" class="mb-20px">
          <el-input v-model="formData.key" :disabled="!!formData.id" placeholder="请输入流标标识" />
          <el-tooltip
            v-if="!formData.id"
            class="item"
            content="新建后，流程标识不可修改！"
            effect="light"
            placement="top"
          >
            <Icon icon="ep:question" class="ml-5px" />
          </el-tooltip>
          <el-tooltip
            v-else
            class="item"
            content="流程标识不可修改！"
            effect="light"
            placement="top"
          >
            <Icon icon="ep:question" class="ml-5px" />
          </el-tooltip>
        </el-form-item>
        <el-form-item label="流程名称" prop="name" class="mb-20px">
          <el-input
            v-model="formData.name"
            :disabled="!!formData.id"
            clearable
            placeholder="请输入流程名称"
          />
        </el-form-item>
        <el-form-item label="流程分类" prop="category" class="mb-20px">
          <el-select
            v-model="formData.category"
            clearable
            placeholder="请选择流程分类"
            style="width: 100%"
          >
            <el-option
              v-for="category in categoryList"
              :key="category.code"
              :label="category.name"
              :value="category.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="流程图标" prop="icon" class="mb-20px">
          <UploadImg v-model="formData.icon" :limit="1" height="64px" width="64px" />
        </el-form-item>
        <el-form-item label="流程描述" prop="description" class="mb-20px">
          <el-input v-model="formData.description" clearable type="textarea" />
        </el-form-item>
        <el-form-item label="流程类型" prop="type" class="mb-20px">
          <el-radio-group v-model="formData.type">
            <el-radio
              v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_TYPE)"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否可见" prop="visible" class="mb-20px">
          <el-radio-group v-model="formData.visible">
            <el-radio
              v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="谁可以发起" prop="startUserType" class="mb-20px">
          <el-select
            v-model="formData.startUserType"
            placeholder="请选择谁可以发起"
            @change="handleStartUserTypeChange"
          >
            <el-option label="全员" :value="0" />
            <el-option label="指定人员" :value="1" />
            <el-option label="均不可提交" :value="2" />
          </el-select>
          <div v-if="formData.startUserType === 1" class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="user in selectedStartUsers"
              :key="user.id"
              class="bg-gray-100 h-35px rounded-3xl flex items-center pr-8px dark:color-gray-600 position-relative"
            >
              <el-avatar class="!m-5px" :size="28" v-if="user.avatar" :src="user.avatar" />
              <el-avatar class="!m-5px" :size="28" v-else>
                {{ user.nickname.substring(0, 1) }}
              </el-avatar>
              {{ user.nickname }}
              <Icon
                icon="ep:close"
                class="ml-2 cursor-pointer hover:text-red-500"
                @click="handleRemoveStartUser(user)"
              />
            </div>
            <el-button type="primary" link @click="openStartUserSelect">
              <Icon icon="ep:plus" />选择人员
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="流程管理员" prop="managerUserType" class="mb-20px">
          <el-select
            v-model="formData.managerUserType"
            placeholder="请选择流程管理员"
            @change="handleManagerUserTypeChange"
          >
            <el-option label="全员" :value="0" />
            <el-option label="指定人员" :value="1" />
            <el-option label="均不可提交" :value="2" />
          </el-select>
          <div v-if="formData.managerUserType === 1" class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="user in selectedManagerUsers"
              :key="user.id"
              class="bg-gray-100 h-35px rounded-3xl flex items-center pr-8px dark:color-gray-600 position-relative"
            >
              <el-avatar class="!m-5px" :size="28" v-if="user.avatar" :src="user.avatar" />
              <el-avatar class="!m-5px" :size="28" v-else>
                {{ user.nickname.substring(0, 1) }}
              </el-avatar>
              {{ user.nickname }}
              <Icon
                icon="ep:close"
                class="ml-2 cursor-pointer hover:text-red-500"
                @click="handleRemoveManagerUser(user)"
              />
            </div>
            <el-button type="primary" link @click="openManagerUserSelect">
              <Icon icon="ep:plus" />选择人员
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="currentStep === 1">
      <!-- 第二步：表单设计 -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="mt-20px"
      >
        <el-form-item label="表单类型" prop="formType" class="mb-20px">
          <el-radio-group v-model="formData.formType">
            <el-radio
              v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_FORM_TYPE)"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.formType === 10" label="流程表单" prop="formId">
          <el-select v-model="formData.formId" clearable style="width: 100%">
            <el-option
              v-for="form in formList"
              :key="form.id"
              :label="form.name"
              :value="form.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="formData.formType === 20"
          label="表单提交路由"
          prop="formCustomCreatePath"
        >
          <el-input
            v-model="formData.formCustomCreatePath"
            placeholder="请输入表单提交路由"
            style="width: 330px"
          />
          <el-tooltip
            class="item"
            content="自定义表单的提交路径，使用 Vue 的路由地址，例如说：bpm/oa/leave/create.vue"
            effect="light"
            placement="top"
          >
            <Icon icon="ep:question" class="ml-5px" />
          </el-tooltip>
        </el-form-item>
        <el-form-item
          v-if="formData.formType === 20"
          label="表单查看地址"
          prop="formCustomViewPath"
        >
          <el-input
            v-model="formData.formCustomViewPath"
            placeholder="请输入表单查看的组件地址"
            style="width: 330px"
          />
          <el-tooltip
            class="item"
            content="自定义表单的查看组件地址，使用 Vue 的组件地址，例如说：bpm/oa/leave/detail.vue"
            effect="light"
            placement="top"
          >
            <Icon icon="ep:question" class="ml-5px" />
          </el-tooltip>
        </el-form-item>
      </el-form>
    </div>

    <!-- 第三步：流程设计 -->
    <div v-show="currentStep === 2">
      <!-- BPMN设计器 -->
      <template v-if="formData.type === BpmModelType.BPMN">
        <BpmModelEditor
          v-if="showDesigner"
          :model-id="formData.id"
          :model-key="formData.key"
          :model-name="formData.name"
          @success="handleDesignSuccess"
        />
      </template>

      <!-- Simple设计器 -->
      <template v-else>
        <SimpleModelDesign
          v-if="showDesigner"
          :model-id="formData.id"
          :model-key="formData.key"
          :model-name="formData.name"
          @success="handleDesignSuccess"
        />
      </template>
    </div>
  </ContentWrap>

  <!-- 用户选择弹窗 -->
  <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
</template>

<script lang="ts" setup>
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { CategoryApi } from '@/api/bpm/category'
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import { BpmModelFormType, BpmModelType } from '@/utils/constants'
import * as UserApi from '@/api/system/user'
import { useUserStoreWithOut } from '@/store/modules/user'
import { UserVO } from '@/api/system/user'
import BpmModelEditor from './editor/index.vue'
import SimpleModelDesign from '../simple/SimpleModelDesign.vue'

const message = useMessage() // 消息弹窗
const router = useRouter()
const route = useRoute()
const userStore = useUserStoreWithOut()

// 步骤控制
const currentStep = ref(0)
// 表单数据
const formRef = ref()
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

// 表单校验规则
const formRules = {
  name: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }],
  key: [{ required: true, message: '流程标识不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '流程分类不能为空', trigger: 'blur' }],
  icon: [{ required: true, message: '流程图标不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  formType: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  formId: [{ required: true, message: '流程表单不能为空', trigger: 'blur' }],
  formCustomCreatePath: [{ required: true, message: '表单提交路由不能为空', trigger: 'blur' }],
  formCustomViewPath: [{ required: true, message: '表单查看地址不能为空', trigger: 'blur' }],
  visible: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  managerUserIds: [{ required: true, message: '流程管理员不能为空', trigger: 'blur' }]
}

// 流程设计器相关
const xmlString = ref(undefined)

// 数据列表
const formList: any = ref([])
const categoryList: any = ref([])
const userList = ref<UserVO[]>([])
const selectedStartUsers = ref<UserVO[]>([])
const selectedManagerUsers = ref<UserVO[]>([])

// 用户选择相关
const userSelectFormRef = ref()
const currentSelectType = ref<'start' | 'manager'>('start')

// 打开发起人选择
const openStartUserSelect = () => {
  currentSelectType.value = 'start'
  userSelectFormRef.value.open(0, selectedStartUsers.value)
}

// 打开管理员选择
const openManagerUserSelect = () => {
  currentSelectType.value = 'manager'
  userSelectFormRef.value.open(0, selectedManagerUsers.value)
}

// 处理用户选择确认
const handleUserSelectConfirm = (_, users: UserVO[]) => {
  if (currentSelectType.value === 'start') {
    selectedStartUsers.value = users
    formData.value.startUserIds = users.map((u) => u.id)
  } else {
    selectedManagerUsers.value = users
    formData.value.managerUserIds = users.map((u) => u.id)
  }
}

// 处理发起人类型变化
const handleStartUserTypeChange = (value: number) => {
  if (value !== 1) {
    selectedStartUsers.value = []
    formData.value.startUserIds = []
  }
}

// 处理管理员类型变化
const handleManagerUserTypeChange = (value: number) => {
  if (value !== 1) {
    selectedManagerUsers.value = []
    formData.value.managerUserIds = []
  }
}

// 移除发起人
const handleRemoveStartUser = (user: UserVO) => {
  selectedStartUsers.value = selectedStartUsers.value.filter((u) => u.id !== user.id)
  formData.value.startUserIds = formData.value.startUserIds.filter((id) => id !== user.id)
}

// 移除管理员
const handleRemoveManagerUser = (user: UserVO) => {
  selectedManagerUsers.value = selectedManagerUsers.value.filter((u) => u.id !== user.id)
  formData.value.managerUserIds = formData.value.managerUserIds.filter((id) => id !== user.id)
}

// 保存操作
const handleSave = async () => {
  try {
    if (formData.value.id) {
      await ModelApi.updateModel(formData.value)
      message.success('修改成功')
    } else {
      const result = await ModelApi.createModel(formData.value)
      formData.value.id = result.id // 保存id用于设计器
      message.success('新增成功')
    }
    // 不再跳转，继续停留在当前页面
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 发布操作
const handleDeploy = async () => {
  try {
    await message.confirm('是否确认发布该流程？')
    // 发布时才进行全部校验
    await validateAllSteps()
    await handleSave()
    await ModelApi.deployModel(formData.value.id)
    message.success('发布成功')
    router.push({ path: '/bpm/manager/model' })
  } catch (error) {
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
      }
    }
  }
}

// 初始化数据
const initData = async () => {
  const modelId = route.query.id as unknown as string
  if (modelId) {
    // 修改场景
    formData.value = await ModelApi.getModel(modelId)
    // 加载数据时，根据已有的用户ID列表初始化已选用户
    if (formData.value.startUserIds?.length) {
      formData.value.startUserType = 1
      selectedStartUsers.value = userList.value.filter((user) =>
        formData.value.startUserIds.includes(user.id)
      )
    }
    if (formData.value.managerUserIds?.length) {
      formData.value.managerUserType = 1
      selectedManagerUsers.value = userList.value.filter((user) =>
        formData.value.managerUserIds.includes(user.id)
      )
    }
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

onMounted(async () => {
  await initData()
})

// 第一步校验
const validateStep1 = async () => {
  await formRef.value?.validate(['name', 'key', 'category', 'icon', 'type', 'visible'])
}

// 第二步校验
const validateStep2 = async () => {
  await formRef.value?.validate([
    'formType',
    'formId',
    'formCustomCreatePath',
    'formCustomViewPath'
  ])
}

// 第三步校验
const validateStep3 = async () => {
  if (!xmlString.value) {
    throw new Error('请设计流程')
  }
}

const validateAllSteps = async () => {
  for (const step of steps) {
    if (step.validator) {
      await step.validator()
    }
  }
}

const steps = [
  { title: '基本信息', validator: validateStep1 },
  { title: '表单设计', validator: validateStep2 },
  { title: '流程设计', validator: validateStep3 }
]

// 处理设计器保存成功
const handleDesignSuccess = (bpmnXml?: string) => {
  if (bpmnXml) {
    // 新建时，保存设计器生成的XML
    formData.value.bpmnXml = bpmnXml
  }
  message.success('保存成功')
}

// 步骤切换处理
const handleStepClick = async (index: number) => {
  // 如果是切换到第三步（流程设计），需要校验key和name
  if (index === 2) {
    if (!formData.value.key || !formData.value.name) {
      message.warning('请先填写流程标识和流程名称')
      return
    }
  }

  currentStep.value = index
}

// 添加一个计算属性来判断是否显示设计器
const showDesigner = computed(() => {
  return (
    currentStep.value === 2 &&
    Boolean(formData.value.id || (formData.value.key && formData.value.name))
  )
})

// 监听步骤变化，确保数据准备完成
watch(
  () => currentStep.value,
  async (newStep) => {
    if (newStep === 2) {
      await nextTick()
    }
  },
  { immediate: false }
)

// 在组件卸载时清理
onBeforeUnmount(() => {
  const w = window as any
  if (w.bpmnInstances) {
    w.bpmnInstances = null
  }
})
</script>

<style lang="scss" scoped>
.process-panel {
  position: absolute;
  top: 0;
  right: 0;
}

.bg-gray-100 {
  background-color: #f5f7fa;
  transition: all 0.3s;

  &:hover {
    background-color: #e6e8eb;
  }

  .ep-close {
    font-size: 14px;
    color: #909399;
    transition: color 0.3s;

    &:hover {
      color: #f56c6c;
    }
  }
}

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

.text-16px {
  font-size: 16px;
}

.h-2px {
  height: 2px;
}

.mx-15px {
  margin-left: 15px;
  margin-right: 15px;
}
</style>
