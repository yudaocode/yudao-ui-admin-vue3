/** 跟进状态 */
export const FOLLOWUP_STATUS = [
  { label: '待跟进', value: false },
  { label: '已跟进', value: true }
]

/** 归属范围 */
export const SCENE_TYPES = [
  { label: '我负责的', value: 1 },
  { label: '我参与的', value: 2 },
  { label: '下属负责的', value: 3 }
]

/** 联系状态 */
export const CONTACT_STATUS = [
  { label: '今日需联系', value: 1 },
  { label: '已逾期', value: 2 },
  { label: '已联系', value: 3 }
]

/** 审批状态 */
export const AUDIT_STATUS = [
  { label: '待审批', value: 10 },
  { label: '审核通过', value: 20 },
  { label: '审核不通过', value: 30 }
]

/** 回款提醒类型 */
export const RECEIVABLE_REMIND_TYPE = [
  { label: '待回款', value: 1 },
  { label: '已逾期', value: 2 },
  { label: '已回款', value: 3 }
]

/** 合同过期状态 */
export const CONTRACT_EXPIRY_TYPE = [
  { label: '即将过期', value: 1 },
  { label: '已过期', value: 2 }
]
