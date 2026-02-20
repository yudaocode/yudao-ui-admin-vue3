import request from '@/config/axios'

// MES 点检保养项目 VO
export interface DvSubjectVO {
  id: number // 编号
  code: string // 项目编码
  name: string // 项目名称
  type: number // 项目类型
  content: string // 项目内容
  standard: string // 标准
  status: number // 状态
  remark: string // 备注
}

// MES 点检保养项目 API
export const DvSubjectApi = {
  // 查询点检保养项目分页
  getSubjectPage: async (params: any) => {
    return await request.get({ url: `/mes/dv/subject/page`, params })
  },

  // 查询点检保养项目详情
  getSubject: async (id: number) => {
    return await request.get({ url: `/mes/dv/subject/get?id=` + id })
  },

  // 新增点检保养项目
  createSubject: async (data: DvSubjectVO) => {
    return await request.post({ url: `/mes/dv/subject/create`, data })
  },

  // 修改点检保养项目
  updateSubject: async (data: DvSubjectVO) => {
    return await request.put({ url: `/mes/dv/subject/update`, data })
  },

  // 删除点检保养项目
  deleteSubject: async (id: number) => {
    return await request.delete({ url: `/mes/dv/subject/delete?id=` + id })
  },

  // 获得点检保养项目精简列表（下拉选项用）
  getSimpleList: async () => {
    return await request.get({ url: `/mes/dv/subject/simple-list` })
  },

  // 导出点检保养项目 Excel
  exportSubject: async (params: any) => {
    return await request.download({ url: `/mes/dv/subject/export-excel`, params })
  }
}
