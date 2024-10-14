import request from '@/config/axios'

export type FormVO = {
  id: number
  name: string
  conf: string
  fields: string[]
  status: number
  remark: string
  createTime: string
}

// 创建工作流的表单定义
export const createForm = async (data: FormVO) => {
  return await request.post({
    url: '/bpm/form/create',
    data: data
  })
}

// 更新工作流的表单定义
export const updateForm = async (data: FormVO) => {
  return await request.put({
    url: '/bpm/form/update',
    data: data
  })
}

// 删除工作流的表单定义
export const deleteForm = async (id: number) => {
  return await request.delete({
    url: '/bpm/form/delete?id=' + id
  })
}

// 获得工作流的表单定义
export const getForm = async (id: number) => {
  return await request.get({
    url: '/bpm/form/get?id=' + id
  })
}

// 获得工作流的表单定义分页
export const getFormPage = async (params) => {
  return await request.get({
    url: '/bpm/form/page',
    params
  })
}

// 获得动态表单的精简列表
export const getFormSimpleList = async () => {
  return await request.get({
    url: '/bpm/form/simple-list'
  })
}
