/** MES 工具状态枚举 */
export const MesToolStatusEnum = {
  STORE: 1, // 在库
  ISSUE: 2, // 领用中
  REPAIR: 3, // 维修中
  SCRAP: 4 // 报废
}

/** MES 保养维护类型枚举 */
export const MesMaintenTypeEnum = {
  REGULAR: 1, // 定期维护
  USAGE: 2 // 按使用次数维护
}

/** MES 物料/产品标识枚举 */
export const MesItemOrProductEnum = {
  ITEM: {
    label: '物料',
    value: 'ITEM'
  },
  PRODUCT: {
    label: '产品',
    value: 'PRODUCT'
  }
} as const

/** MES 设备状态枚举 */
export const MesDvMachineryStatusEnum = {
  STOP: 1, // 停机
  PRODUCING: 2, // 生产中
  MAINTENANCE: 3 // 维护中
}

/** MES 假期类型枚举 */
export const HolidayType = {
  WORKDAY: 1, // 工作日
  HOLIDAY: 2 // 节假日
} as const

/** MES 排班计划状态枚举 */
export const MesCalPlanStatusEnum = {
  PREPARE: 0, // 草稿
  CONFIRMED: 1 // 已确认
}

/** MES 轮班方式枚举 */
export const MesCalShiftTypeEnum = {
  SINGLE: 1, // 单白班
  TWO: 2, // 两班倒
  THREE: 3 // 三班倒
}

/** MES 倒班方式枚举 */
export const MesCalShiftMethodEnum = {
  QUARTER: 1, // 按季度
  MONTH: 2, // 按月
  WEEK: 3, // 按周
  DAY: 4 // 按天
}

/** MES 生产工单状态枚举 */
export const MesProWorkOrderStatusEnum = {
  PREPARE: 0, // 草稿
  CONFIRMED: 1, // 已确认
  FINISHED: 2, // 已完成
  CANCELED: 3 // 已取消
}

/** MES 工单类型枚举 */
export const MesProWorkOrderTypeEnum = {
  SELF: 1, // 自行生产
  OUTSOURCE: 2, // 代工
  PURCHASE: 3 // 采购
}

/** MES 工单来源类型枚举 */
export const MesProWorkOrderSourceTypeEnum = {
  ORDER: 1, // 客户订单
  STORE: 2 // 库存备货
}

/** MES 生产任务状态枚举 */
export const MesProTaskStatusEnum = {
  NORMAL: 0, // 草稿
  START: 1, // 进行中
  PAUSE: 2, // 暂停
  FINISHED: 3, // 已完成
  CANCELED: 4 // 已取消
}

/** MES 点检保养方案状态枚举 */
export const MesDvCheckPlanStatusEnum = {
  PREPARE: 0, // 草稿
  ENABLED: 1 // 已启用
}

/** MES 设备保养记录状态枚举 */
export const MesDvMaintenRecordStatusEnum = {
  PREPARE: 0, // 草稿
  SUBMITTED: 1 // 已提交
}

/** MES 设备保养明细结果枚举（对应字典 mes_mainten_status） */
export const MesDvMaintenStatusEnum = {
  NORMAL: 1, // 正常
  ABNORMAL: 2 // 异常
}

/** MES 维修工单状态枚举 */
export const MesDvRepairStatusEnum = {
  DRAFT: 10, // 草稿
  CONFIRMED: 20 // 已确认
}

/** MES 维修结果枚举（对应字典 mes_dv_repair_result） */
export const MesDvRepairResultEnum = {
  PASS: 1, // 通过
  FAIL: 2 // 不通过
}

/** MES 设备点检记录状态枚举 */
export const MesDvCheckRecordStatusEnum = {
  DRAFT: 10, // 草稿
  FINISHED: 20 // 已完成
}

/** MES 设备点检结果枚举（对应字典 mes_dv_check_result） */
export const MesDvCheckResultEnum = {
  NORMAL: 1, // 正常
  ABNORMAL: 2 // 异常
}

/** MES 质检结果值类型枚举 */
export const MesQcResultValueType = {
  FLOAT: 1, // 浮点
  INTEGER: 2, // 整数
  TEXT: 3, // 文本
  DICT: 4, // 字典
  FILE: 5 // 文件
} as const

/** MES 业务类型常量 */
export const MesBizTypeEnum = {
  // WM 仓库模块 [100, 200)
  WM_ARRIVAL_NOTICE: 100, // 到货通知单
  WM_RETURN_ISSUE: 116, // 生产退料
  WM_PRODUCT_SALES: 118, // 销售出库
  WM_RETURN_SALES: 119, // 销售退货入库
  WM_OUTSOURCE_RECPT: 121, // 外协入库

  // PRO 生产模块 [300, 400)
  PRO_FEEDBACK: 304 // 生产报工
}

/** MES 质检来源单据类型枚举 */
export const MesQcSourceDocTypeEnum = {
  // IQC
  ARRIVAL_NOTICE: MesBizTypeEnum.WM_ARRIVAL_NOTICE,
  OUTSOURCE_RECPT: MesBizTypeEnum.WM_OUTSOURCE_RECPT,
  // IPQC
  PRO_FEEDBACK: MesBizTypeEnum.PRO_FEEDBACK,
  // OQC
  PRODUCT_SALES: MesBizTypeEnum.WM_PRODUCT_SALES,
  // RQC
  RETURN_ISSUE: MesBizTypeEnum.WM_RETURN_ISSUE,
  RETURN_SALES: MesBizTypeEnum.WM_RETURN_SALES
}

/** MES 质检类型枚举 */
export const MesQcTypeEnum = {
  IQC: 1, // 来料检验
  IPQC: 2, // 过程检验
  OQC: 3, // 出货检验
  RQC: 4 // 退货检验
}

/** MES 单据状态常量 */
export const MesOrderStatusConstants = {
  DRAFT: 0,
  CONFIRMED: 1,
  APPROVING: 2,
  APPROVED: 3,
  FINISHED: 4,
  CANCELLED: 5
} as const

/** MES 质检单状态枚举 */
export const MesQcStatusEnum = {
  DRAFT: MesOrderStatusConstants.DRAFT,
  FINISHED: MesOrderStatusConstants.FINISHED
}

/** MES 生产报工状态枚举 */
export const MesProFeedbackStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT, // 草稿
  APPROVING: MesOrderStatusConstants.APPROVING, // 审批中
  UNCHECK: MesOrderStatusConstants.APPROVED, // 待检验
  FINISHED: MesOrderStatusConstants.FINISHED, // 已完成
  CANCELED: MesOrderStatusConstants.CANCELLED // 已取消
}

/** MES 安灯处置状态枚举 */
export const MesProAndonStatusEnum = {
  ACTIVE: 0, // 未处置
  HANDLED: 1 // 已处置
}

/** MES 安灯级别枚举 */
export const MesProAndonLevelEnum = {
  LEVEL1: 1, // 一级
  LEVEL2: 2, // 二级
  LEVEL3: 3 // 三级
}

/** MES 生产报工类型枚举 */
export const MesProFeedbackTypeEnum = {
  SELF: 1, // 自行报工
  UNIFIED: 2 // 统一报工
}

/** MES 到货通知单状态枚举 */
export const MesWmArrivalNoticeStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  PENDING_QC: MesOrderStatusConstants.APPROVING,
  PENDING_RECEIPT: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED
}

/** MES 采购入库单状态枚举 */
export const MesWmItemReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 转移单状态枚举 */
export const MesWmTransferStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  UNCONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 委外收货单状态枚举 */
export const MesWmOutsourceReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 盘点类型枚举 */
export const MesWmStockTakingTypeEnum = {
  STATIC: 1,
  DYNAMIC: 2
}

/** MES 盘点任务状态枚举 */
export const MesWmStockTakingTaskStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 盘点任务行状态枚举 */
export const MesWmStockTakingTaskLineStatusEnum = {
  UNCOUNTED: 0,
  NORMAL: 1,
  GAIN: 2,
  LOSS: 3
}

/** MES 盘点方案参数类型枚举 */
export const MesWmStockTakingParamTypeEnum = {
  WAREHOUSE: 102,
  LOCATION: 103,
  AREA: 104,
  ITEM: 600,
  BATCH: 107,
  QUALITY_STATUS: 900
}

/** MES 外协入库单状态枚举 */
export const MesWmOutsourceRecptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 生产领料出库单状态枚举 */
export const MesWmProductIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 杂项入库单状态枚举 */
export const MesWmMiscReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 供应商退货单状态枚举 */
export const MesWmReturnVendorStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 销售退货单状态枚举 */
export const MesWmReturnSalesStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 生产退料单状态枚举 */
export const MesWmReturnIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 生产入库单状态枚举 */
export const MesWmProductProduceStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 产品入库单状态枚举 */
export const MesWmProductReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 销售出库单状态枚举 */
export const MesWmProductSalesStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  SHIPPING: 10, // 待填写运单
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 发货通知单状态枚举 */
export const MesWmSalesNoticeStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVED: MesOrderStatusConstants.APPROVED
}

/** MES 装箱单状态枚举 */
export const MesWmPackageStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  FINISHED: MesOrderStatusConstants.FINISHED
}

/** MES 杂项出库单状态枚举 */
export const MesWmMiscIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED
}

/** MES 外协发料单状态枚举 */
export const MesWmOutsourceIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELLED: MesOrderStatusConstants.CANCELLED
}

/** MES 编码规则分段类型枚举 */
export const MesAutoCodePartTypeEnum = {
  INPUT: 1, // 输入字符
  DATE: 2, // 当前日期
  FIX: 3, // 固定字符
  SERIAL: 4 // 流水号
}

/** MES 编码规则补齐方式枚举 */
export const MesAutoCodePaddedMethodEnum = {
  LEFT: 1, // 左补齐
  RIGHT: 2 // 右补齐
}

/** MES 自动编码规则 Code 枚举 */
export const MesAutoCodeRuleCode = {
  MD_ITEM_CODE: 'MD_ITEM_CODE', // 物料编码
  MD_VENDOR_CODE: 'MD_VENDOR_CODE', // 供应商编码
  MD_CLIENT_CODE: 'MD_CLIENT_CODE', // 客户编码
  MD_WORKSTATION_CODE: 'MD_WORKSTATION_CODE', // 工作站编码
  TM_TOOL_CODE: 'TM_TOOL_CODE', // 工具编码
  TM_TOOL_TYPE_CODE: 'TM_TOOL_TYPE_CODE', // 工具类型编码
  WM_ARRIVAL_NOTICE_CODE: 'WM_ARRIVAL_NOTICE_CODE', // 到货通知单编码
  WM_ITEM_RECEIPT_CODE: 'WM_ITEM_RECEIPT_CODE', // 采购入库单编码
  WM_RETURN_VENDOR_CODE: 'WM_RETURN_VENDOR_CODE', // 采购退货单编码
  WM_PRODUCT_ISSUE_CODE: 'WM_PRODUCT_ISSUE_CODE', // 生产领料出库单编码
  WM_RETURN_ISSUE_CODE: 'WM_RETURN_ISSUE_CODE', // 生产退料单编码
  WM_RETURN_SALES_CODE: 'WM_RETURN_SALES_CODE', // 销售退货单编码
  PRODUCTRECPT_CODE: 'PRODUCTRECPT_CODE', // 产品入库单编码
  WM_SALES_NOTICE_CODE: 'WM_SALES_NOTICE_CODE', // 发货通知单编码
  WM_SN_CODE: 'WM_SN_CODE', // SN 码
  WM_PACKAGE_CODE: 'WM_PACKAGE_CODE', // 装箱单编码
  WM_BATCH_CODE: 'WM_BATCH_CODE', // 批次编码
  PRO_TASK_CODE: 'PRO_TASK_CODE', // 生产任务编码
  QC_IQC_CODE: 'QC_IQC_CODE', // 来料检验单编码
  QC_IPQC_CODE: 'QC_IPQC_CODE', // 过程检验单编码
  QC_OQC_CODE: 'QC_OQC_CODE', // 出货检验单编码
  QC_RQC_CODE: 'QC_RQC_CODE', // 退货检验单编码
  WM_WAREHOUSE_CODE: 'WM_WAREHOUSE_CODE', // 仓库编码
  WM_LOCATION_CODE: 'WM_LOCATION_CODE', // 库区编码
  WM_AREA_CODE: 'WM_AREA_CODE', // 库位编码
  WM_PRODUCT_SALES_CODE: 'WM_PRODUCT_SALES_CODE', // 销售出库单编码
  WM_MISC_ISSUE_CODE: 'WM_MISC_ISSUE_CODE' // 杂项出库单编码
} as const

/** 获取物料/产品标识的标签 */
export const getItemOrProductLabel = (value: string): string => {
  for (const item of Object.values(MesItemOrProductEnum)) {
    if (item.value === value) {
      return item.label
    }
  }
  return value
}

/** MES 条码格式枚举 */
export enum BarcodeFormatEnum {
  QR_CODE = 1,
  EAN13 = 2,
  CODE39 = 3,
  UPC_A = 4
}

/** 条码格式映射表（枚举值 -> JsBarcode 格式名） */
export const BARCODE_FORMAT_MAP: Record<BarcodeFormatEnum, string> = {
  [BarcodeFormatEnum.QR_CODE]: 'QR_CODE',
  [BarcodeFormatEnum.EAN13]: 'EAN13',
  [BarcodeFormatEnum.CODE39]: 'CODE39',
  [BarcodeFormatEnum.UPC_A]: 'UPC_A'
}

/** MES 条码业务类型枚举（对应后端 BarcodeBizTypeEnum） */
export enum BarcodeBizTypeEnum {
  // WM 仓库模块 [100, 200)
  WAREHOUSE = 102,
  LOCATION = 103,
  AREA = 104,
  PACKAGE = 105,
  STOCK = 106,
  BATCH = 107,
  // PRO 生产模块 [300, 400)
  PROCARD = 300,
  WORKORDER = 301,
  TRANSORDER = 302,
  TASK = 303,
  // DV 设备模块 [400, 500)
  MACHINERY = 400,
  // TM 工具模块 [500, 600)
  TOOL = 500,
  // MD 主数据模块 [600, 700)
  ITEM = 600,
  VENDOR = 601,
  WORKSTATION = 602,
  WORKSHOP = 603,
  USER = 604,
  CLIENT = 605
}
