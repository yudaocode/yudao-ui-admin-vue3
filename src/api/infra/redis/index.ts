import request from '@/config/axios'

/**
 * 获取redis 监控信息
 */
export const getCache = () => {
  return request.get({ url: '/infra/redis/get-monitor-info' })
}

// 获取模块
export const getKeyDefineList = () => {
  return request.get({ url: '/infra/redis/get-key-define-list' })
}

/**
 * 获取redis key列表
 */
export const getKeyList = (keyTemplate: string) => {
  return request.get({
    url: '/infra/redis/get-key-list',
    params: {
      keyTemplate
    }
  })
}

// 获取缓存内容
export const getKeyValue = (key: string) => {
  return request.get({ url: '/infra/redis/get-key-value?key=' + key })
}

// 根据键名删除缓存
export const deleteKey = (key: string) => {
  return request.delete({ url: '/infra/redis/delete-key?key=' + key })
}

export const deleteKeys = (keyTemplate: string) => {
  return request.delete({
    url: '/infra/redis/delete-keys?',
    params: {
      keyTemplate
    }
  })
}
