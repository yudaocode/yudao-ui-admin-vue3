import request from '@/config/axios'

// 文件预签名地址 Response VO
export interface FilePresignedUrlRespVO {
  // 文件配置编号
  configId: number
  // 文件上传 URL
  uploadUrl: string
  // 文件 URL
  url: string
  // 文件路径
  path: string
}

// 查询文件列表
export const getFilePage = (params: PageParam) => {
  return request.get({ url: '/infra/file/page', params })
}

// 删除文件
export const deleteFile = (id: number) => {
  return request.delete({ url: '/infra/file/delete?id=' + id })
}

// 批量删除文件
export const deleteFileList = (ids: number[]) => {
  return request.delete({ url: '/infra/file/delete-list', params: { ids: ids.join(',') } })
}

// 获取文件预签名地址
export const getFilePresignedUrl = (name: string, directory?: string) => {
  return request.get<FilePresignedUrlRespVO>({
    url: '/infra/file/presigned-url',
    params: { name, directory }
  })
}

// 创建文件
export const createFile = (data: any) => {
  return request.post({ url: '/infra/file/create', data })
}

/**
 * 上传文件
 * @deprecated use uploadFile instead
 * @param data
 */
export const updateFile = (data: any) => {
  return uploadFile(data)
}

// 上传文件
export const uploadFile = (data: any) => {
  return request.upload({ url: '/infra/file/upload', data })
}

/**
 * 上传剪贴板中的第一个文件
 * @param event
 */
export const uploadFirstFileItem = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items)
    return new Promise((_, reject) => {
      reject(new Error('剪贴板中没有内容'))
    })

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file') {
      return uploadFile({ file: item.getAsFile() })
    }
  }

  return new Promise((_, reject) => {
    reject(new Error('剪贴板中没有文件'))
  })
}
