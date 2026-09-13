/** OA 考勤类型（与字典 oa_attendance_type 的 value 保持一致） */
export enum OA_ATTENDANCE_TYPE {
  /** 上班打卡 */
  CLOCK_IN = 1,
  /** 下班打卡 */
  CLOCK_OUT = 2
}

/** OA 考勤状态（与字典 oa_attendance_status 的 value 保持一致） */
export enum OA_ATTENDANCE_STATUS {
  /** 正常 */
  NORMAL = 1,
  /** 迟到 */
  LATE = 2,
  /** 早退 */
  EARLY = 3
}
