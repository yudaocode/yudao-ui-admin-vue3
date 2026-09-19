/** 公文套红模板分隔线样式 */
export const OaOfficialDocSeparatorType = {
  SINGLE: 0,
  DOUBLE: 1
} as const

/** 公文收文办理状态 */
export const OaOfficialDocHandleStatus = {
  WAIT_CLAIM: 0,
  CLAIMED: 1,
  PROCESSING: 2,
  COMPLETED: 3
} as const

/** OA 星期名称，按周日至周六排列 */
export const OA_WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

/** OA 云盘根目录编号 */
export const OA_FILE_PARENT_ID_ROOT = 0

/** OA 云盘节点类型 */
export const OA_FILE_NODE_TYPE = {
  FOLDER: 0,
  FILE: 1
} as const

/** OA 云盘权限等级 */
export const OA_FILE_PERMISSION_LEVEL = {
  READ: 1,
  DOWNLOAD: 2,
  EDIT: 3,
  MANAGE: 4
} as const

/** OA 云盘共享主体类型 */
export const OA_FILE_SUBJECT_TYPE = {
  USER: 1,
  DEPT: 2
} as const

/** 云盘文件范围 */
export const OA_FILE_SCOPE = {
  MY: 'my',
  SHARED: 'shared',
  FAVORITE: 'favorite',
  RECYCLE: 'recycle'
} as const

/** 云盘文件范围选项 */
export const OA_FILE_SCOPE_OPTIONS = [
  { value: OA_FILE_SCOPE.MY, label: '我的文件', icon: 'ep:folder' },
  { value: OA_FILE_SCOPE.SHARED, label: '共享文件', icon: 'ep:share' },
  { value: OA_FILE_SCOPE.FAVORITE, label: '我的收藏', icon: 'ep:star' },
  { value: OA_FILE_SCOPE.RECYCLE, label: '回收站', icon: 'ep:delete' }
]

/** 云盘文件分类 */
export const OA_FILE_CATEGORY = {
  ALL: 0,
  IMAGE: 1,
  DOCUMENT: 2,
  VIDEO: 3,
  AUDIO: 4,
  ARCHIVE: 5,
  OTHER: 6
} as const

/** OA 考勤类型 */
export const OA_ATTENDANCE_TYPE = {
  CLOCK_IN: 1,
  CLOCK_OUT: 2,
  LEAVE: 3,
  TRAVEL: 4
} as const

/** OA 考勤状态 */
export const OA_ATTENDANCE_STATUS = {
  NORMAL: 1,
  LATE: 2,
  EARLY: 3,
  LEAVE: 4,
  TRAVEL: 5
} as const

/** OA 优先级 */
export const OA_PRIORITY = {
  NORMAL: 1,
  IMPORTANT: 2,
  URGENT: 3
} as const

/** OA 日程类型 */
export const OA_SCHEDULE_TYPE = {
  REMINDER: 1,
  HOLIDAY: 2
} as const

/** OA 工作计划类型选项 */
export const OA_PLAN_TYPE = {
  DAY: 1,
  WEEK: 2,
  MONTH: 3
} as const

/** OA 工作计划状态 */
export const OA_PLAN_STATUS = {
  UNFINISHED: 1,
  FINISHED: 2,
  CANCELED: 3
} as const

/** OA 工作汇报类型 */
export const OA_WORK_REPORT_TYPE = {
  DAILY: 1,
  WEEKLY: 2,
  MONTHLY: 3
} as const

/** OA 工作汇报状态 */
export const OA_WORK_REPORT_STATUS = {
  DRAFT: 1,
  SUBMITTED: 2
} as const

/** OA 笔记查询场景 */
export const OA_NOTE_SCENE_TYPE = {
  MINE: 1,
  SHARED: 2
} as const

/** OA 笔记类型 */
export const OA_NOTE_TYPE = {
  MINE: 1,
  COMPANY: 2,
  SHARED: 3
} as const

/** OA 讨论类型 */
export const OA_DISCUSSION_TYPE = {
  ANNOUNCEMENT: 1,
  DISCUSSION: 2,
  VOTE: 3
} as const

/** OA 任务类型 */
export const OA_TASK_TYPE = {
  WORK: 1,
  PERSONAL: 2
} as const

/** OA 任务状态 */
export const OA_TASK_STATUS = {
  NEW: 1,
  RECEIVED: 2,
  IN_PROGRESS: 3,
  SUBMITTED: 4,
  COMPLETED: 5
} as const

/** OA 公告类型 */
export const OA_ANNOUNCEMENT_TYPE = {
  ANNOUNCEMENT: 1,
  NOTICE: 2,
  VOTE: 3
} as const

/** OA 通讯录查询类型 */
export const OA_CONTACT_SCENE_TYPE = {
  MINE: 1,
  RECEIVED: 2,
  SENT: 3
} as const

/** OA 邮箱目录入口 */
export const OA_MAIL_FOLDER_KEY = {
  INBOX: 'INBOX',
  UNREAD: 'UNREAD',
  SENT: 'SENT',
  DRAFTS: 'DRAFTS',
  TRASH: 'TRASH'
} as const

/** OA 邮箱写信方式 */
export const OA_MAIL_COMPOSE_MODE = {
  NEW: 'new',
  DRAFT: 'draft',
  REPLY: 'reply',
  REPLY_ALL: 'replyAll',
  FORWARD: 'forward'
} as const

/** OA 车辆归还状态 */
export const OA_VEHICLE_RETURN_STATUS = {
  NOT_EFFECTIVE: 0,
  PENDING_RETURN: 1,
  RETURNING: 2,
  RETURNED: 3
} as const

/** OA 车辆信息管理状态 */
export const OA_VEHICLE_STATUS = {
  IDLE: 0,
  DISABLED: 1,
  IN_USE: 2
} as const

/** 印章状态 */
export const OaSealStatus = {
  AVAILABLE: 0,
  DISABLED: 1,
  IN_USE: 2
} as const

/** 用印申请类型 */
export const OaSealApplyType = {
  CONTRACT: 1,
  AGREEMENT: 2,
  CERTIFICATE: 3,
  AUTHORIZATION: 4,
  OTHER: 5
} as const

/** 用印方式 */
export const OaSealUseMode = {
  ONSITE: 1,
  BORROW: 2
} as const

/** 用印状态 */
export const OaSealUseStatus = {
  PENDING: 0,
  COMPLETED: 1,
  BORROWED: 2,
  RETURNED: 3,
  OVERDUE: 4
} as const

/** 会议室状态 */
export const OaMeetingRoomStatus = {
  NORMAL: 0,
  MAINTENANCE: 1,
  DISABLED: 2
} as const

/** 会议室预定范围 */
export const OaMeetingRoomBookingScope = {
  ALL: 0,
  SPECIFIED: 1
} as const

/** 会议室使用状态 */
export const OaMeetingRoomUseStatus = {
  PENDING: 0,
  IN_USE: 1,
  COMPLETED: 2,
  CANCELLED: 3
} as const

/** 会议室类型 */
export const OaMeetingRoomType = {
  INTERNAL: 1,
  EXTERNAL: 2,
  TRAINING: 3,
  MULTIFUNCTION: 4
} as const

/** 会议室提醒方式 */
export const OaMeetingRoomReminderType = {
  NONE: 1
} as const
