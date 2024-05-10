<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="API 秘钥编号" prop="keyId">
        <el-input v-model="formData.keyId" placeholder="请输入API 秘钥编号" />
      </el-form-item>
      <el-form-item label="模型名字" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模型名字" />
      </el-form-item>
      <el-form-item label="模型标识" prop="model">
        <el-input v-model="formData.model" placeholder="请输入模型标识" />
      </el-form-item>
      <el-form-item label="模型平台" prop="platform">
        <el-input v-model="formData.platform" placeholder="请输入模型平台" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input v-model="formData.sort" placeholder="请输入排序" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio label="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="温度参数" prop="temperature">
        <el-input v-model="formData.temperature" placeholder="请输入温度参数" />
      </el-form-item>
      <el-form-item label="回复数 Token 数" prop="maxTokens">
        <el-input v-model="formData.maxTokens" placeholder="请输入回复数 Token 数" />
      </el-form-item>
      <el-form-item label="上下文数量" prop="maxContexts">
        <el-input v-model="formData.maxContexts" placeholder="请输入上下文数量" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ChatModelApi, ChatModelVO } from '@/api/ai/model/chatModel'
import { CommonStatusEnum } from '@/utils/constants'

/** API 聊天模型 表单 */
defineOptions({ name: 'ChatModelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  keyId: undefined,
  name: undefined,
  model: undefined,
  platform: undefined,
  sort: undefined,
  status: CommonStatusEnum.ENABLE,
  temperature: undefined,
  maxTokens: undefined,
  maxContexts: undefined
})
const formRules = reactive({
  keyId: [{ required: true, message: 'API 秘钥编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '模型名字不能为空', trigger: 'blur' }],
  model: [{ required: true, message: '模型标识不能为空', trigger: 'blur' }],
  platform: [{ required: true, message: '模型平台不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
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
      formData.value = await ChatModelApi.getChatModel(id)
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
    const data = formData.value as unknown as ChatModelVO
    if (formType.value === 'create') {
      await ChatModelApi.createChatModel(data)
      message.success(t('common.createSuccess'))
    } else {
      await ChatModelApi.updateChatModel(data)
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
    keyId: undefined,
    name: undefined,
    model: undefined,
    platform: undefined,
    sort: undefined,
    status: CommonStatusEnum.ENABLE,
    temperature: undefined,
    maxTokens: undefined,
    maxContexts: undefined
  }
  formRef.value?.resetFields()
}
</script>
