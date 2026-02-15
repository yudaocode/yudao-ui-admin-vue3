import request from '@/config/axios'

// MES 物料批次属性配置 VO
export interface MdItemBatchConfigVO {
  id?: number // 编号
  itemId: number // 物料编号
  produceDateFlag: boolean // 批次属性-生产日期
  expireDateFlag: boolean // 批次属性-有效期
  receiptDateFlag: boolean // 批次属性-入库日期
  vendorFlag: boolean // 批次属性-供应商
  clientFlag: boolean // 批次属性-客户
  salesOrderCodeFlag: boolean // 批次属性-销售订单编号
  purchaseOrderCodeFlag: boolean // 批次属性-采购订单编号
  workorderFlag: boolean // 批次属性-生产工单
  taskFlag: boolean // 批次属性-生产任务
  workstationFlag: boolean // 批次属性-工位
  toolFlag: boolean // 批次属性-工具
  moldFlag: boolean // 批次属性-模具
  lotNumberFlag: boolean // 批次属性-生产批号
  qualityStatusFlag: boolean // 批次属性-质量状态
}

// MES 物料批次属性配置 API
export const MdItemBatchConfigApi = {
  // 根据物料编号获取批次属性配置
  getBatchConfigByItemId: async (itemId: number) => {
    return await request.get({ url: `/mes/md/item-batch-config/get-by-item-id?itemId=` + itemId })
  },

  // 保存批次属性配置（新增或更新）
  saveBatchConfig: async (data: MdItemBatchConfigVO) => {
    return await request.post({ url: `/mes/md/item-batch-config/save`, data })
  }
}
