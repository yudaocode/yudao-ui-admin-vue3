import request from '@/config/axios'
import type { Dayjs } from 'dayjs'

/** 示例联系人信息 */
export interface Demo01Contact {
  id: number // 编号
  name?: string // 名字
  sex?: number // 性别
  birthday?: string | Dayjs // 出生年
  description?: string // 简介
  avatar: string // 头像
}

// 示例联系人 API
export const Demo01ContactApi = {
  // 查询示例联系人分页
  getDemo01ContactPage: async (params: any) => {
    return await request.get({ url: `/infra/demo01-contact/page`, params })
  },

  // 查询示例联系人详情
  getDemo01Contact: async (id: number) => {
    return await request.get({ url: `/infra/demo01-contact/get?id=` + id })
  },

  // 新增示例联系人
  createDemo01Contact: async (data: Demo01Contact) => {
    return await request.post({ url: `/infra/demo01-contact/create`, data })
  },

  // 修改示例联系人
  updateDemo01Contact: async (data: Demo01Contact) => {
    return await request.put({ url: `/infra/demo01-contact/update`, data })
  },

  // 删除示例联系人
  deleteDemo01Contact: async (id: number) => {
    return await request.delete({ url: `/infra/demo01-contact/delete?id=` + id })
  },

  /** 批量删除示例联系人 */
  deleteDemo01ContactList: async (ids: number[]) => {
    return await request.delete({ url: `/infra/demo01-contact/delete-list?ids=${ids.join(',')}` })
  },

  // 导出示例联系人 Excel
  exportDemo01Contact: async (params) => {
    return await request.download({ url: `/infra/demo01-contact/export-excel`, params })
  }
}
