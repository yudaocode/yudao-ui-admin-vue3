import request from '@/config/axios'

// 获得地区树
export const getAreaTree = async () => {
  return await request.get({ url: '/system/area/tree' })
}

// 获得 IP 对应的地区名
export const getAreaByIp = async (ip: string) => {
  return await request.get({ url: '/system/area/get-by-ip?ip=' + ip })
}
