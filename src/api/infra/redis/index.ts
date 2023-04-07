import request from '@/config/axios'

/**
 * 获取redis 监控信息
 */
export const getCache = () => {
  return request.get({ url: '/infra/redis/get-monitor-info' })
}
