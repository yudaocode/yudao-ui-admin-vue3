import request from '@/config/axios'

// MES 计量单位 VO
export interface MdUnitMeasureVO {
  id: number // 单位编号
  code: string // 单位编码
  name: string // 单位名称
  primaryFlag: boolean // 是否主单位
  primaryId: number // 主单位编号
  changeRate: number // 与主单位换算比例
  status: number // 状态
  remark: string // 备注
}

// MES 计量单位 API
export const MdUnitMeasureApi = {
  // 查询计量单位分页
  getUnitMeasurePage: async (params: any) => {
    return await request.get({ url: `/mes/md/unit-measure/page`, params })
  },

  // 查询计量单位精简列表
  getUnitMeasureSimpleList: async () => {
    return await request.get({ url: `/mes/md/unit-measure/simple-list` })
  },

  // 查询计量单位详情
  getUnitMeasure: async (id: number) => {
    return await request.get({ url: `/mes/md/unit-measure/get?id=` + id })
  },

  // 新增计量单位
  createUnitMeasure: async (data: MdUnitMeasureVO) => {
    return await request.post({ url: `/mes/md/unit-measure/create`, data })
  },

  // 修改计量单位
  updateUnitMeasure: async (data: MdUnitMeasureVO) => {
    return await request.put({ url: `/mes/md/unit-measure/update`, data })
  },

  // 删除计量单位
  deleteUnitMeasure: async (id: number) => {
    return await request.delete({ url: `/mes/md/unit-measure/delete?id=` + id })
  },

  // 导出计量单位 Excel
  exportUnitMeasure: async (params: any) => {
    return await request.download({ url: `/mes/md/unit-measure/export-excel`, params })
  }
}
