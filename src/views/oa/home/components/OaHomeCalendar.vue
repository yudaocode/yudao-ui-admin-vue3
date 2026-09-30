<template>
  <OaHomePanel title="行事历" v-loading="loading">
    <template #actions>
      <el-button link type="primary" @click="push('/oa/schedule/calendar')">日程管理</el-button>
    </template>

    <div v-if="loadError" class="mb-12px text-13px text-[var(--el-color-danger)]">
      加载失败，
      <el-button link type="primary" @click="getList">重新加载</el-button>
    </div>
    <el-calendar v-model="selectedDate" class="home-calendar">
      <template #header>
        <strong>{{ formatDate(selectedDate, 'YYYY 年 MM 月') }}</strong>
      </template>
      <template #date-cell="{ data }">
        <div class="relative h-full flex items-center justify-center">
          <span>{{ formatDate(data.date, 'D') }}</span>
          <i
            v-if="hasSchedule(data.date)"
            class="absolute bottom-2px right-3px h-5px w-5px rounded-full bg-[var(--el-color-primary)]"
          >
          </i>
        </div>
      </template>
    </el-calendar>

    <!-- 选中日期的日程 -->
    <div class="min-h-90px border-t border-[var(--el-border-color-lighter)] pt-12px">
      <div class="mb-8px text-13px font-600">{{ selectedDateTitle }}</div>
      <el-empty v-if="selectedSchedules.length === 0" :image-size="48" description="暂无日程" />
      <div
        v-for="item in selectedSchedules"
        v-else
        :key="item.id"
        class="min-h-30px flex items-center gap-10px"
      >
        <span class="text-12px text-[var(--el-color-primary)]">
          {{
            dayjs(item.startTime).isSame(selectedDate, 'day')
              ? formatDate(item.startTime, 'HH:mm')
              : '持续'
          }}
        </span>
        <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
      </div>
    </div>
  </OaHomePanel>
</template>

<script setup lang="ts">
import OaHomePanel from './OaHomePanel.vue'
import * as ScheduleApi from '@/api/oa/schedule'
import dayjs from 'dayjs'
import { formatDate, getMonthRange } from '@/utils/formatTime'

defineOptions({ name: 'OaHomeCalendar' })

const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const { push } = useRouter() // 路由跳转
const schedules = ref<ScheduleApi.OaScheduleVO[]>([]) // 当前月份日程
const selectedDate = ref(new Date()) // 当前选中日期
const selectedDateKey = computed(() => dayjs(selectedDate.value).format('YYYY-MM-DD')) // 选中日期标识
const selectedDateTitle = computed(() => dayjs(selectedDate.value).format('MM 月 DD 日日程')) // 选中日期标题
const selectedSchedules = computed(() =>
  schedules.value.filter(
    (item) => dayjs(item.startTime).format('YYYY-MM-DD') === selectedDateKey.value
  )
) // 选中日期的日程列表

/** 判断日期是否存在日程 */
function hasSchedule(date: Date) {
  const dateKey = dayjs(date).format('YYYY-MM-DD')
  return schedules.value.some((item) => dayjs(item.startTime).format('YYYY-MM-DD') === dateKey)
}

/** 查询选中月份的全部日程，避免只展示第一页 */
async function getList() {
  loading.value = true
  loadError.value = false
  try {
    const queryParams = {
      pageNo: 1,
      pageSize: 200,
      startTime: getMonthRange(selectedDate.value)
    }
    const list: ScheduleApi.OaScheduleVO[] = []
    let total = 0
    do {
      const data = await ScheduleApi.getMySchedulePage(queryParams)
      list.push(...data.list)
      total = data.total
      queryParams.pageNo++
      if (data.list.length === 0) {
        break
      }
    } while (list.length < total)
    schedules.value = list
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

watch(
  () => dayjs(selectedDate.value).format('YYYY-MM'),
  () => {
    getList()
  }
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.home-calendar {
  --el-calendar-cell-width: 34px;

  :deep(.el-calendar__body) {
    padding: 10px 0 0;
  }

  :deep(.el-calendar-table thead th) {
    padding: 6px 0;
  }

  :deep(.el-calendar-table .el-calendar-day) {
    height: var(--el-calendar-cell-width);
    padding: 2px;
  }

  :deep(.el-calendar__header) {
    justify-content: center;
    padding: 0 0 10px;
    border: 0;
  }
}
</style>
