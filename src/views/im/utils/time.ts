import dayjs from 'dayjs'

// ====================================================================
// IM 时间格式化
// ====================================================================
// 4 类场景，文案规则各有差异；统一走 dayjs，避免 raw Date 散点写法

const WEEKDAY_NAMES_FULL = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const WEEKDAY_NAMES_SHORT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 消息列表的时间分隔条
 *
 * - 今天：HH:mm
 * - 昨天：昨天 HH:mm
 * - 一周内：周X HH:mm
 * - 超过一周：MM-DD HH:mm
 */
export function formatTimeTip(timestamp: number): string {
  if (!timestamp) {
    return ''
  }
  const target = dayjs(timestamp)
  const now = dayjs()
  const time = target.format('HH:mm')
  if (target.isSame(now, 'day')) {
    return time
  }
  if (target.isSame(now.subtract(1, 'day'), 'day')) {
    return `昨天 ${time}`
  }
  const diffDays = now.startOf('day').diff(target.startOf('day'), 'day')
  if (diffDays >= 2 && diffDays <= 6) {
    return `${WEEKDAY_NAMES_SHORT[target.day()]} ${time}`
  }
  return target.format('MM-DD HH:mm')
}

/**
 * 会话列表里的时间（无 HH:mm 后缀，只展示日期粒度）
 *
 * - 今天：HH:mm
 * - 昨天：昨天 HH:mm
 * - 本周内（2-6 天前）：星期X
 * - 同年其他：MM/DD
 * - 跨年：YYYY/MM/DD
 */
export function formatConversationTime(timestamp: number): string {
  if (!timestamp) {
    return ''
  }
  const target = dayjs(timestamp)
  const now = dayjs()
  if (target.isSame(now, 'day')) {
    return target.format('HH:mm')
  }
  if (target.isSame(now.subtract(1, 'day'), 'day')) {
    return `昨天 ${target.format('HH:mm')}`
  }
  // 用 startOf('day') 兜底跨时间点的差值，避免接近凌晨时取到 1.x → diff 算成 1 漏掉昨天分支
  const diffDays = now.startOf('day').diff(target.startOf('day'), 'day')
  if (diffDays >= 2 && diffDays <= 6) {
    return WEEKDAY_NAMES_FULL[target.day()]
  }
  return target.year() === now.year() ? target.format('MM/DD') : target.format('YYYY/MM/DD')
}

/**
 * 历史消息搜索列表的时间：展示绝对日期
 *
 * - 同年：M月D日 HH:mm
 * - 跨年：YYYY年M月D日 HH:mm
 */
export function formatHistoryTime(timestamp: number): string {
  if (!timestamp) {
    return ''
  }
  const target = dayjs(timestamp)
  return target.year() === dayjs().year()
    ? target.format('M月D日 HH:mm')
    : target.format('YYYY年M月D日 HH:mm')
}

/** 合并消息详情列表里每行的时间：MM-DD HH:mm */
export function formatMergeItemTime(timestamp: number): string {
  if (!timestamp) {
    return ''
  }
  return dayjs(timestamp).format('MM-DD HH:mm')
}

/** RTC 通话时长（秒）→ "00:06" / "1:23:45" */
export function formatCallDuration(seconds: number | undefined): string {
  const total = Math.max(0, Math.floor(seconds || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** 接通到结束的通话时长；任一时间缺失返回 '-' */
export function resolveCallDuration(
  acceptTime: Date | string | undefined,
  endTime: Date | string | undefined
): string {
  if (!acceptTime || !endTime) {
    return '-'
  }
  const seconds = Math.floor((new Date(endTime).getTime() - new Date(acceptTime).getTime()) / 1000)
  return seconds > 0 ? formatCallDuration(seconds) : '-'
}
