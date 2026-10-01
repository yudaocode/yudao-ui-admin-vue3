<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="720px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <el-form-item label="知识库名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入知识库名称" maxlength="100" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入描述"
          maxlength="500"
        />
      </el-form-item>
      <el-divider />
      <el-row>
        <el-col :span="12">
          <el-form-item label="向量化模型供应商" prop="embeddingProviderId">
            <ProviderSelect
              v-model="formData.embeddingProviderId"
              @change="formData.embeddingModelId = undefined"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="向量化模型" prop="embeddingModelId">
            <ModelSelect
              v-model="formData.embeddingModelId"
              :provider-id="formData.embeddingProviderId"
              :type="Ai1ModelTypeEnum.EMBEDDING"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分片大小" prop="chunkSize">
            <el-input-number
              v-model="formData.chunkSize"
              :min="100"
              :max="2000"
              :step="100"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分片重叠" prop="chunkOverlap">
            <el-input-number
              v-model="formData.chunkOverlap"
              :min="0"
              :max="500"
              :step="10"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="检索数量" prop="topK">
            <el-input-number v-model="formData.topK" :min="1" :max="20" class="!w-full" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { KnowledgeBaseApi, KnowledgeBase } from '@/api/ai1/knowledge/base'
import { AI1_KNOWLEDGE_BASE_DEFAULTS, Ai1ModelTypeEnum } from '@/views/ai1/utils/constants'
import ProviderSelect from '@/views/ai1/model/provider/components/ProviderSelect.vue'
import ModelSelect from '@/views/ai1/model/components/ModelSelect.vue'

/** AI1 知识库表单 */
defineOptions({ name: 'Ai1KnowledgeBaseForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  name: undefined as string | undefined,
  description: undefined as string | undefined,
  embeddingProviderId: undefined as number | undefined,
  embeddingModelId: undefined as number | undefined,
  chunkSize: AI1_KNOWLEDGE_BASE_DEFAULTS.CHUNK_SIZE as number,
  chunkOverlap: AI1_KNOWLEDGE_BASE_DEFAULTS.CHUNK_OVERLAP as number,
  topK: AI1_KNOWLEDGE_BASE_DEFAULTS.TOP_K as number,
  status: CommonStatusEnum.ENABLE as number
})
const formRules = reactive({
  name: [{ required: true, message: '知识库名称不能为空', trigger: 'blur' }],
  embeddingProviderId: [{ required: true, message: '向量化模型供应商不能为空', trigger: 'change' }],
  embeddingModelId: [{ required: true, message: '向量化模型不能为空', trigger: 'change' }],
  chunkSize: [{ required: true, message: '分片大小不能为空', trigger: 'blur' }],
  chunkOverlap: [{ required: true, message: '分片重叠不能为空', trigger: 'blur' }],
  topK: [{ required: true, message: '检索数量不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
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
      formData.value = await KnowledgeBaseApi.getKnowledgeBase(id)
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
    const data = formData.value as unknown as KnowledgeBase
    if (formType.value === 'create') {
      await KnowledgeBaseApi.createKnowledgeBase(data)
      message.success(t('common.createSuccess'))
    } else {
      await KnowledgeBaseApi.updateKnowledgeBase(data)
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
    embeddingProviderId: undefined,
    embeddingModelId: undefined,
    chunkSize: AI1_KNOWLEDGE_BASE_DEFAULTS.CHUNK_SIZE,
    chunkOverlap: AI1_KNOWLEDGE_BASE_DEFAULTS.CHUNK_OVERLAP,
    topK: AI1_KNOWLEDGE_BASE_DEFAULTS.TOP_K,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
