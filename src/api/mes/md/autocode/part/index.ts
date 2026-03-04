import request from '@/config/axios'

// MES 编码规则分段 VO
export interface AutoCodePartVO {
  id: number // 分段编号
  ruleId: number // 规则编号
  sort: number // 排序
  type: number // 分段类型
  length: number // 长度
  dateFormat: string // 日期格式
  fixCharacter: string // 固定字符
  serialStartNo: number // 流水号起始值
  serialStep: number // 流水号步长
  cycleFlag: boolean // 是否循环
  cycleMethod: number // 循环方式
  remark: string // 备注
}

// MES 编码规则分段 API
export const AutoCodePartApi = {
  // 查询编码规则分段详情
  getAutoCodePart: async (id: number) => {
    return await request.get({ url: `/mes/md/auto-code-part/get?id=` + id })
  },

  // 查询编码规则分段列表
  getAutoCodePartListByRuleId: async (ruleId: number) => {
    return await request.get({ url: `/mes/md/auto-code-part/list-by-rule-id?ruleId=` + ruleId })
  },

  // 新增编码规则分段
  createAutoCodePart: async (data: AutoCodePartVO) => {
    return await request.post({ url: `/mes/md/auto-code-part/create`, data })
  },

  // 修改编码规则分段
  updateAutoCodePart: async (data: AutoCodePartVO) => {
    return await request.put({ url: `/mes/md/auto-code-part/update`, data })
  },

  // 删除编码规则分段
  deleteAutoCodePart: async (id: number) => {
    return await request.delete({ url: `/mes/md/auto-code-part/delete?id=` + id })
  }
}
