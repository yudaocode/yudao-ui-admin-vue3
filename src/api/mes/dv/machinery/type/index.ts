import request from '@/config/axios'

// MES 设备类型 VO
export interface DvMachineryTypeVO {
  id: number // 编号
  parentId: number // 父类型编号
  code: string // 类型编码
  name: string // 类型名称
  sort: number // 显示排序
  status: number // 状态
  remark: string // 备注
}

// MES 设备类型 API
export const DvMachineryTypeApi = {
  // 查询设备类型列表
  getMachineryTypeList: async (params?: any) => {
    return await request.get({ url: `/mes/dv/machinery-type/list`, params })
  },

  // 查询设备类型精简列表
  getMachineryTypeSimpleList: async () => {
    return await request.get({ url: `/mes/dv/machinery-type/simple-list` })
  },

  // 查询设备类型详情
  getMachineryType: async (id: number) => {
    return await request.get({ url: `/mes/dv/machinery-type/get?id=` + id })
  },

  // 新增设备类型
  createMachineryType: async (data: DvMachineryTypeVO) => {
    return await request.post({ url: `/mes/dv/machinery-type/create`, data })
  },

  // 修改设备类型
  updateMachineryType: async (data: DvMachineryTypeVO) => {
    return await request.put({ url: `/mes/dv/machinery-type/update`, data })
  },

  // 删除设备类型
  deleteMachineryType: async (id: number) => {
    return await request.delete({ url: `/mes/dv/machinery-type/delete?id=` + id })
  }
}
