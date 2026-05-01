import request from '@/config/axios'

// MES 工作记录流水 VO
export interface ProWorkRecordLogVO {
  id: number
  userId: number
  userNickname: string
  workstationId: number
  workstationCode: string
  workstationName: string
  type: number // 1=上工 2=下工
  remark: string
  createTime: Date
}

// MES 当前工作站绑定状态 VO
export interface ProWorkRecordVO {
  userId: number
  userNickname: string
  workstationId: number
  workstationCode: string
  workstationName: string
  type: number // 1=上工 2=下工
  clockInTime: Date
  clockOutTime: Date
}

// MES 工作记录 API
export const ProWorkRecordApi = {
  // 查询工作记录分页
  getWorkRecordLogPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/workrecord/log/page`, params })
  },
  // 查询工作记录详情
  getWorkRecordLog: async (id: number) => {
    return await request.get({ url: `/mes/pro/workrecord/log/get?id=` + id })
  },
  // 导出工作记录 Excel
  exportWorkRecordLog: async (params: any) => {
    return await request.download({ url: `/mes/pro/workrecord/log/export-excel`, params })
  },
  // 上线（绑定工作站）
  clockInWorkRecord: async (workstationId: number) => {
    return await request.put({ url: `/mes/pro/workrecord/clock-in?workstationId=` + workstationId })
  },
  // 下线（解绑工作站）
  clockOutWorkRecord: async () => {
    return await request.put({ url: `/mes/pro/workrecord/clock-out` })
  },
  // 获取当前用户绑定的工作站
  getMyWorkRecord: async () => {
    return await request.get({ url: `/mes/pro/workrecord/get-my` })
  }
}
