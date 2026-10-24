<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" v-loading="formLoading">
      <el-form-item label="用户编号" prop="userId">
        <el-input-number v-model="formData.userId" :min="0" class="!w-1/1" placeholder="0 表示租户级预算" />
      </el-form-item>
      <el-form-item label="周期类型" prop="periodType">
        <el-select v-model="formData.periodType" placeholder="请选择" clearable>
          <el-option label="月度" value="MONTHLY" />
          <el-option label="每日" value="DAILY" />
        </el-select>
      </el-form-item>
      <el-form-item label="预算金额(元)" prop="budgetAmountYuan">
        <el-input-number v-model="formData.budgetAmountYuan" :min="0" :precision="2" class="!w-1/1" placeholder="请输入预算金额" />
      </el-form-item>
      <el-form-item label="告警阈值" prop="alertThresholds">
        <el-input v-model="formData.alertThresholds" placeholder="例如 [80,90,100]" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio>
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
import { BudgetConfigApi, BudgetConfigVO } from '@/api/ai/billing/budgetConfig'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'BudgetConfigForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  userId: 0,
  periodType: 'MONTHLY',
  budgetAmountYuan: undefined,
  alertThresholds: '[80,90,100]',
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  userId: [{ required: true, message: '用户编号不能为空', trigger: 'blur' }],
  periodType: [{ required: true, message: '周期类型不能为空', trigger: 'blur' }],
  budgetAmountYuan: [{ required: true, message: '预算金额不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref()

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await BudgetConfigApi.getBudgetConfig(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as BudgetConfigVO
    if (formType.value === 'create') {
      await BudgetConfigApi.createBudgetConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await BudgetConfigApi.updateBudgetConfig(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    userId: 0,
    periodType: 'MONTHLY',
    budgetAmountYuan: undefined,
    alertThresholds: '[80,90,100]',
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
