<template>
  <Dialog title="设定" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <el-form-item label="角色设定" prop="systemMessage">
        <el-input
          type="textarea"
          v-model="formData.systemMessage"
          rows="4"
          placeholder="请输入角色设定"
        />
      </el-form-item>
      <el-form-item label="模型" prop="modelId">
        <el-select v-model="formData.modelId" placeholder="请选择模型">
          <el-option
            v-for="chatModel in chatModelList"
            :key="chatModel.id"
            :label="chatModel.name"
            :value="chatModel.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="温度参数" prop="temperature">
        <el-input-number
          v-model="formData.temperature"
          placeholder="请输入温度参数"
          :min="0"
          :max="2"
          :precision="2"
        />
      </el-form-item>
      <el-form-item label="回复数 Token 数" prop="maxTokens">
        <el-input-number
          v-model="formData.maxTokens"
          placeholder="请输入回复数 Token 数"
          :min="0"
          :max="4096"
        />
      </el-form-item>
      <el-form-item label="上下文数量" prop="maxContexts">
        <el-input-number
          v-model="formData.maxContexts"
          placeholder="请输入上下文数量"
          :min="0"
          :max="20"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { CommonStatusEnum } from '@/utils/constants'
import { ChatModelApi, ChatModelVO } from '@/api/ai/model/chatModel'
import { ChatConversationApi, ChatConversationVO } from '@/api/ai/chat/conversation'

/** AI 聊天对话的更新表单 */
defineOptions({ name: 'ChatConversationUpdateForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  systemMessage: undefined,
  modelId: undefined,
  temperature: undefined,
  maxTokens: undefined,
  maxContexts: undefined
})
const formRules = reactive({
  modelId: [{ required: true, message: '模型不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  temperature: [{ required: true, message: '温度参数不能为空', trigger: 'blur' }],
  maxTokens: [{ required: true, message: '回复数 Token 数不能为空', trigger: 'blur' }],
  maxContexts: [{ required: true, message: '上下文数量不能为空', trigger: 'blur' }]
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
      const data = await ChatConversationApi.getChatConversationMy(id)
      formData.value = Object.keys(formData.value).reduce((obj, key) => {
        if (data.hasOwnProperty(key)) {
          obj[key] = data[key]
        }
        return obj
      }, {})
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
    const data = formData.value as unknown as ChatConversationVO
    await ChatConversationApi.updateChatConversationMy(data)
    message.success('对话配置已更新')
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
    systemMessage: undefined,
    modelId: undefined,
    temperature: undefined,
    maxTokens: undefined,
    maxContexts: undefined
  }
  formRef.value?.resetFields()
}
</script>
