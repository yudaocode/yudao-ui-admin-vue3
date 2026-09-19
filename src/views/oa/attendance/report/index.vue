<template>
  <doc-alert
    title="【流程】考勤、请假、加班、转正与离职"
    url="https://doc.iocoder.cn/oa/attendance-application/"
  />
  <!-- 考勤报表 -->
  <ContentWrap>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="周报" name="week">
        <OaAttendanceWeekReport />
      </el-tab-pane>
      <el-tab-pane label="月报" name="month" lazy>
        <OaAttendanceMonthReport />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import OaAttendanceMonthReport from './OaAttendanceMonthReport.vue'
import OaAttendanceWeekReport from './OaAttendanceWeekReport.vue'

defineOptions({ name: 'OaAttendanceReport' })

const activeTab = ref('week') // 当前报表类型
</script>
