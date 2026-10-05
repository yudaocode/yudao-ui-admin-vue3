<template>
  <doc-alert
    title="【设置】账套管理、财务参数、财务指标"
    url="https://doc.iocoder.cn/fms/config/account-set/"
  />
  <ContentWrap v-loading="loading">
    <el-form
      v-if="accountSet"
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :disabled="!fmsStore.isAccountSetWritable"
      label-width="120px"
      class="max-w-960px p-[4px_8px_12px]"
    >
      <section class="mb-28px">
        <el-divider content-position="left">基础参数</el-divider>
        <el-form-item label="公司名称">
          <el-input :model-value="accountSet.companyName" disabled class="w-320px! max-w-full" />
        </el-form-item>
        <el-form-item label="本位币">
          <el-input
            :model-value="currency ? `${currency.code} ${currency.name}` : '-'"
            disabled
            class="w-320px! max-w-full"
          />
        </el-form-item>
        <el-form-item label="启用期间">
          <el-date-picker
            :model-value="accountSet.startTime"
            type="month"
            value-format="x"
            format="YYYY-MM"
            disabled
            class="w-320px! max-w-full"
          />
        </el-form-item>
        <el-form-item label="会计制度">
          <el-select v-model="formData.standard" class="w-320px! max-w-full">
            <el-option
              v-for="item in FMS_ACCOUNTING_STANDARD_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </section>

      <template v-if="financeParameter">
        <section class="mb-28px">
          <el-divider content-position="left">科目参数</el-divider>
          <el-form-item label="科目级次" prop="level">
            <div class="flex flex-wrap items-center gap-12px">
              <el-select v-model="formData.level" class="w-160px!" @change="handleLevelChange">
                <el-option
                  v-for="level in levelOptions"
                  :key="level"
                  :label="`${level} 级`"
                  :value="level"
                />
              </el-select>
              <el-text type="warning">科目级次和编码长度调大后不能再调小，请谨慎操作</el-text>
            </div>
          </el-form-item>
          <el-form-item label="编码长度" prop="subjectCodeRules">
            <div class="flex flex-wrap gap-8px">
              <div
                v-for="(_, index) in formData.subjectCodeRules"
                :key="index"
                class="flex items-center gap-8px whitespace-nowrap"
              >
                <el-input-number
                  v-model="formData.subjectCodeRules[index]"
                  :min="getRuleMinimum(index)"
                  :max="FMS_SUBJECT_CODE_LENGTH_MAX"
                  controls-position="right"
                  class="w-72px!"
                />
                <span v-if="index < formData.subjectCodeRules.length - 1">-</span>
              </div>
            </div>
          </el-form-item>
        </section>

        <section class="mb-28px">
          <el-divider content-position="left">账簿</el-divider>
          <el-form-item label="账簿余额方向">
            <el-checkbox
              v-model="formData.ledgerBalanceMode"
              :true-value="FMS_LEDGER_BALANCE_MODE.SAME_AS_SUBJECT"
              :false-value="FMS_LEDGER_BALANCE_MODE.OPPOSITE_TO_SUBJECT"
            >
              与科目方向相同
            </el-checkbox>
          </el-form-item>
          <el-form-item label="结账条件">
            <el-checkbox v-model="formData.voucherReviewRequired">
              凭证审核后才允许结账
            </el-checkbox>
          </el-form-item>
        </section>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="submitForm"
            v-hasPermi="['fms:config:finance-parameter:update']"
            v-if="fmsStore.isAccountSetWritable"
          >
            保存
          </el-button>
        </el-form-item>
      </template>
      <el-alert
        v-else
        :title="
          accountSet.initialized
            ? '当前账套缺少财务参数，请检查初始化数据'
            : '当前账套尚未初始化，请先完成账套初始化'
        "
        type="info"
        show-icon
        :closable="false"
      />
    </el-form>
    <el-empty v-else description="请选择账套" />
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { FmsAccountSetApi } from '@/api/fms/config/account-set'
import type { FmsAccountSetVO } from '@/api/fms/config/account-set'
import { FmsCurrencyApi } from '@/api/fms/config/currency'
import type { FmsCurrencyVO } from '@/api/fms/config/currency'
import { FmsFinanceParameterApi } from '@/api/fms/config/finance-parameter'
import type { FmsFinanceParameterVO } from '@/api/fms/config/finance-parameter'
import { useFmsStore } from '@/views/fms/store/fms'
import {
  FMS_ACCOUNTING_STANDARD_OPTIONS,
  FMS_DEFAULT_SUBJECT_CODE_RULE,
  FMS_DEFAULT_SUBJECT_LEVEL,
  FMS_LEDGER_BALANCE_MODE,
  FMS_SUBJECT_CODE_LENGTH_MAX,
  FMS_SUBJECT_CODE_LENGTH_MIN,
  FMS_SUBJECT_LEVEL_MAX
} from '@/views/fms/utils/constants'

defineOptions({ name: 'FmsFinanceParameter' })

interface FinanceParameterFormData {
  standard: number // 会计制度
  level: number // 科目级次
  subjectCodeRules: number[] // 科目编码规则
  ledgerBalanceMode: number // 账簿余额方向模式
  voucherReviewRequired: boolean // 结账前是否要求凭证审核
}

const message = useMessage() // 消息弹窗
const fmsStore = useFmsStore() // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 页面加载中
const submitLoading = ref(false) // 提交按钮加载中
const accountSet = ref<FmsAccountSetVO>() // 账套信息
const currency = ref<FmsCurrencyVO>() // 本位币信息
const financeParameter = ref<FmsFinanceParameterVO>() // 财务参数
const originalLevel = ref(FMS_DEFAULT_SUBJECT_LEVEL) // 原科目级次
const originalRules = ref(parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE)) // 原科目编码规则
const formData = reactive<FinanceParameterFormData>(createEmptyFormData())
const formRules = reactive<FormRules<FinanceParameterFormData>>({
  standard: [{ required: true, message: '请选择会计制度', trigger: 'change' }],
  level: [{ required: true, message: '请选择科目级次', trigger: 'change' }],
  subjectCodeRules: [{ required: true, message: '请设置各级编码长度', trigger: 'change' }]
})
const formRef = ref<FormInstance>() // 表单 Ref
const levelOptions = computed(() =>
  Array.from(
    { length: FMS_SUBJECT_LEVEL_MAX - originalLevel.value + 1 },
    (_, index) => originalLevel.value + index
  )
)

watch(accountSetId, () => getParameterData())

/** 查询财务参数 */
async function getParameterData() {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) {
    accountSet.value = undefined
    currency.value = undefined
    financeParameter.value = undefined
    resetFormData()
    return
  }

  loading.value = true
  try {
    // 查询账套、财务参数和币别
    const [accountSetData, financeParameterData, currencyList] = await Promise.all([
      FmsAccountSetApi.getAccountSet(currentAccountSetId),
      FmsFinanceParameterApi.getFinanceParameter(currentAccountSetId),
      FmsCurrencyApi.getCurrencySimpleList(currentAccountSetId)
    ])
    if (accountSetId.value !== currentAccountSetId) return

    // 更新基础参数展示数据
    accountSet.value = accountSetData
    currency.value = currencyList.find((item) => item.id === accountSetData.currencyId)
    financeParameter.value = financeParameterData || undefined

    // 回显财务参数
    if (!financeParameterData) {
      resetFormData()
      return
    }
    originalLevel.value = financeParameterData.level
    originalRules.value = parseSubjectCodeRules(financeParameterData.subjectCodeRule)
    Object.assign(formData, {
      standard: accountSetData.standard,
      level: financeParameterData.level,
      subjectCodeRules: [...originalRules.value],
      ledgerBalanceMode: financeParameterData.ledgerBalanceMode,
      voucherReviewRequired: financeParameterData.voucherReviewRequired
    })
  } finally {
    if (accountSetId.value === currentAccountSetId) {
      loading.value = false
    }
  }
}

/** 科目级次变更 */
function handleLevelChange(level: number) {
  while (formData.subjectCodeRules.length < level) {
    formData.subjectCodeRules.push(FMS_SUBJECT_CODE_LENGTH_MIN)
  }
  formData.subjectCodeRules.splice(level)
}

/** 获得编码长度最小值 */
function getRuleMinimum(index: number) {
  return originalRules.value[index] || FMS_SUBJECT_CODE_LENGTH_MIN
}

/** 提交表单 */
async function submitForm() {
  if (!formRef.value || !accountSetId.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  submitLoading.value = true
  try {
    // 更新财务参数
    await FmsFinanceParameterApi.updateFinanceParameter({
      accountSetId: accountSetId.value,
      standard: formData.standard,
      level: formData.level,
      subjectCodeRule: formData.subjectCodeRules.join('-'),
      ledgerBalanceMode: formData.ledgerBalanceMode,
      voucherReviewRequired: formData.voucherReviewRequired
    })

    // 刷新财务参数
    message.success('财务参数保存成功')
    await getParameterData()
  } finally {
    submitLoading.value = false
  }
}

/** 解析科目编码规则 */
function parseSubjectCodeRules(rule: string) {
  return rule.split('-').map(Number)
}

/** 重置表单 */
function resetFormData() {
  originalLevel.value = FMS_DEFAULT_SUBJECT_LEVEL
  originalRules.value = parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE)
  Object.assign(formData, createEmptyFormData())
}

/** 创建表单默认值 */
function createEmptyFormData(): FinanceParameterFormData {
  return {
    standard: FMS_ACCOUNTING_STANDARD_OPTIONS[0].value,
    level: FMS_DEFAULT_SUBJECT_LEVEL,
    subjectCodeRules: parseSubjectCodeRules(FMS_DEFAULT_SUBJECT_CODE_RULE),
    ledgerBalanceMode: FMS_LEDGER_BALANCE_MODE.SAME_AS_SUBJECT,
    voucherReviewRequired: true
  }
}

/** 初始化 */
onMounted(() => {
  getParameterData()
})
</script>
