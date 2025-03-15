<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <el-form-item label="知识库名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入知识库名称" />
      </el-form-item>
      <el-form-item label="知识库描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入知识库描述"
        />
      </el-form-item>
      <el-form-item label="向量模型" prop="embeddingModelId">
        <el-select
          v-model="formData.embeddingModelId"
          placeholder="请选择向量模型"
          clearable
          class="!w-full"
        >
          <el-option v-for="item in modelList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="检索 topK" prop="topK">
        <el-input-number
          v-model="formData.topK"
          placeholder="请输入检索 topK"
          :min="0"
          :max="10"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="检索相似度阈值" prop="similarityThreshold">
        <el-input-number
          v-model="formData.similarityThreshold"
          placeholder="请输入检索相似度阈值"
          :min="0"
          :max="1"
          :step="0.01"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="是否启用" prop="status">
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
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { KnowledgeApi, KnowledgeVO } from '@/api/ai/knowledge/knowledge'
import { CommonStatusEnum } from '@/utils/constants'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { AiModelTypeEnum } from '../../utils/constants'

/** AI 知识库表单 */
defineOptions({ name: 'KnowledgeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  description: undefined,
  embeddingModelId: undefined,
  topK: undefined,
  similarityThreshold: undefined,
  status: CommonStatusEnum.ENABLE // 默认开启
})
const formRules = reactive({
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  embeddingModelId: [{ required: true, message: '请输入向量模型', trigger: 'blur' }],
  topK: [{ required: true, message: '请输入检索 topK', trigger: 'blur' }],
  similarityThreshold: [{ required: true, message: '请输入检索相似度阈值', trigger: 'blur' }],
  status: [{ required: true, message: '请选择是否启用', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const modelList = ref<ModelVO[]>([]) // 向量模型选项

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 获取向量模型列表
  modelList.value = await ModelApi.getModelSimpleList(AiModelTypeEnum.EMBEDDING)
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await KnowledgeApi.getKnowledge(id)
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
    const data = formData.value as unknown as KnowledgeVO
    if (formType.value === 'create') {
      await KnowledgeApi.createKnowledge(data)
      message.success(t('common.createSuccess'))
    } else {
      await KnowledgeApi.updateKnowledge(data)
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
    name: undefined,
    description: undefined,
    embeddingModelId: undefined,
    topK: undefined,
    similarityThreshold: undefined,
    status: CommonStatusEnum.ENABLE // 默认开启
  }
  formRef.value?.resetFields()
}
</script>
