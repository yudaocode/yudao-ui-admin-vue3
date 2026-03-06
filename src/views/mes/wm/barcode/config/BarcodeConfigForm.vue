<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="条码格式" prop="format">
        <el-select v-model="formData.format" placeholder="请选择条码格式" class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_FORMAT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select
          v-model="formData.bizType"
          placeholder="请选择业务类型"
          class="!w-240px"
          :disabled="formType === 'update'"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="内容格式模板" prop="contentFormat">
        <el-input
          v-model="formData.contentFormat"
          placeholder="支持{BUSINESSCODE}占位符，如：WH-{BUSINESSCODE}"
          class="!w-400px"
        />
      </el-form-item>
      <el-form-item label="内容样例" prop="contentExample">
        <el-input
          v-model="formData.contentExample"
          placeholder="如：WH-WH001"
          class="!w-400px"
        />
      </el-form-item>
      <el-form-item label="自动生成" prop="autoGenerateFlag">
        <el-switch v-model="formData.autoGenerateFlag" />
      </el-form-item>
      <el-form-item label="默认打印模板" prop="defaultTemplate">
        <el-input v-model="formData.defaultTemplate" placeholder="请输入默认打印模板" />
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
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
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
import { WmBarcodeConfigApi as BarcodeConfigApi, WmBarcodeConfigVO as BarcodeConfigVO } from '@/api/mes/wm/barcode/config'

defineOptions({ name: 'BarcodeConfigForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  format: undefined,
  bizType: undefined,
  contentFormat: '',
  contentExample: '',
  autoGenerateFlag: true,
  defaultTemplate: '',
  status: 0,
  remark: ''
})
const formRules = reactive({
  format: [{ required: true, message: '条码格式不能为空', trigger: 'change' }],
  bizType: [{ required: true, message: '业务类型不能为空', trigger: 'change' }],
  contentFormat: [{ required: true, message: '内容格式模板不能为空', trigger: 'blur' }],
  autoGenerateFlag: [{ required: true, message: '是否自动生成不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增条码配置' : '修改条码配置'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await BarcodeConfigApi.getBarcodeConfig(id)
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
    const data = formData.value as unknown as BarcodeConfigVO
    if (formType.value === 'create') {
      await BarcodeConfigApi.createBarcodeConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await BarcodeConfigApi.updateBarcodeConfig(data)
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
    format: undefined,
    bizType: undefined,
    contentFormat: '',
    contentExample: '',
    autoGenerateFlag: true,
    defaultTemplate: '',
    status: 0,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
