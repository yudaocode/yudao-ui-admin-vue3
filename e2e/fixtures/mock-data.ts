/**
 * 通用 API 响应工厂
 * 所有 Mock 端点统一返回 { code: 0, data: ..., msg: '' } 格式
 */

/** 构造成功响应 */
export function successResponse<T>(data: T) {
  return {
    code: 0,
    data,
    msg: ''
  }
}

/** 构造失败响应 */
export function errorResponse(code: number, msg: string) {
  return {
    code,
    data: null,
    msg
  }
}

/** 构造分页响应 */
export function pageResponse<T>(list: T[], total: number) {
  return successResponse({ list, total })
}

/** 登录成功响应 */
export const loginSuccessData = {
  userId: 1,
  accessToken: 'mock-access-token-e2e-test',
  refreshToken: 'mock-refresh-token-e2e-test',
  expiresTime: Date.now() + 24 * 60 * 60 * 1000
}

/** 租户信息 */
export const tenantData = {
  id: 1,
  name: '芋道源码'
}

/** 字典数据 - 简化版 */
export const dictListSimpleData = [
  { dictType: 'system_user_sex', value: '1', label: '男', colorType: '', cssClass: '' },
  { dictType: 'system_user_sex', value: '2', label: '女', colorType: '', cssClass: '' },
  { dictType: 'common_status', value: '0', label: '开启', colorType: 'success', cssClass: '' },
  { dictType: 'common_status', value: '1', label: '关闭', colorType: 'danger', cssClass: '' },
  {
    dictType: 'infra_boolean_string',
    value: 'true',
    label: '是',
    colorType: 'success',
    cssClass: ''
  },
  {
    dictType: 'infra_boolean_string',
    value: 'false',
    label: '否',
    colorType: 'danger',
    cssClass: ''
  }
]
