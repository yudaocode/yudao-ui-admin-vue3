<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="流程标识" prop="key">
        <el-input v-model="formData.key" :disabled="!!formData.id" placeholder="请输入流标标识" />
        <el-tooltip
          v-if="!formData.id"
          class="item"
          content="新建后，流程标识不可修改！"
          effect="light"
          placement="top"
        >
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
        <el-tooltip v-else class="item" content="流程标识不可修改！" effect="light" placement="top">
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="流程名称" prop="name">
        <el-input
          v-model="formData.name"
          :disabled="!!formData.id"
          clearable
          placeholder="请输入流程名称"
        />
      </el-form-item>
      <el-form-item label="流程分类" prop="category">
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
      <el-form-item label="流程图标" prop="icon">
        <UploadImg v-model="formData.icon" :limit="1" height="64px" width="64px" />
      </el-form-item>
      <el-form-item label="流程描述" prop="description">
        <el-input v-model="formData.description" clearable type="textarea" />
      </el-form-item>
      <el-form-item label="流程类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="表单类型" prop="formType">
        <el-radio-group v-model="formData.formType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_FORM_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.formType === 10" label="流程表单" prop="formId">
        <el-select v-model="formData.formId" clearable style="width: 100%">
          <el-option v-for="form in formList" :key="form.id" :label="form.name" :value="form.id" />
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
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
      </el-form-item>
      <el-form-item v-if="formData.formType === 20" label="表单查看地址" prop="formCustomViewPath">
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
          <i class="el-icon-question" style="padding-left: 5px"></i>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="是否可见" prop="visible">
        <el-radio-group v-model="formData.visible">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value as string"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="谁可以发起" prop="startUserType">
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
      <el-form-item label="流程管理员" prop="managerUserType">
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
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import { ElMessageBox } from 'element-plus'
import * as ModelApi from '@/api/bpm/model'
import * as FormApi from '@/api/bpm/form'
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import { BpmModelFormType, BpmModelType } from '@/utils/constants'
import { UserVO } from '@/api/system/user'
import * as UserApi from '@/api/system/user'
import { useUserStoreWithOut } from '@/store/modules/user'
import { FormVO } from '@/api/bpm/form'

defineOptions({ name: 'ModelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const userStore = useUserStoreWithOut() // 用户信息缓存
const props = defineProps({
  categoryId: propTypes.number
})
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
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
const formRules = reactive({
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
})
const formRef = ref() // 表单 Ref
const formList = ref<FormVO[]>([]) // 流程表单的下拉框的数据
const categoryList = ref<CategoryVO[]>([]) // 流程分类列表
const userList = ref<UserVO[]>([]) // 用户列表
const selectedStartUsers = ref<UserVO[]>([]) // 已选择的发起人列表
const selectedManagerUsers = ref<UserVO[]>([]) // 已选择的管理员列表
const userSelectFormRef = ref() // 用户选择弹窗 ref
const currentSelectType = ref<'start' | 'manager'>('start') // 当前选择的是发起人还是管理员

/** 打开弹窗 */
const open = async (type: string, id?: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ModelApi.getModel(id)
    } finally {
      formLoading.value = false
    }
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
    formData.value.managerUserIds.push(userStore.getUser.id)
  }
  // 获得流程表单的下拉框的数据
  formList.value = await FormApi.getFormSimpleList()
  // 查询流程分类列表
  categoryList.value = await CategoryApi.getCategorySimpleList()
  // 查询用户列表
  userList.value = await UserApi.getSimpleUserList()
  if (props.categoryId) {
    formData.value.category = props.categoryId
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ModelApi.ModelVO
    if (formType.value === 'create') {
      await ModelApi.createModel(data)
      // 提示，引导用户做后续的操作
      await ElMessageBox.alert(
        '<strong>新建模型成功！</strong>后续需要执行如下 2 个步骤：' +
          '<div>1. 点击【设计流程】按钮，绘制流程图</div>' +
          '<div>2. 点击【发布流程】按钮，完成流程的最终发布</div>' +
          '另外，每次流程修改后，都需要点击【发布流程】按钮，才能正式生效！！！',
        '重要提示',
        {
          dangerouslyUseHTMLString: true,
          type: 'success'
        }
      )
    } else {
      await ModelApi.updateModel(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
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
  }
  formRef.value?.resetFields()
  selectedStartUsers.value = []
  selectedManagerUsers.value = []
}

/** 处理发起人类型变化 */
const handleStartUserTypeChange = (value: number) => {
  if (value !== 1) {
    selectedStartUsers.value = []
    formData.value.startUserIds = []
  }
}

/** 处理管理员类型变化 */
const handleManagerUserTypeChange = (value: number) => {
  if (value !== 1) {
    selectedManagerUsers.value = []
    formData.value.managerUserIds = []
  }
}

/** 打开发起人选择 */
const openStartUserSelect = () => {
  currentSelectType.value = 'start'
  userSelectFormRef.value.open(0, selectedStartUsers.value)
}

/** 打开管理员选择 */
const openManagerUserSelect = () => {
  currentSelectType.value = 'manager'
  userSelectFormRef.value.open(0, selectedManagerUsers.value)
}

/** 处理用户选择确认 */
const handleUserSelectConfirm = (_, users: UserVO[]) => {
  if (currentSelectType.value === 'start') {
    selectedStartUsers.value = users
    formData.value.startUserIds = users.map((u) => u.id)
  } else {
    selectedManagerUsers.value = users
    formData.value.managerUserIds = users.map((u) => u.id)
  }
}

/** 移除发起人 */
const handleRemoveStartUser = (user: UserVO) => {
  selectedStartUsers.value = selectedStartUsers.value.filter((u) => u.id !== user.id)
  formData.value.startUserIds = formData.value.startUserIds.filter((id: number) => id !== user.id)
}

/** 移除管理员 */
const handleRemoveManagerUser = (user: UserVO) => {
  selectedManagerUsers.value = selectedManagerUsers.value.filter((u) => u.id !== user.id)
  formData.value.managerUserIds = formData.value.managerUserIds.filter(
    (id: number) => id !== user.id
  )
}
</script>

<style lang="scss" scoped>
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
</style>
