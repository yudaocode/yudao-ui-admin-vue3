// TODO @AI：应该放到 utils 里
// IM 消息管理共享工具：消息内容预览 / JSON 美化
//
// 消息类型 / 消息状态都走字典：
//   DICT_TYPE.IM_MESSAGE_TYPE     - 对应后端 ImMessageTypeEnum
//   DICT_TYPE.IM_MESSAGE_STATUS   - 对应后端 ImMessageStatusEnum

/** 消息内容（JSON）取首层 content 字段做列表预览，解析失败时回退原文 */
export const getContentPreview = (content?: string): string => {
  if (!content) return ''
  try {
    const parsed = JSON.parse(content)
    if (typeof parsed === 'object' && parsed.content) return String(parsed.content)
    return content
  } catch {
    return content
  }
}

/** 详情弹窗里把 content JSON 美化成 2 缩进 */
export const formatJson = (content?: string): string => {
  if (!content) return ''
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}
