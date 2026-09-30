<template>
  <ContentWrap>
    <el-descriptions :column="4">
      <el-descriptions-item label="工号">{{ employee.jobNumber || '-' }}</el-descriptions-item>
      <el-descriptions-item label="所属部门">{{ employee.deptName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="岗位">{{ employee.postName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="岗位职级">{{ employee.postLevel || '-' }}</el-descriptions-item>
      <el-descriptions-item label="直属上级">
        {{ employee.leaderEmployeeName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="入职状态">
        <dict-tag
          v-if="employee.entryStatus != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
          :value="employee.entryStatus"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="员工状态">
        <dict-tag
          v-if="employee.status != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="employee.status"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="聘用形式">
        <dict-tag
          v-if="employee.type != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="employee.type"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="入职时间">
        {{ formatHrmDateTime(employee.entryTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="试用期">
        {{ employee.probation != null ? `${employee.probation} 个月` : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="转正时间">
        {{ formatHrmDateTime(employee.regularTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="离职时间">
        {{ formatHrmDateTime(employee.leaveTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="工作城市">{{ employee.workCity || '-' }}</el-descriptions-item>
      <el-descriptions-item label="工作地点">
        {{ employee.workAddress || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="详细地址" :span="2">
        {{ employee.workDetailAddress || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="招聘渠道">
        {{ employee.channelName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="司龄起算时间">
        {{ formatHrmDateTime(employee.companyAgeStartTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="司龄">
        {{ employee.companyAge != null ? `${employee.companyAge} 年` : '-' }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <ContentWrap title="异动记录">
    <EmployeeChangeRecordList
      ref="changeRecordListRef"
      :employee="employee"
      :employee-id="employeeId"
      @success="emit('refresh')"
    />
  </ContentWrap>
  <EmployeeQuitInfo ref="quitInfoRef" :employee-id="employeeId" @edit="emit('edit-quit')" />
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import type { HrmEmployeeVO } from '@/api/hrm/employee'
import { formatHrmDateTime } from '@/views/hrm/utils/format'
import EmployeeChangeRecordList from './EmployeeChangeRecordList.vue'
import EmployeeQuitInfo from './EmployeeQuitInfo.vue'

defineOptions({ name: 'HrmEmployeePostInfo' })

defineProps<{
  employee: HrmEmployeeVO
  employeeId: number
}>()
const emit = defineEmits<{
  'edit-quit': []
  refresh: []
}>() // 定义离职编辑与刷新事件

const changeRecordListRef = ref<InstanceType<typeof EmployeeChangeRecordList>>() // 员工异动列表 Ref
const quitInfoRef = ref<InstanceType<typeof EmployeeQuitInfo>>() // 员工离职信息 Ref

/** 刷新员工异动记录 */
function refreshChangeRecordList() {
  return changeRecordListRef.value?.getList()
}

/** 刷新员工离职信息 */
function refreshQuitInfo() {
  return quitInfoRef.value?.getQuitInfo()
}
defineExpose({ refreshChangeRecordList, refreshQuitInfo }) // 提供员工异动和离职信息刷新方法
</script>
