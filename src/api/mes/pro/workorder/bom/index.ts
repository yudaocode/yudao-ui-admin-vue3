import request from '@/config/axios'

// MES 生产工单 BOM VO
export interface ProWorkOrderBomVO {
  id: number // 编号
  workOrderId: number // 生产工单编号
  itemId: number // BOM 物料编号
  itemName: string // 物料名称
  itemCode: string // 物料编码
  itemSpec: string // 规格型号
  unitMeasureId: number // 单位编号
  unitMeasureName: string // 单位名称
  quantity: number // 预计使用量
  remark: string // 备注
  itemOrProduct: string // 物料产品标识
}

// MES 生产工单 BOM API
export const ProWorkOrderBomApi = {
  // 查询工单 BOM 分页
  getWorkOrderBomPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/work-order-bom/page`, params })
  },

  // 查询工单 BOM 详情
  getWorkOrderBom: async (id: number) => {
    return await request.get({ url: `/mes/pro/work-order-bom/get?id=` + id })
  },

  // 新增工单 BOM
  createWorkOrderBom: async (data: ProWorkOrderBomVO) => {
    return await request.post({ url: `/mes/pro/work-order-bom/create`, data })
  },

  // 修改工单 BOM
  updateWorkOrderBom: async (data: ProWorkOrderBomVO) => {
    return await request.put({ url: `/mes/pro/work-order-bom/update`, data })
  },

  // 删除工单 BOM
  deleteWorkOrderBom: async (id: number) => {
    return await request.delete({ url: `/mes/pro/work-order-bom/delete?id=` + id })
  },

  // 获取工单物料需求列表
  getWorkOrderBomItemListByWorkOrderId: async (workOrderId: number) => {
    return await request.get({
      url: `/mes/pro/work-order-bom/item-list-by-work-order-id?workOrderId=` + workOrderId
    })
  }
}
