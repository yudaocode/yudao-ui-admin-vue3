import request from '@/config/axios'

// MES 来料检验缺陷记录 VO
export interface QcIqcDefectVO {
  id: number // 编号
  iqcId: number // 来料检验单 ID
  lineId: number // 来料检验行 ID
  defectName: string // 缺陷描述
  defectLevel: number // 缺陷等级
  defectQuantity: number // 缺陷数量
  remark: string // 备注
}

// MES 来料检验缺陷记录 API
export const QcIqcDefectApi = {
  // 查询来料检验缺陷记录分页
  getIqcDefectPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/iqc/defect/page`, params })
  },

  // 新增来料检验缺陷记录
  createIqcDefect: async (data: QcIqcDefectVO) => {
    return await request.post({ url: `/mes/qc/iqc/defect/create`, data })
  },

  // 修改来料检验缺陷记录
  updateIqcDefect: async (data: QcIqcDefectVO) => {
    return await request.put({ url: `/mes/qc/iqc/defect/update`, data })
  },

  // 删除来料检验缺陷记录
  deleteIqcDefect: async (id: number) => {
    return await request.delete({ url: `/mes/qc/iqc/defect/delete?id=` + id })
  }
}
