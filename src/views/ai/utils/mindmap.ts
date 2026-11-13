/**
 * AI 思维导图：渲染、导出用的工具方法
 */

/** 思维导图状态：生成中、成功、失败、空结果；空字符串表示不展示 */
export type MindMapStatus = '' | 'generating' | 'success' | 'fail' | 'empty'

/** Markdown 链接 / 图片的目标：](url) 或 ](url "title")，以及 ](<url>)；URL 内允许一层成对括号 */
const LINK_TARGET_PATTERN =
  /\]\((?:<[^<>\n]*>|(?:[^()\s]|\([^()\s]*\))*)(?:\s+(?:"[^"\n]*"|'[^'\n]*'|\([^()\n]*\)))?\s*\)/g
/** CommonMark 自动链接：<scheme:...>（scheme 2~32 位）与 <email>；不匹配任意 HTML 标签 */
const AUTOLINK_PATTERN =
  /<(?:[A-Za-z][A-Za-z0-9+.-]{1,31}:[^\s<>]*|[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*)>/g

/**
 * 渲染前处理 Markdown：沿用原规则去掉 ``` 行与部分 Markdown 符号；
 * 但链接 / 图片的目标（](...) 段）与自动链接 <...> 先用私有区字符占位、处理后原样放回，避免 URL 中的 _ * ~ ` > 被删除
 */
export const processMindMapContent = (text: string): string => {
  return text
    .split('\n')
    .filter((line) => !line.includes('```'))
    .map((line) => {
      const saved: string[] = []
      const keep = (match: string) => `\uE000${saved.push(match) - 1}\uE001`
      return line
        .replace(LINK_TARGET_PATTERN, keep)
        .replace(AUTOLINK_PATTERN, keep)
        .replace(/([*_~`>])|(\d+\.)\s/g, '')
        .replace(/\uE000(\d+)\uE001/g, (_, index: string) => saved[Number(index)])
    })
    .join('\n')
}

/**
 * 计算 PNG 导出倍数：目标 4 倍，单边不超过 16384、总像素不超过 16777216（保守设计值）；降到 1 倍仍超出、或尺寸无效时返回 0
 */
export const getMindMapExportScale = (width: number, height: number): number => {
  if (!(width > 0) || !(height > 0)) {
    return 0
  }
  const scale = Math.min(
    4,
    16_384 / width,
    16_384 / height,
    Math.sqrt(16_777_216 / (width * height))
  )
  return scale >= 1 ? scale : 0
}

/**
 * 根标题转为导出文件名：去掉控制字符，把 \ / : * ? " < > | 换成空格，截到 80 个字符；为空时用“思维导图”
 */
export const buildMindMapFileName = (title: string | null | undefined): string => {
  const name = Array.from(
    (title || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .replace(/[\\/:*?"<>|\s]+/g, ' ')
      .trim()
  )
    .slice(0, 80)
    .join('')
    .trim()
  return (name || '思维导图') + '.png'
}
