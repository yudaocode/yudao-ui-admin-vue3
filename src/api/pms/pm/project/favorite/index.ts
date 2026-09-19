import request from '@/config/axios'

// 收藏项目
export const createProjectFavorite = (projectId: number) => {
  return request.post({ url: '/pms/pm/project-favorite/create', params: { projectId } })
}

// 取消收藏项目
export const deleteProjectFavorite = (projectId: number) => {
  return request.delete({ url: '/pms/pm/project-favorite/delete', params: { projectId } })
}
