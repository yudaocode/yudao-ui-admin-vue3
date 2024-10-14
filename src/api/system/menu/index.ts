import request from '@/config/axios'

export interface MenuVO {
  id: number
  name: string
  permission: string
  type: number
  sort: number
  parentId: number
  path: string
  icon: string
  component: string
  componentName?: string
  status: number
  visible: boolean
  keepAlive: boolean
  alwaysShow?: boolean
  createTime: Date
}

// 查询菜单（精简）列表
export const getSimpleMenusList = () => {
  return request.get({ url: '/system/menu/simple-list' })
}

// 查询菜单列表
export const getMenuList = (params) => {
  return request.get({ url: '/system/menu/list', params })
}

// 获取菜单详情
export const getMenu = (id: number) => {
  return request.get({ url: '/system/menu/get?id=' + id })
}

// 新增菜单
export const createMenu = (data: MenuVO) => {
  return request.post({ url: '/system/menu/create', data })
}

// 修改菜单
export const updateMenu = (data: MenuVO) => {
  return request.put({ url: '/system/menu/update', data })
}

// 删除菜单
export const deleteMenu = (id: number) => {
  return request.delete({ url: '/system/menu/delete?id=' + id })
}
