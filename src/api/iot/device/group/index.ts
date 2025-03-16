import request from '@/config/axios'

// IoT 设备分组 VO
export interface DeviceGroupVO {
  id: number // 分组 ID
  name: string // 分组名字
  status: number // 分组状态
  description: string // 分组描述
  deviceCount?: number // 设备数量
}

// IoT 设备分组 API
export const DeviceGroupApi = {
  // 查询设备分组分页
  getDeviceGroupPage: async (params: any) => {
    return await request.get({ url: `/iot/device-group/page`, params })
  },

  // 查询设备分组详情
  getDeviceGroup: async (id: number) => {
    return await request.get({ url: `/iot/device-group/get?id=` + id })
  },

  // 新增设备分组
  createDeviceGroup: async (data: DeviceGroupVO) => {
    return await request.post({ url: `/iot/device-group/create`, data })
  },

  // 修改设备分组
  updateDeviceGroup: async (data: DeviceGroupVO) => {
    return await request.put({ url: `/iot/device-group/update`, data })
  },

  // 删除设备分组
  deleteDeviceGroup: async (id: number) => {
    return await request.delete({ url: `/iot/device-group/delete?id=` + id })
  },

  // 获取设备分组的精简信息列表
  getSimpleDeviceGroupList: async () => {
    return await request.get({ url: `/iot/device-group/simple-list` })
  }
}
