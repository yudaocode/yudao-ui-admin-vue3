import request from '@/config/axios'

// PMS 知识库文档评论 VO
export interface PmsKnowledgeDocumentCommentVO {
  id: number // 评论编号
  documentId: number // 文档编号
  userId: number // 评论人用户编号
  userName?: string // 评论人昵称
  mainId: number // 主评论编号
  replyUserId?: number // 回复对象用户编号
  replyUserName?: string // 回复对象昵称
  content: string // 评论内容
  createTime: number // 创建时间
  children: PmsKnowledgeDocumentCommentVO[] // 回复列表
}

// 查询文档评论列表
export const getKnowledgeDocumentCommentList = (documentId: number) => {
  return request.get<PmsKnowledgeDocumentCommentVO[]>({
    url: '/pms/kb/document-comment/list',
    params: { documentId }
  })
}

// 新增文档评论
export const createKnowledgeDocumentComment = (data: PmsKnowledgeDocumentCommentVO) => {
  return request.post({ url: '/pms/kb/document-comment/create', data })
}

// 删除文档评论
export const deleteKnowledgeDocumentComment = (id: number) => {
  return request.delete({ url: '/pms/kb/document-comment/delete', params: { id } })
}
