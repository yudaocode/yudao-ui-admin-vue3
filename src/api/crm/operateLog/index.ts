import request from '@/config/axios'

export interface OperateLogVO extends PageParam {
  bizType: number
  bizId: number
}

// 获得操作日志
export const getOperateLogPage = async (params: OperateLogVO) => {
  return await request.get({ url: `/crm/operate-log/page`, params })
}
