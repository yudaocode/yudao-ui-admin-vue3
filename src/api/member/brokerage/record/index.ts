import request from '@/config/axios'

// 查询佣金记录列表
export const getMemberBrokerageRecordPage = async (params: any) => {
  return await request.get({ url: `/member/member-brokerage-record/page`, params })
}

// 查询佣金记录详情
export const getMemberBrokerageRecord = async (id: number) => {
  return await request.get({ url: `/member/member-brokerage-record/get?id=` + id })
}
