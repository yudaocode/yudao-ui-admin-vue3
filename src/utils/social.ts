import type { RouterHistory } from 'vue-router'

/** 第三方登录回调时，记录 hash 路由的目标路由的参数名 */
const SOCIAL_ROUTE_KEY = 'socialRoute'

/**
 * 获得第三方登录（社交登录、社交绑定）的回调地址
 *
 * 1. params 需要整体 encode 一次，否则钉钉回调会丢失参数，配合 getUrlValue() 使用
 * 2. hash 路由时，回调地址不能带 #，否则 code、state 会被拼接到 # 之后，导致回调参数丢失（https://t.zsxq.com/QY7xI）。
 *    所以回调到 # 之前的页面，并通过 socialRoute 参数记录目标路由，配合 restoreSocialRoute() 使用
 *
 * @param href 目标路由的 href，即 router.resolve(path).href。history 路由为 /base/path，hash 路由为 #/path
 * @param params 回调需要携带的参数，例如说 type、redirect
 */
export const buildSocialRedirectUri = (
  href: string,
  params: Record<string, number | string>
): string => {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  )
  let path = href
  const hashIndex = href.indexOf('#')
  if (hashIndex !== -1) {
    query.set(SOCIAL_ROUTE_KEY, href.slice(hashIndex + 1))
    path = href.slice(0, hashIndex) || location.pathname
  }
  return `${location.origin}${path}?${encodeURIComponent(query.toString())}`
}

/**
 * 还原第三方登录回调的目标路由，需要在创建路由前调用
 *
 * 配合 buildSocialRedirectUri() 使用：将 /?socialRoute=/xxx&code=... 还原为 /?socialRoute=/xxx&code=...#/xxx
 * 只有 hash 路由的回调地址才会带 socialRoute，所以 history 路由时不会处理
 */
export const restoreSocialRoute = (): void => {
  // 已经有路由，无需还原
  if (location.hash.length > 2) {
    return
  }
  let route: string
  try {
    route = new URL(decodeURIComponent(location.href)).searchParams.get(SOCIAL_ROUTE_KEY) ?? ''
  } catch {
    // 地址无法解析（例如说，非法的 % 编码），保持原样
    return
  }
  if (!route.startsWith('/')) {
    return
  }
  window.history.replaceState(
    window.history.state,
    '',
    `${location.pathname}${location.search}#${route}`
  )
}

/**
 * 获得第三方登录回调的 code、state
 *
 * 1. 从 location.search 读取，兼容 history、hash 路由（hash 路由时，回调参数在 # 之前）
 * 2. 钉钉新版登录回调的是 authCode，其它平台是 code
 */
export const getSocialCallback = (): { code: string; state: string } => {
  const searchParams = new URLSearchParams(location.search)
  return {
    code: searchParams.get('code') || searchParams.get('authCode') || '',
    state: searchParams.get('state') ?? ''
  }
}

/** 第三方登录回调清理后，仍需保留的参数：登录后的重定向地址，不含敏感信息 */
const SOCIAL_REDIRECT_KEY = 'redirect'

/**
 * 清理第三方登录回调的 search，只保留 redirect，且不改变 redirect 的编码
 *
 * 1. 路由 query 中的 redirect：原样保留
 * 2. buildSocialRedirectUri() 整体 encode 的参数：只保留其中的 redirect，并按同样的方式 encode，配合 getUrlValue() 使用
 * 3. 其它参数（code、authCode、state 等授权参数，以及 type、socialRoute）：全部清理
 */
const cleanSocialSearch = (search: string): string => {
  const routeRedirects: string[] = []
  const encodedRedirects: string[] = []
  for (const segment of search.slice(1).split('&')) {
    const [rawKey = ''] = segment.split('=')
    try {
      const key = decodeURIComponent(rawKey.replaceAll('+', ' '))
      if (key === SOCIAL_REDIRECT_KEY) {
        routeRedirects.push(segment)
      } else if (!segment.includes('=') && key.includes('=')) {
        const redirect = new URLSearchParams(key).get(SOCIAL_REDIRECT_KEY)
        if (redirect !== null) {
          const params = new URLSearchParams({ [SOCIAL_REDIRECT_KEY]: redirect })
          encodedRedirects.push(encodeURIComponent(params.toString()))
        }
      }
    } catch {
      // 无法解析的参数（例如说，非法的 % 编码），直接清理
    }
  }
  // 两者都有时，优先使用路由 query 中的 redirect
  const segments = routeRedirects.length > 0 ? routeRedirects : encodedRedirects
  return segments.length > 0 ? `?${segments.join('&')}` : ''
}

/**
 * 清理第三方登录回调残留在地址栏的参数，避免 code 泄露或重复使用
 *
 * 1. 只保留非敏感的 redirect，刷新后仍然可以回到原目标，详见 cleanSocialSearch() 说明
 * 2. hash 路由：回调参数在 # 之前，不属于路由地址，清理地址栏即可。之后 vue-router 使用 #/xxx 相对地址跳转，会沿用清理后的地址
 * 3. history 路由：回调参数属于路由地址，vue-router 会记录在 history.state.current 等处，并在下次 push 时写回地址栏。
 *    所以使用 routerHistory.replace() 同步更新地址栏、history.state、vue-router 记录的当前地址，它不会触发路由跳转，不会重建页面
 *
 * @param routerHistory 路由的 history，即 router.options.history
 */
export const clearSocialCallback = (routerHistory: RouterHistory): void => {
  const search = cleanSocialSearch(location.search)
  if (search === location.search) {
    return
  }
  if (routerHistory.base.includes('#')) {
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}${search}${location.hash}`
    )
    return
  }
  const [path = ''] = routerHistory.location.split(/[?#]/)
  routerHistory.replace(`${path}${search}${location.hash}`)
}
