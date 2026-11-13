<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="620px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="90px"
      v-loading="formLoading"
    >
      <!-- 新增时提示 -->
      <el-alert
        v-if="formType === 'create'"
        class="mb-15px"
        type="info"
        :closable="false"
        show-icon
        title="创建后将自动生成 SKILL.md、scripts/、reference/，可在“文件管理”中继续编辑"
      />
      <el-form-item label="技能名称" prop="name">
        <el-input
          v-model="formData.name"
          :disabled="formType === 'update'"
          placeholder="仅小写字母/数字/中划线，如 order-analysis"
          maxlength="64"
        />
      </el-form-item>
      <el-form-item label="技能描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          :disabled="formType === 'update'"
          placeholder="请输入技能描述"
          maxlength="1024"
          show-word-limit
        />
        <div v-if="formType === 'update'" class="text-12px text-[var(--el-text-color-secondary)]">
          以 SKILL.md 为准
        </div>
      </el-form-item>
      <el-form-item label="版本" prop="version">
        <el-input
          v-model="formData.version"
          placeholder="请输入版本"
          maxlength="32"
          class="!w-160px"
        />
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
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" maxlength="255" />
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
import { CommonStatusEnum } from '@/utils/constants'
import { SkillApi, SkillVO } from '@/api/ai/skill'

/** AI 技能表单 */
defineOptions({ name: 'AiSkillForm' })

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
  version: '1.0.0',
  status: CommonStatusEnum.ENABLE as number,
  remark: undefined as string | undefined
})
const formRules = reactive({
  name: [
    { required: true, message: '技能名称不能为空', trigger: 'blur' },
    { pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, message: '仅支持小写字母、数字、中划线', trigger: 'blur' }
  ],
  description: [{ required: true, whitespace: true, message: '技能描述不能为空', trigger: 'blur' }],
  version: [{ required: true, message: '版本不能为空', trigger: 'blur' }],
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
      formData.value = await SkillApi.getSkill(id)
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
    const data = formData.value as unknown as SkillVO
    if (formType.value === 'create') {
      await SkillApi.createSkill(data)
      message.success(t('common.createSuccess'))
    } else {
      await SkillApi.updateSkill(data)
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
    version: '1.0.0',
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
