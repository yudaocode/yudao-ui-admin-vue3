/**
 * WMS 订单工具
 */

/** 生成业务单号：前缀 + 月日 + 4 位随机数 */
export function generateOrderNo(prefix: string) {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const randomNo = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${prefix}${month}${day}${randomNo}`
}
