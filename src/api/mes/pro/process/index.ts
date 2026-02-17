import request from '@/config/axios'

// MES 生产工序 VO
export interface ProProcessVO {
  id?: number // 编号
  code: string // 工序编码
  name: string // 工序名称
  attention?: string // 工艺要求
  status: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// MES 生产工序 API
export const ProProcessApi = {
  // 查询生产工序列表分页
  getProcessPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/process/page`, params })
  },

  // 查询生产工序精简列表
  getProcessSimpleList: async () => {
    return await request.get({ url: `/mes/pro/process/simple-list` })
  },

  // 查询生产工序详情
  getProcess: async (id: number) => {
    return await request.get({ url: `/mes/pro/process/get?id=` + id })
  },

  // 新增生产工序
  createProcess: async (data: ProProcessVO) => {
    return await request.post({ url: `/mes/pro/process/create`, data })
  },

  // 修改生产工序
  updateProcess: async (data: ProProcessVO) => {
    return await request.put({ url: `/mes/pro/process/update`, data })
  },

  // 删除生产工序
  deleteProcess: async (id: number) => {
    return await request.delete({ url: `/mes/pro/process/delete?id=` + id })
  },

  // 导出生产工序 Excel
  exportProcess: async (params: any) => {
    return await request.download({ url: `/mes/pro/process/export-excel`, params })
  }
}
