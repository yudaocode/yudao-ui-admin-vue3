import request from '@/config/axios'

// 创建优惠劵模板
export function createCouponTemplate(data) {
  return request.post({
    url: '/promotion/coupon-template/create',
    data: data
  })
}

// 更新优惠劵模板
export function updateCouponTemplate(data) {
  return request.put({
    url: '/promotion/coupon-template/update',
    data: data
  })
}

// 更新优惠劵模板的状态
export function updateCouponTemplateStatus(id, status) {
  const data = {
    id,
    status
  }
  return request.put({
    url: '/promotion/coupon-template/update-status',
    data: data
  })
}

// 删除优惠劵模板
export function deleteCouponTemplate(id) {
  return request.delete({
    url: '/promotion/coupon-template/delete?id=' + id
  })
}

// 获得优惠劵模板
export function getCouponTemplate(id) {
  return request.get({
    url: '/promotion/coupon-template/get?id=' + id
  })
}

// 获得优惠劵模板分页
export function getCouponTemplatePage(query) {
  return request.get({
    url: '/promotion/coupon-template/page',
    params: query
  })
}

// 导出优惠劵模板 Excel
export function exportCouponTemplateExcel(query) {
  return request.get({
    url: '/promotion/coupon-template/export-excel',
    params: query,
    responseType: 'blob'
  })
}
