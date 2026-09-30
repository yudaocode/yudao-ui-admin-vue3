<template>
  <doc-alert title="【组织】工作台、组织架构" url="https://doc.iocoder.cn/hrm/organization/" />

  <div v-loading="loading">
    <div class="mb-16px text-24px text-[var(--el-text-color-primary)] leading-28px">
      HR 工作台
    </div>
    <el-row :gutter="16" align="top">
      <el-col :span="16">
        <HrmHomeEmployeeSurvey :survey="summary?.employeeSurvey" />
        <HrmHomeRecruitSurvey :survey="summary?.recruitSurvey" />
        <HrmHomeSalarySurvey :survey="summary?.salarySurvey" />
      </el-col>

      <el-col :span="8">
        <HrmHomeTodoSurvey :survey="summary?.todoSurvey" />
        <HrmHomeCalendar
          ref="calendarRef"
          :get-calendar-items="HomeApi.getHrHomeCalendar"
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
import HrmHomeEmployeeSurvey from '../components/HrmHomeEmployeeSurvey.vue'
import HrmHomeRecruitSurvey from '../components/HrmHomeRecruitSurvey.vue'
import HrmHomeSalarySurvey from '../components/HrmHomeSalarySurvey.vue'
import HrmHomeTodoSurvey from '../components/HrmHomeTodoSurvey.vue'

defineOptions({ name: 'HrmHrHome' })

const router = useRouter() // 路由
const loading = ref(false) // 加载中
const summary = ref<HomeApi.HrmHrHomeStatisticsRespVO>() // 工作台汇总数据
const calendarRef = ref<InstanceType<typeof HrmHomeCalendar>>() // 日历组件 Ref

/** 获得首页统计汇总 */
async function getSummary() {
  loading.value = true
  try {
    summary.value = await HomeApi.getHrHomeStatisticsSummary()
  } finally {
    loading.value = false
  }
}

/** 日历事项是否支持跳转详情 */
function isCalendarItemClickable(item: HomeApi.HrmHomeCalendarItemVO) {
  return item.type !== HrmHomeCalendarItemType.NOTE && !!item.typeId
}

/** 打开日历事项详情 */
function openCalendarItem(item: HomeApi.HrmHomeCalendarItemVO) {
  if (!item.typeId) {
    return
  }
  if (item.type === HrmHomeCalendarItemType.RECRUIT) {
    router.push({ name: 'HrmRecruitCandidateDetail', params: { id: item.typeId } })
    return
  }
  router.push({ name: 'HrmEmployeeDetail', params: { id: item.typeId } })
}

/** 初始化 */
onMounted(() => {
  getSummary()
  calendarRef.value?.refresh()
})
</script>
