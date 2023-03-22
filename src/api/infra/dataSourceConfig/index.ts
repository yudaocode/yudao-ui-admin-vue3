import request from '@/config/axios'

export interface DataSourceConfigVO {
  id: number | undefined
  name: string
  url: string
  username: string
  password: string
  createTime?: Date
}

// 新增数据源配置
export const createDataSourceConfig = (data: DataSourceConfigVO) => {
  return request.post({ url: '/infra/data-source-config/create', data })
}

// 修改数据源配置
export const updateDataSourceConfig = (data: DataSourceConfigVO) => {
  return request.put({ url: '/infra/data-source-config/update', data })
}

// 删除数据源配置
export const deleteDataSourceConfig = (id: number) => {
  return request.delete({ url: '/infra/data-source-config/delete?id=' + id })
}

// 查询数据源配置详情
export const getDataSourceConfig = (id: number) => {
  return request.get({ url: '/infra/data-source-config/get?id=' + id })
}

// 查询数据源配置列表
export const getDataSourceConfigList = () => {
  return request.get({ url: '/infra/data-source-config/list' })
}
