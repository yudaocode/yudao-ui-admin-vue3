import request from '@/config/axios'

// 收藏文件
export const createFileFavorite = (nodeId: number) => {
  return request.post({ url: '/oa/file-favorite/create', params: { nodeId } })
}

// 取消收藏
export const deleteFileFavorite = (nodeId: number) => {
  return request.delete({ url: '/oa/file-favorite/delete', params: { nodeId } })
}
