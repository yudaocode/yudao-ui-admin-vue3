import request from '@/config/axios'
import type { PmsKnowledgeDocumentVO } from '..'

// PMS 知识库文档标签 VO
export interface PmsKnowledgeDocumentLabelVO {
  id: number // 文档标签编号
  name: string // 标签名称
  color: string // 标签颜色
  createTime: number // 创建时间
}

// 查询文档标签详情
export const getKnowledgeDocumentLabel = async (id: number) => {
  return await request.get<PmsKnowledgeDocumentLabelVO>({
    url: '/pms/kb/document-label/get',
    params: { id }
  })
}

// 查询文档标签列表
export const getKnowledgeDocumentLabelList = async () => {
  return await request.get<PmsKnowledgeDocumentLabelVO[]>({ url: '/pms/kb/document-label/list' })
}

// 新增文档标签
export const createKnowledgeDocumentLabel = async (data: PmsKnowledgeDocumentLabelVO) => {
  return await request.post({ url: '/pms/kb/document-label/create', data })
}

// 修改文档标签
export const updateKnowledgeDocumentLabel = async (data: PmsKnowledgeDocumentLabelVO) => {
  return await request.put({ url: '/pms/kb/document-label/update', data })
}

// 删除文档标签
export const deleteKnowledgeDocumentLabel = async (id: number) => {
  return await request.delete({ url: '/pms/kb/document-label/delete', params: { id } })
}

// 查询标签下的文档分页
export const getKnowledgeDocumentPageByLabel = async (params: PageParam) => {
  return await request.get<PageResult<PmsKnowledgeDocumentVO[]>>({
    url: '/pms/kb/document-label/document-page',
    params
  })
}
