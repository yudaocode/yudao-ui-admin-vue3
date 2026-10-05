<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1120">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <div class="section-title">基本信息</div>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="考勤组名称" prop="name">
            <el-input v-model="formData.name" maxlength="50" placeholder="请输入考勤组名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="适用部门" prop="deptIds">
            <DeptSelect
              v-model="formData.deptIds"
              multiple
              placeholder="请选择部门"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="适用员工" prop="employeeIds">
            <HrmEmployeeSelect
              v-model="formData.employeeIds"
              class="!w-1/1"
              multiple
              placeholder="请选择员工"
              title="选择考勤组员工"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="section-title">考勤规则</div>
      <el-form-item label="规则类型">
        <el-radio :model-value="1" :value="1">早晚打卡</el-radio>
      </el-form-item>
      <el-form-item label="班次">
        <div class="w-1/1">
          <div class="mb-12px text-right">
            <el-button @click="openShiftForm()">
              <Icon icon="ep:plus" class="mr-5px" /> 新增班次
            </el-button>
          </div>
          <el-table :data="formData.shifts" border>
            <el-table-column label="工作日" min-width="220">
              <template #default="scope">
                {{ formatHrmAttendanceWeeks(scope.row.weeks) }}
              </template>
            </el-table-column>
            <el-table-column label="上下班时间" min-width="180">
              <template #default="scope">
                {{ scope.row.startTime }} - {{ scope.row.endTime }}
              </template>
            </el-table-column>
            <el-table-column label="打卡时间段" min-width="310">
              <template #default="scope">
                {{ scope.row.clockInStartTime }} - {{ scope.row.clockInEndTime }} /
                {{ scope.row.clockOutStartTime }} - {{ scope.row.clockOutEndTime }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button link type="primary" @click="openShiftForm(scope.$index)">编辑</el-button>
                <el-button link type="danger" @click="removeShift(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>
      <el-form-item label="节假日">
        <el-checkbox v-model="formData.rest">法定节假日休息</el-checkbox>
      </el-form-item>
      <el-form-item label="特殊日期">
        <div class="w-1/1">
          <div class="mb-12px text-right">
            <el-button @click="openSpecialDateForm()">
              <Icon icon="ep:plus" class="mr-5px" /> 添加日期
            </el-button>
          </div>
          <el-table :data="formData.specialDates" border>
            <el-table-column label="日期" min-width="180">
              <template #default="scope">
                {{ formatDate(scope.row.date, 'YYYY-MM-DD') }}
              </template>
            </el-table-column>
            <el-table-column label="上下班时间" min-width="220">
              <template #default="scope">
                {{ formatHrmAttendanceSpecialDate(scope.row, formData.shifts) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button link type="primary" @click="openSpecialDateForm(scope.$index)">
                  编辑
                </el-button>
                <el-button link type="danger" @click="removeSpecialDate(scope.$index)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>

      <div class="section-title">打卡方式</div>
      <el-form-item label="定位打卡">
        <div class="w-1/1">
          <div class="mb-12px flex items-center gap-16px">
            <el-checkbox v-model="formData.openPointCard">关联打卡地址</el-checkbox>
            <el-button :disabled="!formData.openPointCard" @click="openPointForm()">
              <Icon icon="ep:plus" class="mr-5px" /> 新增打卡地址
            </el-button>
          </div>
          <el-table v-if="formData.openPointCard" :data="formData.points" border>
            <el-table-column prop="name" label="地点名称" min-width="150" />
            <el-table-column
              prop="address"
              label="打卡地址"
              min-width="260"
              show-overflow-tooltip
            />
            <el-table-column label="经纬度" min-width="220">
              <template #default="scope">
                {{ formatPointCoordinate(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column prop="radius" label="范围(米)" width="110" />
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button link type="primary" @click="openPointForm(scope.$index)">编辑</el-button>
                <el-button link type="danger" @click="removePoint(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>
      <el-form-item label="WiFi 打卡">
        <div class="w-1/1">
          <div class="mb-12px flex items-center gap-16px">
            <el-checkbox v-model="formData.openWifiCard">关联打卡 WiFi</el-checkbox>
            <el-button :disabled="!formData.openWifiCard" @click="openWifiForm()">
              <Icon icon="ep:plus" class="mr-5px" /> 新增打卡 WiFi
            </el-button>
          </div>
          <el-table v-if="formData.openWifiCard" :data="formData.wifis" border>
            <el-table-column prop="ssid" label="WiFi 名称" min-width="220" />
            <el-table-column prop="mac" label="MAC 地址" min-width="220" />
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button link type="primary" @click="openWifiForm(scope.$index)">编辑</el-button>
                <el-button link type="danger" @click="removeWifi(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>

      <div class="section-title">扣款规则</div>
      <el-alert
        class="mb-16px"
        :closable="false"
        type="info"
        show-icon
        title="扣款金额右侧单位随规则变化：按分钟为元/分钟，按次数为元/次，每月固定为元/月，旷工按元/天。"
      />
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="迟到规则" prop="deductRule.lateMethod">
            <el-select v-model="formData.deductRule.lateMethod" class="!w-1/1">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.HRM_ATTENDANCE_LATE_EARLY_DEDUCT_METHOD)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="迟到计算方式" prop="deductRule.lateDeductMoney">
            <div class="flex w-1/1 items-center gap-10px">
              <el-input-number
                v-model="formData.deductRule.lateDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>元/{{ formatHrmAttendanceDeductUnit(formData.deductRule.lateMethod) }}</span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="早退规则" prop="deductRule.earlyMethod">
            <el-select v-model="formData.deductRule.earlyMethod" class="!w-1/1">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.HRM_ATTENDANCE_LATE_EARLY_DEDUCT_METHOD)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="早退计算方式" prop="deductRule.earlyDeductMoney">
            <div class="flex w-1/1 items-center gap-10px">
              <el-input-number
                v-model="formData.deductRule.earlyDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>元/{{ formatHrmAttendanceDeductUnit(formData.deductRule.earlyMethod) }}</span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="旷工规则" prop="deductRule.absenteeismMethod">
            <el-select v-model="formData.deductRule.absenteeismMethod" class="!w-1/1">
              <el-option
                v-for="item in getIntDictOptions(
                  DICT_TYPE.HRM_ATTENDANCE_ABSENTEEISM_DEDUCT_METHOD
                )"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="旷工计算方式" prop="deductRule.absenteeismDeductMoney">
            <div class="flex w-1/1 items-center gap-10px">
              <el-input-number
                v-model="formData.deductRule.absenteeismDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>元/天</span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="缺卡规则" prop="deductRule.misscardMethod">
            <el-select v-model="formData.deductRule.misscardMethod" class="!w-1/1">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.HRM_ATTENDANCE_MISSCARD_DEDUCT_METHOD)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="缺卡计算方式" prop="deductRule.misscardDeductMoney">
            <div class="flex w-1/1 items-center gap-10px">
              <el-input-number
                v-model="formData.deductRule.misscardDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>元/次</span>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <AttendanceGroupShiftForm ref="shiftFormRef" @confirm="handleShiftConfirm" />
  <AttendanceGroupSpecialDateForm ref="specialDateFormRef" @confirm="handleSpecialDateConfirm" />
  <AttendanceGroupPointForm ref="pointFormRef" @confirm="handlePointConfirm" />
  <AttendanceGroupWifiForm ref="wifiFormRef" @confirm="handleWifiConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as AttendanceGroupApi from '@/api/hrm/attendance/group'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import HrmEmployeeSelect from '@/views/hrm/employee/components/HrmEmployeeSelect.vue'
import {
  HrmAttendanceAbsenteeismDeductMethod,
  HrmAttendanceLateEarlyDeductMethod,
  HrmAttendanceMisscardDeductMethod,
  HRM_ATTENDANCE_POINT_RADIUS_OPTIONS
} from '@/views/hrm/utils/constants'
import {
  formatHrmAttendanceDeductUnit,
  formatHrmAttendanceSpecialDate,
  formatHrmAttendanceWeeks
} from '@/views/hrm/utils/format'
import AttendanceGroupPointForm from './AttendanceGroupPointForm.vue'
import AttendanceGroupShiftForm from './AttendanceGroupShiftForm.vue'
import AttendanceGroupSpecialDateForm from './AttendanceGroupSpecialDateForm.vue'
import AttendanceGroupWifiForm from './AttendanceGroupWifiForm.vue'

/** 考勤组表单 */
defineOptions({ name: 'HrmAttendanceGroupForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

type AttendanceGroupFormData = AttendanceGroupApi.HrmAttendanceGroupVO & {
  deductRule: AttendanceGroupApi.HrmAttendanceDeductRule
}

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<AttendanceGroupFormData>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '考勤组名称不能为空', trigger: 'blur' }],
  deptIds: [{ validator: validateScope, trigger: 'change' }],
  employeeIds: [{ validator: validateScope, trigger: 'change' }],
  'deductRule.lateMethod': [{ required: true, message: '请选择迟到规则', trigger: 'change' }],
  'deductRule.lateDeductMoney': [
    { required: true, message: '请输入迟到扣款金额', trigger: 'blur' }
  ],
  'deductRule.earlyMethod': [{ required: true, message: '请选择早退规则', trigger: 'change' }],
  'deductRule.earlyDeductMoney': [
    { required: true, message: '请输入早退扣款金额', trigger: 'blur' }
  ],
  'deductRule.absenteeismMethod': [
    { required: true, message: '请选择旷工规则', trigger: 'change' }
  ],
  'deductRule.absenteeismDeductMoney': [
    { required: true, message: '请输入旷工扣款金额', trigger: 'blur' }
  ],
  'deductRule.misscardMethod': [{ required: true, message: '请选择缺卡规则', trigger: 'change' }],
  'deductRule.misscardDeductMoney': [
    { required: true, message: '请输入缺卡扣款金额', trigger: 'blur' }
  ]
})
const formRef = ref<FormInstance>() // 表单 Ref
const shiftFormRef = ref<InstanceType<typeof AttendanceGroupShiftForm>>() // 班次表单 Ref
const specialDateFormRef = ref<InstanceType<typeof AttendanceGroupSpecialDateForm>>() // 特殊日期表单 Ref
const pointFormRef = ref<InstanceType<typeof AttendanceGroupPointForm>>() // 打卡地点表单 Ref
const wifiFormRef = ref<InstanceType<typeof AttendanceGroupWifiForm>>() // 打卡 WiFi 表单 Ref
const currentShiftIndex = ref<number>() // 当前班次下标
const currentSpecialDateIndex = ref<number>() // 当前特殊日期下标
const currentPointIndex = ref<number>() // 当前考勤地点下标
const currentWifiIndex = ref<number>() // 当前 WiFi 下标

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (!id) {
    return
  }
  formLoading.value = true
  try {
    // 获取表单数据
    const data = await AttendanceGroupApi.getAttendanceGroup(id)
    formData.value = {
      ...createDefaultFormData(),
      ...data
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
async function submitForm() {
  // 校验表单
  await formRef.value?.validate()
  if (!formData.value.shifts?.length) {
    message.warning('请至少新增一个班次')
    return
  }
  if (!validateCardSettings()) {
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      points: formData.value.openPointCard ? formData.value.points : [],
      wifis: formData.value.openWifiCard ? formData.value.wifis : []
    }
    if (formType.value === 'create') {
      await AttendanceGroupApi.createAttendanceGroup(data)
      message.success(t('common.createSuccess'))
    } else {
      await AttendanceGroupApi.updateAttendanceGroup(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 打开班次表单 */
function openShiftForm(index?: number) {
  currentShiftIndex.value = index
  shiftFormRef.value?.open(index === undefined ? undefined : formData.value.shifts?.[index])
}

/** 保存班次 */
function handleShiftConfirm(shift: AttendanceGroupApi.HrmAttendanceShift) {
  const duplicatedWeek = formData.value.shifts?.some(
    (item, index) =>
      index !== currentShiftIndex.value && item.weeks.some((week) => shift.weeks.includes(week))
  )
  if (duplicatedWeek) {
    message.warning('同一个工作日只能配置一个班次')
    return
  }
  if (currentShiftIndex.value === undefined) {
    formData.value.shifts?.push(shift)
  } else {
    formData.value.shifts?.splice(currentShiftIndex.value, 1, shift)
  }
}

/** 删除班次 */
function removeShift(index: number) {
  formData.value.shifts?.splice(index, 1)
}

/** 打开特殊日期表单 */
function openSpecialDateForm(index?: number) {
  currentSpecialDateIndex.value = index
  specialDateFormRef.value?.open(
    index === undefined ? undefined : formData.value.specialDates?.[index]
  )
}

/** 保存特殊日期 */
function handleSpecialDateConfirm(specialDate: AttendanceGroupApi.HrmAttendanceSpecialDate) {
  const duplicatedDate = formData.value.specialDates?.some(
    (item, index) =>
      index !== currentSpecialDateIndex.value && Number(item.date) === Number(specialDate.date)
  )
  if (duplicatedDate) {
    message.warning('特殊日期不能重复')
    return
  }
  if (currentSpecialDateIndex.value === undefined) {
    formData.value.specialDates?.push(specialDate)
  } else {
    formData.value.specialDates?.splice(currentSpecialDateIndex.value, 1, specialDate)
  }
}

/** 删除特殊日期 */
function removeSpecialDate(index: number) {
  formData.value.specialDates?.splice(index, 1)
}

/** 格式化打卡地点经纬度 */
function formatPointCoordinate(point: AttendanceGroupApi.HrmAttendancePoint) {
  if (point.longitude === undefined || point.latitude === undefined) {
    return '-'
  }
  return `${point.longitude}, ${point.latitude}`
}

/** 打开打卡地点表单 */
function openPointForm(index?: number) {
  currentPointIndex.value = index
  pointFormRef.value?.open(index === undefined ? undefined : formData.value.points?.[index])
}

/** 保存打卡地点 */
function handlePointConfirm(point: AttendanceGroupApi.HrmAttendancePoint) {
  if (currentPointIndex.value === undefined) {
    formData.value.points?.push(point)
  } else {
    formData.value.points?.splice(currentPointIndex.value, 1, point)
  }
}

/** 删除定位地点 */
function removePoint(index: number) {
  formData.value.points?.splice(index, 1)
}

/** 打开打卡 WiFi 表单 */
function openWifiForm(index?: number) {
  currentWifiIndex.value = index
  wifiFormRef.value?.open(index === undefined ? undefined : formData.value.wifis?.[index])
}

/** 保存打卡 WiFi */
function handleWifiConfirm(wifi: AttendanceGroupApi.HrmAttendanceWifi) {
  if (currentWifiIndex.value === undefined) {
    formData.value.wifis?.push(wifi)
  } else {
    formData.value.wifis?.splice(currentWifiIndex.value, 1, wifi)
  }
}

/** 删除 WiFi */
function removeWifi(index: number) {
  formData.value.wifis?.splice(index, 1)
}

/** 校验考勤组适用范围 */
function validateScope(_: unknown, __: unknown, callback: (error?: Error) => void) {
  callback(
    formData.value.deptIds?.length || formData.value.employeeIds?.length
      ? undefined
      : new Error('至少选择一个适用部门或员工')
  )
}

/** 校验已开启打卡方式的配置是否完整 */
function validateCardSettings() {
  if (!formData.value.openPointCard && !formData.value.openWifiCard) {
    message.warning('请至少启用定位打卡或 WiFi 打卡')
    return false
  }
  if (formData.value.openPointCard) {
    const points = formData.value.points || []
    const invalidPoint =
      points.length === 0 ||
      points.some(
        (point) =>
          !point.name?.trim() ||
          !point.address?.trim() ||
          point.latitude === undefined ||
          point.longitude === undefined ||
          !Number.isFinite(point.latitude) ||
          point.latitude < -90 ||
          point.latitude > 90 ||
          !Number.isFinite(point.longitude) ||
          point.longitude < -180 ||
          point.longitude > 180 ||
          !point.radius ||
          !HRM_ATTENDANCE_POINT_RADIUS_OPTIONS.some((radius) => radius === point.radius)
      )
    if (invalidPoint) {
      message.warning('请完整填写定位地点、地址、有效经纬度和打卡范围')
      return false
    }
  }
  if (formData.value.openWifiCard) {
    const wifis = formData.value.wifis || []
    const macPattern = /^((([0-9a-f]{2}:){5})|(([0-9a-f]{2}-){5}))[0-9a-f]{2}$/i
    if (
      wifis.length === 0 ||
      wifis.some((wifi) => !wifi.ssid?.trim() || !wifi.mac || !macPattern.test(wifi.mac))
    ) {
      message.warning('请完整填写 WiFi 名称和正确的 MAC 地址')
      return false
    }
  }
  return true
}

/** 重置表单 */
function resetForm() {
  formData.value = createDefaultFormData()
  currentShiftIndex.value = undefined
  currentSpecialDateIndex.value = undefined
  currentPointIndex.value = undefined
  currentWifiIndex.value = undefined
  formRef.value?.resetFields()
}

/** 创建默认考勤组表单数据 */
function createDefaultFormData(): AttendanceGroupFormData {
  return {
    id: undefined,
    name: '',
    openPointCard: false,
    openWifiCard: false,
    rest: true,
    deptIds: [],
    employeeIds: [],
    shifts: [
      {
        weeks: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
        clockInStartTime: '05:00',
        clockInEndTime: '17:59',
        clockOutStartTime: '09:01',
        clockOutEndTime: '04:59',
        restStartTime: '12:00',
        restEndTime: '13:00',
        excludeRestTime: false
      }
    ],
    specialDates: [],
    points: [],
    wifis: [],
    deductRule: createDefaultDeductRule()
  }
}

/** 创建默认扣款规则 */
function createDefaultDeductRule(): AttendanceGroupApi.HrmAttendanceDeductRule {
  return {
    lateMethod: HrmAttendanceLateEarlyDeductMethod.FIXED_MONTH,
    lateDeductMoney: 0,
    earlyMethod: HrmAttendanceLateEarlyDeductMethod.FIXED_MONTH,
    earlyDeductMoney: 0,
    absenteeismMethod: HrmAttendanceAbsenteeismDeductMethod.BY_DAY,
    absenteeismDeductMoney: 0,
    misscardMethod: HrmAttendanceMisscardDeductMethod.BY_COUNT,
    misscardDeductMoney: 0
  }
}
</script>

<style scoped>
.section-title {
  display: flex;
  margin: 8px 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  align-items: center;
}

.section-title::before {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  background: var(--el-color-primary);
  border-radius: 2px;
  content: '';
}
</style>
