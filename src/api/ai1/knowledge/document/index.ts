import request from '@/config/axios'

/** AI1 知识文档信息 */
export interface KnowledgeDocument {
  id?: number // 编号
  knowledgeBaseId: number // 知识库编号
  name: string // 名称
  content?: string // 内容
  contentLength?: number // 字符数
  chunkCount?: number // 分片数
  status?: number // 状态，参见 Ai1KnowledgeDocumentStatusEnum
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

/** AI1 知识文档批量向量化结果 */
export interface KnowledgeDocumentVectorize {
  successCount: number // 成功数量
  failureCount: number // 失败数量
}

// AI1 知识文档 API
export const KnowledgeDocumentApi = {
  // 查询知识文档分页
  getKnowledgeDocumentPage: async (params: any) => {
    return await request.get({ url: `/ai1/knowledge/document/page`, params })
  },

  // 查询知识文档详情
  getKnowledgeDocument: async (id: number) => {
    return await request.get({ url: `/ai1/knowledge/document/get?id=` + id })
  },

  // 新增知识文档
  createKnowledgeDocument: async (data: KnowledgeDocument) => {
    return await request.post({ url: `/ai1/knowledge/document/create`, data })
  },

  // 上传知识文档
  uploadKnowledgeDocument: async (knowledgeBaseId: number, file: File) => {
    return await request.upload({
      url: `/ai1/knowledge/document/upload`,
      data: { knowledgeBaseId, file }
    })
  },

  // 修改知识文档
  updateKnowledgeDocument: async (data: KnowledgeDocument) => {
    return await request.put({ url: `/ai1/knowledge/document/update`, data })
  },

  // 删除知识文档
  deleteKnowledgeDocument: async (id: number) => {
    return await request.delete({ url: `/ai1/knowledge/document/delete?id=` + id })
  },

  // 批量删除知识文档
  deleteKnowledgeDocumentList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/knowledge/document/delete-list?ids=${ids.join(',')}` })
  },

  // 向量化知识文档
  vectorizeKnowledgeDocument: async (id: number): Promise<number> => {
    return await request.post({ url: `/ai1/knowledge/document/vectorize?id=` + id })
  },

  // 向量化知识库下全部知识文档
  vectorizeKnowledgeDocumentAll: async (
    knowledgeBaseId: number
  ): Promise<KnowledgeDocumentVectorize> => {
    return await request.post({
      url: `/ai1/knowledge/document/vectorize-all?knowledgeBaseId=` + knowledgeBaseId
    })
  }
}
