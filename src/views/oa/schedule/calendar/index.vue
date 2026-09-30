<template>
  <doc-alert
    title="【协作】日程、任务、计划与汇报"
    url="https://doc.iocoder.cn/oa/collaboration/work/"
  />
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="日程范围">
        <el-checkbox v-model="queryParams.includeMine" label="我的日程" @change="handleQuery" />
        <el-checkbox v-model="queryParams.includeReceived" label="共享给我" @change="handleQuery" />
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          clearable
          placeholder="请输入日程标题"
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="日程类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择日程类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_SCHEDULE_TYPE)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-select
          v-model="queryParams.priority"
          placeholder="请选择优先级"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.OA_PRIORITY)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          v-hasPermi="['oa:schedule:create']"
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 日程日历 -->
  <ContentWrap>
    <div class="mb-16px flex flex-wrap items-center justify-between gap-12px">
      <div class="flex items-center gap-8px">
        <el-button @click="changePeriod(-1)">上一{{ viewLabel }}</el-button>
        <el-button @click="calendarDate = new Date()">今天</el-button>
        <el-button @click="changePeriod(1)">下一{{ viewLabel }}</el-button>
        <span>{{ calendarTitle }}</span>
      </div>
      <el-radio-group v-model="calendarView">
        <el-radio-button value="month">月</el-radio-button>
        <el-radio-button value="week">周</el-radio-button>
        <el-radio-button value="day">日</el-radio-button>
      </el-radio-group>
    </div>
    <el-calendar
      v-if="calendarView === 'month'"
      v-model="calendarDate"
      v-loading="calendarLoading"
      class="oa-schedule-calendar"
    >
      <template #header><span></span></template>
      <template #date-cell="{ data }">
        <div class="h-full overflow-hidden" @click.stop="handleCalendarDateChange(data.day)">
          <div class="mb-4px">{{ data.day.slice(8) }}</div>
          <button
            v-for="schedule in getCalendarDaySchedules(data.day).slice(0, 3)"
            :key="schedule.id"
            type="button"
            class="mb-3px block w-full cursor-pointer truncate border-0 rounded-3px px-4px py-2px text-left text-12px"
            :style="getPriorityStyle(schedule.priority)"
            @click.stop="openDetail(schedule.id!)"
          >
            {{
              dayjs(schedule.startTime).isSame(data.day, 'day')
                ? formatDate(schedule.startTime, 'HH:mm')
                : '持续'
            }}
            {{ schedule.title }}
          </button>
          <el-button
            v-if="getCalendarDaySchedules(data.day).length > 3"
            link
            type="primary"
            @click.stop="openDay(data.day)"
          >
            还有 {{ getCalendarDaySchedules(data.day).length - 3 }} 项
          </el-button>
        </div>
      </template>
    </el-calendar>
    <div v-else v-loading="calendarLoading" class="overflow-x-auto">
      <div
        class="grid"
        :style="{ gridTemplateColumns: `repeat(${visibleDates.length}, minmax(140px, 1fr))` }"
      >
        <div
          v-for="date in visibleDates"
          :key="date"
          class="min-h-240px border border-solid border-[var(--el-border-color)] p-12px"
        >
          <el-button link class="mb-12px" @click="openDay(date)">
            {{ dayjs(date).format('MM-DD') }} {{ OA_WEEKDAY_NAMES[dayjs(date).day()] }}
          </el-button>
          <el-empty
            v-if="!getCalendarDaySchedules(date).length"
            description="暂无日程"
            :image-size="40"
          />
          <el-button
            v-for="schedule in getCalendarDaySchedules(date)"
            :key="schedule.id"
            link
            type="primary"
            class="!ml-0 mb-8px !block w-full !whitespace-normal rounded-3px !p-4px !text-left"
            :style="getPriorityStyle(schedule.priority)"
            @click="openDetail(schedule.id!)"
          >
            {{
              dayjs(schedule.startTime).isSame(date, 'day')
                ? formatDate(schedule.startTime, 'HH:mm')
                : '持续'
            }}
            {{ schedule.title }}
          </el-button>
        </div>
      </div>
    </div>
  </ContentWrap>

  <!-- 添加或修改日程对话框 -->
  <OaScheduleForm ref="formRef" @success="getCalendarList" />
  <!-- 日程详情对话框 -->
  <OaScheduleDetail ref="detailRef" @edit="openForm('update', $event)" />
</template>

<script setup lang="ts">
import { DICT_TYPE, getDictObj, getIntDictOptions } from '@/utils/dict'
import dayjs from 'dayjs'
import * as ScheduleApi from '@/api/oa/schedule'
import { formatDate } from '@/utils/formatTime'
import { getAllPageItems } from '@/utils/page'
import { OA_WEEKDAY_NAMES } from '@/views/oa/utils/constants'
import OaScheduleForm from '../list/components/OaScheduleForm.vue'
import OaScheduleDetail from '../list/components/OaScheduleDetail.vue'

defineOptions({ name: 'OaScheduleCalendar' })

const queryParams = reactive({
  includeMine: true,
  includeReceived: true,
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  type: undefined,
  priority: undefined
}) // 查询参数
const queryFormRef = ref() // 搜索的表单
const calendarLoading = ref(false) // 日历加载中
const calendarDate = ref(new Date()) // 当前日历日期
const calendarView = ref<'month' | 'week' | 'day'>('month') // 当前视图
const viewLabel = computed(() => ({ month: '月', week: '周', day: '日' })[calendarView.value])
const calendarRange = computed(() => {
  const date = dayjs(calendarDate.value)
  let beginTime = date.startOf('day')
  let endTime = date.endOf('day')
  if (calendarView.value === 'month') {
    // 月历会补齐相邻月份的日期；预留首尾一周，兼容不同语言的周起始日
    beginTime = date.startOf('month').subtract(7, 'day')
    endTime = date.endOf('month').add(7, 'day')
  }
  if (calendarView.value === 'week') {
    beginTime = beginTime.subtract((beginTime.day() + 6) % 7, 'day')
    endTime = endTime.add(6 - ((endTime.day() + 6) % 7), 'day')
  }
  return [beginTime.format('YYYY-MM-DD HH:mm:ss'), endTime.format('YYYY-MM-DD HH:mm:ss')]
}) // 当前视图覆盖的日期范围
const visibleDates = computed(() =>
  Array.from({ length: calendarView.value === 'week' ? 7 : 1 }, (_, index) =>
    dayjs(calendarRange.value[0]).add(index, 'day').format('YYYY-MM-DD')
  )
)
const calendarTitle = computed(() =>
  calendarView.value === 'month'
    ? dayjs(calendarDate.value).format('YYYY 年 MM 月')
    : `${calendarRange.value[0].slice(0, 10)} ~ ${calendarRange.value[1].slice(0, 10)}`
)
const calendarList = ref<ScheduleApi.OaScheduleVO[]>([]) // 当前月份日程列表
const calendarScheduleMap = computed(() => {
  const result = new Map<string, ScheduleApi.OaScheduleVO[]>()
  // 跨天日程分别归入覆盖的每个自然日
  calendarList.value.forEach((schedule) => {
    let currentDate = dayjs(schedule.startTime).startOf('day')
    let endDate = dayjs(schedule.endTime).startOf('day')
    // TODO DONE @AI：条件分支统一使用花括号，跨天日程限制在当前显示范围内。
    if (currentDate.isBefore(calendarRange.value[0], 'day')) {
      currentDate = dayjs(calendarRange.value[0])
    }
    if (endDate.isAfter(calendarRange.value[1], 'day')) {
      endDate = dayjs(calendarRange.value[1]).startOf('day')
    }
    while (!currentDate.isAfter(endDate)) {
      const date = currentDate.format('YYYY-MM-DD')
      result.set(date, [...(result.get(date) || []), schedule])
      currentDate = currentDate.add(1, 'day')
    }
  })
  return result
}) // 按日期分组的日程

/** 视图或显示区间变化时重新查询 */
watch(
  () => calendarRange.value.join(','),
  () => {
    getCalendarList()
  }
)

/** 查询与当前视图时间范围相交的日程 */
async function getCalendarList() {
  const params = { ...queryParams, overlapTime: [...calendarRange.value] }
  calendarLoading.value = true
  try {
    calendarList.value = await getAllPageItems<ScheduleApi.OaScheduleVO>((pageNo, pageSize) =>
      ScheduleApi.getSchedulePage({ ...params, pageNo, pageSize })
    )
  } finally {
    calendarLoading.value = false
  }
}

/** 切换上一个或下一个显示周期 */
function changePeriod(direction: number) {
  calendarDate.value = dayjs(calendarDate.value).add(direction, calendarView.value).toDate()
}

/** 展开指定日期的全部日程 */
function openDay(date: string) {
  calendarDate.value = dayjs(date).toDate()
  calendarView.value = 'day'
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getCalendarList()
}

/** 日历优先级颜色与列表字典标签保持一致 */
function getPriorityStyle(priority: number) {
  const dict = getDictObj(DICT_TYPE.OA_PRIORITY, priority)
  if (dict?.cssClass && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(dict.cssClass)) {
    return { backgroundColor: dict.cssClass, color: '#fff' }
  }
  const color = dict?.colorType || 'primary'
  return {
    backgroundColor: `var(--el-color-${color}-light-9)`,
    color: `var(--el-color-${color})`
  }
}

/** 获得指定日期的日程 */
function getCalendarDaySchedules(date: string) {
  return calendarScheduleMap.value.get(date) || []
}

/** 选择日历日期 */
function handleCalendarDateChange(date: string) {
  calendarDate.value = dayjs(date).toDate()
}

/** 查看日程详情 */
const detailRef = ref<InstanceType<typeof OaScheduleDetail>>() // 日程详情 Ref
function openDetail(id: number) {
  detailRef.value?.open(id)
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.includeMine = true
  queryParams.includeReceived = true
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref<InstanceType<typeof OaScheduleForm>>() // 日程表单 Ref
function openForm(type: string, id?: number) {
  formRef.value?.open(type, id)
}

/** 初始化 */
onMounted(() => {
  getCalendarList()
})
</script>

<style scoped>
.oa-schedule-calendar :deep(.el-calendar__header) {
  display: none;
}
.oa-schedule-calendar :deep(.el-calendar-day) {
  height: 110px;
  padding: 6px;
}
</style>
