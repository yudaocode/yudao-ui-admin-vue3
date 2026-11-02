import { useCache, CACHE_KEY } from '@/hooks/web/useCache'
import { TokenType } from '@/api/login/types'

const { wsCache } = useCache()

const AccessTokenKey = 'ACCESS_TOKEN'
const RefreshTokenKey = 'REFRESH_TOKEN'

// 获取token
export const getAccessToken = () => {
  // 此处与TokenKey相同，此写法解决初始化时Cookies中不存在TokenKey报错
  const accessToken = wsCache.get(AccessTokenKey)
  return accessToken ? accessToken : wsCache.get('ACCESS_TOKEN')
}

// 刷新token
export const getRefreshToken = () => {
  return wsCache.get(RefreshTokenKey)
}

// 设置token
export const setToken = (token: TokenType) => {
  wsCache.set(RefreshTokenKey, token.refreshToken)
  wsCache.set(AccessTokenKey, token.accessToken)
}

// 删除token
export const removeToken = () => {
  wsCache.delete(AccessTokenKey)
  wsCache.delete(RefreshTokenKey)
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return 'Bearer ' + token
}
// ========== 账号相关 ==========

/** 获取当前登录用户编号 */
export const getCurrentUserId = (): number => {
  const user = wsCache.get(CACHE_KEY.USER)?.user
  return user?.id || 0
}

/** 记住我：只缓存租户名、账号，不缓存密码 */
export type LoginFormType = {
  tenantName: string
  username: string
  rememberMe: boolean
}

const LOGIN_FORM_EXPIRE_SECONDS = 30 * 24 * 60 * 60

/** 白名单挑选可缓存的字段，忽略 password、captchaVerification 等其它字段 */
const pickLoginForm = (loginForm: Partial<LoginFormType>): LoginFormType => {
  return {
    tenantName: loginForm.tenantName ?? '',
    username: loginForm.username ?? '',
    rememberMe: !!loginForm.rememberMe
  }
}

/** 获得登录表单缓存的剩余有效秒数；无法解析时，按完整有效期处理 */
const getLoginFormExpireSeconds = (): number => {
  try {
    const expireTime = JSON.parse(localStorage.getItem(CACHE_KEY.LoginForm) || '{}').e
    if (typeof expireTime === 'number') {
      return Math.floor((expireTime - Date.now()) / 1000)
    }
  } catch {}
  return LOGIN_FORM_EXPIRE_SECONDS
}

export const getLoginForm = (): LoginFormType | undefined => {
  const cache = wsCache.get(CACHE_KEY.LoginForm)
  if (!cache || typeof cache !== 'object') {
    return undefined
  }
  const loginForm = pickLoginForm(cache)
  // 兼容旧缓存：旧版本会缓存可还原的加密密码，这里丢弃后按原有效期重写
  if (Object.keys(cache).some((key) => !(key in loginForm))) {
    const expireSeconds = getLoginFormExpireSeconds()
    if (expireSeconds > 0) {
      wsCache.set(CACHE_KEY.LoginForm, loginForm, { exp: expireSeconds })
    } else {
      wsCache.delete(CACHE_KEY.LoginForm)
    }
  }
  return loginForm
}

export const setLoginForm = (loginForm: LoginFormType) => {
  wsCache.set(CACHE_KEY.LoginForm, pickLoginForm(loginForm), { exp: LOGIN_FORM_EXPIRE_SECONDS })
}

export const removeLoginForm = () => {
  wsCache.delete(CACHE_KEY.LoginForm)
}

// ========== 租户相关 ==========

export const getTenantId = () => {
  return wsCache.get(CACHE_KEY.TenantId)
}

export const setTenantId = (tenantId: number) => {
  wsCache.set(CACHE_KEY.TenantId, tenantId)
}

export const getVisitTenantId = () => {
  return wsCache.get(CACHE_KEY.VisitTenantId)
}

export const setVisitTenantId = (visitTenantId: number) => {
  wsCache.set(CACHE_KEY.VisitTenantId, visitTenantId)
}
