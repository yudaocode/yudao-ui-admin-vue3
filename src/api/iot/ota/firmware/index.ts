import request from '@/config/axios'

/** IoT OTA 固件信息 */
export interface IoTOtaFirmware {
  id?: number // 固件编号
  name?: string // 固件名称
  description?: string // 固件描述
  version?: string // 版本号
  productId?: number // 产品编号
  productName?: string // 产品名称
  fileUrl?: string // 固件文件 URL
  fileSize?: number // 固件文件大小
  fileDigestAlgorithm?: string // 固件文件签名算法
  fileDigestValue?: string // 固件文件签名结果
  createTime?: Date // 创建时间
}

// IoT OTA 固件 API
export const IoTOtaFirmwareApi = {
  // 查询 OTA 固件分页
  getOtaFirmwarePage: async (params: any) => {
    return await request.get({ url: `/iot/ota/firmware/page`, params })
  },

  // 查询 OTA 固件详情
  getOtaFirmware: async (id: number) => {
    return await request.get({ url: `/iot/ota/firmware/get?id=` + id })
  },

  // 新增 OTA 固件
  createOtaFirmware: async (data: IoTOtaFirmware) => {
    return await request.post({ url: `/iot/ota/firmware/create`, data })
  },

  // 修改 OTA 固件
  updateOtaFirmware: async (data: IoTOtaFirmware) => {
    return await request.put({ url: `/iot/ota/firmware/update`, data })
  },

  // 删除 OTA 固件
  deleteOtaFirmware: async (id: number) => {
    return await request.delete({ url: `/iot/ota/firmware/delete?id=` + id })
  }
}
