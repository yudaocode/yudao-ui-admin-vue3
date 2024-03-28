import request from '@/config/axios'

// BPM 流程表达式 VO
export interface ProcessExpressionVO {
  id: number // 编号
  name: string // 表达式名字
  status: number // 表达式状态
  expression: string // 表达式
}

// BPM 流程表达式 API
export const ProcessExpressionApi = {
  // 查询BPM 流程表达式分页
  getProcessExpressionPage: async (params: any) => {
    return await request.get({ url: `/bpm/process-expression/page`, params })
  },

  // 查询BPM 流程表达式详情
  getProcessExpression: async (id: number) => {
    return await request.get({ url: `/bpm/process-expression/get?id=` + id })
  },

  // 新增BPM 流程表达式
  createProcessExpression: async (data: ProcessExpressionVO) => {
    return await request.post({ url: `/bpm/process-expression/create`, data })
  },

  // 修改BPM 流程表达式
  updateProcessExpression: async (data: ProcessExpressionVO) => {
    return await request.put({ url: `/bpm/process-expression/update`, data })
  },

  // 删除BPM 流程表达式
  deleteProcessExpression: async (id: number) => {
    return await request.delete({ url: `/bpm/process-expression/delete?id=` + id })
  },

  // 导出BPM 流程表达式 Excel
  exportProcessExpression: async (params) => {
    return await request.download({ url: `/bpm/process-expression/export-excel`, params })
  }
}