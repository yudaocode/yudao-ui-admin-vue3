import request from '@/config/axios'

// MES 工具类型 VO
export interface TmToolTypeVO {
  id: number // 编号
  code: string // 类型编码
  name: string // 类型名称
  codeFlag: boolean // 是否编码管理
  maintenType: number // 保养维护类型
  maintenPeriod: number // 保养周期
  remark: string // 备注
}

// MES 工具类型 API
export const TmToolTypeApi = {
  // 查询工具类型分页
  getToolTypePage: async (params: any) => {
    return await request.get({ url: `/mes/tm/tool-type/page`, params })
  },

  // 查询工具类型精简列表
  getToolTypeSimpleList: async () => {
    return await request.get({ url: `/mes/tm/tool-type/simple-list` })
  },

  // 查询工具类型详情
  getToolType: async (id: number) => {
    return await request.get({ url: `/mes/tm/tool-type/get?id=` + id })
  },

  // 新增工具类型
  createToolType: async (data: TmToolTypeVO) => {
    return await request.post({ url: `/mes/tm/tool-type/create`, data })
  },

  // 修改工具类型
  updateToolType: async (data: TmToolTypeVO) => {
    return await request.put({ url: `/mes/tm/tool-type/update`, data })
  },

  // 删除工具类型
  deleteToolType: async (id: number) => {
    return await request.delete({ url: `/mes/tm/tool-type/delete?id=` + id })
  },

  // 导出工具类型 Excel
  exportToolType: async (params: any) => {
    return await request.download({ url: `/mes/tm/tool-type/export-excel`, params })
  }
}
