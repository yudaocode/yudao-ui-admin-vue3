import request from '@/config/axios'
import { getRefreshToken } from '@/utils/auth'
import type { UserLoginVO } from './types'
import { service } from '@/config/axios/service'

export interface CodeImgResult {
  captchaOnOff: boolean
  img: string
  uuid: string
}

export interface SmsCodeVO {
  mobile: string
  scene: number
}

export interface SmsLoginVO {
  mobile: string
  code: string
}

// 登录
export const login = (data: UserLoginVO) => {
  return request.post({ url: '/system/auth/login', data })
}

// 刷新访问令牌
export const refreshToken = () => {
  return request.post({ url: '/system/auth/refresh-token?refreshToken=' + getRefreshToken() })
}

// 使用租户名，获得租户编号
export const getTenantIdByName = (name: string) => {
  return request.get({ url: '/system/tenant/get-id-by-name?name=' + name })
}

// 登出
export const loginOut = () => {
  return request.post({ url: '/system/auth/logout' })
}

// 获取用户权限信息
export const getInfo = () => {
  return request.get({ url: '/system/auth/get-permission-info' })
}

// 路由
export const getAsyncRoutes = () => {
  return request.get({ url: '/system/auth/list-menus' })
}

//获取登录验证码
export const sendSmsCode = (data: SmsCodeVO) => {
  return request.post({ url: '/system/auth/send-sms-code', data })
}

// 短信验证码登录
export const smsLogin = (data: SmsLoginVO) => {
  return request.post({ url: '/system/auth/sms-login', data })
}

// 社交授权的跳转
export const socialAuthRedirect = (type: number, redirectUri: string) => {
  return request.get({
    url: '/system/auth/social-auth-redirect?type=' + type + '&redirectUri=' + redirectUri
  })
}
// 获取验证图片以及 token
export const getCode = (data) => {
  return request.postOriginal({ url: 'system/captcha/get', data })
}

// 滑动或者点选验证
export const reqCheck = (data) => {
  return request.postOriginal({ url: 'system/captcha/check', data })
}

// ========== OAUTH 2.0 相关 ==========
export type scopesType = string[]
export interface paramsType {
  responseType: string
  clientId: string
  redirectUri: string
  state: string
  scopes: scopesType
}
export const getAuthorize = (clientId) => {
  return request.get({ url: '/system/oauth2/authorize?clientId=' + clientId })
}

export function authorize(
  responseType: string,
  clientId: string,
  redirectUri: string,
  state: string,
  autoApprove: boolean,
  checkedScopes: scopesType,
  uncheckedScopes: scopesType
) {
  // 构建 scopes
  const scopes = {}
  for (const scope of checkedScopes) {
    scopes[scope] = true
  }
  for (const scope of uncheckedScopes) {
    scopes[scope] = false
  }
  // 发起请求
  return service({
    url: '/system/oauth2/authorize',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded'
    },
    params: {
      response_type: responseType,
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      auto_approve: autoApprove,
      scope: JSON.stringify(scopes)
    },
    method: 'post'
  })
}
