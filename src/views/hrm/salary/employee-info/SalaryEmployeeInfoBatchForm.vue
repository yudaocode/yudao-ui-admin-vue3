<template>
  <Dialog v-model="dialogVisible" width="980px" title="批量调薪">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="104px"
    >
      <!-- 调薪信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门范围">
            <DeptSelect
              v-model="formData.deptIds"
              class="!w-1/1"
              multiple
              placeholder="请选择调薪部门"
              @change="formRef?.validateField('employeeIds')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="指定员工" prop="employeeIds">
            <HrmEmployeeSelect
              v-model="formData.employeeIds"
              class="!w-1/1"
              multiple
              placeholder="请选择调薪员工"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
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
        <el-col :span="12">
          <el-form-item label="生效日期" prop="effectTime">
            <el-date-picker
              v-model="formData.effectTime"
              :disabled-date="disabledEffectDate"
              class="!w-1/1"
              type="date"
              value-format="x"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-alert
        v-if="isPendingChange()"
        :closable="false"
        class="mb-16px"
        show-icon
        title="批量调整将在生效日期前保持待生效，不会提前修改所选员工的薪资档案。"
        type="warning"
      />

      <!-- 调薪方式 -->
      <el-form-item label="调薪方式" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio :value="HrmSalaryBatchAdjustType.PERCENT">按比例调薪</el-radio>
          <el-radio :value="HrmSalaryBatchAdjustType.AMOUNT">按金额调薪</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 调薪项 -->
      <el-table :data="formData.salaryOptions" border max-height="260">
        <el-table-column label="调薪项" min-width="180" prop="name" />
        <el-table-column align="center" label="编码" prop="code" width="120" />
        <el-table-column
          align="center"
          :label="formData.type === HrmSalaryBatchAdjustType.PERCENT ? '调薪比例' : '调薪金额'"
          width="240"
        >
          <template #default="scope">
            <div class="flex items-center justify-center">
              <el-input-number
                v-model="scope.row.value"
                :controls="false"
                :max="formData.type === HrmSalaryBatchAdjustType.PERCENT ? 9999.99 : 9999999.99"
                :precision="2"
                class="!w-180px"
              />
              <span class="ml-8px w-16px text-left">
                {{ formData.type === HrmSalaryBatchAdjustType.PERCENT ? '%' : '元' }}
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-form-item class="mt-16px" label="备注" prop="remark">
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
import * as SalaryEmployeeInfoApi from '@/api/hrm/salary/employee-info'
import * as SalaryOptionApi from '@/api/hrm/salary/config/option'
import HrmEmployeeSelect from '@/views/hrm/employee/components/HrmEmployeeSelect.vue'
import {
  HrmSalaryBatchAdjustType,
  HrmSalaryChangeReason,
  HrmSalaryOptionCategoryCode
} from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmSalaryEmployeeInfoBatchForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单提交中
const minEffectDate = ref<string>() // 最早调薪生效日期
const formData =
  ref<SalaryEmployeeInfoApi.SalaryEmployeeInfoUpdateListReqVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  employeeIds: [
    {
      validator: (_rule, _value, callback) => {
        if (formData.value.employeeIds.length > 0 || formData.value.deptIds.length > 0) {
          callback()
          return
        }
        callback(new Error('至少需要选择一个部门或员工'))
      },
      trigger: 'change'
    }
  ],
  type: [{ required: true, message: '调薪方式不能为空', trigger: 'change' }],
  changeReason: [{ required: true, message: '调整原因不能为空', trigger: 'change' }],
  effectTime: [{ required: true, message: '生效日期不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单

/** 创建表单默认值 */
function createDefaultFormData(): SalaryEmployeeInfoApi.SalaryEmployeeInfoUpdateListReqVO {
  return {
    employeeIds: [],
    deptIds: [],
    type: HrmSalaryBatchAdjustType.PERCENT,
    changeReason: HrmSalaryChangeReason.ENTRY_SALARY,
    effectTime: dayjs().startOf('day').valueOf(),
    remark: '',
    salaryOptions: []
  }
}

/** 是否为待生效调薪 */
function isPendingChange() {
  return dayjs(formData.value.effectTime).isAfter(dayjs(), 'day')
}

/** 判断调薪生效日期是否不可选 */
function disabledEffectDate(date: Date) {
  return !!minEffectDate.value && dayjs(date).isBefore(dayjs(minEffectDate.value), 'day')
}

/** 打开弹窗 */
async function open(employeeIds: number[]) {
  formData.value = createDefaultFormData()
  formData.value.employeeIds = [...employeeIds]
  dialogVisible.value = true
  formLoading.value = true
  try {
    const [options, adjustmentMinEffectDate] = await Promise.all([
      SalaryOptionApi.getSalaryOptionSimpleList(true),
      SalaryEmployeeInfoApi.getSalaryAdjustmentMinEffectDate()
    ])
    formData.value.salaryOptions = options
      .filter((option) => option.parentCode === HrmSalaryOptionCategoryCode.BASIC_SALARY)
      .map((option) => ({ code: option.code, name: option.name, value: 0 }))
    minEffectDate.value = adjustmentMinEffectDate || undefined
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件

/** 提交批量调薪 */
async function submitForm() {
  // 校验表单
  await formRef.value?.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = await SalaryEmployeeInfoApi.updateSalaryEmployeeInfoList(formData.value)
    const successCount = data.successEmployeeIds.length
    const failureCount = Object.keys(data.failureEmployeeReasons).length
    const content = `批量调薪完成：成功 ${successCount} 人，失败 ${failureCount} 人`
    if (failureCount === 0) {
      message.success(content)
    } else if (successCount > 0) {
      message.warning(content)
    } else {
      message.error(content)
    }
    if (successCount > 0) {
      dialogVisible.value = false
      // 发送操作成功的事件
      emit('success')
    }
  } finally {
    formLoading.value = false
  }
}
</script>
