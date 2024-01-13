import request from '@/config/axios'

export interface DiyPageVO {
  id?: number
  templateId?: number
  name: string
  remark: string
  previewPicUrls: string[]
  property: string
}

// 查询装修页面列表
export const getDiyPagePage = async (params: any) => {
  return await request.get({ url: `/promotion/diy-page/page`, params })
}

// 查询装修页面详情
export const getDiyPage = async (id: number) => {
  return await request.get({ url: `/promotion/diy-page/get?id=` + id })
}

// 新增装修页面
export const createDiyPage = async (data: DiyPageVO) => {
  return await request.post({ url: `/promotion/diy-page/create`, data })
}

// 修改装修页面
export const updateDiyPage = async (data: DiyPageVO) => {
  return await request.put({ url: `/promotion/diy-page/update`, data })
}

// 删除装修页面
export const deleteDiyPage = async (id: number) => {
  return await request.delete({ url: `/promotion/diy-page/delete?id=` + id })
}

// 获得装修页面属性
export const getDiyPageProperty = async (id: number) => {
  return await request.get({ url: `/promotion/diy-page/get-property?id=` + id })
}

// 更新装修页面属性
export const updateDiyPageProperty = async (data: DiyPageVO) => {
  return await request.put({ url: `/promotion/diy-page/update-property`, data })
}
