import request from '@/config/axios'

// MES 假期设置 VO
export interface CalHolidayVO {
  id: number // 编号
  day: number // 日期（时间戳）
  type: number // 日期类型
  remark: string // 备注
  createTime: string // 创建时间
}

// MES 假期设置 API
export const CalHolidayApi = {
  // 查询假期设置列表（支持可选日期范围过滤）
  getHolidayList: async (params?: { startDay?: string; endDay?: string }) => {
    return await request.get({ url: `/mes/cal/holiday/list`, params })
  },

  // 根据日期查询假期设置
  getHolidayByDay: async (day: string) => {
    return await request.get({ url: `/mes/cal/holiday/get-by-day`, params: { day } })
  },

  // 保存假期设置（含 upsert 逻辑）
  saveHoliday: async (data: CalHolidayVO) => {
    return await request.post({ url: `/mes/cal/holiday/save`, data })
  }
}
