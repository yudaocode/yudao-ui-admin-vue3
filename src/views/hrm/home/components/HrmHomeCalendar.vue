<template>
  <ContentWrap title="日历" class="calendar-panel">
    <div v-loading="loading">
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div
            class="relative h-full w-full flex flex-col items-center justify-center"
            @click.stop="selectDate(data.day)"
          >
            <span class="leading-18px">{{ data.day.slice(8) }}</span>
            <span
              class="max-w-full truncate text-10px text-[var(--el-text-color-secondary)] leading-14px"
            >
              {{ getHrmLunarDateInfo(data.day).dayText }}
            </span>
            <i
              v-if="calendarDateSet.has(data.day)"
              class="absolute bottom-3px right-3px h-5px w-5px rounded-full bg-[var(--el-color-primary)]"
            ></i>
          </div>
        </template>
      </el-calendar>

      <div
        class="mt-16px flex items-center rounded-4px bg-[var(--el-color-primary-light-9)] px-14px py-10px"
      >
        <div class="mr-10px text-38px text-[var(--el-text-color-primary)] font-700 leading-none">
          {{ formatDate(selectedDate, 'DD') }}
        </div>
        <div>
          <div>{{ formatDate(selectedDate, 'dddd') }}</div>
          <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
            {{ getHrmLunarDateInfo(selectedDate).monthDayText }}
          </div>
        </div>
        <el-button
          v-hasPermi="['hrm:employee:personal-note:create']"
          class="ml-auto"
          link
          type="primary"
          @click="personalNoteFormRef?.open(selectedDate)"
        >
          <Icon icon="ep:plus" class="mr-3px" />添加备忘录
        </el-button>
      </div>

      <div class="mt-18px font-600">当天事项</div>
      <div class="mt-8px min-h-132px">
        <div
          v-for="item in visibleDayItems"
          :key="`${item.type}-${item.personalNoteId || item.typeId || item.content}`"
          class="min-h-32px flex items-center gap-8px"
        >
          <el-tag size="small" :type="eventTagType(item.type)" effect="light">
            {{ item.typeName }}
          </el-tag>
          <span
            v-if="shouldShowItemTime(item)"
            class="flex-none text-12px text-[var(--el-text-color-secondary)] tabular-nums"
          >
            {{ formatDate(item.eventTime, 'HH:mm') }}
          </span>
          <button
            class="min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-left text-[var(--el-text-color-regular)] font-inherit"
            :class="
              canOpenItem(item)
                ? 'cursor-pointer !text-[var(--el-color-primary)] hover:underline'
                : 'cursor-default'
            "
            type="button"
            @click="handleItemClick(item)"
          >
            {{ item.content }}
          </button>
          <el-button
            v-if="item.personalNoteId"
            v-hasPermi="['hrm:employee:personal-note:delete']"
            link
            type="danger"
            @click="handleDeletePersonalNote(item.personalNoteId)"
          >
            删除
          </el-button>
        </div>
        <el-button
          v-if="dayItems.length > 4 && !showAllEvents"
          link
          type="primary"
          @click="showAllEvents = true"
        >
          查看更多事项
        </el-button>
        <el-empty v-if="dayItems.length === 0" :image-size="72" description="暂无数据" />
      </div>
    </div>

    <PersonalNoteForm ref="personalNoteFormRef" @success="refreshCalendar" />
  </ContentWrap>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import * as PersonalNoteApi from '@/api/hrm/employee/personal-note'
import type { HrmHomeCalendarItemVO } from '@/api/hrm/home'
import { formatDate } from '@/utils/formatTime'
import { HrmHomeCalendarItemType } from '@/views/hrm/utils/constants'
import { getHrmLunarDateInfo } from '@/views/hrm/utils/format'
import PersonalNoteForm from './PersonalNoteForm.vue'

defineOptions({ name: 'HrmHomeCalendar' })

const props = defineProps<{
  getCalendarItems: (params: {
    startDate: string
    endDate: string
  }) => Promise<HrmHomeCalendarItemVO[]>
  itemFilter?: (item: HrmHomeCalendarItemVO) => boolean
  isItemClickable?: (item: HrmHomeCalendarItemVO) => boolean
  showItemTime?: (item: HrmHomeCalendarItemVO) => boolean
}>()
const emit = defineEmits<{
  'item-click': [item: HrmHomeCalendarItemVO]
}>() // 定义 item-click 事件

dayjs.locale('zh-cn')

const message = useMessage() // 消息弹窗
const loading = ref(false) // 加载中
const calendarDate = ref(new Date()) // 日历日期
const selectedDate = ref(formatDate(new Date(), 'YYYY-MM-DD')) // 选中日期
const calendarItems = ref<HrmHomeCalendarItemVO[]>([]) // 日历事项列表
const showAllEvents = ref(false) // 是否展示全部事项
const personalNoteFormRef = ref<InstanceType<typeof PersonalNoteForm>>() // 个人备忘表单 Ref
const calendarDateSet = computed(() => new Set(calendarItems.value.map((item) => item.date))) // 日历日期集合
const dayItems = computed(() =>
  calendarItems.value.filter((item) => item.date === selectedDate.value)
)
const visibleDayItems = computed(() =>
  showAllEvents.value ? dayItems.value : dayItems.value.slice(0, 4)
)

/** 监听日历日期变化 */
watch(calendarDate, async (date, oldDate) => {
  selectedDate.value = formatDate(date, 'YYYY-MM-DD')
  showAllEvents.value = false
  if (!dayjs(date).isSame(oldDate, 'month')) {
    await refreshCalendar()
  }
})

/** 刷新当前月份的日历 */
async function refreshCalendar() {
  loading.value = true
  try {
    const month = dayjs(calendarDate.value)
    const items = await props.getCalendarItems({
      startDate: formatDate(month.startOf('month'), 'YYYY-MM-DD'),
      endDate: formatDate(month.endOf('month'), 'YYYY-MM-DD')
    })
    const normalizedItems = items.map((item) => ({
      ...item,
      date: Array.isArray(item.date)
        ? dayjs(new Date(item.date[0], item.date[1] - 1, item.date[2])).format('YYYY-MM-DD')
        : item.date
    }))
    calendarItems.value = props.itemFilter
      ? normalizedItems.filter(props.itemFilter)
      : normalizedItems
  } finally {
    loading.value = false
  }
}
defineExpose({ refresh: refreshCalendar }) // 提供 refresh 方法，用于刷新日历

/** 选择日期 */
function selectDate(date: string) {
  selectedDate.value = date
  calendarDate.value = dayjs(date).toDate()
}

/** 是否可打开日历事项 */
function canOpenItem(item: HrmHomeCalendarItemVO) {
  return props.isItemClickable?.(item) === true
}

/** 是否展示事项时间 */
function shouldShowItemTime(item: HrmHomeCalendarItemVO) {
  return !!item.eventTime && (props.showItemTime ? props.showItemTime(item) : true)
}

/** 日历事项点击操作 */
function handleItemClick(item: HrmHomeCalendarItemVO) {
  if (canOpenItem(item)) {
    emit('item-click', item)
  }
}

/** 删除个人备忘 */
async function handleDeletePersonalNote(id: number) {
  await message.delConfirm()
  await PersonalNoteApi.deleteEmployeePersonalNote(id)
  message.success('删除成功')
  await refreshCalendar()
}

/** 获取日历事项标签类型 */
function eventTagType(type: number) {
  switch (type) {
    case HrmHomeCalendarItemType.NOTE:
    case HrmHomeCalendarItemType.RECRUIT:
      return 'primary'
    case HrmHomeCalendarItemType.BIRTHDAY:
      return 'danger'
    case HrmHomeCalendarItemType.ENTRY:
    case HrmHomeCalendarItemType.REGULAR:
      return 'success'
    case HrmHomeCalendarItemType.LEAVE:
      return 'warning'
    default:
      return 'info'
  }
}
</script>

<style scoped>
.calendar-panel :deep(.el-calendar) {
  --el-calendar-cell-width: 38px;
}

.calendar-panel :deep(.el-calendar__header) {
  padding: 8px 4px 12px;
}

.calendar-panel :deep(.el-calendar__body) {
  padding: 0;
}

.calendar-panel :deep(.el-calendar-table .el-calendar-day) {
  height: 42px;
  padding: 0;
}
</style>
