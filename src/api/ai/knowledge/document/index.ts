import request from '@/config/axios'

// AI 知识库文档 VO
export interface KnowledgeDocumentVO {
  id: number // 编号
  knowledgeId: number // 知识库编号
  name: string // 文档名称
  contentLength: number // 字符数
  tokens: number // token 数
  segmentMaxTokens: number // 分片最大 token 数
  retrievalCount: number // 召回次数
  status: number // 是否启用
}

// AI 知识库文档 API
export const KnowledgeDocumentApi = {
  // 查询知识库文档分页
  getKnowledgeDocumentPage: async (params: any) => {
    return await request.get({ url: `/ai/knowledge/document/page`, params })
  },

  // 查询知识库文档详情
  getKnowledgeDocument: async (id: number) => {
    return await request.get({ url: `/ai/knowledge/document/get?id=` + id })
  },

  // 新增知识库文档（单个）
  createKnowledgeDocument: async (data: any) => {
    return await request.post({ url: `/ai/knowledge/document/create`, data })
  },

  // 新增知识库文档（多个）
  createKnowledgeDocumentList: async (data: any) => {
    return await request.post({ url: `/ai/knowledge/document/create-list`, data })
  },

  // 修改知识库文档
  updateKnowledgeDocument: async (data: any) => {
    return await request.put({ url: `/ai/knowledge/document/update`, data })
  },

  // 修改知识库文档状态
  updateKnowledgeDocumentStatus: async (data: any) => {
    return await request.put({
      url: `/ai/knowledge/document/update-status`,
      data
    })
  },

  // 删除知识库文档
  deleteKnowledgeDocument: async (id: number) => {
    return await request.delete({ url: `/ai/knowledge/document/delete?id=` + id })
  }
}
