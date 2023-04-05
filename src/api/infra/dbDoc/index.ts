import request from '@/config/axios'

// 导出Html
export const exportHtml = () => {
  return request.download({ url: '/infra/db-doc/export-html' })
}

// 导出Word
export const exportWord = () => {
  return request.download({ url: '/infra/db-doc/export-word' })
}

// 导出Markdown
export const exportMarkdown = () => {
  return request.download({ url: '/infra/db-doc/export-markdown' })
}
