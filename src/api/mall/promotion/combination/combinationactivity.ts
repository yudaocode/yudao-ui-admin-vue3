import request from '@/config/axios'

export interface CombinationActivityVO {
  id: number
  name: string
  spuId: number
  totalLimitCount: number
  singleLimitCount: number
  startTime: Date
  endTime: Date
  userSize: number
  totalNum: number
  successNum: number
  orderUserCount: number
  virtualGroup: number
  status: number
  limitDuration: number
}

// 查询拼团活动列表
export const getCombinationActivityPage = async (params) => {
  return await request.get({ url: '/promotion/combination-activity/page', params })
}

// 查询拼团活动详情
export const getCombinationActivity = async (id: number) => {
  return await request.get({ url: '/promotion/combination-activity/get?id=' + id })
}

// 新增拼团活动
export const createCombinationActivity = async (data: CombinationActivityVO) => {
  return await request.post({ url: '/promotion/combination-activity/create', data })
}

// 修改拼团活动
export const updateCombinationActivity = async (data: CombinationActivityVO) => {
  return await request.put({ url: '/promotion/combination-activity/update', data })
}

// 删除拼团活动
export const deleteCombinationActivity = async (id: number) => {
  return await request.delete({ url: '/promotion/combination-activity/delete?id=' + id })
}

// 导出拼团活动 Excel
export const exportCombinationActivity = async (params) => {
  return await request.download({ url: '/promotion/combination-activity/export-excel', params })
}
