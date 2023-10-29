import request from '@/config/axios'

export interface DiyTemplateVO {
  id?: number
  name: string
  used: boolean
  usedTime?: Date
  remark: string
  previewImageUrls: string[]
  property: string
}

// 查询装修模板列表
export const getDiyTemplatePage = async (params: any) => {
  return await request.get({ url: `/promotion/diy-template/page`, params })
}

// 查询装修模板详情
export const getDiyTemplate = async (id: number) => {
  return await request.get({ url: `/promotion/diy-template/get?id=` + id })
}

// 新增装修模板
export const createDiyTemplate = async (data: DiyTemplateVO) => {
  return await request.post({ url: `/promotion/diy-template/create`, data })
}

// 修改装修模板
export const updateDiyTemplate = async (data: DiyTemplateVO) => {
  return await request.put({ url: `/promotion/diy-template/update`, data })
}

// 删除装修模板
export const deleteDiyTemplate = async (id: number) => {
  return await request.delete({ url: `/promotion/diy-template/delete?id=` + id })
}

// 使用装修模板
export const useDiyTemplate = async (id: number) => {
  return await request.put({ url: `/promotion/diy-template/use?id=` + id })
}
