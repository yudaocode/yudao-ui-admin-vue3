import request from '@/config/axios'

/** AI1 模型供应商信息 */
export interface Provider {
  id?: number // 编号
  name: string // 名称
  baseUrl: string // 接口地址
  apiKey?: string // API 密钥
  headers?: string // 请求附属 Header
  status: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
  updateTime?: Date // 更新时间
}

/** AI1 模型供应商连通测试结果 */
export interface ProviderConnect {
  connectable: boolean // 是否连通
  httpCode: number // HTTP 状态码
  elapsedMs: number // 测试耗时，单位：毫秒
  message: string // 测试过程描述
}

// AI1 模型供应商 API
export const ProviderApi = {
  // 查询模型供应商分页
  getProviderPage: async (params: any) => {
    return await request.get({ url: `/ai1/provider/page`, params })
  },

  // 查询模型供应商详情
  getProvider: async (id: number) => {
    return await request.get({ url: `/ai1/provider/get?id=` + id })
  },

  // 查询模型供应商精简列表
  getProviderSimpleList: async (): Promise<Provider[]> => {
    return await request.get({ url: `/ai1/provider/simple-list` })
  },

  // 新增模型供应商
  createProvider: async (data: Provider) => {
    return await request.post({ url: `/ai1/provider/create`, data })
  },

  // 修改模型供应商
  updateProvider: async (data: Provider) => {
    return await request.put({ url: `/ai1/provider/update`, data })
  },

  // 删除模型供应商
  deleteProvider: async (id: number) => {
    return await request.delete({ url: `/ai1/provider/delete?id=` + id })
  },

  // 批量删除模型供应商
  deleteProviderList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/provider/delete-list?ids=${ids.join(',')}` })
  },

  // 测试模型供应商连通
  testProvider: async (id: number): Promise<ProviderConnect> => {
    return await request.post({ url: `/ai1/provider/test?id=` + id })
  }
}
