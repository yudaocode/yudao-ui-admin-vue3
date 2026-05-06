import request from '@/config/axios'

// 排班日历 - 班组排班项
export interface CalCalendarTeamShiftItem {
  teamId: number
  teamName: string
  shiftId: number
  shiftName: string
  sort: number
}

// 排班日历 - 日历天 VO
export interface CalCalendarDayVO {
  day: string // yyyy-MM-dd
  shiftType: number // 轮班方式
  teamShifts: CalCalendarTeamShiftItem[]
}

// 排班日历 API
export const CalCalendarApi = {
  // 查询排班日历列表
  getCalendarList: async (params: any) => {
    return await request.get({ url: `/mes/cal/calendar/list`, params })
  }
}
