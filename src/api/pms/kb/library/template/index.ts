import request from '@/config/axios'

export interface PmsKnowledgeLibraryTemplateDocumentVO {
  title: string // 文档标题
  content: string // 文档内容
}

export interface PmsKnowledgeLibraryTemplateVO {
  id?: number // 模板编号
  name: string // 模板名称
  description?: string // 模板简介
  coverUrl?: string // 模板封面地址
  status: number // 模板状态
  sort: number // 显示顺序
  documents?: PmsKnowledgeLibraryTemplateDocumentVO[] // 模板文档列表
  createTime?: number // 创建时间
}

export interface PmsKnowledgeLibraryTemplateSaveReqVO extends Omit<
  PmsKnowledgeLibraryTemplateVO,
  'documents'
> {
  documents: PmsKnowledgeLibraryTemplateDocumentVO[] // 模板文档列表
}

// 查询知识库模板分页
export const getKnowledgeLibraryTemplatePage = (params: PageParam) => {
  return request.get<PageResult<PmsKnowledgeLibraryTemplateVO[]>>({
    url: '/pms/kb/library-template/page',
    params
  })
}

// 查询知识库模板详情
export const getKnowledgeLibraryTemplate = (id: number) => {
  return request.get<PmsKnowledgeLibraryTemplateSaveReqVO>({
    url: '/pms/kb/library-template/get',
    params: { id }
  })
}

// 新增知识库模板
export const createKnowledgeLibraryTemplate = (data: PmsKnowledgeLibraryTemplateSaveReqVO) => {
  return request.post({ url: '/pms/kb/library-template/create', data })
}

// 修改知识库模板
export const updateKnowledgeLibraryTemplate = (data: PmsKnowledgeLibraryTemplateSaveReqVO) => {
  return request.put({ url: '/pms/kb/library-template/update', data })
}

// 删除知识库模板
export const deleteKnowledgeLibraryTemplate = (id: number) => {
  return request.delete({ url: '/pms/kb/library-template/delete', params: { id } })
}
