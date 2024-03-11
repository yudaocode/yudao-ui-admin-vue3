import request from '@/config/axios'

export interface ClueConfigVO {
  hidphoneEnabled?: boolean
}

// 获取线索规则设置
export const getClueConfig = async () => {
  return await request.get({ url: `/crm/clue-config/get` })
}

// 更新线索规则设置
export const saveClueConfig = async (data: ClueConfigVO) => {
  return await request.put({ url: `/crm/clue-config/save`, data })
}
