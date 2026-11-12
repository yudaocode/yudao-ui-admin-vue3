import { AiPptLanguageEnum } from './constants'

/** 未知用量的展示文案 */
const UNKNOWN_USAGE_TEXT = '未取得'

/** 格式化 Token 数：null 表示未知，显示未取得；真实 0 显示 0 */
export function formatTokenCount(value?: number | null) {
  return value === null || value === undefined ? UNKNOWN_USAGE_TEXT : value.toLocaleString()
}

/** 格式化 PPT 语言 */
export function formatPptLanguage(language?: string) {
  return language === AiPptLanguageEnum.EN ? 'English' : '中文'
}
