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
  FLOAT: 1,    // 浮点
  INTEGER: 2,  // 整数
  TEXT: 3,     // 文本
  DICT: 4,     // 字典
  FILE: 5      // 文件
} as const

/** MES 质检类型枚举 */
export const MesQcTypeEnum = {
  IQC: 1,  // 来料检验
  IPQC: 2, // 过程检验
  OQC: 3,  // 出货检验
  RQC: 4   // 退货检验
}

/** MES 单据状态枚举 */
export const MesOrderStatusEnum = {
  DRAFT: 0,      // 草稿
  CONFIRMED: 1,  // 已确认
  APPROVING: 2,  // 审批中
  APPROVED: 3,   // 已审批
  FINISHED: 4,   // 已完成
  CANCELLED: 5   // 已取消
}

/** MES 生产报工状态枚举 */
export const MesProFeedbackStatusEnum = {
  PREPARE: 0,   // 草稿
  APPROVING: 1, // 审批中
  UNCHECK: 2,   // 待检验
  FINISHED: 3,  // 已完成
  CANCELED: 4   // 已取消
}

/** MES 安灯处置状态枚举 */
export const MesProAndonStatusEnum = {
  ACTIVE: 0,  // 未处置
  HANDLED: 1  // 已处置
}

/** MES 安灯级别枚举 */
export const MesProAndonLevelEnum = {
  LEVEL1: 1, // 一级
  LEVEL2: 2, // 二级
  LEVEL3: 3  // 三级
}

/** MES 生产报工类型枚举 */
export const MesProFeedbackTypeEnum = {
  SELF: 1,    // 自行报工
  UNIFIED: 2  // 统一报工
}

/** MES 到货通知单状态枚举 */
export const MesWmArrivalNoticeStatusEnum = {
  PREPARE: 0,        // 草稿
  PENDING_QC: 1,     // 待质检
  PENDING_RECEIPT: 2, // 待入库
  FINISHED: 3         // 已完成
}

/** MES 采购入库单状态枚举 */
export const MesWmItemReceiptStatusEnum = {
  PREPARE: 0,    // 草稿
  APPROVING: 1,  // 待上架
  APPROVED: 2,   // 待入库
  FINISHED: 3,   // 已完成
  CANCELED: 4    // 已取消
}

/** 获取物料/产品标识的标签 */
export const getItemOrProductLabel = (value: string): string => {
  for (const item of Object.values(MesItemOrProductEnum)) {
    if (item.value === value) {
      return item.label
    }
  }
  return value
}
