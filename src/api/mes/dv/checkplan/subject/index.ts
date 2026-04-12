import request from '@/config/axios'

// MES 点检保养方案项目 VO
export interface DvCheckPlanSubjectVO {
  id: number
  planId: number // 方案编号
  subjectId: number // 项目编号
  subjectCode: string // 项目编码
  subjectName: string // 项目名称
  subjectType: number // 项目类型
  subjectContent: string // 项目内容
  subjectStandard: string // 标准
  remark: string // 备注
}

// MES 点检保养方案项目 API
export const DvCheckPlanSubjectApi = {
  // 查询指定方案的项目列表
  getListByPlan: async (planId: number) => {
    return await request.get({ url: `/mes/dv/check-plan-subject/list-by-plan?planId=` + planId })
  },

  // 新增方案项目关联
  create: async (data: DvCheckPlanSubjectVO) => {
    return await request.post({ url: `/mes/dv/check-plan-subject/create`, data })
  },

  // 删除方案项目关联
  delete: async (id: number) => {
    return await request.delete({ url: `/mes/dv/check-plan-subject/delete?id=` + id })
  }
}
