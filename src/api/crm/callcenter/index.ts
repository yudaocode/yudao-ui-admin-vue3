import request from '@/config/axios'


export interface CallVo {
  manufacturerId: number // 编号
  callId: number // 线索名称
  callType: number // 跟进状态
}

// CRM 呼叫中心 电话拔出
export const callCenterCall = async (data: CallVo) => {
  return await request.post({ url: `/crm/call-center/call`,data})
}

// CRM 呼叫中心 电话拔出
export const callCenterUserbyPhone = async (data: String) => {
  return await request.post({ url: `/crm/call-center/entryphone`,data})
}

export const Callyunke = async() =>{
  return await request.post({url:`/crm/call-center/callyunke`})
}