import request from '@/config/axios'

/** AI1 模型信息 */
export interface Model {
  id?: number // 编号
  providerId: number // 模型供应商编号
  name: string // 名称
  model: string // 模型标识
  type: number // 类型
  status: number // 状态
  createTime?: Date // 创建时间
}

/** AI1 远程模型信息 */
export interface RemoteModel {
  model: string // 模型标识
  imported: boolean // 是否已导入
}

// AI1 模型 API
export const ModelApi = {
  // 查询模型分页
  getModelPage: async (params: any) => {
    return await request.get({ url: `/ai1/model/page`, params })
  },

  // 查询模型详情
  getModel: async (id: number) => {
    return await request.get({ url: `/ai1/model/get?id=` + id })
  },

  // 查询模型精简列表
  getModelSimpleList: async (providerId?: number, type?: number): Promise<Model[]> => {
    return await request.get({ url: `/ai1/model/simple-list`, params: { providerId, type } })
  },

  // 新增模型
  createModel: async (data: Model) => {
    return await request.post({ url: `/ai1/model/create`, data })
  },

  // 修改模型
  updateModel: async (data: Model) => {
    return await request.put({ url: `/ai1/model/update`, data })
  },

  // 删除模型
  deleteModel: async (id: number) => {
    return await request.delete({ url: `/ai1/model/delete?id=` + id })
  },

  // 批量删除模型
  deleteModelList: async (ids: number[]) => {
    return await request.delete({ url: `/ai1/model/delete-list?ids=${ids.join(',')}` })
  },

  // 查询远程模型列表
  getRemoteModelList: async (providerId: number): Promise<RemoteModel[]> => {
    return await request.get({ url: `/ai1/model/remote-list?providerId=` + providerId })
  },

  // 导入远程模型
  importRemoteModelList: async (data: {
    providerId: number
    models: string[]
  }): Promise<number> => {
    return await request.post({ url: `/ai1/model/import`, data })
  }
}
