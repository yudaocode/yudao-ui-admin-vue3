import request from '@/config/axios'

// TODO @AI：defect/record/index.ts
// MES 质检缺陷记录 VO
export interface QcDefectRecordVO {
  id: number // 编号
  qcType: number // 检验类型
  qcId: number // 检验单 ID
  lineId: number // 检验行 ID
  name: string // 缺陷描述
  level: number // 缺陷等级
  quantity: number // 缺陷数量
  remark: string // 备注
}

// MES 质检缺陷记录 API
export const QcDefectRecordApi = {
  // 查询质检缺陷记录分页
  getDefectRecordPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/defect-record/page`, params })
  },

  // 新增质检缺陷记录
  createDefectRecord: async (data: QcDefectRecordVO) => {
    return await request.post({ url: `/mes/qc/defect-record/create`, data })
  },

  // 修改质检缺陷记录
  updateDefectRecord: async (data: QcDefectRecordVO) => {
    return await request.put({ url: `/mes/qc/defect-record/update`, data })
  },

  // 删除质检缺陷记录
  deleteDefectRecord: async (id: number) => {
    return await request.delete({ url: `/mes/qc/defect-record/delete?id=` + id })
  }
}
