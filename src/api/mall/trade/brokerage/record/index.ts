import request from '@/config/axios'

// 查询佣金记录列表
export const getBrokerageRecordPage = async (params: any) => {
  return await request.get({ url: `/trade/brokerage-record/page`, params })
}

// 查询佣金记录详情
export const getBrokerageRecord = async (id: number) => {
  return await request.get({ url: `/trade/brokerage-record/get?id=` + id })
}
