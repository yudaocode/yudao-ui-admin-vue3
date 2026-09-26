<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="980px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="104px"
    >
      <!-- 调薪信息 -->
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="员工" prop="employeeId">
            <HrmEmployeeSelect
              v-model="formData.employeeId"
              :disabled="!!formData.id"
              class="!w-1/1"
              placeholder="请选择员工"
              @change="loadSalaryEmployee"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="记录类型" prop="recordType">
            <el-radio-group v-model="formData.recordType" disabled>
              <el-radio :value="HrmSalaryRecordType.FIXED">定薪</el-radio>
              <el-radio :value="HrmSalaryRecordType.CHANGE">调薪</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="调薪模板">
            <SalaryChangeTemplateSelect
              ref="templateSelectRef"
              v-model="selectedTemplateId"
              @change="applySelectedTemplate()"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="formData.recordType === HrmSalaryRecordType.CHANGE" :span="6">
          <el-form-item label="生效日期" prop="effectTime">
            <el-date-picker
              v-model="formData.effectTime"
              :disabled-date="disabledEffectDate"
              value-format="x"
              type="date"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="formData.recordType === HrmSalaryRecordType.CHANGE" :gutter="20">
        <el-col :span="8">
          <el-form-item label="调整原因" prop="changeReason">
            <el-select v-model="formData.changeReason" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.HRM_SALARY_CHANGE_REASON)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="调整前正式">
            <el-input-number
              :model-value="beforeTotal"
              :min="0"
              :precision="2"
              class="!w-1/1"
              disabled
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="调整前试用">
            <el-input-number
              :model-value="probationBeforeTotal"
              :min="0"
              :precision="2"
              class="!w-1/1"
              disabled
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-alert
        v-if="isPendingChange()"
        type="warning"
        :closable="false"
        show-icon
        class="mb-16px"
        title="该调整将在生效日期前保持待生效，当前薪资档案不会提前变化"
      />

      <!-- 薪资明细 -->
      <el-divider content-position="left">薪资明细</el-divider>
      <el-table :data="salaryOptionRows" border>
        <el-table-column label="薪资项" prop="name" min-width="180" />
        <el-table-column label="编码" prop="code" width="120" align="center" />
        <el-table-column label="试用期工资" width="220" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.probationOption.value"
              :precision="2"
              :min="0"
              class="!w-1/1"
            />
          </template>
        </el-table-column>
        <el-table-column label="转正后工资" width="220" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.regularOption.value"
              :precision="2"
              :min="0"
              class="!w-1/1"
            />
          </template>
        </el-table-column>
      </el-table>

      <el-form-item label="备注" prop="remark" class="mt-16px">
        <el-input
          v-model="formData.remark"
          :rows="3"
          maxlength="500"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
    </el-form>
    <!-- 表单按钮 -->
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as SalaryChangeRecordApi from '@/api/hrm/salary/change-record'
import * as SalaryEmployeeInfoApi from '@/api/hrm/salary/employee-info'
import * as SalaryOptionApi from '@/api/hrm/salary/config/option'
import * as SalaryChangeTemplateApi from '@/api/hrm/salary/config/change-template'
import HrmEmployeeSelect from '@/views/hrm/employee/components/HrmEmployeeSelect.vue'
import SalaryChangeTemplateSelect from '../config/change-template/components/SalaryChangeTemplateSelect.vue'
import {
  HrmSalaryChangeReason,
  HrmSalaryOptionCategoryCode,
  HrmSalaryRecordType
} from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmSalaryEmployeeInfoForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('定薪/调薪') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const salaryOptionList = ref<SalaryOptionApi.SalaryOptionVO[]>([]) // 薪资项列表
const salaryTemplateList = ref<SalaryChangeTemplateApi.HrmSalaryChangeTemplateVO[]>([]) // 调薪模板列表
const selectedTemplateId = ref<number>() // 已选调薪模板
const minEffectDate = ref<string>() // 最早调薪生效日期
let salaryDraftMap = new Map<number, SalaryOptionApi.SalaryOptionValueVO>() // 正式工资草稿
let probationDraftMap = new Map<number, SalaryOptionApi.SalaryOptionValueVO>() // 试用期工资草稿
const beforeTotal = ref(0) // 调整前正式工资
const probationBeforeTotal = ref(0) // 调整前试用期工资
const formData = ref<SalaryEmployeeInfoApi.SalaryEmployeeInfoUpdateReqVO>({
  employeeId: undefined,
  recordType: HrmSalaryRecordType.FIXED,
  changeReason: HrmSalaryChangeReason.ENTRY_SALARY,
  effectTime: undefined,
  remark: '',
  salaryOptions: [],
  probationSalaryOptions: []
}) // 表单数据
const formRules = reactive<FormRules>({
  employeeId: [{ required: true, message: '员工不能为空', trigger: 'change' }],
  recordType: [{ required: true, message: '记录类型不能为空', trigger: 'change' }],
  changeReason: [{ required: true, message: '调整原因不能为空', trigger: 'change' }],
  effectTime: [{ required: true, message: '生效日期不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单
const templateSelectRef = ref<InstanceType<typeof SalaryChangeTemplateSelect>>() // 调薪模板选择器

/** 薪资项表格行 */
const salaryOptionRows = computed(() => {
  const regularOptions = formData.value.salaryOptions || []
  const probationOptions = formData.value.probationSalaryOptions || []
  const regularOptionMap = new Map(regularOptions.map((option) => [option.code, option]))
  const probationOptionMap = new Map(probationOptions.map((option) => [option.code, option]))
  const optionCodes = Array.from(
    new Set([
      ...regularOptions.map((option) => option.code),
      ...probationOptions.map((option) => option.code)
    ])
  )
  return optionCodes.map((code) => ({
    code,
    name: regularOptionMap.get(code)?.name || probationOptionMap.get(code)?.name,
    regularOption: regularOptionMap.get(code) || { code, value: 0 },
    probationOption: probationOptionMap.get(code) || { code, value: 0 }
  }))
})

/** 是否为待生效调薪 */
function isPendingChange() {
  return (
    formData.value.recordType === HrmSalaryRecordType.CHANGE &&
    !!formData.value.effectTime &&
    dayjs(formData.value.effectTime).isAfter(dayjs(), 'day')
  )
}

/** 判断调薪生效日期是否不可选 */
function disabledEffectDate(date: Date) {
  return !!minEffectDate.value && dayjs(date).isBefore(dayjs(minEffectDate.value), 'day')
}

/** 打开弹窗 */
async function open(employeeId?: number, recordId?: number) {
  dialogVisible.value = true
  dialogTitle.value = '定薪/调薪'
  resetForm()
  await nextTick() // 等待弹窗内的调薪模板选择器挂载
  await loadSimpleData()
  if (recordId) {
    dialogTitle.value = '编辑定薪调薪记录'
    selectedTemplateId.value = undefined
    // 获取表单数据
    const record = await SalaryChangeRecordApi.getSalaryChangeRecord(recordId)
    beforeTotal.value = record.beforeTotal || 0
    probationBeforeTotal.value = record.probationBeforeTotal || 0
    formData.value = {
      id: record.id,
      employeeId: record.employeeId || employeeId,
      recordType: record.recordType,
      changeReason: record.changeReason,
      effectTime: record.effectTime,
      remark: record.remark,
      salaryOptions: (record.salaryOptions || []).map((item) => ({ ...item })),
      probationSalaryOptions: (record.probationSalaryOptions || []).map((item) => ({ ...item }))
    }
    resetDraftMaps(formData.value.salaryOptions, formData.value.probationSalaryOptions)
  } else if (employeeId) {
    formData.value.employeeId = employeeId
    await loadSalaryEmployee()
  } else {
    selectDefaultTemplate()
    resetDraftMaps(buildDefaultOptionValues(), buildDefaultOptionValues())
    applySelectedTemplate(false)
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件

/** 提交表单 */
async function submitForm() {
  // 校验表单
  await formRef.value?.validate()
  // 提交请求
  formLoading.value = true
  try {
    await SalaryEmployeeInfoApi.updateSalaryEmployeeInfo(formData.value)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 加载薪资项和调薪模板 */
async function loadSimpleData() {
  const [options, templates, adjustmentMinEffectDate] = await Promise.all([
    SalaryOptionApi.getSalaryOptionSimpleList(true),
    templateSelectRef.value?.init(),
    SalaryEmployeeInfoApi.getSalaryAdjustmentMinEffectDate()
  ])
  salaryOptionList.value = options.filter(
    (item) => item.parentCode !== HrmSalaryOptionCategoryCode.ROOT && item.calculateEnabled
  )
  salaryTemplateList.value = templates || []
  minEffectDate.value = adjustmentMinEffectDate || undefined
  selectDefaultTemplate()
}

/** 创建表单默认值 */
function createDefaultFormData(): SalaryEmployeeInfoApi.SalaryEmployeeInfoUpdateReqVO {
  return {
    employeeId: undefined,
    recordType: HrmSalaryRecordType.FIXED,
    changeReason: HrmSalaryChangeReason.ENTRY_SALARY,
    effectTime: dayjs().startOf('month').valueOf(),
    remark: '',
    salaryOptions: [],
    probationSalaryOptions: []
  }
}

/** 加载员工薪资档案 */
async function loadSalaryEmployee() {
  if (!formData.value.employeeId) {
    return
  }
  formLoading.value = true
  try {
    const salaryEmployee = await SalaryEmployeeInfoApi.getSalaryEmployeeInfo(
      formData.value.employeeId
    )
    if (salaryEmployee?.id) {
      formData.value.recordType = HrmSalaryRecordType.CHANGE
      beforeTotal.value = salaryEmployee.regularSalary || 0
      probationBeforeTotal.value = salaryEmployee.probationSalary || 0
      resetDraftMaps(
        salaryEmployee.salaryOptions?.length
          ? salaryEmployee.salaryOptions
          : buildDefaultOptionValues(),
        salaryEmployee.probationSalaryOptions?.length
          ? salaryEmployee.probationSalaryOptions
          : buildDefaultOptionValues()
      )
    } else {
      formData.value.recordType = HrmSalaryRecordType.FIXED
      beforeTotal.value = 0
      probationBeforeTotal.value = 0
      resetDraftMaps(buildDefaultOptionValues(), buildDefaultOptionValues())
    }
    applySelectedTemplate(false)
  } finally {
    formLoading.value = false
  }
}

/** 构建默认薪资项 */
function buildDefaultOptionValues() {
  return salaryOptionList.value.map((item) => ({
    code: item.code,
    name: item.name,
    value: 0
  }))
}

/** 选中默认调薪模板 */
function selectDefaultTemplate() {
  selectedTemplateId.value = salaryTemplateList.value.find((item) => item.defaultStatus)?.id
}

/** 重置薪资项草稿 */
function resetDraftMaps(
  salaryOptions: SalaryOptionApi.SalaryOptionValueVO[] = [],
  probationSalaryOptions: SalaryOptionApi.SalaryOptionValueVO[] = []
) {
  salaryDraftMap = new Map(
    salaryOptions
      .filter((item) => item.code !== undefined)
      .map((item) => [item.code as number, { ...item }])
  )
  probationDraftMap = new Map(
    probationSalaryOptions
      .filter((item) => item.code !== undefined)
      .map((item) => [item.code as number, { ...item }])
  )
}

/** 同步薪资项草稿 */
function syncDraftMaps() {
  for (const item of formData.value.salaryOptions || []) {
    if (item.code !== undefined) {
      salaryDraftMap.set(item.code, { ...item })
    }
  }
  for (const item of formData.value.probationSalaryOptions || []) {
    if (item.code !== undefined) {
      probationDraftMap.set(item.code, { ...item })
    }
  }
}

/** 获得已选模板的薪资项定义 */
function getSelectedOptionDefinitions(): SalaryChangeTemplateApi.HrmSalaryChangeOptionVO[] {
  const template = salaryTemplateList.value.find((item) => item.id === selectedTemplateId.value)
  if (template?.options?.length) {
    const enabledOptions = new Map(salaryOptionList.value.map((item) => [item.code, item]))
    return template.options
      .filter((item) => enabledOptions.has(item.code))
      .map((item) => ({ code: item.code, name: enabledOptions.get(item.code)!.name }))
  }
  return salaryOptionList.value.map((item) => ({ code: item.code, name: item.name }))
}

/** 构建已选模板的薪资项 */
function buildSelectedOptions(draftMap: Map<number, SalaryOptionApi.SalaryOptionValueVO>) {
  return getSelectedOptionDefinitions()
    .filter((item) => item.code !== undefined)
    .map((item) => {
      const current = draftMap.get(item.code as number)
      return {
        code: item.code,
        name: item.name || current?.name,
        value: current?.value ?? 0
      }
    })
}

/** 应用已选调薪模板 */
function applySelectedTemplate(syncDraft = true) {
  if (syncDraft) {
    syncDraftMaps()
  }
  formData.value.salaryOptions = buildSelectedOptions(salaryDraftMap)
  formData.value.probationSalaryOptions = buildSelectedOptions(probationDraftMap)
}

/** 重置表单 */
function resetForm() {
  formData.value = createDefaultFormData()
  beforeTotal.value = 0
  probationBeforeTotal.value = 0
  selectedTemplateId.value = undefined
  salaryDraftMap = new Map()
  probationDraftMap = new Map()
  formRef.value?.resetFields()
}
</script>
