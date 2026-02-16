import request from '@/config/axios'

// MES 假期设置 VO
export interface CalHolidayVO {
  id: number // 编号
  theDay: string // 日期
  type: string // 日期类型
  startTime: string // 开始时间
  endTime: string // 结束时间
  remark: string // 备注
  attribute1: string // 预留字段1
  attribute2: string // 预留字段2
  attribute3: number // 预留字段3
  attribute4: number // 预留字段4
  createTime: string // 创建时间
}

// MES 假期设置 API
export const CalHolidayApi = {
  // 查询假期设置分页
  getHolidayPage: async (params: any) => {
    return await request.get({ url: `/mes/cal/holiday/page`, params })
  },

  // 查询所有假期设置列表（日历组件用，不分页）
  getHolidayList: async () => {
    return await request.get({ url: `/mes/cal/holiday/list` })
  },

  // 查询假期设置详情
  getHoliday: async (id: number) => {
    return await request.get({ url: `/mes/cal/holiday/get?id=` + id })
  },

  // 新增假期设置（含 upsert 逻辑）
  createHoliday: async (data: CalHolidayVO) => {
    return await request.post({ url: `/mes/cal/holiday/create`, data })
  },

  // 修改假期设置
  updateHoliday: async (data: CalHolidayVO) => {
    return await request.put({ url: `/mes/cal/holiday/update`, data })
  },

  // 删除假期设置
  deleteHoliday: async (id: number) => {
    return await request.delete({ url: `/mes/cal/holiday/delete?id=` + id })
  },

  // 导出假期设置 Excel
  exportHoliday: async (params: any) => {
    return await request.download({ url: `/mes/cal/holiday/export-excel`, params })
  }
}
