import request from '@/config/axios/request'

// 获得地区树
export const getAreaTree = async (content?: any) => {
  return await request.get({
    url: '/system/area/tree',
    params: content
  })
}
// 获得 IP 对应的地区名
export const getAreaByIp = async (ip) => {
  return await request.get({
    url: '/system/area/get-by-ip?ip=' + ip
  })
}
