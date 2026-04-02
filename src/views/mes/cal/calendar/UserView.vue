<!-- 排班日历 - 按个人视图 -->
<template>
  <div>
    <!-- 顶部：人员选择 -->
    <el-form :inline="true" label-width="80px" class="mb-10px">
      <el-form-item label="人员">
        <el-select
          v-model="userId"
          filterable
          remote
          :remote-method="remoteSearchUser"
          :loading="userSearchLoading"
          placeholder="请输入人员姓名搜索"
          class="!w-200px"
          @change="onUserQuery"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onUserQuery">
          <Icon icon="ep:search" class="mr-5px" /> 查询
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 日历 -->
    <CalendarLegend />
    <el-calendar v-model="currentDate" v-loading="loading">
      <template #date-cell="{ data }">
        <CalendarDateCell
          :day="data.day"
          :holiday-set="holidaySet"
          :calendar-day-map="calendarDayMap"
        />
      </template>
    </el-calendar>
  </div>
</template>

<script setup lang="ts">
import { getSimpleUserList, UserVO } from '@/api/system/user'
import CalendarDateCell from './CalendarDateCell.vue'
import CalendarLegend from './CalendarLegend.vue'
import { useCalendar } from './useCalendar'

const { loading, currentDate, calendarDayMap, holidaySet, loadHolidays, fetchCalendar, watchMonth } =
  useCalendar()

const userId = ref<number>() // 当前选中的用户编号
const userList = ref<UserVO[]>([]) // 搜索到的用户列表
const userSearchLoading = ref(false) // 远程搜索加载状态
let allUserList: UserVO[] = [] // 缓存全量用户列表

/** 远程搜索用户 */
const remoteSearchUser = (query: string) => {
  if (query) {
    userSearchLoading.value = true
    // 从缓存的全量列表中前端过滤
    userList.value = allUserList.filter((user) =>
      user.nickname?.toLowerCase().includes(query.toLowerCase())
    )
    userSearchLoading.value = false
  } else {
    userList.value = []
  }
}

/** 查询当前月份的排班日历，按选中人员过滤 */
const doFetch = () => {
  if (!userId.value) return
  fetchCalendar({ queryType: 'USER', userId: userId.value })
}

/** 查询按钮 / 下拉选人后刷新日历 */
const onUserQuery = () => {
  doFetch()
}

/** 监听月份切换，重新加载当月排班 */
watchMonth(() => {
  if (userId.value) {
    doFetch()
  }
})

/** 初始化 */
onMounted(async () => {
  allUserList = await getSimpleUserList()
  await loadHolidays()
})
</script>
