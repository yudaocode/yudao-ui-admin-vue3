<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1150px">
    <div v-loading="loading">
      <!-- 最近五天 -->
      <div
        class="mb-20px flex gap-8px border-0 border-b border-solid border-[var(--el-border-color)] pb-12px"
      >
        <button
          v-for="date in dates"
          :key="date"
          type="button"
          class="cursor-pointer rounded border-0 px-20px py-8px text-center"
          :class="
            selectedDate === date
              ? 'bg-[var(--el-color-primary)] text-white'
              : 'bg-[var(--el-fill-color-light)]'
          "
          @click="selectedDate = date"
        >
          <div>{{ formatDate(date, 'MM-DD') }}</div>
          <div class="mt-4px text-12px">{{ OA_WEEKDAY_NAMES[new Date(date).getDay()] }}</div>
        </button>
      </div>
      <div class="flex gap-20px">
        <!-- 半小时占用格 -->
        <div class="min-w-0 flex-1">
          <div class="mb-20px flex flex-wrap items-center justify-between gap-12px">
            <div class="text-16px font-semibold">
              {{ formatDate(selectedDate, 'YYYY年MM月DD日') }} 预约情况
            </div>
            <!-- 预约状态说明 -->
            <div class="flex shrink-0 items-center gap-16px text-13px">
              <span class="flex items-center gap-6px">
                <i class="h-14px w-14px border border-solid border-gray-300 bg-white"></i>
                可预约
              </span>
              <span class="flex items-center gap-6px">
                <i class="h-14px w-14px bg-green-500"></i>
                已预约
              </span>
              <span class="flex items-center gap-6px">
                <i class="h-14px w-14px bg-gray-200"></i>
                已过期
              </span>
            </div>
          </div>
          <div
            class="overflow-hidden rounded-lg border border-solid border-[var(--el-border-color)]"
          >
            <div
              v-for="period in [0, 1]"
              :key="period"
              class="flex"
              :class="
                period === 1 ? 'border-0 border-t border-solid border-[var(--el-border-color)]' : ''
              "
            >
              <div
                class="w-56px shrink-0 flex items-center justify-center border-0 border-r border-solid border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)] font-semibold"
              >
                {{ period === 0 ? '上午' : '下午' }}
              </div>
              <div class="min-w-0 flex-1">
                <!-- 整点时间表头 -->
                <div
                  class="grid grid-cols-12 border-0 border-b border-solid border-[var(--el-border-color)] bg-[var(--el-fill-color-light)] px-6px py-10px text-center text-12px font-semibold text-[var(--el-text-color-secondary)]"
                >
                  <span v-for="hour in 12" :key="hour">
                    {{ String(period * 12 + hour - 1).padStart(2, '0') }}:00
                  </span>
                </div>
                <!-- 每格表示半小时 -->
                <div class="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-2px px-6px py-10px">
                  <el-tooltip
                    v-for="slot in slots.slice(period * 24, (period + 1) * 24)"
                    :key="slot.startTime"
                    :content="slot.title"
                    placement="top"
                  >
                    <div
                      class="h-36px rounded-4px border border-solid border-[var(--el-border-color)]"
                      :class="
                        slot.expired ? 'bg-gray-200' : slot.booking ? 'bg-green-500' : 'bg-white'
                      "
                    ></div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 当日预定信息 -->
        <div
          v-if="showBookings"
          class="w-280px shrink-0 border-0 border-l border-solid border-[var(--el-border-color)] pl-16px"
        >
          <div class="mb-12px text-16px font-semibold">
            {{ formatDate(selectedDate, 'MM 月 DD 日') }}已预约
          </div>
          <el-empty v-if="!dayBookings.length" description="暂无预约记录" :image-size="70" />
          <div class="max-h-400px space-y-12px overflow-y-auto">
            <div
              v-for="booking in dayBookings"
              :key="booking.id"
              class="rounded border border-solid border-[var(--el-border-color)] p-12px"
            >
              <div class="mb-8px flex items-start justify-between gap-8px">
                <div class="min-w-0 break-words font-medium text-[var(--el-color-primary)]">
                  {{ booking.title }}
                </div>
                <DictTag
                  v-if="booking.status !== undefined"
                  class="shrink-0"
                  :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
                  :value="booking.status"
                />
              </div>
              <div class="mb-8px">
                {{ formatDate(booking.startTime, 'HH:mm') }} -
                {{ formatDate(booking.endTime, 'HH:mm') }}
              </div>
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                主持人：{{ booking.moderatorName }}　申请人：{{ booking.creatorName }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import * as MeetingRoomBookingApi from '@/api/oa/meetingroom/booking'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { OA_WEEKDAY_NAMES } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaMeetingRoomScheduleDialog' })

withDefaults(defineProps<{ showBookings?: boolean }>(), { showBookings: true })

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const loading = ref(false) // 日程加载中
const list = ref<MeetingRoomBookingApi.MeetingRoomBookingVO[]>([]) // 五天内的有效预定
const dates = ref<number[]>([]) // 日期选项
const selectedDate = ref(0) // 当前日期零点

/** 当前日期的预定，包含跨日会议 */
const dayBookings = computed(() => {
  const endTime = selectedDate.value + 24 * 60 * 60 * 1000
  return list.value.filter(
    (booking) => Number(booking.startTime) < endTime && Number(booking.endTime) > selectedDate.value
  )
})

/** 生成半小时占用格，审批中的预定也占用时段 */
const slots = computed(() => {
  return Array.from({ length: 48 }, (_, index) => {
    const startTime = selectedDate.value + index * 30 * 60 * 1000
    const endTime = startTime + 30 * 60 * 1000
    const booking = dayBookings.value.find(
      (item) => Number(item.startTime) < endTime && Number(item.endTime) > startTime
    )
    const expired = endTime <= Date.now()
    const title =
      formatDate(startTime, 'HH:mm') +
      '-' +
      formatDate(endTime, 'HH:mm') +
      ' - ' +
      (expired
        ? '已过期'
        : booking
          ? booking.title + '（' + booking.moderatorName + '）'
          : '可预约')
    return { startTime, booking, expired, title }
  })
})

/** 打开预定信息 */
async function open(roomId: number, roomName: string) {
  // 1. 打开弹窗，初始化最近五天及当前选中日期
  dialogVisible.value = true
  dialogTitle.value = roomName + ' - 预约信息'
  const startTime = new Date()
  startTime.setHours(0, 0, 0, 0)
  dates.value = Array.from(
    { length: 5 },
    (_, index) => startTime.getTime() + index * 24 * 60 * 60 * 1000
  )
  selectedDate.value = dates.value[0]
  list.value = []
  // 2. 查询五天内的有效预定，供时段占用和当日列表展示
  loading.value = true
  try {
    list.value = await MeetingRoomBookingApi.getMeetingRoomBookingSchedule(
      roomId,
      formatDate(startTime),
      formatDate(startTime.getTime() + 5 * 24 * 60 * 60 * 1000)
    )
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
