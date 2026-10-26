/**
 * 解析数字 ID，超出安全范围时保留字符串
 *
 * 返回类型兼容现有 number 声明，大 ID 在运行时仍为 string；无效值返回 undefined
 */
export function parseId(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw === 'number') {
    if (!Number.isSafeInteger(raw) || raw < 0) return undefined
    return (raw < Number.MAX_SAFE_INTEGER ? raw : String(raw)) as number
  }
  if (typeof raw !== 'string' || !/^(?:0|[1-9]\d*)$/.test(raw)) return undefined
  const id = Number(raw)
  return (id < Number.MAX_SAFE_INTEGER ? id : raw) as number
}

/** 判断 ID 的值类型（number 或 string），不代替合法性校验；静态类型同 parseId 按 number 收窄 */
export function isIdType(value: unknown): value is number {
  return typeof value === 'number' || typeof value === 'string'
}

/** 判断必须大于零的业务 ID */
export function isPositiveId(value: unknown): value is number | string {
  if (!isIdType(value)) return false
  const id = parseId(value)
  return id !== undefined && id !== 0
}

/** 精确比较数字 ID，空游标按零比较 */
export function compareId(a?: number | string | null, b?: number | string | null): number {
  const left = a == null ? 0 : parseId(a)
  const right = b == null ? 0 : parseId(b)
  if (left === undefined || right === undefined) throw new Error('无效的 ID')
  const x = String(left)
  const y = String(right)
  return x.length !== y.length ? x.length - y.length : x === y ? 0 : x < y ? -1 : 1
}
