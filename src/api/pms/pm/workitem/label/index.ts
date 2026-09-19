import request from '@/config/axios'

// PMS 工作项标签 VO
export interface PmsWorkItemLabelVO {
  id?: number // 标签编号
  name: string // 标签名称
  color: string // 标签颜色
  createTime?: number // 创建时间
}

// 查询工作项标签列表
export const getWorkItemLabelList = (name?: string) => {
  return request.get<PmsWorkItemLabelVO[]>({
    url: '/pms/pm/work-item-label/list',
    params: { name }
  })
}

// 新增工作项标签
export const createWorkItemLabel = (data: PmsWorkItemLabelVO) => {
  return request.post({ url: '/pms/pm/work-item-label/create', data })
}

// 修改工作项标签
export const updateWorkItemLabel = (data: PmsWorkItemLabelVO) => {
  return request.put({ url: '/pms/pm/work-item-label/update', data })
}

// 删除工作项标签
export const deleteWorkItemLabel = (id: number) => {
  return request.delete({ url: '/pms/pm/work-item-label/delete', params: { id } })
}
