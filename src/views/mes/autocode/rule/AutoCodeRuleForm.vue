<!-- MES 编码规则的新增/修改 -->
<!-- TODO @AI：最大长度，默认是有的把；-->
<!-- TODO @AI：所有 magic number 枚举的，都使用 mes utils 里的枚举；没有就新建 -->
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
        <el-col :span="8">
          <el-form-item label="规则编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入规则编码" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="规则名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入规则名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
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
          <el-form-item label="规则描述" prop="description">
            <el-input v-model="formData.description" placeholder="请输入规则描述" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否补齐" prop="padded">
            <el-switch v-model="formData.padded" />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.padded">
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
        <el-col :span="8" v-if="formData.padded">
          <el-form-item label="补齐字符" prop="paddedChar">
            <el-input v-model="formData.paddedChar" placeholder="请输入补齐字符" maxlength="1" />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.padded">
          <el-form-item label="补齐方式" prop="paddedMethod">
            <el-select v-model="formData.paddedMethod" placeholder="请选择补齐方式" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_PADDED_METHOD)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
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
    <!-- TODO @AI：el- 风格先的交互，参考别的界面； -->
    <el-tabs v-model="activeTab" v-if="formType === 'update' && formData.id">
      <el-tab-pane label="编码分段" name="parts" lazy>
        <AutoCodePartList :ruleId="formData.id!" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { AutoCodeRuleApi, AutoCodeRuleVO } from '@/api/mes/md/autocode/rule'
import AutoCodePartList from './AutoCodePartList.vue'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'AutoCodeRuleForm' })

const { t } = useI18n()
const message = useMessage()

// TODO @AI：/Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/UserForm.vue 注释风格；
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const activeTab = ref('parts')
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  description: undefined,
  maxLength: 20,
  padded: false,
  paddedChar: '0',
  paddedMethod: 1, // TODO @AI：这里有枚举，需要使用下；
  status: CommonStatusEnum.ENABLE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '规则编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  maxLength: [{ required: true, message: '最大长度不能为空', trigger: 'blur' }],
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
    maxLength: 20,
    padded: false,
    paddedChar: '0',
    paddedMethod: 1, // TODO @AI：这里有枚举，需要使用下；
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
