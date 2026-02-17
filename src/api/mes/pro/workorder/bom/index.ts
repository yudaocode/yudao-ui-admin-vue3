import request from '@/config/axios'

// MES 生产工单 BOM VO
export interface ProWorkorderBomVO {
  id: number // 编号
  workorderId: number // 生产工单编号
  itemId: number // BOM 物料编号
  itemName: string // 物料名称
  itemCode: string // 物料编码
  itemSpec: string // 规格型号
  unitMeasureId: number // 单位编号
  unitMeasureName: string // 单位名称
  itemOrProduct: string // 物料产品标识
  quantity: number // 预计使用量
  remark: string // 备注
}

// MES 生产工单 BOM API
export const ProWorkorderBomApi = {
  // 查询工单 BOM 分页
  getWorkorderBomPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/workorder-bom/page`, params })
  },

  // 查询工单 BOM 详情
  getWorkorderBom: async (id: number) => {
    return await request.get({ url: `/mes/pro/workorder-bom/get?id=` + id })
  },

  // 新增工单 BOM
  createWorkorderBom: async (data: ProWorkorderBomVO) => {
    return await request.post({ url: `/mes/pro/workorder-bom/create`, data })
  },

  // 修改工单 BOM
  updateWorkorderBom: async (data: ProWorkorderBomVO) => {
    return await request.put({ url: `/mes/pro/workorder-bom/update`, data })
  },

  // 删除工单 BOM
  deleteWorkorderBom: async (id: number) => {
    return await request.delete({ url: `/mes/pro/workorder-bom/delete?id=` + id })
  }
}
