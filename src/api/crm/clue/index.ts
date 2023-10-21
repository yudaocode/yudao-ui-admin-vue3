import request from '@/config/axios'

export interface ClueVO {
  id: number
  transformStatus: boolean
  followUpStatus: boolean
  name: string
  customerId: number
  contactNextTime: Date
  telephone: string
  mobile: string
  address: string
  ownerUserId: number
  contactLastTime: Date
  remark: string
}

// 查询线索列表
export const getCluePage = async (params) => {
  return await request.get({ url: `/crm/clue/page`, params })
}

// 查询线索详情
export const getClue = async (id: number) => {
  return await request.get({ url: `/crm/clue/get?id=` + id })
}

// 新增线索
export const createClue = async (data: ClueVO) => {
  return await request.post({ url: `/crm/clue/create`, data })
}

// 修改线索
export const updateClue = async (data: ClueVO) => {
  return await request.put({ url: `/crm/clue/update`, data })
}

// 删除线索
export const deleteClue = async (id: number) => {
  return await request.delete({ url: `/crm/clue/delete?id=` + id })
}

// 导出线索 Excel
export const exportClue = async (params) => {
  return await request.download({ url: `/crm/clue/export-excel`, params })
}
