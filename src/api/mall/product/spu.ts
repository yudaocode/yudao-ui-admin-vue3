import request from '@/config/axios'

// 创建商品 SPU
export function createSpu(data) {
  return request.post({
    url: '/product/spu/create',
    data: data
  })
}

// 更新商品 SPU
export function updateSpu(data) {
  return request.put({
    url: '/product/spu/update',
    data: data
  })
}

// 删除商品 SPU
export function deleteSpu(id) {
  return request.delete({
    url: `/product/spu/delete?id=${id}`
  })
}

// 获得商品 SPU 详情
export function getSpuDetail(id) {
  return request.get({
    url: `/product/spu/get-detail?id=${id}`
  })
}

// 获得商品 SPU 分页
export function getSpuPage(query) {
  return request.get({
    url: '/product/spu/page',
    params: query
  })
}

// 获得商品 SPU 精简列表
export function getSpuSimpleList() {
  return request.get({
    url: '/product/spu/get-simple-list'
  })
}
