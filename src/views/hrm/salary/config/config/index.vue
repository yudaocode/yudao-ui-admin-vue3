<template>
  <doc-alert
    title="【薪资】计薪设置、薪资档案、月度工资、工资条"
    url="https://doc.iocoder.cn/hrm/salary/config/"
  />

  <!-- 计薪配置 -->
  <ContentWrap>
    <el-alert
      v-if="initialized"
      title="计薪初始化已完成，仅可调整对应社保自然月。"
      type="info"
      show-icon
      :closable="false"
      class="mb-15px"
    />
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="formRules"
      label-width="132px"
      class="max-w-900px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="计薪周期开始日" prop="cycleStartDay">
            <el-input-number
              v-model="formData.cycleStartDay"
              :disabled="initialized"
              :min="1"
              :max="31"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工资周期结束日">
            <el-input-number
              :model-value="getCycleEndDay(formData.cycleStartDay)"
              disabled
              :min="1"
              :max="31"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="!initialized" :gutter="20">
        <el-col :span="12">
          <el-form-item label="薪资启用月份" prop="startYearMonth">
            <el-date-picker
              v-model="formData.startYearMonth"
              :disabled="initialized"
              type="month"
              value-format="YYYY-MM"
              placeholder="请选择月份"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="对应社保自然月" prop="socialSecurityMonthType">
        <el-radio-group v-model="formData.socialSecurityMonthType">
          <el-radio
            v-for="item in HrmSalarySocialSecurityMonthTypeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :disabled="loading"
          @click="submitForm"
          v-hasPermi="['hrm:salary:config:update']"
        >
          <Icon icon="ep:check" class="mr-5px" /> 保存
        </el-button>
        <el-button @click="loadConfig"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as SalaryConfigApi from '@/api/hrm/salary/config/config'
import {
  HrmSalarySocialSecurityMonthType,
  HrmSalarySocialSecurityMonthTypeOptions
} from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmSalaryConfigConfig' })

interface SalaryConfigFormData {
  cycleStartDay: number
  socialSecurityMonthType: number
  startYearMonth: string
}

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 配置加载中
const initialized = ref(false) // 是否已完成计薪初始化
const formRef = ref<FormInstance>() // 配置表单
const formData = ref<SalaryConfigFormData>({
  cycleStartDay: 1,
  socialSecurityMonthType: HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
  startYearMonth: ''
}) // 表单数据
const formRules = reactive<FormRules>({
  cycleStartDay: [{ required: true, message: '计薪周期开始日不能为空', trigger: 'blur' }],
  socialSecurityMonthType: [
    { required: true, message: '对应社保自然月不能为空', trigger: 'change' }
  ],
  startYearMonth: [{ required: true, message: '薪资启用月份不能为空', trigger: 'change' }]
}) // 表单校验规则

/** 获得计薪周期结束日 */
function getCycleEndDay(cycleStartDay: number) {
  return cycleStartDay === 1 ? 31 : cycleStartDay - 1
}

/** 加载计薪配置 */
async function loadConfig() {
  loading.value = true
  try {
    const data = await SalaryConfigApi.getSalaryConfig()
    initialized.value = Boolean(data?.startYear && data?.startMonth)
    if (data) {
      formData.value = {
        cycleStartDay: data.cycleStartDay ?? 1,
        socialSecurityMonthType:
          data.socialSecurityMonthType ?? HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
        startYearMonth:
          data.startYear && data.startMonth
            ? `${data.startYear}-${String(data.startMonth).padStart(2, '0')}`
            : ''
      }
    } else {
      formData.value = {
        cycleStartDay: 1,
        socialSecurityMonthType: HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
        startYearMonth: ''
      }
    }
  } finally {
    loading.value = false
  }
}

/** 保存计薪配置 */
async function submitForm() {
  if (initialized.value) {
    await formRef.value?.validateField('socialSecurityMonthType')
  } else {
    // 校验表单
    await formRef.value?.validate()
  }
  // 提交请求
  loading.value = true
  try {
    if (initialized.value) {
      await SalaryConfigApi.updateSalaryConfig({
        socialSecurityMonthType: formData.value.socialSecurityMonthType
      })
      message.success(t('common.updateSuccess'))
    } else {
      const [startYear, startMonth] = formData.value.startYearMonth.split('-').map(Number)
      await SalaryConfigApi.createSalaryConfig({
        cycleStartDay: formData.value.cycleStartDay,
        socialSecurityMonthType: formData.value.socialSecurityMonthType,
        startYear,
        startMonth
      })
      message.success(t('common.createSuccess'))
    }
    await loadConfig()
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadConfig()
})
</script>
