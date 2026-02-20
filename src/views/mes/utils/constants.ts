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

/** 获取物料/产品标识的标签 */
export const getItemOrProductLabel = (value: string): string => {
  for (const item of Object.values(MesItemOrProductEnum)) {
    if (item.value === value) {
      return item.label
    }
  }
  return value
}
