import request from '@/config/axios'

// MES 工具台账 VO
export interface TmToolVO {
  id: number // 编号
  code: string // 工具编码
  name: string // 工具名称
  brand: string // 品牌
  spec: string // 型号规格
  toolTypeId: number // 工具类型编号
  toolTypeName: string // 工具类型名称
  quantity: number // 数量
  quantityAvailable: number // 可用数量
  maintenType: number // 保养维护类型
  nextMaintenPeriod: number // 下次保养周期（次数）
  nextMaintenDate: Date // 下次保养日期
  status: number // 状态
  remark: string // 备注
}

// MES 工具台账 API
export const TmToolApi = {
  // 查询工具台账分页
  getToolPage: async (params: any) => {
    return await request.get({ url: `/mes/tm/tool/page`, params })
  },

  // 查询工具台账详情
  getTool: async (id: number) => {
    return await request.get({ url: `/mes/tm/tool/get?id=` + id })
  },

  // 新增工具台账
  createTool: async (data: TmToolVO) => {
    return await request.post({ url: `/mes/tm/tool/create`, data })
  },

  // 修改工具台账
  updateTool: async (data: TmToolVO) => {
    return await request.put({ url: `/mes/tm/tool/update`, data })
  },

  // 删除工具台账
  deleteTool: async (id: number) => {
    return await request.delete({ url: `/mes/tm/tool/delete?id=` + id })
  },

  // 导出工具台账 Excel
  exportTool: async (params: any) => {
    return await request.download({ url: `/mes/tm/tool/export-excel`, params })
  }
}
