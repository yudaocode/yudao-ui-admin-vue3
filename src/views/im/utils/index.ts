/** 生成客户端消息 ID（时间戳 + UUID） */
export const generateClientMessageId = (): string => {
  const timestamp = Date.now().toString()
  const randomPart = 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
  return `${timestamp}-${randomPart}`
}

/** 生成存储 key（对齐 boxim key 命名 chats-{userId}） */
export const buildMetaKey = (userId: string): string => {
  return `chats-${userId}`
}

/** 解析文本消息 content JSON */
export const parseTextContent = (content: string): string => {
  try {
    const parsed = JSON.parse(content)
    return parsed.content || ''
  } catch {
    return content
  }
}

/** 序列化文本消息 content JSON */
export const serializeTextContent = (text: string): string => {
  return JSON.stringify({ content: text })
}
