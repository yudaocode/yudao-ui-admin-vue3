<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="760px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="Agent 名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入 Agent 名称" maxlength="100" />
      </el-form-item>
      <el-form-item label="介绍" prop="introduction">
        <el-input
          v-model="formData.introduction"
          type="textarea"
          :rows="2"
          placeholder="请输入 Agent 介绍"
          maxlength="500"
        />
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="模型供应商" prop="providerId">
            <ProviderSelect v-model="formData.providerId" @change="formData.modelId = undefined" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="对话模型" prop="modelId">
            <ModelSelect
              v-model="formData.modelId"
              :provider-id="formData.providerId"
              :type="Ai1ModelTypeEnum.CHAT"
              placeholder="请选择对话模型"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="系统指令" prop="systemPrompt">
        <el-input
          v-model="formData.systemPrompt"
          type="textarea"
          :rows="6"
          placeholder="请输入 Agent 系统指令"
        />
      </el-form-item>
      <el-form-item label="关联知识库" prop="knowledgeBaseIds">
        <KnowledgeBaseSelect v-model="formData.knowledgeBaseIds" multiple clearable />
      </el-form-item>
      <el-form-item label="关联 MCP" prop="mcpIds">
        <McpSelect v-model="formData.mcpIds" multiple clearable />
      </el-form-item>
      <el-form-item label="关联 SKILL" prop="skillIds">
        <SkillSelect v-model="formData.skillIds" multiple clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { AgentApi, Agent } from '@/api/ai1/agent'
import { Ai1ModelTypeEnum } from '@/views/ai1/utils/constants'
import ProviderSelect from '@/views/ai1/model/provider/components/ProviderSelect.vue'
import ModelSelect from '@/views/ai1/model/components/ModelSelect.vue'
import KnowledgeBaseSelect from '@/views/ai1/knowledge/components/KnowledgeBaseSelect.vue'
import McpSelect from '@/views/ai1/mcp/components/McpSelect.vue'
import SkillSelect from '@/views/ai1/skill/components/SkillSelect.vue'

/** AI1 Agent 表单 */
defineOptions({ name: 'Ai1AgentForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  name: undefined as string | undefined,
  introduction: undefined as string | undefined,
  providerId: undefined as number | undefined,
  modelId: undefined as number | undefined,
  systemPrompt: undefined as string | undefined,
  knowledgeBaseIds: [] as number[],
  mcpIds: [] as number[],
  skillIds: [] as number[]
})
const formRules = reactive({
  name: [{ required: true, message: 'Agent 名称不能为空', trigger: 'blur' }],
  providerId: [{ required: true, message: '模型供应商不能为空', trigger: 'change' }],
  modelId: [{ required: true, message: '对话模型不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await AgentApi.getAgent(id)
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
    const data = formData.value as unknown as Agent
    if (formType.value === 'create') {
      await AgentApi.createAgent(data)
      message.success(t('common.createSuccess'))
    } else {
      await AgentApi.updateAgent(data)
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
    introduction: undefined,
    providerId: undefined,
    modelId: undefined,
    systemPrompt: undefined,
    knowledgeBaseIds: [],
    mcpIds: [],
    skillIds: []
  }
  formRef.value?.resetFields()
}
</script>
