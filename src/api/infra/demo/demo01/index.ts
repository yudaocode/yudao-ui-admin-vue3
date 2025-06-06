import request from '@/config/axios'

export interface Demo01ContactVO {
  id: number
  name: string
  sex: number
  birthday: Date
  description: string
  avatar: string
}

// 查询示例联系人分页
export const getDemo01ContactPage = async (params) => {
  return await request.get({ url: `/infra/demo01-contact/page`, params })
}

// 查询示例联系人详情
export const getDemo01Contact = async (id: number) => {
  return await request.get({ url: `/infra/demo01-contact/get?id=` + id })
}

// 新增示例联系人
export const createDemo01Contact = async (data: Demo01ContactVO) => {
  return await request.post({ url: `/infra/demo01-contact/create`, data })
}

// 修改示例联系人
export const updateDemo01Contact = async (data: Demo01ContactVO) => {
  return await request.put({ url: `/infra/demo01-contact/update`, data })
}

// 删除示例联系人
export const deleteDemo01Contact = async (id: number) => {
  return await request.delete({ url: `/infra/demo01-contact/delete?id=` + id })
}

// 导出示例联系人 Excel
export const exportDemo01Contact = async (params) => {
  return await request.download({ url: `/infra/demo01-contact/export-excel`, params })
}
