<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="模型编号" prop="modelId">
        <el-input v-model="formData.modelId" placeholder="请输入模型编号" />
      </el-form-item>
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="角色头像" prop="avatar">
        <el-input v-model="formData.avatar" placeholder="请输入角色头像" />
      </el-form-item>
      <el-form-item label="角色类别" prop="category">
        <el-input v-model="formData.category" placeholder="请输入角色类别" />
      </el-form-item>
      <el-form-item label="角色排序" prop="sort">
        <el-input v-model="formData.sort" placeholder="请输入角色排序" />
      </el-form-item>
      <el-form-item label="角色描述" prop="description">
        <Editor v-model="formData.description" height="150px" />
      </el-form-item>
      <el-form-item label="角色欢迎语" prop="welcomeMessage">
        <el-input v-model="formData.welcomeMessage" placeholder="请输入角色欢迎语" />
      </el-form-item>
      <el-form-item label="角色上下文" prop="systemMessage">
        <el-input v-model="formData.systemMessage" placeholder="请输入角色上下文" />
      </el-form-item>
      <el-form-item label="是否公开" prop="publicStatus">
        <el-radio-group v-model="formData.publicStatus">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import { ChatRoleApi, ChatRoleVO } from '@/api/ai/model/chatRole'

/** AI 聊天角色 表单 */
defineOptions({ name: 'ChatRoleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  modelId: undefined,
  name: undefined,
  avatar: undefined,
  category: undefined,
  sort: undefined,
  description: undefined,
  welcomeMessage: undefined,
  systemMessage: undefined,
  publicStatus: undefined,
  status: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  avatar: [{ required: true, message: '角色头像不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '角色类别不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '角色排序不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '角色描述不能为空', trigger: 'blur' }],
  welcomeMessage: [{ required: true, message: '角色欢迎语不能为空', trigger: 'blur' }],
  systemMessage: [{ required: true, message: '角色上下文不能为空', trigger: 'blur' }],
  publicStatus: [{ required: true, message: '是否公开不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ChatRoleApi.getChatRole(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ChatRoleVO
    if (formType.value === 'create') {
      await ChatRoleApi.createChatRole(data)
      message.success(t('common.createSuccess'))
    } else {
      await ChatRoleApi.updateChatRole(data)
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
    modelId: undefined,
    name: undefined,
    avatar: undefined,
    category: undefined,
    sort: undefined,
    description: undefined,
    welcomeMessage: undefined,
    systemMessage: undefined,
    publicStatus: undefined,
    status: undefined
  }
  formRef.value?.resetFields()
}
</script>
