import request from '@/config/axios'

// AI 知识库分片 VO
export interface AiKnowledgeSegmentRespVO {
  id: number // 编号
  documentId: number // 文档编号
  knowledgeId: number // 知识库编号
  vectorId: string // 向量库编号
  content: string // 切片内容
  contentLength: number // 切片内容长度
  tokens: number // token 数量
  retrievalCount: number // 召回次数
  status: number // 文档状态
  createTime: number // 创建时间
}

// AI 知识库分片 API
export const KnowledgeSegmentApi = {
  // 查询知识库分片分页
  getKnowledgeSegmentPage: async (params: any) => {
    return await request.get({ url: `/ai/knowledge/segment/page`, params })
  },

  // 查询知识库分片详情
  getKnowledgeSegment: async (id: number) => {
    return await request.get({ url: `/ai/knowledge/segment/get?id=` + id })
  },

  // 删除知识库分片
  deleteKnowledgeSegment: async (id: number) => {
    return await request.delete({ url: `/ai/knowledge/segment/delete?id=` + id })
  },
  
  // 切片内容
  splitContent: async (url: string, segmentMaxTokens: number) => {
    return await request.get({ 
      url: `/ai/knowledge/segment/split`, 
      params: { url, segmentMaxTokens } 
    })
  },
  
  // 获取文档处理列表
  getKnowledgeSegmentProcessList: async (documentIds: number[]) => {
    return await request.get({ 
      url: `/ai/knowledge/segment/get-process-list`, 
      params: { documentIds: documentIds.join(',') } 
    })
  }
}
