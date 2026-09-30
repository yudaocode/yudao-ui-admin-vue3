<template>
  <doc-alert title="【员工】员工管理" url="https://doc.iocoder.cn/hrm/employee/" />

  <div v-if="accessible" v-loading="loading">
    <el-row :gutter="16">
      <el-col :span="16">
        <EmployeeSurvey :employee="employee" :salary-slip-summary="salarySlipSummary" />
      </el-col>
      <el-col :span="8">
        <HrmHomeCalendar
          ref="calendarRef"
          :get-calendar-items="HomeCalendarApi.getEmployeeHomeCalendar"
          :show-item-time="isCalendarItemTimeVisible"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import * as EmployeeApi from '@/api/hrm/portal/employee'
import * as HomeCalendarApi from '@/api/hrm/portal/home/calendar'
import * as SalarySlipApi from '@/api/hrm/portal/salary/slip'
import type { HrmHomeCalendarItemVO } from '@/api/hrm/home'
import HrmHomeCalendar from '@/views/hrm/home/components/HrmHomeCalendar.vue'
import { HrmHomeCalendarItemType } from '@/views/hrm/utils/constants'
import { checkHrmPortalAccess } from '@/views/hrm/utils/employee'
import EmployeeSurvey from './EmployeeSurvey.vue'

defineOptions({ name: 'HrmPortalHome' })

const router = useRouter() // 路由
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const employee = ref<EmployeeApi.HrmPortalEmployeeVO>() // 员工信息
const salarySlipSummary = ref<SalarySlipApi.SalarySlipUnreadSummaryVO>() // 工资条汇总数据
const calendarRef = ref<InstanceType<typeof HrmHomeCalendar>>() // 日历组件 Ref

/** 员工端仅为个人备忘展示具体时间 */
function isCalendarItemTimeVisible(item: HrmHomeCalendarItemVO) {
  return item.type === HrmHomeCalendarItemType.NOTE
}

/** 刷新员工工作台 */
async function refreshAll() {
  loading.value = true
  try {
    const [employeeData, salarySummary] = await Promise.all([
      EmployeeApi.getEmployee(),
      SalarySlipApi.getUnreadSalarySlipSummary(),
      calendarRef.value?.refresh()
    ])
    employee.value = employeeData
    salarySlipSummary.value = salarySummary
  } finally {
    loading.value = false
  }
}

/** 页面激活时刷新个人工作台 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router)
  if (!accessible.value) {
    return
  }
  await refreshAll()
})
</script>
