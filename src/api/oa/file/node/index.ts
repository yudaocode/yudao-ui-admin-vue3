import request from '@/config/axios'

export interface OaFileNodeVO {
  id?: number // 节点编号
  parentId: number // 父目录编号
  type: number // 类型：0 目录、1 文件
  name: string // 名称
  url?: string // 上传文件地址；详情返回授权后的临时地址，列表不返回
  extension?: string // 扩展名
  category?: number // 分类
  size?: number // 文件大小
  status?: number // 回收状态
  creator?: string // 创建人
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
  level?: number // 当前权限
  favorite?: boolean // 是否收藏
}

export interface OaFileStorageVO {
  usedSize: number // 已用容量（字节）
  totalSize: number // 总容量（字节）
  fileCount: number // 我的文件数量
  sharedCount: number // 我共享的节点数量
  receivedCount: number // 共享给我的入口数量
}

// 查询本人云盘概览
export const getFileStorage = () => {
  return request.get<OaFileStorageVO>({ url: '/oa/file-node/get-storage' })
}

// 查询文件分页
export const getFileNodePage = (params: any) => {
  return request.get({ url: '/oa/file-node/page', params })
}

// 查询本人可用目录
export const getFileDirectoryList = () => {
  return request.get<OaFileNodeVO[]>({ url: '/oa/file-node/directory-list' })
}

// 新增文件或目录
export const createFileNode = (data: OaFileNodeVO) => {
  return request.post({ url: '/oa/file-node/create', data })
}

// 重命名节点
export const updateFileNodeName = (id: number, name: string) => {
  return request.put({ url: '/oa/file-node/update-name', data: { id, name } })
}

// 复制文件或整目录
export const copyFileNode = (id: number, parentId: number) => {
  return request.post({ url: '/oa/file-node/copy', data: { id, parentId } })
}

// 移动节点
export const updateFileNodeParent = (id: number, parentId: number) => {
  return request.put({ url: '/oa/file-node/update-parent', data: { id, parentId } })
}

// 移入回收站
export const recycleFileNode = (id: number) => {
  return request.put({ url: '/oa/file-node/recycle', params: { id } })
}

// 恢复节点
export const restoreFileNode = (id: number) => {
  return request.put({ url: '/oa/file-node/restore', params: { id } })
}

// 彻底删除业务节点
export const deleteFileNode = (id: number) => {
  return request.delete({ url: '/oa/file-node/delete', params: { id } })
}

// 查询文件详情
export const getFileNode = (id: number) => {
  return request.get<OaFileNodeVO>({ url: '/oa/file-node/get', params: { id } })
}
