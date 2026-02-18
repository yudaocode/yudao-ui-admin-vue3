import request from '@/config/axios'

// MES 生产工序内容 VO
export interface ProProcessContentVO {
  id?: number // 编号
  processId: number // 工序编号
  sort: number // 顺序编号
  content?: string // 步骤说明
  device?: string // 辅助设备
  material?: string // 辅助材料
  docUrl?: string // 材料文档 URL
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// MES 生产工序内容 API
export const ProProcessContentApi = {
  // 查询工序内容列表（按工序编号）
  getProcessContentListByProcessId: async (processId: number) => {
    return await request.get({ url: `/mes/pro/process-content/list-by-process?processId=` + processId })
  },

  // 查询工序内容详情
  getProcessContent: async (id: number) => {
    return await request.get({ url: `/mes/pro/process-content/get?id=` + id })
  },

  // 新增工序内容
  createProcessContent: async (data: ProProcessContentVO) => {
    return await request.post({ url: `/mes/pro/process-content/create`, data })
  },

  // 修改工序内容
  updateProcessContent: async (data: ProProcessContentVO) => {
    return await request.put({ url: `/mes/pro/process-content/update`, data })
  },

  // 删除工序内容
  deleteProcessContent: async (id: number) => {
    return await request.delete({ url: `/mes/pro/process-content/delete?id=` + id })
  }
}
