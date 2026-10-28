/** IoT 透传原始消息、数据解析脚本的工具方法 */

/** 数据解析脚本的最大字节数（UTF-8） */
export const SCRIPT_CONTENT_MAX_BYTES = 32 * 1024
/** 透传载荷的最大字节数 */
export const RAW_PAYLOAD_MAX_BYTES = 4096
/** Modbus 透传 PDU 的最小、最大字节数 */
export const MODBUS_PDU_MIN_BYTES = 5
export const MODBUS_PDU_MAX_BYTES = 253

/** Modbus 写操作的功能码 */
export const MODBUS_WRITE_FUNCTION_CODES: Record<number, string> = {
  0x05: '写单个线圈',
  0x06: '写单个寄存器',
  0x0f: '写多个线圈',
  0x10: '写多个寄存器'
}

/** 解析 HEX 字符串（允许空格、换行），格式不正确时返回 undefined */
export const parseHex = (hex: string): number[] | undefined => {
  const text = (hex || '').replace(/\s+/g, '')
  if (text.length === 0 || text.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(text)) {
    return undefined
  }
  const bytes: number[] = []
  for (let i = 0; i < text.length; i += 2) {
    bytes.push(parseInt(text.substring(i, i + 2), 16))
  }
  return bytes
}

/** 字节数组转为大写、空格分隔的 HEX 字符串 */
export const bytesToHex = (bytes: ArrayLike<number>): string => {
  return Array.from(bytes)
    .map((b) => (b & 0xff).toString(16).toUpperCase().padStart(2, '0'))
    .join(' ')
}

/** 字节数组转为 Base64 */
export const bytesToBase64 = (bytes: number[]): string => {
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b & 0xff)))
  return window.btoa(binary)
}

/** Base64 转为 HEX 字符串；格式不正确时返回 undefined */
export const base64ToHex = (base64?: string): string | undefined => {
  if (typeof base64 !== 'string' || base64.length === 0) {
    return undefined
  }
  try {
    const binary = window.atob(base64)
    const bytes: number[] = []
    for (let i = 0; i < binary.length; i++) {
      bytes.push(binary.charCodeAt(i))
    }
    return bytesToHex(bytes)
  } catch {
    return undefined
  }
}

/** 计算字符串的 UTF-8 字节数 */
export const getUtf8ByteLength = (content: string): number => {
  return new TextEncoder().encode(content || '').length
}

/**
 * 计算脚本内容的 SHA-256 短码（前 12 位）
 *
 * crypto.subtle 只在安全上下文（HTTPS、localhost）中可用；不可用或内容为空时返回空串，页面不展示短码
 */
export const getScriptShortHash = async (content?: string): Promise<string> => {
  if (!content || !window.crypto?.subtle) {
    return ''
  }
  try {
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 12)
  } catch {
    return ''
  }
}
