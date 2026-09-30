<template>
  <div
    v-loading="loading"
    class="relative flex min-h-116px cursor-pointer items-center gap-16px overflow-hidden rounded-8px p-20px text-white shadow-[0_4px_12px_rgb(0_0_0_/_8%)] transition-transform duration-200 hover:translate-y--2px bg-[linear-gradient(135deg,#409eff,#66b1ff)]"
    @click="push('/oa/attendance/my')"
  >
    <!-- 打卡入口随标题布局，避免绝对定位与说明文字重叠 -->
    <div class="min-w-0 flex-1">
      <div class="mb-4px flex flex-wrap items-center gap-x-12px text-14px">
        <span class="opacity-90">今日考勤</span>
        <el-button
          :loading="clockLoading"
          class="!text-12px !text-white"
          link
          type="primary"
          @click.stop="handleClock"
        >
          立即打卡
        </el-button>
      </div>
      <div v-if="loadError" class="mt-4px truncate text-12px opacity-85" @click.stop="getList">
        加载失败，点击重试
      </div>
      <div v-else class="truncate text-28px font-600">{{ attendanceText }}</div>
      <div class="mt-4px truncate text-12px opacity-85">{{ attendanceDescription }}</div>
    </div>
    <div class="h-56px w-56px flex shrink-0 items-center justify-center rounded-16px bg-white/20">
      <Icon icon="ep:calendar" :size="30" />
    </div>
  </div>
</template>

<script setup lang="ts">
import * as AttendanceApi from '@/api/oa/attendance'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'OaHomeAttendance' })

const { push } = useRouter() // 路由跳转
const message = useMessage() // 消息弹窗
const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const clockLoading = ref(false) // 打卡提交中
const attendance = ref<AttendanceApi.OaAttendanceVO>() // 今日最近打卡
const attendanceText = computed(() => {
  if (!attendance.value?.type) {
    return '未打卡'
  }
  return getDictLabel(DICT_TYPE.OA_ATTENDANCE_TYPE, attendance.value?.type)
}) // 今日最近打卡类型
const attendanceDescription = computed(() => {
  if (!attendance.value?.attendanceTime) {
    return '今天还没有考勤记录'
  }
  const status = getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, attendance.value?.status)
  return `${formatDate(attendance.value?.attendanceTime, 'HH:mm:ss')} · ${status}`
}) // 今日最近打卡说明

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    attendance.value = (await AttendanceApi.getMyTodayAttendanceList()).slice(-1)[0]
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 打卡后只刷新考勤卡片 */
async function handleClock() {
  if (clockLoading.value) return
  clockLoading.value = true
  try {
    await AttendanceApi.clockAttendance()
    message.success('打卡成功')
    await getList()
  } finally {
    clockLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
