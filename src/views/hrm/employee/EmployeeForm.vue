<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1040px" align-center>
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="112px"
    >
      <el-tabs v-model="activeTab" class="employee-form-tabs">
        <el-tab-pane label="个人信息" name="personal">
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('name')" :span="12">
              <el-form-item label="员工姓名" prop="name">
                <el-input v-model="formData.name" maxlength="255" placeholder="请输入员工姓名" />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('userId')" :span="12">
              <el-form-item label="绑定用户" prop="userId">
                <UserSelect v-model="formData.userId" placeholder="请选择后台用户" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('mobile')" :span="12">
              <el-form-item label="手机号" prop="mobile">
                <el-input v-model="formData.mobile" maxlength="11" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('email')" :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" maxlength="255" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('country')" :span="12">
              <el-form-item label="国家或地区" prop="country">
                <el-input
                  v-model="formData.country"
                  maxlength="64"
                  placeholder="请输入国家或地区"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('nation')" :span="12">
              <el-form-item label="民族" prop="nation">
                <el-input v-model="formData.nation" maxlength="64" placeholder="请输入民族" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('idType')" :span="12">
              <el-form-item label="证件类型" prop="idType">
                <el-select
                  v-model="formData.idType"
                  clearable
                  placeholder="请选择证件类型"
                  class="!w-1/1"
                >
                  <el-option
                    v-for="item in HrmEmployeeIdTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('idNumber')" :span="12">
              <el-form-item label="证件号码" prop="idNumber">
                <el-input
                  v-model="formData.idNumber"
                  maxlength="255"
                  placeholder="请输入证件号码"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('sex')" :span="12">
              <el-form-item label="性别" prop="sex">
                <el-select v-model="formData.sex" clearable placeholder="请选择性别" class="!w-1/1">
                  <el-option
                    v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('nativePlace')" :span="12">
              <el-form-item label="籍贯" prop="nativePlace">
                <el-input v-model="formData.nativePlace" maxlength="128" placeholder="请输入籍贯" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('birthday')" :span="12">
              <el-form-item label="出生时间" prop="birthday">
                <el-date-picker
                  v-model="formData.birthday"
                  type="datetime"
                  value-format="x"
                  placeholder="请选择出生时间"
                  class="!w-1/1"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('age')" :span="12">
              <el-form-item label="年龄" prop="age">
                <el-input-number
                  v-model="formData.age"
                  :min="0"
                  :max="200"
                  disabled
                  class="!w-1/1"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('highestEducation')" :span="12">
              <el-form-item label="最高学历" prop="highestEducation">
                <el-select
                  v-model="formData.highestEducation"
                  clearable
                  placeholder="请选择最高学历"
                  class="!w-1/1"
                >
                  <el-option
                    v-for="dict in getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_EDUCATION)"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('address')" :span="12">
              <el-form-item label="户籍地址" prop="address">
                <el-input v-model="formData.address" maxlength="255" placeholder="请输入户籍地址" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="入职信息" name="entry">
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('jobNumber')" :span="12">
              <el-form-item label="工号" prop="jobNumber">
                <el-input v-model="formData.jobNumber" maxlength="64" placeholder="请输入工号" />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('entryStatus')" :span="12">
              <el-form-item label="入职状态" prop="entryStatus">
                <el-select
                  v-model="formData.entryStatus"
                  :disabled="!['create', 'candidate'].includes(formType)"
                  placeholder="请选择入职状态"
                  class="!w-1/1"
                >
                  <el-option
                    v-for="dict in entryStatusOptions"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('deptId')" :span="12">
              <el-form-item label="部门" prop="deptId">
                <DeptSelect v-model="formData.deptId" class="!w-1/1" />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('postName')" :span="12">
              <el-form-item label="岗位" prop="postName">
                <el-input v-model="formData.postName" maxlength="255" placeholder="请输入岗位" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('postLevel')" :span="12">
              <el-form-item label="岗位职级" prop="postLevel">
                <el-input
                  v-model="formData.postLevel"
                  maxlength="255"
                  placeholder="请输入岗位职级"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('leaderEmployeeId')" :span="12">
              <el-form-item label="直属上级" prop="leaderEmployeeId">
                <HrmEmployeeSelect
                  v-model="formData.leaderEmployeeId"
                  :disabled-ids="formData.id ? [formData.id] : []"
                  placeholder="请选择直属上级"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('channelId')" :span="12">
              <el-form-item label="招聘渠道" prop="channelId">
                <RecruitChannelSelect v-model="formData.channelId" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('type')" :span="12">
              <el-form-item label="聘用形式" prop="type">
                <el-select
                  v-model="formData.type"
                  :disabled="formType === 'update'"
                  placeholder="请选择聘用形式"
                  class="!w-1/1"
                  @change="handleTypeChange"
                >
                  <el-option
                    v-for="dict in getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_TYPE)"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('status')" :span="12">
              <el-form-item label="员工状态" prop="status">
                <el-input
                  v-if="formData.type === HrmEmployeeType.FORMAL"
                  :model-value="getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, formData.status) || '-'"
                  disabled
                  placeholder="保存后自动计算"
                />
                <el-select
                  v-else
                  v-model="formData.status"
                  :disabled="formType === 'update'"
                  placeholder="请选择员工状态"
                  class="!w-1/1"
                >
                  <el-option
                    v-for="dict in nonFormalStatusOptions"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('entryTime')" :span="12">
              <el-form-item label="入职时间" prop="entryTime">
                <el-date-picker
                  v-model="formData.entryTime"
                  type="datetime"
                  value-format="x"
                  :disabled-date="
                    formType === 'confirm' || formType === 'rehire' ? disableFutureDate : undefined
                  "
                  placeholder="请选择入职时间"
                  class="!w-1/1"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('probation')" :span="12">
              <el-form-item label="试用期（月）" prop="probation">
                <div class="w-full">
                  <el-input-number
                    v-model="formData.probation"
                    :min="0"
                    :max="6"
                    :disabled="formType === 'update' || formData.type !== HrmEmployeeType.FORMAL"
                    class="!w-1/1"
                  />
                  <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
                    0 表示无试用期；转正时间按入职时间 + 试用期月数计算。
                  </div>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('regularTime')" :span="12">
              <el-form-item label="转正时间" prop="regularTime">
                <el-date-picker
                  v-model="formData.regularTime"
                  type="datetime"
                  value-format="x"
                  disabled
                  placeholder="保存后自动计算"
                  class="!w-1/1"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('leaveTime')" :span="12">
              <el-form-item label="离职时间" prop="leaveTime">
                <el-date-picker
                  v-model="formData.leaveTime"
                  type="datetime"
                  value-format="x"
                  disabled
                  placeholder="由离职流程维护"
                  class="!w-1/1"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('companyAgeStartTime')" :span="12">
              <el-form-item label="司龄起算时间" prop="companyAgeStartTime">
                <el-date-picker
                  v-model="formData.companyAgeStartTime"
                  type="datetime"
                  value-format="x"
                  placeholder="默认使用入职时间"
                  class="!w-1/1"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('companyAge')" :span="12">
              <el-form-item label="司龄（年）" prop="companyAge">
                <el-input-number v-model="formData.companyAge" :min="0" disabled class="!w-1/1" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('workCity')" :span="12">
              <el-form-item label="工作城市" prop="workCity">
                <el-input v-model="formData.workCity" maxlength="64" placeholder="请输入工作城市" />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('workAddress')" :span="12">
              <el-form-item label="工作地点" prop="workAddress">
                <el-input
                  v-model="formData.workAddress"
                  maxlength="255"
                  placeholder="请输入工作地点"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col v-if="isFieldVisible('workDetailAddress')" :span="12">
              <el-form-item label="工作详细地址" prop="workDetailAddress">
                <el-input
                  v-model="formData.workDetailAddress"
                  maxlength="255"
                  placeholder="请输入工作详细地址"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="isFieldVisible('candidateId')" :span="12">
              <el-form-item label="招聘候选人" prop="candidateId">
                <el-input
                  v-model="formData.candidateId"
                  disabled
                  placeholder="由招聘转入时自动关联"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item v-if="isFieldVisible('remark')" label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    <template #footer>
      <el-button type="primary" :loading="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'

import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import * as EmployeeApi from '@/api/hrm/employee'
import * as EmployeeConfigApi from '@/api/hrm/employee/config'
import * as RecruitCandidateApi from '@/api/hrm/recruit/candidate'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import RecruitChannelSelect from '@/views/hrm/recruit/channel/components/RecruitChannelSelect.vue'
import HrmEmployeeSelect from './components/HrmEmployeeSelect.vue'
import {
  HrmEmployeeIdTypeOptions,
  HrmEmployeeType,
  HrmEmployeeEntryStatus,
  HrmEmployeeIdType,
  HrmEmployeeStatus,
  HRM_EMPLOYEE_CREATE_ENTRY_STATUSES,
  HRM_EMPLOYEE_NO_PROBATION_MONTHS,
  HRM_EMPLOYEE_NON_FORMAL_STATUSES
} from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmEmployeeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；candidate - 候选人转员工
const formData = ref<EmployeeApi.HrmEmployeeVO>(createDefaultFormData()) // 表单数据
const formRules: FormRules = {
  name: [{ required: true, message: '员工姓名不能为空', trigger: 'blur' }],
  jobNumber: [
    {
      validator: (_rule, value, callback) => {
        if (formData.value.entryStatus === HrmEmployeeEntryStatus.ACTIVE && !value?.trim()) {
          callback(new Error('在职员工工号不能为空'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  mobile: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  entryStatus: [{ required: true, message: '请选择入职状态', trigger: 'change' }],
  type: [{ required: true, message: '请选择聘用形式', trigger: 'change' }],
  entryTime: [{ required: true, message: '请选择入职时间', trigger: 'change' }],
  probation: [
    {
      validator: (_rule, value, callback) => {
        if (formData.value.type === HrmEmployeeType.FORMAL && value == null) {
          callback(new Error('请输入试用期'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  status: [
    {
      validator: (_rule, value, callback) => {
        if (formData.value.type === HrmEmployeeType.INFORMAL && value == null) {
          callback(new Error('请选择员工状态'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]
} // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref
const activeTab = ref('personal') // 当前选中的页签
const createFieldVisibleMap = ref<Record<number, Set<string>>>({}) // 新建员工字段配置
const entryStatusOptions = computed(() => {
  const options = getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS)
  if (formType.value === 'update') {
    return options
  }
  return options.filter((item) =>
    (HRM_EMPLOYEE_CREATE_ENTRY_STATUSES as readonly number[]).includes(Number(item.value))
  )
})
const nonFormalStatusOptions = computed(() =>
  getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_STATUS).filter((item) =>
    (HRM_EMPLOYEE_NON_FORMAL_STATUSES as readonly number[]).includes(Number(item.value))
  )
)

/** 创建默认表单数据 */
function createDefaultFormData(): EmployeeApi.HrmEmployeeVO {
  return {
    id: undefined,
    name: '',
    jobNumber: '',
    userId: undefined,
    mobile: '',
    country: '中国',
    nation: '',
    idType: HrmEmployeeIdType.ID_CARD,
    idNumber: '',
    sex: undefined,
    email: '',
    nativePlace: '',
    birthday: undefined,
    age: undefined,
    address: '',
    highestEducation: undefined,
    deptId: undefined,
    leaderEmployeeId: undefined,
    entryStatus: HrmEmployeeEntryStatus.ACTIVE,
    status: undefined,
    type: HrmEmployeeType.FORMAL,
    entryTime: undefined,
    probation: HRM_EMPLOYEE_NO_PROBATION_MONTHS,
    regularTime: undefined,
    leaveTime: undefined,
    postName: '',
    postLevel: '',
    workCity: '',
    workAddress: '',
    workDetailAddress: '',
    channelId: undefined,
    companyAgeStartTime: undefined,
    companyAge: undefined,
    candidateId: undefined,
    remark: ''
  }
}

/** 判断字段是否显示 */
function isFieldVisible(name: string) {
  if (formType.value === 'update') {
    return true
  }
  const entryStatus = formData.value.entryStatus || HrmEmployeeEntryStatus.ACTIVE
  const visibleFields = createFieldVisibleMap.value[entryStatus]
  return !visibleFields || visibleFields.has(name)
}

/** 加载新建员工字段配置 */
async function loadCreateFieldConfig() {
  const [activeFields, pendingEntryFields] = await Promise.all([
    EmployeeConfigApi.getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.ACTIVE),
    EmployeeConfigApi.getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.PENDING_ENTRY)
  ])
  createFieldVisibleMap.value = {
    [HrmEmployeeEntryStatus.ACTIVE]: new Set(
      activeFields.filter((field) => field.visible).map((field) => field.name)
    ),
    [HrmEmployeeEntryStatus.PENDING_ENTRY]: new Set(
      pendingEntryFields.filter((field) => field.visible).map((field) => field.name)
    )
  }
}

/** 打开弹窗 */
async function open(type: string, id?: number, defaultData?: Partial<EmployeeApi.HrmEmployeeVO>) {
  dialogVisible.value = true
  dialogTitle.value =
    type === 'confirm'
      ? '确认入职'
      : type === 'rehire'
        ? '办理再入职'
        : type === 'candidate'
          ? '候选人转员工'
          : t('action.' + type)
  formType.value = type
  activeTab.value = 'personal'
  resetForm()
  formLoading.value = true
  try {
    const [employee] = await Promise.all([
      id ? EmployeeApi.getEmployee(id) : Promise.resolve(undefined),
      type !== 'update' ? loadCreateFieldConfig() : Promise.resolve()
    ])
    if (employee) {
      formData.value = employee
      if (type === 'confirm') {
        formData.value.entryStatus = HrmEmployeeEntryStatus.ACTIVE
        if (!formData.value.entryTime || Number(formData.value.entryTime) > Date.now()) {
          const entryTime = Date.now()
          formData.value.entryTime = entryTime
          formData.value.regularTime = undefined
          if (
            !formData.value.companyAgeStartTime ||
            Number(formData.value.companyAgeStartTime) > entryTime
          ) {
            formData.value.companyAgeStartTime = entryTime
          }
        }
      } else if (type === 'rehire') {
        const entryTime = Date.now()
        formData.value = {
          ...formData.value,
          entryStatus: HrmEmployeeEntryStatus.ACTIVE,
          entryTime,
          companyAgeStartTime: entryTime,
          regularTime: undefined,
          leaveTime: undefined,
          probation: HRM_EMPLOYEE_NO_PROBATION_MONTHS
        }
        handleTypeChange(formData.value.type)
      }
    } else if (defaultData) {
      formData.value = {
        ...formData.value,
        ...defaultData
      }
      handleTypeChange(formData.value.type)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 确认入职和再入职不允许选择未来时间 */
function disableFutureDate(date: Date) {
  return date.getTime() > new Date().setHours(23, 59, 59, 999)
}

/** 切换聘用形式 */
function handleTypeChange(type?: number) {
  if (type === HrmEmployeeType.FORMAL) {
    formData.value.probation ??= HRM_EMPLOYEE_NO_PROBATION_MONTHS
    if (
      formData.value.status !== HrmEmployeeStatus.REGULAR &&
      formData.value.status !== HrmEmployeeStatus.PROBATION
    ) {
      formData.value.status = undefined
    }
    return
  }
  formData.value.probation = undefined
  formData.value.regularTime = undefined
  if (!nonFormalStatusOptions.value.some((item) => Number(item.value) === formData.value.status)) {
    formData.value.status = HrmEmployeeStatus.INTERN
  }
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value || !(await formRef.value.validate())) {
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    const submitData = buildSubmitData()
    if (formType.value === 'create') {
      await EmployeeApi.createEmployee(submitData)
      message.success(t('common.createSuccess'))
    } else if (formType.value === 'candidate') {
      await RecruitCandidateApi.convertRecruitCandidateToEmployee(
        submitData as RecruitCandidateApi.HrmRecruitCandidateEntryReqVO
      )
      message.success(t('common.createSuccess'))
    } else if (formType.value === 'confirm') {
      await EmployeeApi.confirmEmployeeEntry(submitData)
      message.success('已确认入职')
    } else if (formType.value === 'rehire') {
      await EmployeeApi.rehireEmployee({
        ...submitData,
        employeeId: formData.value.id
      })
      message.success('再入职办理成功')
    } else {
      await EmployeeApi.updateEmployee(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 按当前字段配置构造提交数据，避免隐藏字段旧值随请求提交 */
function buildSubmitData() {
  if (formType.value === 'update') {
    return formData.value
  }
  const entryStatus = formData.value.entryStatus || HrmEmployeeEntryStatus.ACTIVE
  const visibleFields = createFieldVisibleMap.value[entryStatus]
  if (!visibleFields) {
    return formData.value
  }
  const submitData: Partial<EmployeeApi.HrmEmployeeVO> = {}
  Object.entries(formData.value).forEach(([name, value]) => {
    if (visibleFields.has(name)) {
      submitData[name] = value
    }
  })
  if (formType.value === 'confirm' || formType.value === 'rehire') {
    submitData.id = formData.value.id
  } else if (formType.value === 'candidate') {
    submitData.candidateId = formData.value.candidateId
  }
  return submitData as EmployeeApi.HrmEmployeeVO
}

/** 重置表单 */
function resetForm() {
  formData.value = createDefaultFormData()
  formRef.value?.resetFields()
}
</script>

<style scoped>
.employee-form-tabs :deep(.el-tabs__content) {
  max-height: calc(100vh - 270px);
  padding-right: 8px;
  overflow-y: auto;
}
</style>
