import request from '@/config/axios'

// TODO @AI：改成 shift/index.ts，参考别的 api ts；

// MES 班组排班 VO
export interface CalTeamShiftVO {
  id: number
  planId: number // 排班计划编号
  teamId: number // 班组编号
  shiftId: number // 班次编号
  day: number // 日期
  sort: number // 排序
  teamName: string // 班组名称（关联查询）
  shiftName: string // 班次名称（关联查询）
  remark: string // 备注
  attribute1: string
  attribute2: string
  attribute3: number
  attribute4: number
}

// MES 班组排班 API
export const CalTeamShiftApi = {
  // 查询班组排班列表
  getTeamShiftList: async (params: any) => {
    return await request.get({ url: `/mes/cal/team-shift/list`, params })
  }
}
