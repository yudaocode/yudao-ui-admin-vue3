import request from '@/config/axios'

// AI 模型 VO
export interface ModelVO {
  id: number // 编号
  keyId: number // API 秘钥编号
  name: string // 模型名字
  model: string // 模型标识
  platform: string // 模型平台
  type: number // 模型类型
  sort: number // 排序
  status: number // 状态
  temperature?: number // 温度参数
  maxTokens?: number // 单条回复的最大 Token 数量
  maxContexts?: number // 上下文的最大 Message 数量
  inputModalities?: string[] // 输入模态数组
  reasoningConfig?: ModelReasoningConfigVO // 思考配置；为空表示未配置，simple-list 不返回
}

// AI 模型的思考配置
export interface ModelReasoningConfigVO {
  levels: ModelReasoningLevelVO[] // 档位数组，从低到高；为空表示清空
  defaultLevel?: string // 默认档位
}

// AI 模型的思考档位
export interface ModelReasoningLevelVO {
  level: string // 档位值
  options: Record<string, unknown> // 思考参数
}

// AI 模型 API
export const ModelApi = {
  // 查询模型分页
  getModelPage: async (params: any) => {
    return await request.get({ url: `/ai/model/page`, params })
  },

  // 获得模型列表
  getModelSimpleList: async (type?: number) => {
    return await request.get({
      url: `/ai/model/simple-list`,
      params: {
        type
      }
    })
  },

  // 查询模型详情
  getModel: async (id: number) => {
    return await request.get({ url: `/ai/model/get?id=` + id })
  },

  // 新增模型
  createModel: async (data: ModelVO) => {
    return await request.post({ url: `/ai/model/create`, data })
  },

  // 修改模型
  updateModel: async (data: ModelVO) => {
    return await request.put({ url: `/ai/model/update`, data })
  },

  // 删除模型
  deleteModel: async (id: number) => {
    return await request.delete({ url: `/ai/model/delete?id=` + id })
  }
}
