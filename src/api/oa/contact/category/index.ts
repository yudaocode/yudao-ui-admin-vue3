import request from '@/config/axios'

export interface OaContactCategoryVO {
  id?: number // 分类编号
  name: string // 分类名称
  sort: number // 显示排序
  createTime?: string // 创建时间
}

// 查询联系人分类列表
export const getContactCategoryList = (): Promise<OaContactCategoryVO[]> => {
  return request.get({ url: '/oa/contact-category/list' })
}

// 查询联系人分类详情
export const getContactCategory = (id: number) => {
  return request.get<OaContactCategoryVO>({ url: '/oa/contact-category/get', params: { id } })
}

// 查询分类精简列表
export const getSimpleContactCategoryList = (): Promise<OaContactCategoryVO[]> => {
  return request.get({ url: '/oa/contact-category/simple-list' })
}

// 新增联系人分类
export const createContactCategory = (data: OaContactCategoryVO) => {
  return request.post({ url: '/oa/contact-category/create', data })
}

// 修改联系人分类
export const updateContactCategory = (data: OaContactCategoryVO) => {
  return request.put({ url: '/oa/contact-category/update', data })
}

// 删除联系人分类
export const deleteContactCategory = (id: number) => {
  return request.delete({ url: '/oa/contact-category/delete', params: { id } })
}
