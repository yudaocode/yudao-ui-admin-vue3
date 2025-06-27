import request from '@/config/axios'

export interface DeptVO {
  id: number
  name: string
  parentId: number
  status: number
  sort: number
  leaderUserId: number
  phone: string
  email: string
  createTime: Date
}

// 查询部门（精简)列表
export const getSimpleDeptList = (): Promise<DeptVO[]> => {
  return request.get({ url: '/system/dept/simple-list' })
}

// 查询部门列表
export const getDeptList = (params: any) => {
  return request.get({ url: '/system/dept/list', params })
}

// 查询部门分页
export const getDeptPage = async (params: PageParam) => {
  return await request.get({ url: '/system/dept/list', params })
}

// 查询部门详情
export const getDept = (id: number) => {
  return request.get({ url: '/system/dept/get?id=' + id })
}

// 新增部门
export const createDept = (data: DeptVO) => {
  return request.post({ url: '/system/dept/create', data })
}

// 修改部门
export const updateDept = (data: DeptVO) => {
  return request.put({ url: '/system/dept/update', data })
}

// 删除部门
export const deleteDept = async (id: number) => {
  return await request.delete({ url: '/system/dept/delete?id=' + id })
}

// 批量删除部门
export const deleteDeptList = async (ids: number[]) => {
  return await request.delete({ url: '/system/dept/delete-list', params: { ids: ids.join(',') } })
}
