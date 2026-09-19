import request from '@/config/axios'

export interface PmsProjectTemplateStatusVO {
  code: string // 模板内稳定编码
  name: string // 状态名称
  workItemType: number // 工作项类型
  statusType: number // 语义状态
  defaultStatus: boolean // 是否为初始状态
  sort: number // 显示顺序
  boardCode: string // 所属看板列编码
}

export interface PmsProjectTemplateBoardVO {
  code: string // 模板内稳定编码
  name: string // 看板列名称
  workItemType: number // 工作项类型
  sort: number // 显示顺序
  statusCodes: string[] // 关联的状态编码列表
}

export interface PmsProjectTemplateVO {
  id?: number // 模板编号
  name: string // 模板名称
  description?: string // 模板描述
  projectType: number // 项目类型
  status: number // 模板状态
  sort: number // 显示顺序
  itemTypes: number[] // 启用的工作项类型列表
  statuses: PmsProjectTemplateStatusVO[] // 工作项状态模板列表
  boards: PmsProjectTemplateBoardVO[] // 看板列模板列表
  createTime?: number // 创建时间
}

// 查询项目模板分页
export const getProjectTemplatePage = (params: PageParam) => {
  return request.get<PageResult<PmsProjectTemplateVO[]>>({
    url: '/pms/pm/project-template/page',
    params
  })
}

// 查询项目模板详情
export const getProjectTemplate = (id: number) => {
  return request.get<PmsProjectTemplateVO>({ url: '/pms/pm/project-template/get', params: { id } })
}

// 新增项目模板
export const createProjectTemplate = (data: PmsProjectTemplateVO) => {
  return request.post({ url: '/pms/pm/project-template/create', data })
}

// 修改项目模板
export const updateProjectTemplate = (data: PmsProjectTemplateVO) => {
  return request.put({ url: '/pms/pm/project-template/update', data })
}

// 删除项目模板
export const deleteProjectTemplate = (id: number) => {
  return request.delete({ url: '/pms/pm/project-template/delete', params: { id } })
}
