<template>
  <Dialog title="设定" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="角色设定" prop="systemContext">
        <el-input type="textarea" v-model="formData.systemContext" placeholder="请输入角色设定" />
      </el-form-item>
      <el-form-item label="模型" prop="modelId">
        <UploadImg v-model="formData.modelId" />
      </el-form-item>
      <el-form-item label="上下文数量" prop="category">
        <el-input v-model="formData.category" placeholder="请输入角色类别" />
      </el-form-item>
      <el-form-item label="话题随机性" prop="description">
        <el-input type="textarea" v-model="formData.description" placeholder="请输入角色描述" />
      </el-form-item>
      <el-form-item label="回复数" prop="systemMessage">
        <el-input type="textarea" v-model="formData.systemMessage" placeholder="请输入角色设定" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ChatRoleApi, ChatRoleVO } from '@/api/ai/model/chatRole'
import { CommonStatusEnum } from '@/utils/constants'
import { ChatModelApi, ChatModelVO } from '@/api/ai/model/chatModel'
import { ChatConversationApi, ChatConversationVO } from '@/api/ai/chat/conversation'

/** AI 聊天角色 表单 */
defineOptions({ name: 'ChatConversationUpdateForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  systemContext: undefined,
  modelId: undefined,
  name: undefined,
  avatar: undefined,
  category: undefined,
  sort: undefined,
  description: undefined,
  systemMessage: undefined,
  publicStatus: true,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  avatar: [{ required: true, message: '角色头像不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '角色类别不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '角色排序不能为空', trigger: 'blur' }],
  description: [{ required: true, message: '角色描述不能为空', trigger: 'blur' }],
  systemMessage: [{ required: true, message: '角色设定不能为空', trigger: 'blur' }],
  publicStatus: [{ required: true, message: '是否公开不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const chatModelList = ref([] as ChatModelVO[]) // 聊天模型列表

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ChatConversationApi.getChatConversationMy(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得下拉数据
  chatModelList.value = await ChatModelApi.getChatModelSimpleList(CommonStatusEnum.ENABLE)
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
    await ChatRoleApi.updateChatRole(data)
    message.success(t('common.updateSuccess'))
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
    systemMessage: undefined,
    publicStatus: true,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
