import request from '@/config/axios'

/** IoT 数据流转规则信息 */
export interface DataRule {
  id: number // 场景编号
  name?: string // 场景名称
  description: string // 场景描述
  status?: number // 场景状态
  sourceConfigs?: any[] // 数据源配置数组
  sinkIds?: number[] // 数据目的编号数组
}

// IoT 数据流转规则 API
export const DataRuleApi = {
  // 查询数据流转规则分页
  getDataRulePage: async (params: any) => {
    return await request.get({ url: `/iot/data-rule/page`, params })
  },

  // 查询数据流转规则详情
  getDataRule: async (id: number) => {
    return await request.get({ url: `/iot/data-rule/get?id=` + id })
  },

  // 新增数据流转规则
  createDataRule: async (data: DataRule) => {
    return await request.post({ url: `/iot/data-rule/create`, data })
  },

  // 修改数据流转规则
  updateDataRule: async (data: DataRule) => {
    return await request.put({ url: `/iot/data-rule/update`, data })
  },

  // 删除数据流转规则
  deleteDataRule: async (id: number) => {
    return await request.delete({ url: `/iot/data-rule/delete?id=` + id })
  }
}
