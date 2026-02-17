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
  RUNNING: 1, // 运行中
  STOP: 2, // 停机
  FAULT: 3 // 故障
}

/** MES 假期类型枚举 */
export const HolidayType = {
  WORKDAY: 1, // 工作日
  HOLIDAY: 2 // 节假日
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
