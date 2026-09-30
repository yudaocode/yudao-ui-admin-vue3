import request from '@/config/axios'

/** AI1 知识库信息 */
export interface KnowledgeBase {
  id?: number // 编号
  name: string // 名称
  description?: string // 描述
  embeddingProviderId: number // 向量化模型供应商编号
  embeddingProviderName?: string // 向量化模型供应商名称
  embeddingModelId: number // 向量化模型编号
  embeddingModelName?: string // 向量化模型名称
  chunkSize: number // 分片大小
  chunkOverlap: number // 分片重叠
  topK: number // 检索数量
  status: number // 状态
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

/** AI1 知识库检索结果 */
export interface KnowledgeSearch {
  text: string // 分片文本
  documentId?: number // 文档编号
  documentName?: string // 文档名称
  chunkIndex?: number // 分片序号
  score: number // 相似度
}

// AI1 知识库 API
export const KnowledgeBaseApi = {
  // 查询知识库分页
  getKnowledgeBasePage: async (params: any) => {
    return await request.get({ url: `/ai1/knowledge/page`, params })
  },

  // 查询知识库详情
  getKnowledgeBase: async (id: number) => {
    return await request.get({ url: `/ai1/knowledge/get?id=` + id })
  },

  // 查询知识库精简列表
  getKnowledgeBaseSimpleList: async (): Promise<KnowledgeBase[]> => {
    return await request.get({ url: `/ai1/knowledge/simple-list` })
  },

  // 新增知识库
  createKnowledgeBase: async (data: KnowledgeBase) => {
    return await request.post({ url: `/ai1/knowledge/create`, data })
  },

  // 修改知识库
  updateKnowledgeBase: async (data: KnowledgeBase) => {
    return await request.put({ url: `/ai1/knowledge/update`, data })
  },

  // 删除知识库
  deleteKnowledgeBase: async (id: number) => {
    return await request.delete({ url: `/ai1/knowledge/delete?id=` + id })
  },

  // 批量删除知识库
  deleteKnowledgeBaseList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/knowledge/delete-list?ids=${ids.join(',')}` })
  },

  // 检索知识库
  searchKnowledgeBase: async (params: {
    id: number
    query: string
    topK?: number
  }): Promise<KnowledgeSearch[]> => {
    return await request.get({ url: `/ai1/knowledge/search`, params })
  }
}
