import request from '@/config/axios'

// 点赞文档
export const createKnowledgeDocumentLike = (documentId: number) => {
  return request.post({ url: '/pms/kb/document-like/create', params: { documentId } })
}

// 取消点赞文档
export const deleteKnowledgeDocumentLike = (documentId: number) => {
  return request.delete({ url: '/pms/kb/document-like/delete', params: { documentId } })
}
