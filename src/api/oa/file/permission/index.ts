import request from '@/config/axios'

export interface OaFilePermissionVO {
  id?: number // 编号
  nodeId: number // 文件节点
  subjectType: number // 主体类型
  subjectId?: number // 主体编号
  level: number // 权限级别
  inherit: boolean // 是否继承
  expireTime?: string // 到期时间
}

// 查询共享权限
export const getFilePermissionList = (nodeId: number) => {
  return request.get<OaFilePermissionVO[]>({ url: '/oa/file-permission/list', params: { nodeId } })
}

// 保存共享权限
export const saveFilePermission = (data: OaFilePermissionVO) => {
  return request.post({ url: '/oa/file-permission/save', data })
}

// 取消共享权限
export const deleteFilePermission = (id: number) => {
  return request.delete({ url: '/oa/file-permission/delete', params: { id } })
}
