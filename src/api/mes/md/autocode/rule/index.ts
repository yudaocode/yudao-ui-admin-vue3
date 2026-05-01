import request from '@/config/axios'

// MES 编码规则 VO
export interface AutoCodeRuleVO {
  id: number // 规则编号
  code: string // 规则编码
  name: string // 规则名称
  description: string // 规则描述
  maxLength: number // 最大长度
  padded: boolean // 是否补齐
  paddedChar: string // 补齐字符
  paddedMethod: number // 补齐方式
  status: number // 状态
  remark: string // 备注
}

// MES 编码规则 API
export const AutoCodeRuleApi = {
  // 查询编码规则分页
  getAutoCodeRulePage: async (params: any) => {
    return await request.get({ url: `/mes/md/auto-code-rule/page`, params })
  },

  // 查询编码规则详情
  getAutoCodeRule: async (id: number) => {
    return await request.get({ url: `/mes/md/auto-code-rule/get?id=` + id })
  },

  // 新增编码规则
  createAutoCodeRule: async (data: AutoCodeRuleVO) => {
    return await request.post({ url: `/mes/md/auto-code-rule/create`, data })
  },

  // 修改编码规则
  updateAutoCodeRule: async (data: AutoCodeRuleVO) => {
    return await request.put({ url: `/mes/md/auto-code-rule/update`, data })
  },

  // 删除编码规则
  deleteAutoCodeRule: async (id: number) => {
    return await request.delete({ url: `/mes/md/auto-code-rule/delete?id=` + id })
  },

  // 导出编码规则 Excel
  exportAutoCodeRule: async (params: any) => {
    return await request.download({ url: `/mes/md/auto-code-rule/export-excel`, params })
  }
}
