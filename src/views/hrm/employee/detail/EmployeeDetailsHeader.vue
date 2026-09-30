<template>
  <div v-loading="loading">
    <div class="flex items-start justify-between gap-16px">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-10px">
          <span class="break-all text-xl font-bold">{{ employee.name || '-' }}</span>
          <dict-tag
            v-if="employee.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="employee.entryStatus"
          />
          <dict-tag
            v-if="employee.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="employee.status"
          />
        </div>
        <div class="mt-6px text-sm text-[var(--el-text-color-secondary)]">
          员工编号：{{ employee.id || '-' }}
        </div>
      </div>
      <div><slot></slot></div>
    </div>
    <ContentWrap class="mt-10px">
      <el-descriptions :column="5" direction="vertical">
        <el-descriptions-item label="所属部门">{{ employee.deptName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ employee.postName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ employee.jobNumber || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ employee.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="直属上级">
          {{ employee.leaderEmployeeName || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as EmployeeApi from '@/api/hrm/employee'

defineOptions({ name: 'HrmEmployeeDetailsHeader' })

defineProps<{
  employee: EmployeeApi.HrmEmployeeVO
  loading: boolean
}>()
</script>
