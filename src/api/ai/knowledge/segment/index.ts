import request from '@/config/axios'

// AI 知识库分段 VO
export interface KnowledgeSegmentVO {
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

// AI 知识库分段 API
export const KnowledgeSegmentApi = {
  // 查询知识库分段分页
  getKnowledgeSegmentPage: async (params: any) => {
    return await request.get({ url: `/ai/knowledge/segment/page`, params })
  },

  // 查询知识库分段详情
  getKnowledgeSegment: async (id: number) => {
    return await request.get({ url: `/ai/knowledge/segment/get?id=` + id })
  },

  // 删除知识库分段
  deleteKnowledgeSegment: async (id: number) => {
    return await request.delete({ url: `/ai/knowledge/segment/delete?id=` + id })
  },

  // 新增知识库分段
  createKnowledgeSegment: async (data: KnowledgeSegmentVO) => {
    return await request.post({ url: `/ai/knowledge/segment/create`, data })
  },

  // 修改知识库分段
  updateKnowledgeSegment: async (data: KnowledgeSegmentVO) => {
    return await request.put({ url: `/ai/knowledge/segment/update`, data })
  },

  // 修改知识库分段状态
  updateKnowledgeSegmentStatus: async (data: any) => {
    return await request.put({
      url: `/ai/knowledge/segment/update-status`,
      data
    })
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
  },

  // 搜索知识库分段
  searchKnowledgeSegment: async (params: any) => {
    return await request.get({
      url: `/ai/knowledge/segment/search`,
      params
    })
  }
}
