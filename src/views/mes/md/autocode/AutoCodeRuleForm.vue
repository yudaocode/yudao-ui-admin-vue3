<!-- MES 编码规则的新增/修改 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1000px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="规则编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入规则编码" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="规则名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入规则名称" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="规则描述" prop="description">
            <el-input v-model="formData.description" placeholder="请输入规则描述" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="最大长度" prop="maxLength">
            <el-input-number
              v-model="formData.maxLength"
              placeholder="请输入最大长度"
              :min="1"
              :max="100"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="是否补齐" prop="padded">
            <el-radio-group v-model="formData.padded">
              <el-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="dict.value + ''"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="formData.padded">
          <el-form-item label="补齐字符" prop="paddedChar">
            <el-input v-model="formData.paddedChar" placeholder="请输入补齐字符" maxlength="1" />
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="formData.padded">
          <el-form-item label="补齐方式" prop="paddedMethod">
            <!-- DONE @AI：改成 radio -->
            <el-radio-group v-model="formData.paddedMethod">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_PADDED_METHOD)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
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
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 底部 Tab：仅修改时展示 -->
    <template v-if="formType === 'update' && formData.id">
      <el-divider>规则组成</el-divider>
      <AutoCodePartList :ruleId="formData.id!" />
    </template>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getBoolDictOptions, getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { AutoCodeRuleApi, AutoCodeRuleVO } from '@/api/mes/md/autocode/rule'
import AutoCodePartList from './AutoCodePartList.vue'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'AutoCodeRuleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const activeTab = ref('parts') // 当前激活的 Tab
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  description: undefined,
  maxLength: undefined,
  padded: false,
  paddedChar: undefined,
  paddedMethod: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '规则编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  maxLength: [{ required: true, message: '最大长度不能为空', trigger: 'blur' }],
  padded: [{ required: true, message: '是否补齐不能为空', trigger: 'change' }],
  paddedChar: [{ required: true, message: '补齐字符不能为空', trigger: 'blur' }],
  paddedMethod: [{ required: true, message: '补齐方式不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  activeTab.value = 'parts'
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await AutoCodeRuleApi.getAutoCodeRule(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as AutoCodeRuleVO
    if (formType.value === 'create') {
      await AutoCodeRuleApi.createAutoCodeRule(data)
      message.success(t('common.createSuccess'))
    } else {
      await AutoCodeRuleApi.updateAutoCodeRule(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    description: undefined,
    maxLength: undefined,
    padded: false,
    paddedChar: undefined,
    paddedMethod: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
