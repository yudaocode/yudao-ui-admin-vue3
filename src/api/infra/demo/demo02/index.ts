import request from '@/config/axios'

export interface Demo02CategoryVO {
  id: number
  name: string
  parentId: number
}

// 查询示例分类列表
export const getDemo02CategoryList = async (params) => {
  return await request.get({ url: `/infra/demo02-category/list`, params })
}

// 查询示例分类详情
export const getDemo02Category = async (id: number) => {
  return await request.get({ url: `/infra/demo02-category/get?id=` + id })
}

// 新增示例分类
export const createDemo02Category = async (data: Demo02CategoryVO) => {
  return await request.post({ url: `/infra/demo02-category/create`, data })
}

// 修改示例分类
export const updateDemo02Category = async (data: Demo02CategoryVO) => {
  return await request.put({ url: `/infra/demo02-category/update`, data })
}

// 删除示例分类
export const deleteDemo02Category = async (id: number) => {
  return await request.delete({ url: `/infra/demo02-category/delete?id=` + id })
}

// 导出示例分类 Excel
export const exportDemo02Category = async (params) => {
  return await request.download({ url: `/infra/demo02-category/export-excel`, params })
}
