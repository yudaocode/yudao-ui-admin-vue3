<template>
  <doc-alert title="【组织】工作台、组织架构" url="https://doc.iocoder.cn/hrm/organization/" />

  <div v-loading="loading">
    <div class="mb-16px text-24px text-[var(--el-text-color-primary)] leading-28px">
      团队工作台
    </div>
    <el-row :gutter="16" align="top">
      <el-col :lg="16" :md="24">
        <HrmTeamOverview
          :leader-employee-id="summary?.leaderEmployeeId"
          :overview="summary?.teamOverview"
        />
        <HrmTeamSurvey :survey="summary?.teamSurvey" />
      </el-col>

      <el-col :lg="8" :md="24">
        <HrmHomeCalendar
          ref="calendarRef"
          :get-calendar-items="HomeApi.getTeamHomeCalendar"
          :is-item-clickable="isCalendarItemClickable"
          @item-click="openCalendarItem"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import * as HomeApi from '@/api/hrm/home'
import { HrmHomeCalendarItemType } from '@/views/hrm/utils/constants'
import HrmHomeCalendar from '../components/HrmHomeCalendar.vue'
import HrmTeamOverview from './components/HrmTeamOverview.vue'
import HrmTeamSurvey from './components/HrmTeamSurvey.vue'

defineOptions({ name: 'HrmTeamHome' })

const router = useRouter() // 路由
const loading = ref(false) // 加载中
const summary = ref<HomeApi.HrmTeamHomeStatisticsRespVO>() // 工作台汇总数据
const calendarRef = ref<InstanceType<typeof HrmHomeCalendar>>() // 日历组件 Ref

/** 获得团队工作台统计 */
async function getSummary() {
  loading.value = true
  try {
    summary.value = await HomeApi.getTeamHomeStatisticsSummary()
  } finally {
    loading.value = false
  }
}

/** 团队日历中的员工事项支持跳转详情 */
function isCalendarItemClickable(item: HomeApi.HrmHomeCalendarItemVO) {
  return item.type !== HrmHomeCalendarItemType.NOTE && !!item.typeId
}

/** 打开下属员工档案 */
function openCalendarItem(item: HomeApi.HrmHomeCalendarItemVO) {
  if (item.typeId) {
    router.push({ name: 'HrmEmployeeDetail', params: { id: item.typeId } })
  }
}

/** 初始化 */
onMounted(() => {
  getSummary()
  calendarRef.value?.refresh()
})
</script>
