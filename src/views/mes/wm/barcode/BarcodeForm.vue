<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="条码格式" prop="format">
        <el-select v-model="formData.format" placeholder="请选择条码格式" class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_BARCODE_FORMAT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select v-model="formData.bizType" placeholder="请选择业务类型" class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_BARCODE_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI：需要根据 bizType，使用不同业务的 select； -->
      <el-form-item label="业务编号" prop="bizId">
        <el-input-number v-model="formData.bizId" :min="1" class="!w-240px" />
      </el-form-item>
      <!-- TODO @AI：bizCode、bizName 根据上面的 select 进行设置；必填！（后端校验也加下） -->
      <el-form-item label="业务编码" prop="bizCode">
        <el-input v-model="formData.bizCode" placeholder="请输入业务编码" />
      </el-form-item>
      <el-form-item label="业务名称" prop="bizName">
        <el-input v-model="formData.bizName" placeholder="请输入业务名称" />
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
import { BarcodeApi, BarcodeVO } from '@/api/mes/wm/barcode'

defineOptions({ name: 'BarcodeForm' })

// TODO @AI：注释参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/UserForm.vue

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
  bizId: undefined,
  bizCode: '',
  bizName: '',
  status: 0,
  remark: ''
})
const formRules = reactive({
  format: [{ required: true, message: '条码格式不能为空', trigger: 'change' }],
  bizType: [{ required: true, message: '业务类型不能为空', trigger: 'change' }],
  bizId: [{ required: true, message: '业务编号不能为空', trigger: 'blur' }],
  bizCode: [{ required: true, message: '业务编码不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增条码' : '修改条码'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await BarcodeApi.getBarcode(id)
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
    const data = formData.value as unknown as BarcodeVO
    if (formType.value === 'create') {
      await BarcodeApi.createBarcode(data)
      message.success(t('common.createSuccess'))
    } else {
      await BarcodeApi.updateBarcode(data)
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
    bizId: undefined,
    bizCode: '',
    bizName: '',
    status: 0, // TODO @AI：枚举类；commonstatusenum；
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
