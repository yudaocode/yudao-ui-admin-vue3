import request from '@/config/axios'

export interface OfficialDocTemplateVO {
  id?: number // 编号
  name?: string // 模板名称
  authorityName?: string // 红头名称
  fontSize?: number // 红头字号
  noPrefix?: string // 发文字号前缀
  sealPicUrl?: string // 印章图片地址
  separatorType?: number // 分隔线类型
  status?: number // 状态
  sort?: number // 显示顺序
  remark?: string // 备注
  creator?: string // 创建人编号
  createTime?: string // 创建时间
}

// 查询套红模板分页
export const getTemplatePage = (params: PageParam) => {
  return request.get({ url: '/oa/officialdoc-template/page', params })
}

// 查询套红模板
export const getTemplate = (id: number) => {
  return request.get({ url: '/oa/officialdoc-template/get', params: { id } })
}

// 新增套红模板
export const createTemplate = (data: OfficialDocTemplateVO) => {
  return request.post({ url: '/oa/officialdoc-template/create', data })
}

// 修改套红模板
export const updateTemplate = (data: OfficialDocTemplateVO) => {
  return request.put({ url: '/oa/officialdoc-template/update', data })
}

// 删除套红模板
export const deleteTemplate = (id: number) => {
  return request.delete({ url: '/oa/officialdoc-template/delete', params: { id } })
}

// 查询套红模板精简列表
export const getSimpleTemplateList = () => {
  return request.get({ url: '/oa/officialdoc-template/simple-list' })
}
