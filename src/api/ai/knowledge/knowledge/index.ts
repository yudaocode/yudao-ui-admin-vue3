import request from '@/config/axios'

// AI 知识库 VO
export interface KnowledgeVO {
  id: number // 编号
  name: string // 知识库名称
  description: string // 知识库描述
  embeddingModelId: number // 嵌入模型编号，高质量模式时维护
  topK: number // topK
  similarityThreshold: number // 相似度阈值
}

// AI 知识库 API
export const KnowledgeApi = {
  // 查询知识库分页
  getKnowledgePage: async (params: any) => {
    return await request.get({ url: `/ai/knowledge/page`, params })
  },

  // 查询知识库详情
  getKnowledge: async (id: number) => {
    return await request.get({ url: `/ai/knowledge/get?id=` + id })
  },

  // 新增知识库
  createKnowledge: async (data: KnowledgeVO) => {
    return await request.post({ url: `/ai/knowledge/create`, data })
  },

  // 修改知识库
  updateKnowledge: async (data: KnowledgeVO) => {
    return await request.put({ url: `/ai/knowledge/update`, data })
  },

  // 删除知识库
  deleteKnowledge: async (id: number) => {
    return await request.delete({ url: `/ai/knowledge/delete?id=` + id })
  },

  // 获取知识库简单列表
  getSimpleKnowledgeList: async () => {
    return await request.get({ url: `/ai/knowledge/simple-list` })
  }
}
